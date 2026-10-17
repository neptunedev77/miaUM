"use client";

import { startTransition, useActionState, useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, CalendarClock, Check, Eye, Hand, Lock, Mail, Send, ShieldCheck, TriangleAlert } from "lucide-react";
import { createFoundAction } from "@/app/anuncios/actions";
import type { FormOptions } from "@/server/reports";
import { fieldErrors, foundReportSchema, LIMITS, UNKNOWN_CAMPUS } from "@/domain/report";
import { lisbonLocalToUtc } from "@/domain/time";
import { Alert } from "@/components/ui/alert";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { CharCount, Field, Textarea, TextInput } from "@/components/ui/field";
import { ReportRow } from "@/components/report-row";
import { FormSection } from "./choices";
import { ItemFields, type Values } from "./item-fields";

type Step = "start" | "encourage" | "point" | "finder" | "details" | "preview";

/** Campos do primeiro passo, para voltar ao passo certo quando há erros. */
const CUSTODY_FIELDS = ["holderType", "dropOffText", "dropOffPointId", "finderContact", "finderAccepted"];

function Stepper({ current }: { current: 0 | 1 | 2 }) {
  const t = useTranslations("reportForm.steps");
  const steps = [t("custody"), t("details"), t("preview")];
  return (
    <ol className="flex items-center gap-2 text-sm" aria-label={t("label")}>
      {steps.map((label, i) => (
        <li key={label} className="flex flex-1 items-center gap-2" aria-current={i === current ? "step" : undefined}>
          <span className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-300",
            i < current ? "bg-primary text-primary-foreground" : i === current ? "bg-primary-soft text-primary-ink ring-2 ring-primary-ink" : "bg-surface-muted text-muted",
          )}>
            {i < current ? <Check aria-hidden className="size-3.5" /> : i + 1}
          </span>
          <span className={cn("hidden sm:inline", i === current ? "font-medium" : "text-muted")}>{label}</span>
          {i < steps.length - 1 && <span aria-hidden className={cn("h-px flex-1 transition-colors duration-300", i < current ? "bg-primary" : "bg-border")} />}
        </li>
      ))}
    </ol>
  );
}

const choiceCard =
  "group flex flex-col items-start gap-2 rounded-2xl border border-border p-5 text-left transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift";

export function FoundWizard({ options, now, initial, email }: { options: FormOptions; now: string; initial: Values; email: string }) {
  const t = useTranslations("reportForm");
  const tf = useTranslations("report");
  const listId = useId();
  const [step, setStep] = useState<Step>("start");
  const [values, setValues] = useState<Values>({ foundAt: now, ...initial });
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [state, action, pending] = useActionState(createFoundAction, undefined);
  const topRef = useRef<HTMLDivElement>(null);

  const serverErrors = state?.errors ?? {};
  const errors = { ...serverErrors, ...clientErrors };
  const set = (name: string, value: string) => {
    setValues((v) => ({ ...v, [name]: value }));
    setClientErrors((errs) => {
      const rest = { ...errs };
      delete rest[name];
      return rest;
    });
  };
  const err = (k: string) => (errors[k] ? t(`errors.${errors[k]}`) : undefined);

  function go(next: Step) {
    setStep(next);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Erros do servidor: volta ao passo onde está o primeiro campo com problema.
  useEffect(() => {
    const keys = Object.keys(state?.errors ?? {});
    if (keys.length === 0 || keys.includes("_form")) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reação a uma resposta do servidor
    setStep(keys.some((k) => CUSTODY_FIELDS.includes(k)) ? "start" : "details");
  }, [state]);

  function chooseCustody(holderType: "POINT" | "FINDER", next: Step) {
    set("holderType", holderType);
    go(next);
  }

  /** Texto livre; se coincidir com uma sugestão, liga o anúncio a esse ponto conhecido. */
  function setDropOff(text: string) {
    set("dropOffText", text);
    set("dropOffPointId", options.points.find((p) => p.label === text.trim())?.id ?? "");
  }

  /** Valida os detalhes no próprio browser antes de mostrar a pré-visualização (o servidor valida de novo). */
  function toPreview() {
    const parsed = foundReportSchema().safeParse(values);
    if (!parsed.success) {
      const errs = fieldErrors(parsed.error);
      setClientErrors(errs);
      if (Object.keys(errs).some((k) => CUSTODY_FIELDS.includes(k))) go("start");
      return;
    }
    setClientErrors({});
    go("preview");
  }

  function publish() {
    const data = new FormData();
    for (const [k, v] of Object.entries(values)) data.set(k, v);
    // Documentos de identificação: nunca enviar fotografias (o servidor também o recusa).
    if (category && !category.allowPhotos) data.delete("photoIds");
    startTransition(() => action(data));
  }

  const category = options.categories.find((c) => c.id === values.categoryId);
  const campus = options.campi.find((c) => c.id === values.campusId);
  const stepIndex = step === "details" ? 1 : step === "preview" ? 2 : 0;
  const dropOffOk = (values.dropOffText ?? "").trim().length >= LIMITS.dropOffTextMin;
  const backButton = (to: Step) => (
    <button type="button" onClick={() => go(to)} className={buttonClasses({ variant: "ghost" })}>
      <ArrowLeft aria-hidden className="size-4" /> {t("back")}
    </button>
  );

  return (
    <div ref={topRef} className="scroll-mt-24 space-y-6">
      <Stepper current={stepIndex} />
      {errors._form && <Alert tone="danger">{t(`errors.${errors._form}`)}</Alert>}

      {step === "start" && (
        <FormSection icon={<ShieldCheck className="size-4" />} title={t("found.startTitle")} description={t("found.startText")}>
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => chooseCustody("POINT", "point")} className={choiceCard}>
              <span className="flex size-10 items-center justify-center rounded-xl bg-success-soft text-success"><Check aria-hidden className="size-5" /></span>
              <span className="font-semibold">{t("found.yes")}</span>
              <span className="text-sm text-muted">{t("found.yesText")}</span>
            </button>
            <button type="button" onClick={() => go("encourage")} className={choiceCard}>
              <span className="flex size-10 items-center justify-center rounded-xl bg-surface-muted text-muted"><Hand aria-hidden className="size-5" /></span>
              <span className="font-semibold">{t("found.no")}</span>
              <span className="text-sm text-muted">{t("found.noText")}</span>
            </button>
          </div>
          {CUSTODY_FIELDS.some((k) => errors[k]) && (
            <p className="text-sm font-medium text-danger">{err(CUSTODY_FIELDS.find((k) => errors[k])!)}</p>
          )}
        </FormSection>
      )}

      {step === "encourage" && (
        <FormSection icon={<ShieldCheck className="size-4" />} title={t("found.encourageTitle")}>
          <div className="space-y-3 rounded-2xl bg-primary-soft/60 p-5">
            <p>{t("found.encourageText")}</p>
            <p className="text-sm text-muted">{t("found.encourageExamples")}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => chooseCustody("POINT", "point")} className={choiceCard}>
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><ShieldCheck aria-hidden className="size-5" /></span>
              <span className="font-semibold">{t("found.willDeliver")}</span>
              <span className="text-sm text-muted">{t("found.willDeliverText")}</span>
            </button>
            <button type="button" onClick={() => chooseCustody("FINDER", "finder")} className={choiceCard}>
              <span className="flex size-10 items-center justify-center rounded-xl bg-surface-muted text-muted"><ArrowRight aria-hidden className="size-5" /></span>
              <span className="font-semibold">{t("found.proceed")}</span>
              <span className="text-sm text-muted">{t("found.proceedText")}</span>
            </button>
          </div>
          <div>{backButton("start")}</div>
        </FormSection>
      )}

      {step === "point" && (
        <FormSection icon={<ShieldCheck className="size-4" />} title={t("found.pointTitle")} description={t("found.pointText")}>
          <Field id="dropOffText" label={t("found.pointLabel")} hint={t("found.pointHint")} error={err("dropOffText")}>
            <TextInput name="dropOffText" list={listId} value={values.dropOffText ?? ""} onChange={(e) => setDropOff(e.target.value)}
              maxLength={LIMITS.dropOffTextMax} autoComplete="off" placeholder={t("found.pointPlaceholder")} autoFocus />
          </Field>
          <datalist id={listId}>
            {options.points.map((p) => <option key={p.id} value={p.label} />)}
          </datalist>
          {values.dropOffPointId && (
            <p className="flex animate-fade-in items-center gap-1.5 text-sm text-success"><Check aria-hidden className="size-4" /> {t("found.pointLinked")}</p>
          )}
          <p className="flex items-center gap-1.5 text-xs text-muted"><Lock aria-hidden className="size-3.5" /> {t("found.pointPrivate")}</p>
          <div className="flex justify-between gap-2">
            {backButton("start")}
            <button type="button" disabled={!dropOffOk} onClick={() => go("details")} className={buttonClasses()}>
              {t("next")} <ArrowRight aria-hidden className="size-4" />
            </button>
          </div>
        </FormSection>
      )}

      {step === "finder" && (
        <FormSection icon={<Hand className="size-4" />} title={t("found.finderTitle")}>
          <Alert tone="notice" icon={TriangleAlert}>{t("found.finderWarning")}</Alert>
          <div className="space-y-2 rounded-xl border border-border p-4 text-sm">
            <p className="font-medium">{t("found.contactTitle")}</p>
            <p className="flex items-center gap-2 text-muted"><Mail aria-hidden className="size-4 shrink-0" /> <span className="break-all">{email}</span></p>
          </div>
          <Field id="finderContact" label={t("found.contactExtra")} optional={t("optional")} hint={t("found.contactHint")} error={err("finderContact")}>
            <TextInput name="finderContact" value={values.finderContact ?? ""} onChange={(e) => set("finderContact", e.target.value)}
              maxLength={LIMITS.contactMax} autoComplete="tel" placeholder={t("found.contactPlaceholder")} />
          </Field>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 text-sm has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-primary/20">
            <input type="checkbox" checked={values.finderAccepted === "on"} onChange={(e) => set("finderAccepted", e.target.checked ? "on" : "")}
              className="mt-0.5 size-4 accent-[var(--primary)]" />
            <span>{t("found.finderAccept")}</span>
          </label>
          {err("finderAccepted") && <p className="text-sm font-medium text-danger">{err("finderAccepted")}</p>}
          <div className="flex justify-between gap-2">
            {backButton("encourage")}
            <button type="button" disabled={values.finderAccepted !== "on"} onClick={() => go("details")} className={buttonClasses()}>
              {t("next")} <ArrowRight aria-hidden className="size-4" />
            </button>
          </div>
        </FormSection>
      )}

      {step === "details" && (
        <form onSubmit={(e) => { e.preventDefault(); toPreview(); }} className="space-y-6" noValidate>
          <ItemFields options={options} values={values} set={set} errors={errors} whereTitle={t("whereFoundTitle")} />
          <FormSection icon={<CalendarClock className="size-4" />} title={t("whenFoundTitle")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="foundAt" label={t("foundAt")} hint={t("foundAtHint")} error={err("foundAt")}>
                <TextInput type="datetime-local" name="foundAt" required max={now} value={values.foundAt ?? ""}
                  onChange={(e) => set("foundAt", e.target.value)} />
              </Field>
            </div>
          </FormSection>
          <FormSection icon={<Lock className="size-4" />} title={t("privateDetails")} description={t("privateDetailsText")}>
            <Field id="privateDetails" label={t("privateDetailsLabel")} error={err("privateDetails")}
              optional={<CharCount value={values.privateDetails ?? ""} max={LIMITS.privateDetailsMax} />}>
              <Textarea name="privateDetails" value={values.privateDetails ?? ""} onChange={(e) => set("privateDetails", e.target.value)}
                maxLength={LIMITS.privateDetailsMax} placeholder={t("privateDetailsPlaceholder")} className="min-h-20" />
            </Field>
          </FormSection>
          <div className="flex justify-between gap-2">
            {backButton(values.holderType === "FINDER" ? "finder" : "point")}
            <button type="submit" className={buttonClasses({ size: "lg" })}>
              <Eye aria-hidden className="size-4" /> {t("toPreview")}
            </button>
          </div>
        </form>
      )}

      {step === "preview" && category && (
        <FormSection icon={<Eye className="size-4" />} title={t("previewTitle")} description={t("previewText")}>
          <ReportRow preview report={{
            id: "preview",
            type: "FOUND",
            categorySlug: category.slug,
            categoryName: category.name,
            subcategoryName: category.subcategories.find((s) => s.id === values.subcategoryId)?.name ?? null,
            campusName: values.campusId === UNKNOWN_CAMPUS ? null : (campus?.name ?? null),
            locationName: campus?.locations.find((l) => l.id === values.locationId)?.name ?? null,
            color: values.color || null,
            brand: values.brand?.trim() || null,
            description: values.description?.trim() ?? "",
            eventAt: lisbonLocalToUtc(values.foundAt ?? "") ?? new Date(),
            publishedAt: new Date(),
            custody: { kind: values.holderType === "FINDER" ? "FINDER" : "POINT", campusName: null },
            photos: category.allowPhotos ? (values.photoIds ?? "").split(",").filter(Boolean).map((id) => ({ id })) : [],
          }} />
          <p className="flex items-start gap-2 text-sm text-muted"><Lock aria-hidden className="mt-0.5 size-4 shrink-0" /> {tf("neverPublic")}</p>
          <div className="flex justify-between gap-2">
            {backButton("details")}
            <button type="button" onClick={publish} disabled={pending} aria-busy={pending} className={buttonClasses({ size: "lg" })}>
              <Send aria-hidden className="size-4" /> {pending ? t("publishing") : t("publishFound")}
            </button>
          </div>
        </FormSection>
      )}
    </div>
  );
}
