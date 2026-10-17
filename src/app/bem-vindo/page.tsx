import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/card";
import { Page } from "@/components/ui/page";
import { LogoMark } from "@/components/logo";
import { safeNext } from "@/domain/navigation";
import { requireUser } from "@/server/session";
import { FirstNameForm } from "./first-name-form";

export const metadata: Metadata = { title: "Bem-vindo" };

/** Passo obrigatório depois do login: pede o primeiro nome se ainda não o tivermos. */
export default async function WelcomePage({ searchParams }: PageProps<"/bem-vindo">) {
  const next = safeNext((await searchParams).next, "/");
  const user = await requireUser(next);
  if (user.name) redirect(next);
  const t = await getTranslations("welcome");

  return (
    <Page className="mx-auto max-w-md">
      <div className="animate-fade-up space-y-3 text-center">
        <LogoMark className="mx-auto size-12" />
        <h1 className="font-display text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted">{t("intro")}</p>
      </div>
      <Card className="animate-fade-up p-6">
        <FirstNameForm next={next} />
      </Card>
    </Page>
  );
}
