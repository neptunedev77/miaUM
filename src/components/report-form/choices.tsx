"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/components/ui/cn";

/**
 * Grupo de opções acessível (radios nativos com aspeto de botões/cartões): funciona por teclado
 * (setas), com leitores de ecrã e sem JavaScript especial.
 */
export function ChoiceGroup<T extends string>({ name, label, value, onChange, options, columns = "auto", error, hint }: {
  name: string;
  label: ReactNode;
  value: T | "";
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; icon?: ReactNode; swatch?: string }[];
  columns?: "auto" | "chips";
  error?: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <fieldset className="space-y-2" aria-invalid={Boolean(error) || undefined}
      aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}>
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      <div className={cn(columns === "chips" ? "flex flex-wrap gap-2" : "grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4")}>
        {options.map((o) => {
          const checked = value === o.value;
          return (
            <label key={o.value}
              className={cn(
                "group relative flex cursor-pointer items-center gap-2.5 rounded-xl border bg-surface text-sm transition-[border-color,background-color,box-shadow,transform] duration-200",
                "has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-primary/20 active:scale-[0.98]",
                columns === "chips" ? "px-3 py-2" : "px-3 py-3",
                checked ? "border-primary-ink bg-primary-soft font-medium text-foreground" : "border-border hover:border-border-strong hover:bg-surface-muted",
              )}>
              <input type="radio" name={name} value={o.value} checked={checked} onChange={() => onChange(o.value)} className="sr-only" />
              {o.swatch && (
                <span aria-hidden className="size-5 shrink-0 rounded-full ring-1 ring-border-strong ring-inset" style={{ background: o.swatch }} />
              )}
              {o.icon && (
                <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                  checked ? "bg-primary text-primary-foreground" : "bg-surface-muted text-muted group-hover:text-foreground")}>
                  {o.icon}
                </span>
              )}
              <span className="min-w-0 flex-1 leading-tight">{o.label}</span>
              {checked && columns !== "chips" && <Check aria-hidden className="size-4 shrink-0 animate-scale-in text-primary-ink" />}
            </label>
          );
        })}
      </div>
      {hint && !error && <p id={`${name}-hint`} className="text-xs text-muted">{hint}</p>}
      {error && <p id={`${name}-error`} className="text-xs font-medium text-danger">{error}</p>}
    </fieldset>
  );
}

/** Secção de formulário com título e ícone. */
export function FormSection({ icon, title, description, children }: {
  icon: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="animate-fade-up space-y-5 rounded-2xl border border-border bg-surface p-5 shadow-soft sm:p-6">
      <header className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-ink">{icon}</span>
        <div>
          <h2 className="font-semibold">{title}</h2>
          {description && <p className="text-sm text-muted">{description}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}
