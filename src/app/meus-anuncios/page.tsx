import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { CircleCheck, Clock, Hand, Inbox, PackageSearch, Search } from "lucide-react";
import { ReportRow } from "@/components/report-row";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { EmptyState, Page, PageHeader } from "@/components/ui/page";
import { getMyClaims, getMyReports } from "@/server/reports";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Os meus anúncios" };

const TABS = ["perdidos", "encontrados", "pedidos"] as const;
type Tab = (typeof TABS)[number];

export default async function MyReportsPage({ searchParams }: PageProps<"/meus-anuncios">) {
  const query = await searchParams;
  const tab: Tab = TABS.includes(query.separador as Tab) ? (query.separador as Tab) : "perdidos";
  const user = await requireUser(`/meus-anuncios?separador=${tab}`);
  const locale = (await getLocale()) === "en" ? "en" : "pt";
  const [t, tc, format] = await Promise.all([getTranslations("myReports"), getTranslations("claim"), getFormatter()]);

  // Tudo carregado de uma vez: as listas são pequenas (anúncios de 30 dias de um utilizador).
  const [lost, found, claims] = await Promise.all([
    getMyReports(user.id, "LOST", locale),
    getMyReports(user.id, "FOUND", locale),
    getMyClaims(user.id, locale),
  ]);
  const counts: Record<Tab, number> = { perdidos: lost.length, encontrados: found.length, pedidos: claims.length };
  const pending = found.filter((r) => r.status === "CLAIMED").length + claims.filter((c) => c.status === "ACTIVE").length;

  const statusBadge = (status: string) =>
    status === "OPEN" || status === "PUBLISHED" ? <Badge tone="neutral">{tc("status.ACTIVE_REPORT")}</Badge>
      : <Badge tone={status === "CLAIMED" ? "accent" : "success"}>{tc(`status.${status}`)}</Badge>;

  return (
    <Page>
      <PageHeader title={t("title")} description={pending > 0 ? t("pending", { count: pending }) : t("description")} />

      {query.desistiu && <Alert icon={CircleCheck}>{tc("flash.desistiu")}</Alert>}
      {typeof query.erro === "string" && <Alert tone="danger">{tc.has(`errors.${query.erro}`) ? tc(`errors.${query.erro}`) : tc("errors.notAllowed")}</Alert>}

      <nav aria-label={t("tabsLabel")} className="flex gap-1 overflow-x-auto rounded-2xl border border-border bg-surface p-1">
        {TABS.map((key) => (
          <Link key={key} href={`/meus-anuncios?separador=${key}`} scroll={false} aria-current={tab === key ? "page" : undefined}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-200",
              tab === key ? "bg-primary text-primary-foreground shadow-soft" : "text-muted hover:text-foreground",
            )}>
            {t(`tabs.${key}`)}
            <span className={cn("rounded-full px-1.5 text-xs tabular-nums", tab === key ? "bg-white/20" : "bg-surface-muted")}>{counts[key]}</span>
          </Link>
        ))}
      </nav>

      {tab === "perdidos" && (
        lost.length === 0
          ? <EmptyState icon={<Search className="size-7" aria-hidden />} title={t("emptyLost")} description={t("emptyLostText")}
              action={<ButtonLink href="/perdi">{t("newLost")}</ButtonLink>} />
          : <ul className="grid gap-3">{lost.map((r, i) => <li key={r.id}><ReportRow report={r} index={i} badge={statusBadge(r.status)} /></li>)}</ul>
      )}

      {tab === "encontrados" && (
        found.length === 0
          ? <EmptyState icon={<PackageSearch className="size-7" aria-hidden />} title={t("emptyFound")} description={t("emptyFoundText")}
              action={<ButtonLink href="/encontrei">{t("newFound")}</ButtonLink>} />
          : <ul className="grid gap-3">
              {found.map((r, i) => (
                <li key={r.id}>
                  <ReportRow report={r} index={i} badge={statusBadge(r.status)}
                    footer={r.status === "CLAIMED" && r.custody?.kind === "FINDER"
                      ? <p className="flex items-center gap-1.5 text-xs font-medium text-notice-foreground"><Hand aria-hidden className="size-3.5" /> {t("finderAttention")}</p>
                      : null} />
                </li>
              ))}
            </ul>
      )}

      {tab === "pedidos" && (
        claims.length === 0
          ? <EmptyState icon={<Inbox className="size-7" aria-hidden />} title={t("emptyClaims")} description={t("emptyClaimsText")} />
          : <ul className="grid gap-3">
              {claims.map((c, i) => (
                <li key={c.id}>
                  <ReportRow report={c.report} index={i}
                    badge={<Badge tone={c.status === "ACTIVE" ? "accent" : c.status === "COMPLETED" ? "success" : "neutral"}>{tc(`claimStatus.${c.status}`)}</Badge>}
                    footer={c.status === "ACTIVE"
                      ? <p className="flex items-center gap-1.5 text-xs font-medium text-notice-foreground">
                          <Clock aria-hidden className="size-3.5" /> {tc("deadline", { date: format.dateTime(c.deadline, { dateStyle: "medium", timeStyle: "short" }) })}
                        </p>
                      : null} />
                </li>
              ))}
            </ul>
      )}
    </Page>
  );
}
