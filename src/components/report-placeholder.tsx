import { getTranslations } from "next-intl/server";
import { ArrowLeft, Hammer, PackageSearch, Search } from "lucide-react";
import { ButtonLink } from "./ui/button";
import { EmptyState, Page, PageHeader } from "./ui/page";

/** Página provisória dos formulários "Perdi" / "Encontrei" (implementados na Fase 2). */
export async function ReportPlaceholder({ type }: { type: "lost" | "found" }) {
  const t = await getTranslations("report");
  const tc = await getTranslations("common");
  const Icon = type === "lost" ? Search : PackageSearch;

  return (
    <Page className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow={<span className="inline-flex items-center gap-1.5"><Icon aria-hidden className="size-4" />{tc("comingSoon")}</span>}
        title={t(type === "lost" ? "lostTitle" : "foundTitle")}
        description={t(type === "lost" ? "lostText" : "foundText")}
      />
      <EmptyState icon={<Hammer className="size-7" aria-hidden />} title={t("soonTitle")} description={t("soonText")}
        action={<ButtonLink href="/" variant="outline"><ArrowLeft aria-hidden className="size-4" /> {tc("backHome")}</ButtonLink>} />
    </Page>
  );
}
