import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { setLocale, signOutAction } from "@/app/actions";
import { getCurrentUser, hasRole } from "@/server/session";
import { displayName } from "@/domain/email";

const linkClass = "rounded px-2 py-1 hover:bg-border/40";

export async function Header() {
  const [t, tc, locale, user] = await Promise.all([
    getTranslations("nav"),
    getTranslations("common"),
    getLocale(),
    getCurrentUser(),
  ]);
  const otherLocale = locale === "pt" ? "en" : "pt";

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/" className="text-xl font-bold text-accent">
          {tc("appName")}
        </Link>
        <nav aria-label={t("mainNav")} className="flex flex-1 flex-wrap items-center gap-1 text-sm">
          <Link href="/" className={linkClass}>{t("home")}</Link>
          {hasRole(user, "STAFF") && <Link href="/staff" className={linkClass}>{t("staff")}</Link>}
          {hasRole(user, "ADMIN") && <Link href="/admin" className={linkClass}>{t("admin")}</Link>}
        </nav>
        <div className="flex items-center gap-2 text-sm">
          <form action={setLocale}>
            <input type="hidden" name="locale" value={otherLocale} />
            <button type="submit" className={linkClass} lang={otherLocale} aria-label={`${tc("language")}: ${tc("switchTo")}`}>
              {otherLocale.toUpperCase()}
            </button>
          </form>
          {user ? (
            <>
              <Link href="/conta" className={linkClass}>{displayName(user.name, user.email)}</Link>
              <form action={signOutAction}>
                <button type="submit" className={linkClass}>{t("signOut")}</button>
              </form>
            </>
          ) : (
            <Link href="/entrar" className="rounded bg-accent px-3 py-1 font-medium text-accent-foreground">
              {t("signIn")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
