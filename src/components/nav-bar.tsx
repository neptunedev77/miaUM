"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ListChecks, LogIn, LogOut, Menu, PackageSearch, UserRound, X } from "lucide-react";
import { setLocale, signOutAction } from "@/app/actions";
import { Avatar } from "./ui/avatar";
import { buttonClasses } from "./ui/button";
import { cn } from "./ui/cn";
import { ThemeToggle } from "./theme-toggle";

export type NavItem = { href: string; key: "home" | "mine" | "admin" };
type Locale = "pt" | "en";
type User = { name: string; email: string } | null;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Fecha um painel ao clicar fora ou com Escape. */
function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

function LanguageSwitch({ locale, className }: { locale: Locale; className?: string }) {
  const t = useTranslations("common");
  return (
    <form action={setLocale} className={cn("flex rounded-xl border border-border bg-surface p-0.5 text-xs font-semibold", className)}
      aria-label={t("language")}>
      {(["pt", "en"] as const).map((l) => (
        <button key={l} type="submit" name="locale" value={l} lang={l} aria-pressed={locale === l}
          className={cn(
            "rounded-[10px] px-2.5 py-1.5 uppercase transition-colors duration-200",
            locale === l ? "bg-primary text-primary-foreground shadow-soft" : "text-muted hover:text-foreground",
          )}>
          {l}
        </button>
      ))}
    </form>
  );
}

function UserMenu({ user }: { user: NonNullable<User> }) {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  const menuId = useId();

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls={menuId}
        className="flex items-center gap-2 rounded-xl py-1 pr-2 pl-1 text-sm font-medium transition-colors hover:bg-surface-muted">
        <Avatar name={user.name} />
        <span className="max-w-32 truncate">{user.name}</span>
        <ChevronDown aria-hidden className={cn("size-4 text-muted transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && (
        <div id={menuId}
          className="absolute right-0 mt-2 w-64 origin-top-right animate-scale-in rounded-2xl border border-border bg-surface p-1.5 shadow-lift">
          <div className="border-b border-border px-3 pt-2 pb-3">
            <p className="truncate font-medium">{user.name}</p>
            <p className="truncate text-sm text-muted">{user.email}</p>
          </div>
          <Link href="/conta" onClick={() => setOpen(false)}
            className="mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-surface-muted">
            <UserRound aria-hidden className="size-4 text-muted" /> {t("account")}
          </Link>
          <Link href="/meus-anuncios" onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-surface-muted">
            <ListChecks aria-hidden className="size-4 text-muted" /> {t("mine")}
          </Link>
          <form action={signOutAction}>
            <button type="submit"
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-danger transition-colors hover:bg-danger-soft">
              <LogOut aria-hidden className="size-4" /> {t("signOut")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export function NavBar({ items, locale, user }: { items: NavItem[]; locale: Locale; user: User }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileRef = useDismiss(mobileOpen, () => setMobileOpen(false));
  const panelId = useId();

  return (
    <>
      {/* Desktop */}
      <nav aria-label={t("mainNav")} className="hidden flex-1 items-center gap-1 md:flex">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}
              className={cn(
                "relative rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200",
                active ? "text-foreground" : "text-muted hover:text-foreground",
              )}>
              {t(item.key)}
              <span aria-hidden className={cn(
                "absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-primary-ink transition-transform duration-300 ease-out",
                active ? "scale-x-100" : "scale-x-0",
              )} />
            </Link>
          );
        })}
      </nav>
      <div className="hidden items-center gap-2 md:flex">
        {/* Ações principais: visíveis em ecrãs largos; em ecrãs médios estão no topo da página inicial */}
        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/perdi" className={buttonClasses({ variant: "outline", size: "sm" })}>
            {t("lost")}
          </Link>
          <Link href="/encontrei" className={buttonClasses({ size: "sm" })}>
            <PackageSearch aria-hidden className="size-4" /> {t("found")}
          </Link>
          <span aria-hidden className="mx-1 h-6 w-px bg-border" />
        </div>
        <ThemeToggle />
        <LanguageSwitch locale={locale} />
        {user ? (
          <UserMenu user={user} />
        ) : (
          <Link href="/entrar" className={buttonClasses({ variant: "ghost", size: "sm" })}>
            <LogIn aria-hidden className="size-4" /> {t("signIn")}
          </Link>
        )}
      </div>

      {/* Telemóvel */}
      <div ref={mobileRef} className="ml-auto md:hidden">
        <button type="button" onClick={() => setMobileOpen((o) => !o)} aria-expanded={mobileOpen} aria-controls={panelId}
          aria-label={mobileOpen ? t("closeMenu") : t("openMenu")}
          className="flex size-10 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-surface-muted">
          {mobileOpen ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
        </button>
        {mobileOpen && (
          <div id={panelId}
            className="absolute inset-x-0 top-16 animate-slide-down border-b border-border bg-surface px-4 pt-4 pb-5 shadow-lift">
            <div className="mb-3 grid grid-cols-2 gap-2">
              <Link href="/perdi" onClick={() => setMobileOpen(false)} className={buttonClasses({ variant: "outline" })}>
                {t("lost")}
              </Link>
              <Link href="/encontrei" onClick={() => setMobileOpen(false)} className={buttonClasses()}>
                <PackageSearch aria-hidden className="size-4" /> {t("found")}
              </Link>
            </div>
            <nav aria-label={t("mainNav")} className="flex flex-col gap-1">
              {items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "rounded-xl px-3 py-2.5 font-medium transition-colors",
                      active ? "bg-primary-soft text-primary-ink" : "hover:bg-surface-muted",
                    )}>
                    {t(item.key)}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <LanguageSwitch locale={locale} />
              </div>
              {user ? (
                <div className="flex items-center gap-2">
                  <Link href="/conta" onClick={() => setMobileOpen(false)} className={buttonClasses({ variant: "outline", size: "sm" })}>
                    <Avatar name={user.name} size="xs" /> {t("account")}
                  </Link>
                  <form action={signOutAction}>
                    <button type="submit" aria-label={t("signOut")} className={buttonClasses({ variant: "ghost", size: "sm" })}>
                      <LogOut aria-hidden className="size-4" />
                    </button>
                  </form>
                </div>
              ) : (
                <Link href="/entrar" onClick={() => setMobileOpen(false)} className={buttonClasses({ size: "sm" })}>
                  <LogIn aria-hidden className="size-4" /> {t("signIn")}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
