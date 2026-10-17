"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { saveFirstName } from "@/app/actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { Field, TextInput } from "@/components/ui/field";

export function FirstNameForm({ next }: { next: string }) {
  const t = useTranslations("welcome");
  const [state, action] = useActionState(saveFirstName, undefined);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field id="name" label={t("label")} hint={t("hint")} error={state?.error ? t(state.error) : undefined}>
        <TextInput name="name" required maxLength={40} autoComplete="given-name" autoFocus placeholder={t("placeholder")} />
      </Field>
      <SubmitButton size="lg" className="w-full">{t("submit")}</SubmitButton>
    </form>
  );
}
