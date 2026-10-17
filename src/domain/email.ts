// Regras puras sobre emails (sem dependências do servidor).

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** true se o domínio do email (ou um subdomínio dele) estiver na lista permitida. */
export function isAllowedEmail(email: string, allowedDomains: readonly string[]): boolean {
  const normalized = normalizeEmail(email);
  const at = normalized.lastIndexOf("@");
  if (at <= 0 || at === normalized.length - 1) return false;
  const domain = normalized.slice(at + 1);
  return allowedDomains.some((d) => {
    const allowed = d.trim().toLowerCase();
    return allowed !== "" && (domain === allowed || domain.endsWith(`.${allowed}`));
  });
}

/** Nome a mostrar: o primeiro nome guardado ou, na falta dele, a parte local do email. */
export function displayName(name: string | null | undefined, email: string | null | undefined): string {
  const first = name?.trim().split(/\s+/)[0];
  if (first) return first;
  return email ? email.split("@")[0] : "?";
}
