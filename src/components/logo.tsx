import { cn } from "./ui/cn";

/** Marca própria do miaUM (não é o logótipo da UMinho): um marcador de localização com uma lupa. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-8", className)}>
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <path
        d="M16 7.5a6.5 6.5 0 0 0-6.5 6.5c0 4.6 6.5 10.5 6.5 10.5s6.5-5.9 6.5-10.5A6.5 6.5 0 0 0 16 7.5Z"
        className="fill-primary-foreground"
      />
      <circle cx="16" cy="14" r="2.6" className="fill-primary" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="transition-transform duration-300 ease-out group-hover:-rotate-6 group-hover:scale-105" />
      <span className="font-display text-xl font-semibold tracking-tight">
        mia<span className="text-primary-ink">UM</span>
      </span>
    </span>
  );
}
