import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Page, PageHeader } from "@/components/ui/page";
import { LostForm } from "@/components/report-form/lost-form";
import { utcToLisbonLocal } from "@/domain/time";
import { getFormOptions } from "@/server/reports";
import { requireNamedUser } from "@/server/session";

export const metadata: Metadata = { title: "Perdi algo" };

export default async function LostPage() {
  await requireNamedUser("/perdi");
  const [t, locale] = await Promise.all([getTranslations("report"), getLocale()]);
  const options = await getFormOptions(locale === "en" ? "en" : "pt");

  return (
    <Page className="mx-auto max-w-3xl">
      <PageHeader title={t("lostTitle")} description={t("lostIntro")} />
      <LostForm options={options} now={utcToLisbonLocal(new Date())} />
    </Page>
  );
}
