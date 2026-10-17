"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Camera, ImagePlus, LoaderCircle, ShieldAlert, Trash2 } from "lucide-react";
import { checkPhotoFile, PHOTO_LIMITS, type PhotoError } from "@/domain/photos";
import { cn } from "@/components/ui/cn";
import { PhotoEditor } from "./photo-editor";

/**
 * Escolha de até 3 fotografias. Cada uma passa pelo editor (recortar/tapar) e só a versão editada é
 * enviada; o servidor remove ainda todos os metadados. Os ids ficam em `value` ("id1,id2").
 */
export function PhotoPicker({ value, onChange, allowed }: { value: string; onChange: (ids: string) => void; allowed: boolean }) {
  const t = useTranslations("photos");
  const inputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<PhotoError | "uploadFailed" | null>(null);
  const ids = value ? value.split(",").filter(Boolean) : [];

  if (!allowed) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-notice-border bg-notice p-4 text-sm text-notice-foreground">
        <ShieldAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
        <p>{t("notAllowed")}</p>
      </div>
    );
  }

  function pick(file: File | undefined) {
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    const problem = checkPhotoFile(file);
    setError(problem);
    if (!problem) setEditing(file);
  }

  async function upload(blob: Blob) {
    setEditing(null);
    setUploading(true);
    setError(null);
    try {
      const data = new FormData();
      data.set("file", new File([blob], "foto.jpg", { type: "image/jpeg" }));
      const res = await fetch("/api/fotos", { method: "POST", body: data });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return setError(json.error ?? "uploadFailed");
      onChange([...ids, json.id].join(","));
    } catch {
      setError("uploadFailed");
    } finally {
      setUploading(false);
    }
  }

  function remove(id: string) {
    onChange(ids.filter((x) => x !== id).join(","));
    // Apaga já o ficheiro no servidor (se falhar, a limpeza diária trata dos órfãos).
    fetch(`/api/fotos/${id}`, { method: "DELETE" }).catch(() => {});
  }

  const full = ids.length >= PHOTO_LIMITS.maxPerReport;

  return (
    <div className="space-y-3">
      <ul className="grid grid-cols-3 gap-3">
        {ids.map((id, i) => (
          <li key={id} className="group relative aspect-square animate-scale-in overflow-hidden rounded-xl border border-border bg-surface-muted">
            {/* eslint-disable-next-line @next/next/no-img-element -- servida pela própria app, com verificação de acesso */}
            <img src={`/api/fotos/${id}?t=thumb`} alt={t("photoN", { n: i + 1 })} className="size-full object-cover" />
            <button type="button" onClick={() => remove(id)} aria-label={t("remove", { n: i + 1 })}
              className="absolute top-1.5 right-1.5 flex size-8 items-center justify-center rounded-full bg-black/60 text-white opacity-90 transition-opacity hover:opacity-100 focus-visible:opacity-100">
              <Trash2 aria-hidden className="size-4" />
            </button>
          </li>
        ))}
        {uploading && (
          <li className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-border-strong">
            <LoaderCircle aria-label={t("uploading")} className="size-6 animate-spin text-muted" />
          </li>
        )}
        {!full && !uploading && (
          <li>
            <button type="button" onClick={() => inputRef.current?.click()}
              className={cn(
                "flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border-strong text-sm text-muted",
                "transition-colors hover:border-primary-ink hover:bg-primary-soft hover:text-primary-ink",
              )}>
              {ids.length === 0 ? <Camera aria-hidden className="size-6" /> : <ImagePlus aria-hidden className="size-6" />}
              <span className="px-2 text-center leading-tight">{t("add")}</span>
            </button>
          </li>
        )}
      </ul>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1}
        aria-hidden onChange={(e) => pick(e.target.files?.[0])} />
      <p className="text-xs text-muted">{t("hint", { max: PHOTO_LIMITS.maxPerReport })}</p>
      {error && <p role="alert" className="text-sm font-medium text-danger">{t(`errors.${error}`)}</p>}
      {editing && <PhotoEditor file={editing} onCancel={() => setEditing(null)} onDone={upload} />}
    </div>
  );
}
