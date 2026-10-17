"use client";

import { useActionState, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, EyeOff, IdCard, MapPin, Timer, TriangleAlert } from "lucide-react";
import { claimAction } from "@/app/anuncios/claim-actions";
import { Alert } from "./ui/alert";
import { buttonClasses } from "./ui/button";
import { SubmitButton } from "./ui/submit-button";

/** "É meu": mostra os termos e só reserva o objeto depois de a pessoa os aceitar. */
export function ClaimDialog({ reportId, revertDays }: { reportId: string; revertDays: number }) {
  const t = useTranslations("claim");
  const ref = useRef<HTMLDialogElement>(null);
  const [accepted, setAccepted] = useState(false);
  const [state, action] = useActionState(claimAction, undefined);

  const terms = [
    { icon: EyeOff, text: t("terms.hidden") },
    { icon: MapPin, text: t("terms.go") },
    { icon: IdCard, text: t("terms.inPerson") },
    { icon: Timer, text: t("terms.deadline", { days: revertDays }) },
    { icon: TriangleAlert, text: t("terms.honest") },
  ];

  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className={buttonClasses({ size: "lg", className: "w-full" })}>
        {t("button")}
      </button>
      <dialog ref={ref} aria-labelledby="claim-title" onClick={(e) => e.target === e.currentTarget && ref.current?.close()}
        className="m-auto w-[min(100%-2rem,32rem)] animate-scale-in rounded-3xl border border-border bg-surface p-0 text-foreground shadow-lift backdrop:bg-black/50 backdrop:backdrop-blur-sm">
        <form action={action} className="space-y-5 p-6">
          <input type="hidden" name="reportId" value={reportId} />
          <h2 id="claim-title" className="font-display text-2xl font-semibold">{t("title")}</h2>
          <ul className="space-y-3">
            {terms.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-ink"><Icon aria-hidden className="size-4" /></span>
                <span className="pt-1.5">{text}</span>
              </li>
            ))}
          </ul>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 text-sm has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-primary/20">
            <input type="checkbox" name="terms" checked={accepted} onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 size-4 accent-[var(--primary)]" />
            <span className="font-medium">{t("accept")}</span>
          </label>
          {state?.error && <Alert tone="danger">{t(`errors.${state.error}`)}</Alert>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => ref.current?.close()} className={buttonClasses({ variant: "ghost" })}>{t("cancel")}</button>
            <SubmitButton disabled={!accepted}><Check aria-hidden className="size-4" /> {t("confirm")}</SubmitButton>
          </div>
        </form>
      </dialog>
    </>
  );
}
