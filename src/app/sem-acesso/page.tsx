import { getTranslations } from "next-intl/server";
import { ArrowLeft, Lock } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, Page } from "@/components/ui/page";

export default async function ForbiddenPage() {
  const t = await getTranslations("errors");
  const tc = await getTranslations("common");
  return (
    <Page className="mx-auto max-w-xl">
      <EmptyState icon={<Lock className="size-7" aria-hidden />} title={t("forbiddenTitle")} description={t("forbiddenText")}
        action={<ButtonLink href="/" variant="outline"><ArrowLeft aria-hidden className="size-4" /> {tc("backHome")}</ButtonLink>} />
    </Page>
  );
}
