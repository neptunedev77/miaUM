"use client";

import { useTranslations } from "next-intl";
import { CalendarDays, CalendarClock, Eye, MoveDown, MoveRight, SearchX, Zap } from "lucide-react";
import { LIMITS } from "@/domain/report";
import { datePart, dayKind, join, presets, shiftDate, splitDuration, timePart, windowMinutes, type LocalDateTime } from "@/domain/lost-window";
import { cn } from "@/components/ui/cn";
import { controlClasses } from "@/components/ui/field";
import { FormSection } from "./choices";

type Key = "lostFrom" | "lostTo";

/** Um dos extremos do intervalo: dia (Hoje / Ontem / outro) + hora. */
function Endpoint({ id, icon, label, hint, value, today, now, onChange, error }: {
  id: Key;
  icon: React.ReactNode;
  label: string;
  hint: string;
  value: LocalDateTime;
  today: string;
  now: LocalDateTime;
  onChange: (v: LocalDateTime) => void;
  error?: string;
}) {
  const t = useTranslations("lostWindow");
  const date = value ? datePart(value) : "";
  const time = value ? timePart(value) : "";
  const kind = date ? dayKind(date, today) : null;
  const minDate = shiftDate(today, -60);

  function setDay(k: "today" | "yesterday" | "other") {
    const d = k === "today" ? today : k === "yesterday" ? shiftDate(today, -1) : kind === "other" ? date : shiftDate(today, -2);
    // Hoje sem hora escolhida: usa a hora atual (nunca no futuro).
    const fallback = d === today ? timePart(now) : "09:00";
    onChange(join(d, time || fallback));
  }

  const dayButtons = [
    { k: "today" as const, label: t("today") },
    { k: "yesterday" as const, label: t("yesterday") },
    { k: "other" as const, label: t("otherDay") },
  ];

  return (
    <fieldset aria-describedby={error ? `${id}-error` : `${id}-hint`}
      className={cn("space-y-3 rounded-2xl border bg-background/60 p-4 transition-colors", error ? "border-danger/50" : "border-border")}>
      <legend className="sr-only">{label}</legend>
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-ink">{icon}</span>
        <div className="min-w-0">
          <p aria-hidden className="font-medium leading-tight">{label}</p>
          <p id={`${id}-hint`} className="text-xs text-muted">{hint}</p>
        </div>
      </div>

      <div role="group" aria-label={t("day")} className="grid grid-cols-3 gap-1.5">
        {dayButtons.map((b) => (
          <button key={b.k} type="button" onClick={() => setDay(b.k)} aria-pressed={kind === b.k}
            className={cn(
              "rounded-xl border px-2 py-2 text-sm font-medium transition-[background-color,border-color,color] duration-200 active:scale-[0.98]",
              kind === b.k ? "border-primary-ink bg-primary-soft text-foreground" : "border-border text-muted hover:border-border-strong hover:text-foreground",
            )}>
            {b.label}
          </button>
        ))}
      </div>

      {kind === "other" && (
        <div className="relative animate-slide-down">
          <CalendarDays aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
          <label htmlFor={`${id}-date`} className="sr-only">{t("date")}</label>
          <input id={`${id}-date`} type="date" value={date} min={minDate} max={today}
            onChange={(e) => e.target.value && onChange(join(e.target.value, time || "09:00"))}
            className={cn(controlClasses, "h-11 pl-10")} />
        </div>
      )}

      <div className="flex items-center gap-2">
        <label htmlFor={`${id}-time`} className="text-sm text-muted">{t("at")}</label>
        <input id={`${id}-time`} type="time" step={300} value={time} disabled={!date}
          max={date === today ? timePart(now) : undefined}
          onChange={(e) => onChange(join(date || today, e.target.value))}
          className={cn(controlClasses, "h-11 w-32 text-center tabular-nums")} />
      </div>

      {error && <p id={`${id}-error`} className="text-xs font-medium text-danger">{error}</p>}
    </fieldset>
  );
}

/** Campo do intervalo em que o objeto se perdeu (substitui dois campos de data/hora "soltos"). */
export function LostWindowField({ now, from, to, onChange, errors }: {
  now: LocalDateTime;
  from: LocalDateTime;
  to: LocalDateTime;
  onChange: (key: Key, value: LocalDateTime) => void;
  errors: Partial<Record<Key, string>>;
}) {
  const t = useTranslations("lostWindow");
  const tf = useTranslations("reportForm");
  const today = datePart(now);
  const minutes = from && to ? windowMinutes(from, to) : null;

  // Validação imediata (o servidor volta a validar com as mesmas regras).
  let problem: string | null = null;
  if (from > now || to > now) problem = "dateInFuture";
  else if (minutes !== null && minutes < 0) problem = "lostToBeforeFrom";
  else if (minutes !== null && minutes > LIMITS.lostWindowMaxDays * 1440) problem = "windowTooLong";

  const fromError = errors.lostFrom ? tf(`errors.${errors.lostFrom}`) : undefined;
  const toError = errors.lostTo ? tf(`errors.${errors.lostTo}`) : undefined;

  const d = minutes !== null && minutes >= 0 ? splitDuration(minutes) : null;
  const duration = d && [
    d.days ? t("days", { n: d.days }) : null,
    d.hours ? t("hours", { n: d.hours }) : null,
    d.minutes || (!d.days && !d.hours) ? t("minutes", { n: d.minutes }) : null,
  ].filter(Boolean).join(" ");

  return (
    <FormSection icon={<CalendarClock className="size-4" />} title={tf("whenLostTitle")} description={t("intro")}>
      <input type="hidden" name="lostFrom" value={from} />
      <input type="hidden" name="lostTo" value={to} />

      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs font-medium text-muted"><Zap aria-hidden className="size-3.5" /> {t("shortcuts")}</span>
        {presets(now).map((p) => {
          const active = from === p.from && to === p.to;
          return (
            <button key={p.key} type="button" aria-pressed={active}
              onClick={() => { onChange("lostFrom", p.from); onChange("lostTo", p.to); }}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm transition-[background-color,border-color,color] duration-200 active:scale-[0.97]",
                active ? "border-primary-ink bg-primary text-primary-foreground" : "border-border bg-surface text-muted hover:border-primary/40 hover:text-foreground",
              )}>
              {t(`presets.${p.key}`)}
            </button>
          );
        })}
      </div>

      <div className="grid items-stretch gap-2 md:grid-cols-[1fr_auto_1fr]">
        <Endpoint id="lostFrom" icon={<Eye className="size-4" />} label={tf("lostFrom")} hint={t("fromHint")}
          value={from} today={today} now={now} onChange={(v) => onChange("lostFrom", v)} error={fromError} />
        <div aria-hidden className="flex items-center justify-center text-muted">
          <MoveDown className="size-5 md:hidden" />
          <MoveRight className="hidden size-5 md:block" />
        </div>
        <Endpoint id="lostTo" icon={<SearchX className="size-4" />} label={tf("lostTo")} hint={t("toHint")}
          value={to} today={today} now={now} onChange={(v) => onChange("lostTo", v)} error={toError} />
      </div>

      <div aria-live="polite" className={cn(
        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors duration-300",
        problem ? "bg-danger-soft text-danger" : duration ? "bg-success-soft text-success" : "bg-surface-muted text-muted",
      )}>
        <span aria-hidden className="relative flex h-2 flex-1 items-center">
          <span className="absolute inset-x-0 h-0.5 rounded-full bg-current opacity-25" />
          <span className="absolute left-0 size-2.5 rounded-full bg-current" />
          <span className="absolute right-0 size-2.5 rounded-full bg-current" />
        </span>
        <span className="shrink-0 font-medium">
          {problem ? tf(`errors.${problem}`) : duration ? t("window", { duration }) : t("incomplete")}
        </span>
      </div>
    </FormSection>
  );
}
