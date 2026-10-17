import type { ComponentProps } from "react";
import { cn } from "./cn";

type Tone = "neutral" | "primary" | "accent" | "success";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-muted text-muted ring-border",
  primary: "bg-primary-soft text-primary-ink ring-primary/20",
  accent: "bg-accent-soft text-notice-foreground ring-accent/30",
  success: "bg-success-soft text-success ring-success/20",
};

export function Badge({ tone = "neutral", className, ...props }: ComponentProps<"span"> & { tone?: Tone }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", tones[tone], className)}
      {...props}
    />
  );
}
