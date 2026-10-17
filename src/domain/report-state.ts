// Estados dos anúncios (SPEC §7). Único sítio que decide estados: o resto do código usa estas funções.
// As transições de reclamação (CLAIMED, RETURNED, ...) chegam na Fase 2C.

export type ReportType = "LOST" | "FOUND";
export type ReportStatus = "OPEN" | "RECOVERED" | "PUBLISHED" | "CLAIMED" | "RETURNED";

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
