import { getTranslations } from "next-intl/server";

/** Esqueleto genérico enquanto a página carrega. */
export default async function Loading() {
  const t = await getTranslations("common");
  return (
    <div role="status" aria-live="polite" className="animate-fade-in space-y-8">
      <span className="sr-only">{t("loading")}</span>
      <div className="space-y-3">
        <div className="skeleton h-10 w-2/3 max-w-md rounded-xl" />
        <div className="skeleton h-4 w-full max-w-lg rounded-lg" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="skeleton h-40 rounded-2xl" />
        <div className="skeleton h-40 rounded-2xl" />
      </div>
    </div>
  );
}
