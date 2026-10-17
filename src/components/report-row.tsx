import Link from "next/link";
import type { CSSProperties } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { ChevronRight, MapPin, ShieldCheck, UserRound } from "lucide-react";
import { CategoryIcon } from "./category-icon";
import { Badge } from "./ui/badge";
import { cn } from "./ui/cn";

/** Dados públicos necessários para mostrar um anúncio numa lista (nunca dados privados). */
export type ReportSummary = {
  id: string;
  type: "LOST" | "FOUND";
  categorySlug: string;
  categoryName: string;
  subcategoryName: string | null;
  campusName: string | null;
  locationName: string | null;
  color: string | null;
  brand: string | null;
  description: string;
  eventAt: Date;
  publishedAt: Date;
  custody: { kind: "POINT" | "FINDER"; campusName: string | null } | null;
  photos?: { id: string }[];
};

export function reportTitle(r: Pick<ReportSummary, "subcategoryName" | "categoryName" | "brand">) {
  const base = r.subcategoryName ?? r.categoryName;
  return r.brand ? `${base} · ${r.brand}` : base;
}

export function CustodyLabel({ custody, className, icon = true }: {
  custody: NonNullable<ReportSummary["custody"]>;
  className?: string;
  /** false quando o rótulo já tem o seu próprio ícone (ex.: na página de detalhe). */
  icon?: boolean;
}) {
  const t = useTranslations("report.custody");
  const Icon = custody.kind === "POINT" ? ShieldCheck : UserRound;
  const text = custody.kind === "POINT" && custody.campusName
    ? t("POINT_campus", { campus: custody.campusName })
    : t(custody.kind);
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      {icon && <Icon aria-hidden className="size-3.5 shrink-0" />} {text}
    </span>
  );
}

/** Linha da lista compacta (versão "alta", com destaque). */
export function ReportRow({ report, index = 0, preview = false, badge, footer }: {
  report: ReportSummary;
  index?: number;
  preview?: boolean;
  /** Etiqueta extra (ex.: estado em "Os meus anúncios"). */
  badge?: React.ReactNode;
  /** Linha extra por baixo (ex.: prazo da reserva). */
  footer?: React.ReactNode;
}) {
  const t = useTranslations("report");
  const tc = useTranslations("colors");
  const format = useFormatter();
  const lost = report.type === "LOST";
  const place = [report.campusName ?? t("campusUnknown"), report.locationName].filter(Boolean).join(" · ");

  const body = (
    <>
      <div className={cn(
        "relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl sm:size-24",
        lost ? "bg-primary-soft text-primary-ink" : "bg-success-soft text-success",
      )}>
        {report.photos?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element -- servida pela própria app, com verificação de acesso
          <img src={`/api/fotos/${report.photos[0].id}?t=thumb`} alt="" loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <CategoryIcon slug={report.categorySlug} className="size-8 transition-transform duration-300 group-hover:scale-110" />
        )}
        {(report.photos?.length ?? 0) > 1 && (
          <span className="absolute right-1 bottom-1 rounded-md bg-black/60 px-1.5 text-[10px] font-semibold text-white">
            {report.photos!.length}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="flex flex-wrap items-center gap-1.5">
            <Badge tone={lost ? "primary" : "success"}>{t(lost ? "lostBadge" : "foundBadge")}</Badge>
            {badge}
          </span>
          <time dateTime={report.publishedAt.toISOString()} className="shrink-0 text-xs text-muted">
            {format.relativeTime(report.publishedAt, new Date())}
          </time>
        </div>
        <h3 className="truncate font-semibold">{reportTitle(report)}</h3>
        <p className="line-clamp-2 text-sm text-muted">{report.description}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span className="inline-flex items-center gap-1"><MapPin aria-hidden className="size-3.5" /> {place}</span>
          {report.color && <span>{tc(report.color)}</span>}
          {report.custody && <CustodyLabel custody={report.custody} />}
        </div>
        {footer}
      </div>
      {!preview && (
        <ChevronRight aria-hidden className="hidden size-5 shrink-0 self-center text-muted transition-transform duration-200 group-hover:translate-x-0.5 sm:block" />
      )}
    </>
  );

  const classes = cn(
    "group flex gap-4 rounded-2xl border border-border bg-surface p-3 shadow-soft sm:p-4",
    !preview && "stagger animate-fade-up transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift",
  );

  if (preview) return <div className={classes}>{body}</div>;
  return (
    <Link href={`/anuncios/${report.id}`} className={classes} style={{ "--i": Math.min(index, 8) } as CSSProperties}>
      {body}
    </Link>
  );
}
