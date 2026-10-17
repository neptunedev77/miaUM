import type { CSSProperties } from "react";
import { getTranslations } from "next-intl/server";
import { Building2, LayoutGrid, MapPin, Store, Users, Wrench } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Card, interactiveCard } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";
import { Page, PageHeader } from "@/components/ui/page";
import { prisma } from "@/server/db";
import { requireRole } from "@/server/session";

export default async function AdminPage() {
  await requireRole("ADMIN");
  const t = await getTranslations("admin");
  const [campi, locations, categories, points, users] = await Promise.all([
    prisma.campus.count(),
    prisma.location.count(),
    prisma.category.count(),
    prisma.dropOffPoint.count(),
    prisma.user.count({ where: { deletedAt: null } }),
  ]);
  const stats = [
    { label: t("campi"), value: campi, icon: Building2 },
    { label: t("locations"), value: locations, icon: MapPin },
    { label: t("categories"), value: categories, icon: LayoutGrid },
    { label: t("points"), value: points, icon: Store },
    { label: t("users"), value: users, icon: Users },
  ];

  return (
    <Page>
      <PageHeader title={t("title")} description={t("description")} />

      <section aria-labelledby="resumo" className="space-y-4">
        <h2 id="resumo" className="text-lg font-semibold">{t("stats")}</h2>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {stats.map(({ label, value, icon: Icon }, i) => (
            <Card key={label} style={{ "--i": i } as CSSProperties}
              className={cn("stagger flex animate-fade-up flex-col gap-3 p-5", interactiveCard)}>
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary-ink">
                <Icon aria-hidden className="size-5" />
              </span>
              <dt className="text-sm text-muted">{label}</dt>
              <dd className="-mt-2 font-display text-3xl font-semibold tabular-nums">{value}</dd>
            </Card>
          ))}
        </dl>
      </section>

      <Alert icon={Wrench}>{t("toolsSoon")}</Alert>
    </Page>
  );
}
