// Intervalo "vi-o pela última vez" -> "dei pela falta", em hora local de Lisboa ("AAAA-MM-DDTHH:mm").
// Funções puras para o campo do formulário (atalhos, dias, duração).

export type LocalDateTime = string; // "AAAA-MM-DDTHH:mm"

const RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

/** Minutos "ingénuos" desde 1970 (os dois extremos estão no mesmo fuso, por isso as diferenças são corretas). */
function toMinutes(v: LocalDateTime): number | null {
  const m = RE.exec(v);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number);
  return Date.UTC(y, mo - 1, d, h, mi) / 60000;
}

function fromMinutes(min: number): LocalDateTime {
  return new Date(min * 60000).toISOString().slice(0, 16);
}

export function datePart(v: LocalDateTime) {
  return v.slice(0, 10);
}

export function timePart(v: LocalDateTime) {
  return v.slice(11, 16);
}

export function join(date: string, time: string): LocalDateTime {
  return `${date}T${time || "00:00"}`;
}

/** Soma dias a "AAAA-MM-DD". */
export function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Duração em minutos entre os dois extremos (negativa se estiverem trocados). */
export function windowMinutes(from: LocalDateTime, to: LocalDateTime): number | null {
  const a = toMinutes(from);
  const b = toMinutes(to);
  return a === null || b === null ? null : b - a;
}

/** Arredonda para baixo aos 15 minutos (atalhos mais limpos: 14:37 -> 14:30). */
function floor15(v: LocalDateTime): LocalDateTime {
  const m = toMinutes(v)!;
  return fromMinutes(m - (m % 15));
}

export type PresetKey = "lastHour" | "last3Hours" | "today" | "yesterday";

/** Atalhos para preencher o intervalo de uma vez, relativos a "agora". */
export function presets(now: LocalDateTime): { key: PresetKey; from: LocalDateTime; to: LocalDateTime }[] {
  const nowMin = toMinutes(now)!;
  const today = datePart(now);
  const yesterday = shiftDate(today, -1);
  const morning = join(today, "08:00");
  const out: { key: PresetKey; from: LocalDateTime; to: LocalDateTime }[] = [
    { key: "lastHour", from: floor15(fromMinutes(nowMin - 60)), to: now },
    { key: "last3Hours", from: floor15(fromMinutes(nowMin - 180)), to: now },
  ];
  // "Hoje" só faz sentido depois das 08:00.
  if (now > morning) out.push({ key: "today", from: morning, to: now });
  out.push({ key: "yesterday", from: join(yesterday, "08:00"), to: join(yesterday, "20:00") });
  return out;
}

/** Que dia é, relativamente a hoje (para os botões "Hoje" / "Ontem" / outro). */
export function dayKind(date: string, today: string): "today" | "yesterday" | "other" {
  if (date === today) return "today";
  if (date === shiftDate(today, -1)) return "yesterday";
  return "other";
}

/** Duração para mostrar: { days, hours, minutes }. */
export function splitDuration(totalMinutes: number) {
  const m = Math.max(0, Math.round(totalMinutes));
  return { days: Math.floor(m / 1440), hours: Math.floor((m % 1440) / 60), minutes: m % 60 };
}
