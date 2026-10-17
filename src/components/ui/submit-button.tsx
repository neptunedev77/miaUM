"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import { buttonClasses } from "./button";

type Props = Omit<ComponentProps<"button">, "type"> & {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
};

/** Botão de submissão que mostra um indicador enquanto a ação do servidor corre. */
export function SubmitButton({ variant, size, className, children, disabled, ...props }: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending}
      className={buttonClasses({ variant, size, className })}
      {...props}
    >
      {pending && <LoaderCircle aria-hidden className="size-4 animate-spin" />}
      {children}
    </button>
  );
}
