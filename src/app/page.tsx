import { getTranslations } from "next-intl/server";

export default async function HomePage() {
  const t = await getTranslations("home");
  const tc = await getTranslations("common");

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-lg text-muted">{t("intro")}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          {/* Os formulários chegam na Fase 2 */}
          <button type="button" disabled aria-describedby="em-breve"
            className="rounded-lg bg-accent px-5 py-3 text-lg font-semibold text-accent-foreground opacity-60">
            {t("lost")}
          </button>
          <button type="button" disabled aria-describedby="em-breve"
            className="rounded-lg border-2 border-accent px-5 py-3 text-lg font-semibold text-accent opacity-60">
            {t("found")}
          </button>
        </div>
        <p id="em-breve" className="text-sm text-muted">{tc("comingSoon")}</p>
      </section>

      <p role="note" className="rounded-lg bg-notice px-4 py-3 text-notice-foreground">{t("oldNotice")}</p>

      <section aria-labelledby="recentes" className="space-y-3">
        <h2 id="recentes" className="text-xl font-semibold">{t("listTitle")}</h2>
        <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-muted">{t("empty")}</p>
      </section>
    </div>
  );
}
