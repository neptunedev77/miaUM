import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Logo } from "./logo";

export async function Footer() {
  const t = await getTranslations("footer");
  const tn = await getTranslations("nav");

  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:grid-cols-[2fr_1fr] sm:px-6">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-md text-sm text-muted">{t("about")}</p>
        </div>
        <nav aria-label={t("linksTitle")} className="space-y-3 text-sm">
          <p className="font-semibold">{t("linksTitle")}</p>
          <ul className="space-y-2 text-muted">
            <li><Link href="/" className="transition-colors hover:text-primary-ink">{tn("home")}</Link></li>
            <li><Link href="/entrar" className="transition-colors hover:text-primary-ink">{tn("signIn")}</Link></li>
            <li><Link href="/conta" className="transition-colors hover:text-primary-ink">{tn("account")}</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-4 text-xs text-muted sm:flex-row sm:justify-between sm:px-6">
          <p>{t("independent")}</p>
          <p>{t("provisional")}</p>
        </div>
      </div>
    </footer>
  );
}
