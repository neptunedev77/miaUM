import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import {
  ArrowLeft, CalendarClock, CircleCheck, Clock, Hand, Lock, Mail, MapPin, Palette, Phone, ShieldCheck, Sparkles, Tag,
} from "lucide-react";
import { CategoryIcon } from "@/components/category-icon";
import { Gallery } from "@/components/photos/gallery";
import { LostWindowTimeline } from "@/components/lost-window-timeline";
import { CustodyLabel, reportTitle } from "@/components/report-row";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";
import { Page } from "@/components/ui/page";
import { getReportForViewer } from "@/server/reports";
import { getCurrentUser } from "@/server/session";

export const metadata: Metadata = { title: "Anúncio" };

function Detail({ icon: Icon, label, children }: { icon: typeof Tag; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-3">
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
      <div className="min-w-0">
        <dt className="text-xs text-muted">{label}</dt>
        <dd className="text-sm font-medium">{children}</dd>
      </div>
    </div>
  );
}

export default async function ReportPage({ params, searchParams }: PageProps<"/anuncios/[id]">) {
  const [{ id }, { novo }] = await Promise.all([params, searchParams]);
  const [user, locale] = await Promise.all([getCurrentUser(), getLocale()]);
  const data = await getReportForViewer(id, user?.id ?? null, locale === "en" ? "en" : "pt");
  if (!data) notFound();
  const { report: r, isAuthor, owner } = data;

  const [t, tc, format] = await Promise.all([getTranslations("report"), getTranslations("colors"), getFormatter()]);
  const lost = r.type === "LOST";
  const when = (d: Date) => format.dateTime(d, { dateStyle: "medium", timeStyle: "short" });
  const similarHref = `/encontrei?${new URLSearchParams({
    categoria: r.categoryId,
    ...(r.campusId && { campus: r.campusId }),
    ...(r.color && { cor: r.color }),
  })}`;

  return (
    <Page className="mx-auto max-w-5xl">
      <Link href="/#anuncios" transitionTypes={["nav-back"]}
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground">
        <ArrowLeft aria-hidden className="size-4" /> {t("backToList")}
      </Link>

      {novo && isAuthor && (
        <Alert icon={CircleCheck} className="border-success/30 bg-success-soft text-success">
          <strong className="font-semibold">{t("publishedTitle")}</strong> {t(lost ? "publishedLostText" : "publishedFoundText")}
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card className="animate-fade-up overflow-hidden">
          {r.photos.length > 0 ? (
            <Gallery photos={r.photos} alt={reportTitle(r)} />
          ) : (
            <div className={cn("flex h-44 items-center justify-center sm:h-56", lost ? "bg-primary-soft text-primary-ink" : "bg-success-soft text-success")}>
              <CategoryIcon slug={r.categorySlug} className="size-16 animate-scale-in" />
            </div>
          )}
          <div className="space-y-4 p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={lost ? "primary" : "success"}>{t(lost ? "lostBadge" : "foundBadge")}</Badge>
              <span className="text-xs text-muted">{t("publishedAgo", { ago: format.relativeTime(r.publishedAt, new Date()) })}</span>
            </div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">{reportTitle(r)}</h1>
            <p className="text-pretty whitespace-pre-line">{r.description}</p>

            <dl className="grid divide-y divide-border border-t border-border sm:grid-cols-2 sm:divide-y-0">
              <Detail icon={Tag} label={t("category")}>{r.subcategoryName ? `${r.categoryName} · ${r.subcategoryName}` : r.categoryName}</Detail>
              {r.color && <Detail icon={Palette} label={t("color")}>{tc(r.color)}</Detail>}
              <Detail icon={MapPin} label={t(lost ? "whereLost" : "whereFound")}>
                {[r.campusName ?? t("campusUnknown"), r.locationName, r.locationNote].filter(Boolean).join(" · ")}
              </Detail>
              {!lost && <Detail icon={CalendarClock} label={t("whenFound")}>{when(r.eventAt)}</Detail>}
              {r.custody && (
                <Detail icon={ShieldCheck} label={t("custodyLabel")}><CustodyLabel custody={r.custody} icon={false} /></Detail>
              )}
            </dl>
            {lost && r.lostFrom && r.lostTo && (
              <div className="space-y-2">
                <p className="flex items-center gap-2 text-xs text-muted"><CalendarClock aria-hidden className="size-4" /> {t("whenLost")}</p>
                <LostWindowTimeline from={r.lostFrom} to={r.lostTo} />
              </div>
            )}
          </div>
        </Card>

        <aside className="space-y-4">
          {isAuthor && owner ? (
            <Card className="animate-fade-up space-y-4 p-5">
              <div className="flex items-center gap-2">
                <Sparkles aria-hidden className="size-4 text-primary-ink" />
                <h2 className="font-semibold">{t("yours")}</h2>
              </div>
              <p className="flex items-center gap-2 text-sm text-muted">
                <Clock aria-hidden className="size-4 shrink-0" /> {t("expiresOn", { date: format.dateTime(owner.expiresAt, { dateStyle: "long" }) })}
              </p>
              {owner.dropOffText && (
                <div className="rounded-xl bg-surface-muted p-3 text-sm">
                  <p className="text-xs text-muted">{t("handedInAt")}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 font-medium"><ShieldCheck aria-hidden className="size-4 shrink-0" /> {owner.dropOffText}</p>
                  {owner.point && <p className="mt-1 text-muted">{owner.point.directions}</p>}
                </div>
              )}
              {owner.contact && (
                <div className="space-y-1.5 rounded-xl bg-surface-muted p-3 text-sm">
                  <p className="flex items-start gap-2"><Hand aria-hidden className="mt-0.5 size-4 shrink-0" /> {t("finderKeeps")}</p>
                  <p className="flex items-center gap-2 text-muted"><Mail aria-hidden className="size-4 shrink-0" /> <span className="break-all">{owner.contact.email}</span></p>
                  {owner.contact.extra && <p className="flex items-center gap-2 text-muted"><Phone aria-hidden className="size-4 shrink-0" /> {owner.contact.extra}</p>}
                </div>
              )}
              {owner.privateDetails && (
                <div className="text-sm">
                  <p className="flex items-center gap-1.5 text-xs text-muted"><Lock aria-hidden className="size-3.5" /> {t("privateDetails")}</p>
                  <p className="mt-1">{owner.privateDetails}</p>
                </div>
              )}
              <p className="text-xs text-muted">{t("manageSoon")}</p>
            </Card>
          ) : lost ? (
            <Card className="animate-fade-up space-y-3 p-5">
              <h2 className="font-semibold">{t("sawItTitle")}</h2>
              <p className="text-sm text-muted">{t("sawItText")}</p>
              <ButtonLink href={similarHref} className="w-full">{t("foundSimilar")}</ButtonLink>
            </Card>
          ) : (
            <Card className="animate-fade-up space-y-3 p-5">
              <h2 className="font-semibold">{t("isItYoursTitle")}</h2>
              <p className="text-sm text-muted">{t("isItYoursText")}</p>
              <button type="button" disabled className={buttonClasses({ className: "w-full" })}>{t("itsMine")}</button>
              <p className="text-xs text-muted">{t("claimSoon")}</p>
            </Card>
          )}

          <div className="flex animate-fade-up items-start gap-3 rounded-2xl bg-primary-soft/60 p-4 text-sm">
            <Lock aria-hidden className="mt-0.5 size-4 shrink-0 text-primary-ink" />
            <p className="text-muted">{t("neverPublic")}</p>
          </div>
        </aside>
      </div>
    </Page>
  );
}
