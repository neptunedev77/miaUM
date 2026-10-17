"use client";

import { useTranslations } from "next-intl";
import { Moon, Sun } from "lucide-react";
import { cn } from "./ui/cn";
import { THEME_COOKIE, type Theme } from "./theme";

/** Alterna entre claro e escuro. A escolha fica num cookie para o servidor a aplicar no próximo carregamento. */
export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations("nav");

  function toggle() {
    const root = document.documentElement;
    const current: Theme =
      root.dataset.theme === "dark" || root.dataset.theme === "light"
        ? root.dataset.theme
        : matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const next: Theme = current === "dark" ? "light" : "dark";
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    const apply = () => {
      root.dataset.theme = next;
    };
    // Transição suave entre temas onde o browser a suporta.
    if (document.startViewTransition) document.startViewTransition(apply);
    else apply();
  }

  return (
    <button type="button" onClick={toggle} aria-label={t("toggleTheme")} title={t("toggleTheme")}
      className={cn(
        "flex size-9 items-center justify-center rounded-xl border border-border bg-surface text-muted transition-colors duration-200 hover:text-foreground",
        className,
      )}>
      {/* Os dois ícones existem sempre; o CSS mostra o certo, sem diferenças entre servidor e cliente */}
      <Moon aria-hidden className="size-4 dark:hidden" />
      <Sun aria-hidden className="hidden size-4 dark:block" />
    </button>
  );
}
