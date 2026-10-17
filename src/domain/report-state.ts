// Estados dos anúncios e das reclamações (SPEC §7, versão simplificada sem staff).
// Único sítio que decide estados: o resto do código usa `transition` e nunca muda `status` à mão.

export type ReportType = "LOST" | "FOUND";
export type ReportStatus = "OPEN" | "RECOVERED" | "PUBLISHED" | "CLAIMED" | "RETURNED";
export type ClaimStatus = "ACTIVE" | "COMPLETED" | "REJECTED" | "EXPIRED";

const VALID: Record<ReportType, readonly ReportStatus[]> = {
  LOST: ["OPEN", "RECOVERED"],
  FOUND: ["PUBLISHED", "CLAIMED", "RETURNED"],
};

export function isValidStatus(type: ReportType, status: ReportStatus): boolean {
  return VALID[type].includes(status);
}

export function initialStatus(type: ReportType): ReportStatus {
  return type === "LOST" ? "OPEN" : "PUBLISHED";
}

/** Estado em que o anúncio aparece na lista pública. */
export function publicStatus(type: ReportType): ReportStatus {
  return initialStatus(type);
}

type VisibilityInput = {
  type: ReportType;
  status: ReportStatus;
  hiddenByModeration: boolean;
  expiresAt: Date;
};

/** true se o anúncio aparece ao público (lista e página de detalhe). */
export function isPubliclyVisible(report: VisibilityInput, now: Date = new Date()): boolean {
  return (
    !report.hiddenByModeration &&
    report.expiresAt.getTime() > now.getTime() &&
    report.status === publicStatus(report.type)
  );
}

// ---------------------------------------------------------------------------
// Transições
// ---------------------------------------------------------------------------

/**
 * Acontecimentos possíveis:
 * - claim: alguém carrega em "É meu" e aceita os termos (FOUND PUBLISHED -> CLAIMED);
 * - claimantReceived: o reclamante confirma "Recebi o objeto" (-> RETURNED);
 * - claimantWithdrew: o reclamante diz "Afinal não era meu" (-> PUBLISHED);
 * - finderReturned: quem encontrou marca "Devolvido" / encerra o anúncio (-> RETURNED);
 * - finderRejected: quem encontrou diz "Não era dele" (-> PUBLISHED);
 * - claimExpired: passaram os dias de reserva sem resposta (-> PUBLISHED);
 * - recovered: quem perdeu diz "Já recuperei" (LOST OPEN -> RECOVERED).
 */
export type ReportEvent =
  | "claim"
  | "claimantReceived"
  | "claimantWithdrew"
  | "finderReturned"
  | "finderRejected"
  | "claimExpired"
  | "recovered";

export class InvalidTransitionError extends Error {
  constructor(public type: ReportType, public status: ReportStatus, public event: ReportEvent) {
    super(`Transição inválida: ${type} ${status} + ${event}`);
  }
}

type Rule = { from: ReportStatus; to: ReportStatus; claim?: { from: ClaimStatus | null; to: ClaimStatus } };

const RULES: Record<ReportType, Partial<Record<ReportEvent, Rule[]>>> = {
  FOUND: {
    claim: [{ from: "PUBLISHED", to: "CLAIMED", claim: { from: null, to: "ACTIVE" } }],
    claimantReceived: [{ from: "CLAIMED", to: "RETURNED", claim: { from: "ACTIVE", to: "COMPLETED" } }],
    claimantWithdrew: [{ from: "CLAIMED", to: "PUBLISHED", claim: { from: "ACTIVE", to: "REJECTED" } }],
    finderRejected: [{ from: "CLAIMED", to: "PUBLISHED", claim: { from: "ACTIVE", to: "REJECTED" } }],
    claimExpired: [{ from: "CLAIMED", to: "PUBLISHED", claim: { from: "ACTIVE", to: "EXPIRED" } }],
    finderReturned: [
      { from: "CLAIMED", to: "RETURNED", claim: { from: "ACTIVE", to: "COMPLETED" } },
      // O dono apareceu sem usar a app: quem encontrou encerra o anúncio diretamente.
      { from: "PUBLISHED", to: "RETURNED" },
    ],
  },
  LOST: {
    recovered: [{ from: "OPEN", to: "RECOVERED" }],
  },
};

/**
 * Calcula o resultado de um acontecimento. Devolve o novo estado do anúncio e, se houver, a
 * mudança da reclamação ativa. Lança InvalidTransitionError se o acontecimento não for permitido.
 */
export function transition(type: ReportType, status: ReportStatus, event: ReportEvent) {
  const rule = RULES[type][event]?.find((r) => r.from === status);
  if (!rule) throw new InvalidTransitionError(type, status, event);
  return { status: rule.to, claim: rule.claim ?? null };
}

export function canTransition(type: ReportType, status: ReportStatus, event: ReportEvent): boolean {
  return Boolean(RULES[type][event]?.some((r) => r.from === status));
}

// ---------------------------------------------------------------------------
// Regras de reclamação
// ---------------------------------------------------------------------------

export type ClaimLimits = { maxActive: number; maxPerWindow: number };

export type ClaimRefusal = "ownReport" | "notAvailable" | "activeClaimExists" | "tooManyClaims" | "termsNotAccepted";

/** Pode este utilizador reclamar este anúncio? Devolve o motivo da recusa, ou null. */
export function claimRefusal(input: {
  report: VisibilityInput & { authorId: string };
  userId: string;
  termsAccepted: boolean;
  activeClaims: number;
  claimsInWindow: number;
  limits: ClaimLimits;
  now?: Date;
}): ClaimRefusal | null {
  const { report, userId, limits } = input;
  if (report.authorId === userId) return "ownReport";
  if (report.type !== "FOUND" || !isPubliclyVisible(report, input.now)) return "notAvailable";
  if (!input.termsAccepted) return "termsNotAccepted";
  if (input.activeClaims >= limits.maxActive) return "activeClaimExists";
  if (input.claimsInWindow >= limits.maxPerWindow) return "tooManyClaims";
  return null;
}

/** Data a partir da qual uma reserva sem resposta volta a estar pública. */
export function claimDeadline(createdAt: Date, revertDays: number): Date {
  return new Date(createdAt.getTime() + revertDays * 24 * 60 * 60 * 1000);
}

export function isClaimStale(createdAt: Date, revertDays: number, now: Date = new Date()): boolean {
  return now.getTime() >= claimDeadline(createdAt, revertDays).getTime();
}
