/**
 * Números de página a mostrar (base 1), com "…" quando há muitas páginas.
 * Mostra sempre a primeira, a última e as vizinhas da atual. Ex.: 1 … 4 5 6 … 12
 */
export function pageNumbers(current: number, total: number, siblings = 1): (number | "…")[] {
  if (total <= 1) return [1];
  // Com poucas páginas, mostrar todas é mais simples do que usar reticências.
  if (total <= 2 * siblings + 5) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, total]);
  for (let p = current - siblings; p <= current + siblings; p++) if (p >= 1 && p <= total) pages.add(p);
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  for (const [i, p] of sorted.entries()) {
    const prev = sorted[i - 1];
    if (prev !== undefined && p - prev === 2) out.push(prev + 1);
    else if (prev !== undefined && p - prev > 2) out.push("…");
    out.push(p);
  }
  return out;
}
