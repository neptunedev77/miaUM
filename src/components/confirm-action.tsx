"use client";

import { useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { buttonClasses } from "./ui/button";
import { SubmitButton } from "./ui/submit-button";

/**
 * Botão que pede confirmação num modal antes de submeter uma ação do servidor
 * (para ações que não se podem desfazer).
 */
export function ConfirmAction({ action, fields, label, title, text, confirmLabel, variant = "outline", icon, className }: {
  action: (formData: FormData) => Promise<void>;
  fields: Record<string, string>;
  label: ReactNode;
  title: string;
  text: ReactNode;
  confirmLabel: string;
  variant?: "primary" | "outline" | "ghost";
  icon?: ReactNode;
  className?: string;
}) {
  const t = useTranslations("common");
  const ref = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className={buttonClasses({ variant, className })}>
        {icon} {label}
      </button>
      <dialog ref={ref} aria-label={title} onClick={(e) => e.target === e.currentTarget && ref.current?.close()}
        className="m-auto w-[min(100%-2rem,28rem)] animate-scale-in rounded-3xl border border-border bg-surface p-0 text-foreground shadow-lift backdrop:bg-black/50 backdrop:backdrop-blur-sm">
        <form action={action} className="space-y-4 p-6">
          {Object.entries(fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
          <h2 className="font-display text-xl font-semibold">{title}</h2>
          <div className="text-sm text-muted">{text}</div>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => ref.current?.close()} className={buttonClasses({ variant: "ghost" })}>{t("cancel")}</button>
            <SubmitButton>{confirmLabel}</SubmitButton>
          </div>
        </form>
      </dialog>
    </>
  );
}
