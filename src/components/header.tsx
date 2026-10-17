import Link from "next/link";
import { getLocale } from "next-intl/server";
import { getCurrentUser, hasRole } from "@/server/session";
import { displayName } from "@/domain/email";
import { Logo } from "./logo";
import { NavBar, type NavItem } from "./nav-bar";

export async function Header() {
  const [locale, user] = await Promise.all([getLocale(), getCurrentUser()]);

  const items: NavItem[] = [{ href: "/", key: "home" }];
  if (hasRole(user, "STAFF")) items.push({ href: "/staff", key: "staff" });
  if (hasRole(user, "ADMIN")) items.push({ href: "/admin", key: "admin" });

  return (
    <header
      style={{ viewTransitionName: "site-header" }}
      className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70"
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="group shrink-0 rounded-lg" aria-label="miaUM">
          <Logo />
        </Link>
        <NavBar
          items={items}
          locale={locale === "en" ? "en" : "pt"}
          user={user ? { name: displayName(user.name, user.email), email: user.email } : null}
        />
      </div>
    </header>
  );
}
