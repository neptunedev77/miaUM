import type { CSSProperties } from "react";
import { getTranslations } from "next-intl/server";
import { BellRing, Clock, Hand, Inbox, PackageSearch, PenLine, ShieldCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, Page } from "@/components/ui/page";

const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

export default async function HomePage() {
  const t = await getTranslations("home");
  const steps = [
    { icon: <PenLine className="size-5" aria-hidden />, key: "1" },
    { icon: <BellRing className="size-5" aria-hidden />, key: "2" },
    { icon: <Hand className="size-5" aria-hidden />, key: "3" },
  ] as const;

  return (
    <Page className="space-y-14">
      {/* Topo compacto: os anúncios (o essencial da app) ficam logo abaixo */}
      <section className="relative">
        {/* Fundo decorativo a toda a largura, esbatido em baixo */}
        <div aria-hidden
          className="bg-hero pointer-events-none absolute -top-10 left-1/2 h-[calc(100%+5rem)] w-screen -translate-x-1/2 [mask-image:linear-gradient(to_bottom,black_55%,transparent)] sm:-top-14">
          <div className="bg-dots absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />
        </div>
        <div className="relative max-w-3xl space-y-4">
          <p className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-border bg-surface/80 px-3 py-1 text-sm font-medium text-muted backdrop-blur">
            <span aria-hidden className="size-1.5 rounded-full bg-primary-ink" />
            {t("eyebrow")}
          </p>
          <h1 className="stagger animate-fade-up font-display text-3xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl"
            style={stagger(1)}>
            {t("title")}
          </h1>
          <p className="stagger max-w-2xl animate-fade-up text-pretty text-muted sm:text-lg" style={stagger(2)}>{t("intro")}</p>
          <div className="stagger flex animate-fade-up flex-col gap-3 pt-2 sm:flex-row" style={stagger(3)}>
            <ButtonLink href="/perdi" size="lg" variant="outline">
              {t("lost")}
            </ButtonLink>
            <ButtonLink href="/encontrei" size="lg">
              <PackageSearch aria-hidden className="size-5" /> {t("found")}
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* Anúncios recentes: o núcleo da app */}
      <section aria-labelledby="recentes" className="stagger animate-fade-up space-y-4" style={stagger(4)}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 id="recentes" className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{t("listTitle")}</h2>
          <p className="flex items-center gap-1.5 text-sm text-muted">
            <Clock aria-hidden className="size-4 shrink-0" /> {t("oldNotice")}
          </p>
        </div>
        <EmptyState icon={<Inbox className="size-7" aria-hidden />} title={t("empty")} description={t("emptyText")} />
      </section>

      {/* Como funciona + privacidade */}
      <section aria-labelledby="como-funciona" className="space-y-6">
        <div className="space-y-1">
          <h2 id="como-funciona" className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{t("howTitle")}</h2>
          <p className="text-muted">{t("howText")}</p>
        </div>
        <ol className="grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.key} style={stagger(i)}
              className="stagger relative animate-fade-up rounded-2xl border border-border bg-surface p-6 shadow-soft">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary-ink">{s.icon}</span>
                <span aria-hidden className="font-display text-3xl font-semibold text-border-strong">0{s.key}</span>
              </div>
              <h3 className="font-semibold">{t(`steps.${s.key}.title`)}</h3>
              <p className="mt-1 text-sm text-muted">{t(`steps.${s.key}.text`)}</p>
            </li>
          ))}
        </ol>
        <div className="flex animate-fade-up items-start gap-4 rounded-2xl bg-primary-soft/60 p-6">
          <ShieldCheck aria-hidden className="mt-0.5 size-6 shrink-0 text-primary-ink" />
          <div>
            <h3 className="font-semibold">{t("privacyTitle")}</h3>
            <p className="mt-1 text-sm text-muted">{t("privacyText")}</p>
          </div>
        </div>
      </section>
    </Page>
  );
}
