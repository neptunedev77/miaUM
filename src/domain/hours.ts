// Horários dos pontos de entrega: { mon: [["09:00","12:30"], ...], ... } (SPEC §3.2).

export const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
export type Weekday = (typeof WEEKDAYS)[number];
export type Hours = Partial<Record<Weekday, [string, string][]>>;

/** Dia da semana em Europe/Lisbon (as regras de negócio usam sempre este fuso). */
export function lisbonWeekday(date: Date): Weekday {
  const name = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "Europe/Lisbon" }).format(date);
  return name.slice(0, 3).toLowerCase() as Weekday;
}

/** Intervalos de um dia, ignorando dados mal formados. */
export function intervalsFor(hours: unknown, day: Weekday): [string, string][] {
  if (!hours || typeof hours !== "object") return [];
  const value = (hours as Record<string, unknown>)[day];
  if (!Array.isArray(value)) return [];
  return value.filter(
    (i): i is [string, string] => Array.isArray(i) && i.length === 2 && typeof i[0] === "string" && typeof i[1] === "string",
  );
}

/** "09:00–12:30 · 14:00–17:30", ou null se estiver fechado. */
export function formatIntervals(intervals: [string, string][]): string | null {
  return intervals.length === 0 ? null : intervals.map(([a, b]) => `${a}–${b}`).join(" · ");
}
