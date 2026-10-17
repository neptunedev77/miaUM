import { cn } from "./cn";

const sizes = {
  xs: "size-6 text-xs",
  sm: "size-8 text-sm",
  md: "size-9 text-sm",
  xl: "size-16 text-2xl",
} as const;

/** Avatar com a inicial do nome (nunca mostra fotografias nem dados de contacto). */
export function Avatar({ name, size = "sm", className }: { name: string; size?: keyof typeof sizes; className?: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary-ink ring-1 ring-primary/15", sizes[size], className)}>
      {initial}
    </span>
  );
}
