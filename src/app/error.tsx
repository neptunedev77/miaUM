"use client";

import { useTranslations } from "next-intl";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errors");
  return (
    <div role="alert" className="space-y-3">
      <h1 className="text-2xl font-bold">{t("genericTitle")}</h1>
      <p className="text-muted">{t("genericText")}</p>
      <button type="button" onClick={reset} className="rounded bg-accent px-4 py-2 font-medium text-accent-foreground">
        {t("retry")}
      </button>
    </div>
  );
}
