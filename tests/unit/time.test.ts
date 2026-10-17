import { describe, expect, it } from "vitest";
import { addDays, lisbonLocalToUtc, utcToLisbonLocal } from "@/domain/time";

describe("lisbonLocalToUtc", () => {
  it("converte hora de verão (UTC+1)", () => {
    expect(lisbonLocalToUtc("2026-07-15T14:30")?.toISOString()).toBe("2026-07-15T13:30:00.000Z");
  });

  it("converte hora de inverno (UTC+0)", () => {
    expect(lisbonLocalToUtc("2026-12-01T09:00")?.toISOString()).toBe("2026-12-01T09:00:00.000Z");
  });

  it("acerta nos dias de mudança de hora", () => {
    // 25/10/2026: às 02:00 de verão volta para 01:00 (inverno)
    expect(lisbonLocalToUtc("2026-10-25T12:00")?.toISOString()).toBe("2026-10-25T12:00:00.000Z");
    // 29/03/2026: às 01:00 passa para 02:00 (verão)
    expect(lisbonLocalToUtc("2026-03-29T12:00")?.toISOString()).toBe("2026-03-29T11:00:00.000Z");
  });

  it("rejeita texto inválido e datas impossíveis", () => {
    expect(lisbonLocalToUtc("")).toBeNull();
    expect(lisbonLocalToUtc("2026-07-15")).toBeNull();
    expect(lisbonLocalToUtc("2026-02-30T10:00")).toBeNull();
    expect(lisbonLocalToUtc("2026-07-15T25:00")).toBeNull();
    expect(lisbonLocalToUtc("abc")).toBeNull();
  });
});

describe("utcToLisbonLocal", () => {
  it("faz o caminho inverso", () => {
    expect(utcToLisbonLocal(new Date("2026-07-15T13:30:00Z"))).toBe("2026-07-15T14:30");
    expect(utcToLisbonLocal(new Date("2026-12-01T09:00:00Z"))).toBe("2026-12-01T09:00");
  });
});

describe("addDays", () => {
  it("soma dias", () => {
    expect(addDays(new Date("2026-10-01T00:00:00Z"), 30).toISOString()).toBe("2026-10-31T00:00:00.000Z");
  });
});
