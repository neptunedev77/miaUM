const texts = {
  pt: {
    subject: "O teu link para entrar no miaUM",
    intro: "Usa o link abaixo para entrares no miaUM. Expira em 15 minutos e só pode ser usado uma vez.",
    button: "Entrar no miaUM",
    ignore: "Se não pediste este email, podes ignorá-lo.",
  },
  en: {
    subject: "Your miaUM sign-in link",
    intro: "Use the link below to sign in to miaUM. It expires in 15 minutes and can only be used once.",
    button: "Sign in to miaUM",
    ignore: "If you didn't request this email, you can ignore it.",
  },
} as const;

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function magicLinkEmail(url: string, locale: "pt" | "en") {
  const t = texts[locale];
  const safeUrl = escapeHtml(url);
  return {
    subject: t.subject,
    text: `${t.intro}\n\n${url}\n\n${t.ignore}`,
    html: `<p>${t.intro}</p>
<p><a href="${safeUrl}" style="display:inline-block;padding:10px 16px;background:#0f766e;color:#fff;border-radius:6px;text-decoration:none">${t.button}</a></p>
<p style="color:#555;font-size:13px">${t.ignore}</p>`,
  };
}
