"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Maximize2, X } from "lucide-react";
import { cn } from "@/components/ui/cn";

/* eslint-disable @next/next/no-img-element -- fotografias servidas pela própria app, com verificação de acesso */

export function Gallery({ photos, alt }: { photos: { id: string; width: number; height: number }[]; alt: string }) {
  const t = useTranslations("photos");
  const [index, setIndex] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const current = photos[index];

  return (
    <div>
      <button type="button" onClick={() => dialogRef.current?.showModal()} aria-label={t("enlarge")}
        className="group relative block w-full bg-surface-muted">
        <img key={current.id} src={`/api/fotos/${current.id}`} alt={`${alt} — ${t("photoN", { n: index + 1 })}`}
          width={current.width} height={current.height}
          className="mx-auto h-64 w-full animate-fade-in object-contain sm:h-80" />
        <span className="absolute right-3 bottom-3 flex size-9 items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <Maximize2 aria-hidden className="size-4" />
        </span>
      </button>

      {photos.length > 1 && (
        <div className="flex gap-2 border-t border-border p-3" role="group" aria-label={t("choose")}>
          {photos.map((p, i) => (
            <button key={p.id} type="button" onClick={() => setIndex(i)} aria-pressed={i === index} aria-label={t("photoN", { n: i + 1 })}
              className={cn("size-16 overflow-hidden rounded-lg ring-2 transition-[box-shadow,opacity]",
                i === index ? "ring-primary-ink" : "opacity-70 ring-transparent hover:opacity-100")}>
              <img src={`/api/fotos/${p.id}?t=thumb`} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <dialog ref={dialogRef} aria-label={alt} onClick={(e) => e.target === e.currentTarget && dialogRef.current?.close()}
        className="m-auto max-h-[92vh] max-w-[94vw] animate-scale-in overflow-visible bg-transparent p-0 backdrop:bg-black/80">
        <img src={`/api/fotos/${current.id}`} alt={`${alt} — ${t("photoN", { n: index + 1 })}`}
          className="max-h-[92vh] max-w-[94vw] rounded-xl object-contain" />
        <button type="button" onClick={() => dialogRef.current?.close()} aria-label={t("close")} autoFocus
          className="absolute -top-3 -right-3 flex size-9 items-center justify-center rounded-full bg-white text-black shadow-lift">
          <X aria-hidden className="size-4" />
        </button>
      </dialog>
    </div>
  );
}
