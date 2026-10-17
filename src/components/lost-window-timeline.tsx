import { useFormatter, useTranslations } from "next-intl";
import { Eye, SearchX } from "lucide-react";
import { splitDuration } from "@/domain/lost-window";

/** Linha temporal do intervalo em que o objeto se perdeu (página de detalhe). */
export function LostWindowTimeline({ from, to }: { from: Date; to: Date }) {
  const t = useTranslations("lostWindow");
  const format = useFormatter();
  const sameDay = format.dateTime(from, { dateStyle: "medium" }) === format.dateTime(to, { dateStyle: "medium" });
  const d = splitDuration((to.getTime() - from.getTime()) / 60000);
  const duration = [
    d.days ? t("days", { n: d.days }) : null,
    d.hours ? t("hours", { n: d.hours }) : null,
    d.minutes || (!d.days && !d.hours) ? t("minutes", { n: d.minutes }) : null,
  ].filter(Boolean).join(" ");

  const point = (icon: React.ReactNode, label: string, date: Date, showDate: boolean, align: "start" | "end") => (
    <div className={align === "end" ? "text-right" : ""}>
      <p className={`flex items-center gap-1.5 text-xs text-muted ${align === "end" ? "justify-end" : ""}`}>{icon} {label}</p>
      <p className="font-semibold tabular-nums">{format.dateTime(date, { timeStyle: "short" })}</p>
      {showDate && <p className="text-xs text-muted">{format.dateTime(date, { dateStyle: "medium" })}</p>}
    </div>
  );

  return (
    <div className="space-y-2 rounded-xl bg-surface-muted p-4">
      {sameDay && <p className="text-xs font-medium text-muted">{format.dateTime(from, { dateStyle: "full" })}</p>}
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
        {point(<Eye aria-hidden className="size-3.5" />, t("seen"), from, !sameDay, "start")}
        <div className="relative flex items-center justify-center">
          <span aria-hidden className="absolute inset-x-0 h-0.5 rounded-full bg-primary/30" />
          <span aria-hidden className="absolute left-0 size-2.5 rounded-full bg-primary-ink" />
          <span aria-hidden className="absolute right-0 size-2.5 rounded-full bg-primary-ink" />
          <span className="relative rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-primary-ink ring-1 ring-primary/20">
            {duration}
          </span>
        </div>
        {point(<SearchX aria-hidden className="size-3.5" />, t("noticed"), to, !sameDay, "end")}
      </div>
    </div>
  );
}
