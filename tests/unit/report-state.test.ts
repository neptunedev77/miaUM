import { describe, expect, it } from "vitest";
import {
  canTransition, claimDeadline, claimRefusal, InvalidTransitionError, isClaimStale, transition,
  type ReportEvent, type ReportStatus, type ReportType,
} from "@/domain/report-state";

const ALL_STATUSES: ReportStatus[] = ["OPEN", "RECOVERED", "PUBLISHED", "CLAIMED", "RETURNED"];
const ALL_EVENTS: ReportEvent[] = ["claim", "claimantReceived", "claimantWithdrew", "finderReturned", "finderRejected", "claimExpired", "recovered"];

/** Todas as transições permitidas: tudo o resto tem de ser recusado. */
const ALLOWED: Record<string, { to: ReportStatus; claim: { from: string | null; to: string } | null }> = {
  "FOUND PUBLISHED claim": { to: "CLAIMED", claim: { from: null, to: "ACTIVE" } },
  "FOUND CLAIMED claimantReceived": { to: "RETURNED", claim: { from: "ACTIVE", to: "COMPLETED" } },
  "FOUND CLAIMED claimantWithdrew": { to: "PUBLISHED", claim: { from: "ACTIVE", to: "REJECTED" } },
  "FOUND CLAIMED finderRejected": { to: "PUBLISHED", claim: { from: "ACTIVE", to: "REJECTED" } },
  "FOUND CLAIMED claimExpired": { to: "PUBLISHED", claim: { from: "ACTIVE", to: "EXPIRED" } },
  "FOUND CLAIMED finderReturned": { to: "RETURNED", claim: { from: "ACTIVE", to: "COMPLETED" } },
  "FOUND PUBLISHED finderReturned": { to: "RETURNED", claim: null },
  "LOST OPEN recovered": { to: "RECOVERED", claim: null },
};

describe("transition — todas as combinações", () => {
  for (const type of ["LOST", "FOUND"] as ReportType[]) {
    for (const status of ALL_STATUSES) {
      for (const event of ALL_EVENTS) {
        const key = `${type} ${status} ${event}`;
        const expected = ALLOWED[key];
        it(`${key} -> ${expected ? expected.to : "recusada"}`, () => {
          if (expected) {
            expect(transition(type, status, event)).toEqual({ status: expected.to, claim: expected.claim });
            expect(canTransition(type, status, event)).toBe(true);
          } else {
            expect(() => transition(type, status, event)).toThrow(InvalidTransitionError);
            expect(canTransition(type, status, event)).toBe(false);
          }
        });
      }
    }
  }

  it("estados finais não aceitam mais acontecimentos", () => {
    for (const event of ALL_EVENTS) {
      expect(canTransition("FOUND", "RETURNED", event)).toBe(false);
      expect(canTransition("LOST", "RECOVERED", event)).toBe(false);
    }
  });
});

describe("claimRefusal", () => {
  const NOW = new Date("2026-10-17T12:00:00Z");
  const report = { type: "FOUND" as const, status: "PUBLISHED" as const, hiddenByModeration: false, expiresAt: new Date("2026-11-01T00:00:00Z"), authorId: "finder" };
  const base = { report, userId: "owner", termsAccepted: true, activeClaims: 0, claimsInWindow: 0, limits: { maxActive: 1, maxPerWindow: 3 }, now: NOW };

  it("aceita uma reclamação válida", () => {
    expect(claimRefusal(base)).toBeNull();
  });

  it("recusa o próprio anúncio", () => {
    expect(claimRefusal({ ...base, userId: "finder" })).toBe("ownReport");
  });

  it("recusa anúncios que não estão disponíveis", () => {
    expect(claimRefusal({ ...base, report: { ...report, status: "CLAIMED" } })).toBe("notAvailable");
    expect(claimRefusal({ ...base, report: { ...report, hiddenByModeration: true } })).toBe("notAvailable");
    expect(claimRefusal({ ...base, report: { ...report, expiresAt: new Date("2026-10-01T00:00:00Z") } })).toBe("notAvailable");
    expect(claimRefusal({ ...base, report: { ...report, type: "LOST", status: "OPEN" } })).toBe("notAvailable");
  });

  it("exige a aceitação dos termos", () => {
    expect(claimRefusal({ ...base, termsAccepted: false })).toBe("termsNotAccepted");
  });

  it("limita a 1 reclamação ativa e 3 na janela", () => {
    expect(claimRefusal({ ...base, activeClaims: 1 })).toBe("activeClaimExists");
    expect(claimRefusal({ ...base, claimsInWindow: 2 })).toBeNull();
    expect(claimRefusal({ ...base, claimsInWindow: 3 })).toBe("tooManyClaims");
  });
});

describe("prazo da reserva", () => {
  const created = new Date("2026-10-10T12:00:00Z");

  it("calcula a data limite", () => {
    expect(claimDeadline(created, 5).toISOString()).toBe("2026-10-15T12:00:00.000Z");
  });

  it("só expira depois do prazo", () => {
    expect(isClaimStale(created, 5, new Date("2026-10-15T11:59:00Z"))).toBe(false);
    expect(isClaimStale(created, 5, new Date("2026-10-15T12:00:00Z"))).toBe(true);
  });
});
