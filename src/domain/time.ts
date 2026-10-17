// Datas: guardadas em UTC, mas as regras de negócio e os formulários usam a hora de Lisboa.

export const TIME_ZONE = "Europe/Lisbon";
const LOCAL_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

/** Diferença (ms) entre a hora de Lisboa e UTC num dado instante (0 no inverno, +1 h no verão). */
function lisbonOffsetMs(instant: number): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(instant));
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(instant / 1000) * 1000;
}

/**
 * Converte "AAAA-MM-DDTHH:mm" (valor de um <input type="datetime-local">, em hora de Lisboa) para UTC.
 * Devolve null se o texto não for uma data válida.
 */
export function lisbonLocalToUtc(local: string): Date | null {
  const m = LOCAL_RE.exec(local);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number);
  const naive = Date.UTC(y, mo - 1, d, h, mi);
  const check = new Date(naive);
  if (check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d || h > 23 || mi > 59) return null;
  // Duas passagens para acertar nas mudanças de hora (verão/inverno).
  let utc = naive - lisbonOffsetMs(naive);
  utc = naive - lisbonOffsetMs(utc);
  return new Date(utc);
}

/** UTC -> "AAAA-MM-DDTHH:mm" em hora de Lisboa (para preencher <input type="datetime-local">). */
export function utcToLisbonLocal(date: Date): string {
  const local = new Date(date.getTime() + lisbonOffsetMs(date.getTime()));
  return local.toISOString().slice(0, 16);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}
