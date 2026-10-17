import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft, CalendarClock, CircleCheck, Lock, MapPin, Palette, ShieldCheck, Tag } from "lucide-react";
import { CategoryIcon } from "@/components/category-icon";
import { Gallery } from "@/components/photos/gallery";
import { LostWindowTimeline } from "@/components/lost-window-timeline";
import { CustodyLabel, reportTitle } from "@/components/report-row";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";
import { Page } from "@/components/ui/page";
import { config } from "@/server/config";
import { getReportForViewer } from "@/server/reports";
import { ClaimantPanel, OwnerPanel, VisitorPanel } from "./panels";
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
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [user, locale] = await Promise.all([getCurrentUser(), getLocale()]);
  const data = await getReportForViewer(id, user?.id ?? null, locale === "en" ? "en" : "pt");
  if (!data) notFound();
  const { report: r, isAuthor } = data;

  const [t, tc, tcl, format] = await Promise.all([getTranslations("report"), getTranslations("colors"), getTranslations("claim"), getFormatter()]);
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

      {query.novo && isAuthor && (
        <Alert icon={CircleCheck} className="border-success/30 bg-success-soft text-success">
          <strong className="font-semibold">{t("publishedTitle")}</strong> {t(lost ? "publishedLostText" : "publishedFoundText")}
        </Alert>
      )}
      {(["reservado", "concluido", "encerrado", "reaberto", "recuperado"] as const).map((k) =>
        query[k] ? (
          <Alert key={k} icon={CircleCheck} className="border-success/30 bg-success-soft text-success">{tcl(`flash.${k}`)}</Alert>
        ) : null,
      )}
      {typeof query.erro === "string" && <Alert tone="danger">{tcl.has(`errors.${query.erro}`) ? tcl(`errors.${query.erro}`) : tcl("errors.notAllowed")}</Alert>}

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
              {(r.status === "CLAIMED" || r.status === "RETURNED" || r.status === "RECOVERED") && (
                <Badge tone="accent">{tcl(`status.${r.status}`)}</Badge>
              )}
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
          {isAuthor ? <OwnerPanel data={data} />
            : data.claim ? <ClaimantPanel data={data} />
            : <VisitorPanel data={data} signedIn={Boolean(user)} revertDays={config.CLAIM_REVERT_DAYS} similarHref={similarHref} />}

          <div className="flex animate-fade-up items-start gap-3 rounded-2xl bg-primary-soft/60 p-4 text-sm">
            <Lock aria-hidden className="mt-0.5 size-4 shrink-0 text-primary-ink" />
            <p className="text-muted">{t("neverPublic")}</p>
          </div>
        </aside>
      </div>
    </Page>
  );
}
