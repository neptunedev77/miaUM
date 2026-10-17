import { ViewTransition, type ReactNode } from "react";
import { cn } from "./cn";

/** Envolve o conteúdo de cada página para a transição suave entre rotas. */
export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      <div className={cn("space-y-8", className)}>{children}</div>
    </ViewTransition>
  );
}

export function PageHeader({ title, description, eyebrow, actions }: {
  title: string;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex animate-fade-up flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        {eyebrow && <p className="text-sm font-medium text-primary-ink">{eyebrow}</p>}
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {description && <p className="max-w-2xl text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </header>
  );
}

/** Estado vazio / de erro centrado, com ícone. */
export function EmptyState({ icon, title, description, action }: {
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex animate-fade-up flex-col items-center rounded-2xl border border-dashed border-border-strong bg-surface/60 px-6 py-14 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary-ink">{icon}</div>
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="mt-1 max-w-md text-sm text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
