import type { ComponentProps } from "react";
import { cn } from "./cn";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-2xl border border-border bg-surface shadow-soft", className)} {...props} />;
}

/** Variante interativa: eleva-se ao passar o rato / ao focar. */
export const interactiveCard =
  "transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift";
