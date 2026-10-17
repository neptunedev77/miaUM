"use client";

import { useTranslations } from "next-intl";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errors");
  return (
    <div role="alert"
      className="mx-auto flex max-w-xl animate-fade-up flex-col items-center rounded-2xl border border-dashed border-border-strong px-6 py-14 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-danger-soft text-danger">
        <TriangleAlert aria-hidden className="size-7" />
      </div>
      <h1 className="text-lg font-semibold">{t("genericTitle")}</h1>
      <p className="mt-1 text-sm text-muted">{t("genericText")}</p>
      <Button onClick={reset} className="mt-6"><RotateCcw aria-hidden className="size-4" /> {t("retry")}</Button>
    </div>
  );
}
