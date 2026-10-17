import { getTranslations } from "next-intl/server";
import { ArrowLeft, MailCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Page } from "@/components/ui/page";

export default async function CheckEmailPage() {
  const t = await getTranslations("login");
  return (
    <Page className="mx-auto max-w-md">
      <Card className="animate-fade-up p-8 text-center">
        <div className="mx-auto mb-5 flex size-16 animate-scale-in items-center justify-center rounded-2xl bg-primary-soft text-primary-ink">
          <MailCheck aria-hidden className="size-8" />
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">{t("checkTitle")}</h1>
        <p className="mt-2 text-muted">{t("checkText")}</p>
        <p className="mt-4 rounded-xl bg-surface-muted px-4 py-3 text-sm text-muted">{t("checkHint")}</p>
        <ButtonLink href="/entrar" variant="ghost" className="mt-6">
          <ArrowLeft aria-hidden className="size-4" /> {t("tryAgain")}
        </ButtonLink>
      </Card>
    </Page>
  );
}
