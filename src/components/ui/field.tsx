"use client";

import { createContext, use, type ComponentProps, type ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "./cn";

type FieldContext = { id: string; describedBy?: string; invalid: boolean };
const Ctx = createContext<FieldContext | null>(null);

/** Liga automaticamente a legenda, o texto de ajuda e o erro ao controlo (acessibilidade). */
function useField(id?: string) {
  const ctx = use(Ctx);
  return {
    id: id ?? ctx?.id,
    "aria-describedby": ctx?.describedBy,
    "aria-invalid": ctx?.invalid || undefined,
  };
}

export function Field({ id, label, hint, error, optional, children, className }: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  optional?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <Ctx value={{ id, describedBy, invalid: Boolean(error) }}>
      <div className={cn("space-y-1.5", className)}>
        <label htmlFor={id} className="flex items-baseline justify-between gap-2 text-sm font-medium">
          <span>{label}</span>
          {optional && <span className="text-xs font-normal text-muted">{optional}</span>}
        </label>
        {children}
        {hint && !error && <p id={`${id}-hint`} className="text-xs text-muted">{hint}</p>}
        {error && (
          <p id={`${id}-error`} className="flex animate-fade-in items-center gap-1.5 text-xs font-medium text-danger">
            <CircleAlert aria-hidden className="size-3.5 shrink-0" /> {error}
          </p>
        )}
      </div>
    </Ctx>
  );
}

export const controlClasses =
  "w-full rounded-xl border border-border-strong bg-background px-3.5 text-base transition-[border-color,box-shadow] duration-200 " +
  "placeholder:text-muted/70 focus:border-primary-ink focus:ring-4 focus:ring-primary/15 focus:outline-none " +
  "aria-invalid:border-danger aria-invalid:ring-danger/15 disabled:opacity-60 sm:text-sm";

export function TextInput({ className, id, ...props }: ComponentProps<"input">) {
  return <input {...useField(id)} className={cn(controlClasses, "h-11", className)} {...props} />;
}

export function Textarea({ className, id, ...props }: ComponentProps<"textarea">) {
  return <textarea {...useField(id)} className={cn(controlClasses, "min-h-28 resize-y py-2.5", className)} {...props} />;
}

export function Select({ className, id, children, ...props }: ComponentProps<"select">) {
  return (
    <select {...useField(id)} className={cn(controlClasses, "h-11 appearance-none bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pr-10", className)}
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}
      {...props}>
      {children}
    </select>
  );
}

/** Contador de caracteres para campos com limite. */
export function CharCount({ value, max }: { value: string; max: number }) {
  const near = value.length > max * 0.9;
  return (
    <span aria-live="polite" className={cn("text-xs tabular-nums", near ? "text-danger" : "text-muted")}>
      {value.length}/{max}
    </span>
  );
}
