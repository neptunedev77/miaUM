import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Page, PageHeader } from "@/components/ui/page";
import { FoundWizard } from "@/components/report-form/found-wizard";
import { COLORS } from "@/domain/report";
import { utcToLisbonLocal } from "@/domain/time";
import { getFormOptions } from "@/server/reports";
import { requireNamedUser } from "@/server/session";

export const metadata: Metadata = { title: "Encontrei algo" };

/** Aceita ?categoria=&campus=&cor= (vindo de "Encontrei algo parecido" num anúncio de perdido). */
export default async function FoundPage({ searchParams }: PageProps<"/encontrei">) {
  const params = await searchParams;
  const user = await requireNamedUser("/encontrei");
  const [t, locale] = await Promise.all([getTranslations("report"), getLocale()]);
  const options = await getFormOptions(locale === "en" ? "en" : "pt");

  // Só valores que existem nas opções são usados para preencher o formulário.
  const initial: Record<string, string> = {};
  if (options.categories.some((c) => c.id === params.categoria)) initial.categoryId = params.categoria as string;
  if (options.campi.some((c) => c.id === params.campus)) initial.campusId = params.campus as string;
  if (COLORS.some((c) => c === params.cor)) initial.color = params.cor as string;

  return (
    <Page className="mx-auto max-w-3xl">
      <PageHeader title={t("foundTitle")} description={t("foundIntro")} />
      <FoundWizard options={options} now={utcToLisbonLocal(new Date())} initial={initial} email={user.email} />
    </Page>
  );
}
