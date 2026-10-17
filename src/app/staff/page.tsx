import type { CSSProperties } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { Clock, MapPin, PackageOpen, Store } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, interactiveCard } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";
import { EmptyState, Page, PageHeader } from "@/components/ui/page";
import { formatIntervals, intervalsFor, lisbonWeekday } from "@/domain/hours";
import { prisma } from "@/server/db";
import { requireRole } from "@/server/session";

export default async function StaffPage() {
  const user = await requireRole("STAFF");
  const [t, tc, locale] = await Promise.all([getTranslations("staff"), getTranslations("common"), getLocale()]);
  const points = await prisma.dropOffPoint.findMany({
    where: { staff: { some: { userId: user.id } } },
    include: { campus: true, location: true },
    orderBy: { name: "asc" },
  });
  const today = lisbonWeekday(new Date());
  const en = locale === "en";

  return (
    <Page>
      <PageHeader title={t("title")} description={t("description")} />

      <section aria-labelledby="pontos" className="space-y-4">
        <h2 id="pontos" className="text-lg font-semibold">{t("points")}</h2>
        {points.length === 0 ? (
          <EmptyState icon={<Store className="size-7" aria-hidden />} title={t("noPoints")} description={t("noPointsText")} />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {points.map((p, i) => {
              const hours = formatIntervals(intervalsFor(p.hours, today));
              return (
                <li key={p.id} className="stagger animate-fade-up" style={{ "--i": i } as CSSProperties}>
                  <Card className={cn("h-full space-y-4 p-6", interactiveCard)}>
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary-ink">
                        <Store aria-hidden className="size-5" />
                      </span>
                      {p.isPlaceholder && <Badge tone="accent">{tc("provisional")}</Badge>}
                    </div>
                    <h3 className="font-semibold">{p.name}</h3>
                    <div className="space-y-2 text-sm text-muted">
                      <p className="flex items-center gap-2">
                        <MapPin aria-hidden className="size-4 shrink-0" />
                        {en ? p.campus.nameEn : p.campus.namePt}
                        {p.location && <> · {en ? p.location.nameEn : p.location.namePt}</>}
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock aria-hidden className="size-4 shrink-0" />
                        <span>
                          <span className="font-medium text-foreground">{t("today")}:</span> {hours ?? t("closedToday")}
                        </span>
                      </p>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Alert icon={PackageOpen}>{t("itemsSoon")}</Alert>
    </Page>
  );
}
