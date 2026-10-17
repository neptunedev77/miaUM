import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft, ArrowRight, Inbox, SearchX } from "lucide-react";
import { ReportFilters } from "@/components/report-filters";
import { listHref, type FilterValues } from "@/components/list-href";
import { ReportRow } from "@/components/report-row";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/page";
import { pageNumbers } from "@/domain/pagination";
import { lisbonLocalToUtc } from "@/domain/time";
import { cn } from "@/components/ui/cn";
import { getFormOptions, listPublicReports, PAGE_SIZE, type ListFilters } from "@/server/reports";
import Link from "next/link";
import { redirect } from "next/navigation";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const str = (v: string | string[] | undefined) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 80) : undefined);

/** Lê os filtros do URL, ignorando valores inválidos. */
function parseFilters(params: Record<string, string | string[] | undefined>) {
  const values: FilterValues = {
    tipo: ["perdidos", "encontrados"].includes(str(params.tipo) ?? "") ? str(params.tipo) : undefined,
    q: str(params.q),
    campus: str(params.campus),
    local: str(params.local),
    categoria: str(params.categoria),
    desde: DATE_RE.test(str(params.desde) ?? "") ? str(params.desde) : undefined,
    ate: DATE_RE.test(str(params.ate) ?? "") ? str(params.ate) : undefined,
  };
  const filters: ListFilters = {
    type: values.tipo === "perdidos" ? "LOST" : values.tipo === "encontrados" ? "FOUND" : undefined,
    q: values.q,
    campusId: values.campus,
    locationId: values.campus ? values.local : undefined,
    categoryId: values.categoria,
    from: values.desde ? (lisbonLocalToUtc(`${values.desde}T00:00`) ?? undefined) : undefined,
    to: values.ate ? (lisbonLocalToUtc(`${values.ate}T23:59`) ?? undefined) : undefined,
  };
  const page = Math.max(0, Math.min(500, Number.parseInt(str(params.pagina) ?? "1", 10) - 1 || 0));
  return { values, filters, page };
}

export async function ReportList({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const locale = (await getLocale()) === "en" ? "en" : "pt";
  const t = await getTranslations("list");
  const { values, filters, page } = parseFilters(searchParams);
  const [{ items, total }, options] = await Promise.all([listPublicReports(filters, page, locale), getFormOptions(locale)]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filtered = Boolean(values.q || values.campus || values.categoria || values.local || values.desde || values.ate || values.tipo);
  const pageHref = (p: number) => listHref("/", { ...values, pagina: p > 0 ? String(p + 1) : undefined });
  // Página além do fim (ex.: link antigo depois de anúncios expirarem): vai para a última.
  if (page > 0 && page >= pages) redirect(pageHref(pages - 1));

  return (
    <div className="space-y-4">
      <ReportFilters values={values}
        campi={options.campi.map((c) => ({ id: c.id, name: c.name, locations: c.locations }))}
        categories={options.categories.map((c) => ({ id: c.id, name: c.name }))} />

      <p className="text-sm text-muted" aria-live="polite">
        {total > PAGE_SIZE
          ? t("showing", { from: page * PAGE_SIZE + 1, to: Math.min(total, (page + 1) * PAGE_SIZE), total })
          : t("count", { count: total })}
      </p>

      {items.length === 0 ? (
        filtered
          ? <EmptyState icon={<SearchX className="size-7" aria-hidden />} title={t("noResults")} description={t("noResultsText")} />
          : <EmptyState icon={<Inbox className="size-7" aria-hidden />} title={t("empty")} description={t("emptyText")} />
      ) : (
        <ul className="grid gap-3">
          {items.map((r, i) => <li key={r.id}><ReportRow report={r} index={i} /></li>)}
        </ul>
      )}

      {pages > 1 && (
        <nav aria-label={t("pagination")} className="flex flex-wrap items-center justify-center gap-1.5 pt-2 sm:justify-between">
          {page > 0
            ? <Link href={pageHref(page - 1)} scroll={false} className={buttonClasses({ variant: "outline", size: "sm" })} aria-label={t("previous")}>
                <ArrowLeft aria-hidden className="size-4" /> <span className="hidden sm:inline">{t("previous")}</span>
              </Link>
            : <span className="hidden sm:block" />}
          <ol className="flex items-center gap-1">
            {pageNumbers(page + 1, pages).map((n, i) => (
              <li key={`${n}-${i}`}>
                {n === "…" ? (
                  <span aria-hidden className="px-1.5 text-muted">…</span>
                ) : (
                  <Link href={pageHref(n - 1)} scroll={false} aria-current={n === page + 1 ? "page" : undefined}
                    aria-label={t("pageOf", { page: n, pages })}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-xl text-sm font-medium tabular-nums transition-colors duration-200",
                      n === page + 1 ? "bg-primary text-primary-foreground shadow-soft" : "text-muted hover:bg-surface-muted hover:text-foreground",
                    )}>
                    {n}
                  </Link>
                )}
              </li>
            ))}
          </ol>
          {page + 1 < pages
            ? <Link href={pageHref(page + 1)} scroll={false} className={buttonClasses({ variant: "outline", size: "sm" })} aria-label={t("next")}>
                <span className="hidden sm:inline">{t("next")}</span> <ArrowRight aria-hidden className="size-4" />
              </Link>
            : <span className="hidden sm:block" />}
        </nav>
      )}
    </div>
  );
}
