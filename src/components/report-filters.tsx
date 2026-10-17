"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { LoaderCircle, Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "./ui/cn";
import { controlClasses, Select } from "./ui/field";
import { listHref, type FilterValues } from "./list-href";

type Option = { id: string; name: string };

export function ReportFilters({ values, campi, categories }: {
  values: FilterValues;
  campi: (Option & { locations: (Option & { isSubzone: boolean })[] })[];
  categories: Option[];
}) {
  const t = useTranslations("list");
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(values.q ?? "");
  const [more, setMore] = useState(Boolean(values.local || values.desde || values.ate));
  const first = useRef(true);

  function apply(patch: Partial<FilterValues>) {
    const next = { ...values, ...patch };
    if ("campus" in patch) next.local = undefined;
    startTransition(() => router.replace(listHref(pathname, next), { scroll: false }));
  }

  // Pesquisa com atraso, para não pedir a lista a cada tecla.
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const id = setTimeout(() => apply({ q: q.trim() || undefined }), 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só reage ao texto
  }, [q]);

  const campus = campi.find((c) => c.id === values.campus);
  const tabs = [
    { key: undefined, label: t("all") },
    { key: "perdidos", label: t("lost") },
    { key: "encontrados", label: t("found") },
  ];
  const active = Boolean(values.q || values.campus || values.categoria || values.local || values.desde || values.ate);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label={t("typeLabel")} className="inline-flex w-full rounded-xl border border-border bg-surface p-1 sm:w-auto">
          {tabs.map((tab) => {
            const selected = values.tipo === tab.key;
            return (
              <Link key={tab.label} href={listHref(pathname, { ...values, tipo: tab.key })} scroll={false}
                aria-current={selected ? "page" : undefined}
                className={cn(
                  "flex-1 rounded-lg px-4 py-1.5 text-center text-sm font-medium transition-colors duration-200 sm:flex-none",
                  selected ? "bg-primary text-primary-foreground shadow-soft" : "text-muted hover:text-foreground",
                )}>
                {tab.label}
              </Link>
            );
          })}
        </nav>
        <div className="relative flex-1 sm:max-w-sm">
          {pending
            ? <LoaderCircle aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 animate-spin text-muted" />
            : <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />}
          <label htmlFor="pesquisa" className="sr-only">{t("search")}</label>
          <input id="pesquisa" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchPlaceholder")}
            maxLength={80} className={cn(controlClasses, "h-11 pl-10")} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="f-campus" className="sr-only">{t("campus")}</label>
        <Select id="f-campus" value={values.campus ?? ""} onChange={(e) => apply({ campus: e.target.value || undefined })} className="h-10 w-auto min-w-40">
          <option value="">{t("anyCampus")}</option>
          {campi.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <label htmlFor="f-categoria" className="sr-only">{t("category")}</label>
        <Select id="f-categoria" value={values.categoria ?? ""} onChange={(e) => apply({ categoria: e.target.value || undefined })} className="h-10 w-auto min-w-40">
          <option value="">{t("anyCategory")}</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <button type="button" onClick={() => setMore((m) => !m)} aria-expanded={more}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm text-muted transition-colors hover:text-foreground">
          <SlidersHorizontal aria-hidden className="size-4" /> {t("moreFilters")}
        </button>
        {active && (
          <Link href={listHref(pathname, { tipo: values.tipo })} scroll={false}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm text-primary-ink transition-colors hover:bg-primary-soft">
            <X aria-hidden className="size-4" /> {t("clear")}
          </Link>
        )}
      </div>

      {more && (
        <div className="grid animate-slide-down gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label htmlFor="f-local" className="text-xs font-medium text-muted">{t("building")}</label>
            <Select id="f-local" value={values.local ?? ""} disabled={!campus} onChange={(e) => apply({ local: e.target.value || undefined })} className="h-10">
              <option value="">{campus ? t("anyBuilding") : t("chooseCampusFirst")}</option>
              {campus?.locations.filter((l) => !l.isSubzone).map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="f-desde" className="text-xs font-medium text-muted">{t("from")}</label>
            <input id="f-desde" type="date" value={values.desde ?? ""} max={values.ate || undefined}
              onChange={(e) => apply({ desde: e.target.value || undefined })} className={cn(controlClasses, "h-10")} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="f-ate" className="text-xs font-medium text-muted">{t("to")}</label>
            <input id="f-ate" type="date" value={values.ate ?? ""} min={values.desde || undefined}
              onChange={(e) => apply({ ate: e.target.value || undefined })} className={cn(controlClasses, "h-10")} />
          </div>
        </div>
      )}
    </div>
  );
}
