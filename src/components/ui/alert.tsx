import type { ReactNode } from "react";
import { CircleAlert, Info, type LucideIcon } from "lucide-react";
import { cn } from "./cn";

type Tone = "info" | "danger" | "notice";

const tones: Record<Tone, string> = {
  info: "border-border bg-surface-muted text-foreground",
  danger: "border-danger/30 bg-danger-soft text-danger",
  notice: "border-notice-border bg-notice text-notice-foreground",
};

export function Alert({ tone = "info", icon, children, className, role }: {
  tone?: Tone;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
  role?: string;
}) {
  const Icon = icon ?? (tone === "danger" ? CircleAlert : Info);
  return (
    <div role={role ?? (tone === "danger" ? "alert" : "note")}
      className={cn("flex animate-fade-up items-start gap-3 rounded-xl border px-4 py-3 text-sm", tones[tone], className)}>
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
