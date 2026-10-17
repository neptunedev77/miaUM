"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Send } from "lucide-react";
import { createLostAction } from "@/app/anuncios/actions";
import type { FormOptions } from "@/server/reports";
import { Alert } from "@/components/ui/alert";
import { buttonClasses } from "@/components/ui/button";
import { ItemFields, type Values } from "./item-fields";
import { LostWindowField } from "./lost-window-field";

export function LostForm({ options, now }: { options: FormOptions; now: string }) {
  const t = useTranslations("reportForm");
  const [values, setValues] = useState<Values>({ lostTo: now });
  const [state, action, pending] = useActionState(createLostAction, undefined);
  const errors = state?.errors ?? {};
  const set = (name: string, value: string) => setValues((v) => ({ ...v, [name]: value }));

  // Submissão manual: evita que o React limpe o formulário quando o servidor devolve erros.
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {errors._form && <Alert tone="danger">{t(`errors.${errors._form}`)}</Alert>}
      {Object.keys(errors).length > 0 && !errors._form && <Alert tone="danger">{t("fixErrors")}</Alert>}

      <ItemFields options={options} values={values} set={set} errors={errors} whereTitle={t("whereLostTitle")} />

      <LostWindowField now={now} from={values.lostFrom ?? ""} to={values.lostTo ?? ""} onChange={set}
        errors={{ lostFrom: errors.lostFrom, lostTo: errors.lostTo }} />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">{t("publicNotice")}</p>
        <button type="submit" disabled={pending} aria-busy={pending} className={buttonClasses({ size: "lg" })}>
          <Send aria-hidden className="size-4" /> {pending ? t("publishing") : t("publishLost")}
        </button>
      </div>
    </form>
  );
}
