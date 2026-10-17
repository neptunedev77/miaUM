/**
 * Caminho de regresso depois do login (?next=). Só aceita caminhos internos, para não permitir
 * redirecionamentos para outros sites ("//site.com", "https://...", "/\\site.com").
 */
export function safeNext(value: unknown, fallback = "/"): string {
  if (typeof value !== "string" || value.length > 300) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}

/** Primeiro nome a guardar: só a primeira palavra, sem espaços a mais, até 40 caracteres. */
export function firstNameFrom(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const first = input.trim().split(/\s+/)[0] ?? "";
  if (first.length < 1 || first.length > 40) return null;
  // Letras (com acentos), hífen e apóstrofo.
  if (!/^[\p{L}][\p{L}'’-]*$/u.test(first)) return null;
  return first.charAt(0).toLocaleUpperCase("pt-PT") + first.slice(1);
}
