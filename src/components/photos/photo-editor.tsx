"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { useTranslations } from "next-intl";
import { Crop, EyeOff, Plus, RotateCcw, X } from "lucide-react";
import { clampRect, maskInCrop, outputSize, type Rect } from "@/domain/photos";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";

type Mode = "crop" | "mask";
const FULL: Rect = { x: 0, y: 0, w: 1, h: 1 };
const STEP = 0.02;

/**
 * Caixa arrastável/redimensionável em frações (0–1) da imagem.
 * Rato/toque: arrastar move; o canto inferior direito redimensiona.
 * Teclado: setas movem, Shift + setas redimensionam, Delete remove (se removível).
 */
function Box({ rect, onChange, onRemove, label, variant, stageRef }: {
  rect: Rect;
  onChange: (r: Rect) => void;
  onRemove?: () => void;
  label: string;
  variant: "crop" | "mask";
  stageRef: React.RefObject<HTMLDivElement | null>;
}) {
  const drag = useRef<{ kind: "move" | "resize"; x: number; y: number; start: Rect } | null>(null);

  function begin(e: ReactPointerEvent, kind: "move" | "resize") {
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { kind, x: e.clientX, y: e.clientY, start: rect };
  }

  function move(e: ReactPointerEvent) {
    const d = drag.current;
    const stage = stageRef.current?.getBoundingClientRect();
    if (!d || !stage) return;
    const dx = (e.clientX - d.x) / stage.width;
    const dy = (e.clientY - d.y) / stage.height;
    onChange(clampRect(d.kind === "move"
      ? { ...d.start, x: d.start.x + dx, y: d.start.y + dy }
      : { ...d.start, w: d.start.w + dx, h: d.start.h + dy }));
  }

  function key(e: KeyboardEvent) {
    const delta = { ArrowLeft: [-STEP, 0], ArrowRight: [STEP, 0], ArrowUp: [0, -STEP], ArrowDown: [0, STEP] }[e.key];
    if (delta) {
      e.preventDefault();
      const [dx, dy] = delta;
      onChange(clampRect(e.shiftKey ? { ...rect, w: rect.w + dx, h: rect.h + dy } : { ...rect, x: rect.x + dx, y: rect.y + dy }));
    } else if ((e.key === "Delete" || e.key === "Backspace") && onRemove) {
      e.preventDefault();
      onRemove();
    }
  }

  return (
    <div role="group" tabIndex={0} aria-label={label} onKeyDown={key}
      onPointerDown={(e) => begin(e, "move")} onPointerMove={move} onPointerUp={() => (drag.current = null)}
      className={cn(
        "absolute cursor-move touch-none outline-none focus-visible:ring-4 focus-visible:ring-primary/60",
        variant === "crop"
          ? "border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"
          : "border border-white/40 bg-black",
      )}
      style={{ left: `${rect.x * 100}%`, top: `${rect.y * 100}%`, width: `${rect.w * 100}%`, height: `${rect.h * 100}%` }}>
      {variant === "crop" && (
        <div aria-hidden className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
          {Array.from({ length: 9 }).map((_, i) => <span key={i} className="border border-white/20" />)}
        </div>
      )}
      {onRemove && (
        <button type="button" onPointerDown={(e) => e.stopPropagation()} onClick={onRemove} aria-label={label}
          className="absolute -top-3 -right-3 flex size-6 items-center justify-center rounded-full bg-white text-black shadow">
          <X aria-hidden className="size-3.5" />
        </button>
      )}
      <span aria-hidden onPointerDown={(e) => begin(e, "resize")} onPointerMove={move} onPointerUp={() => (drag.current = null)}
        className="absolute -right-2 -bottom-2 size-5 cursor-se-resize touch-none rounded-full border-2 border-black bg-white" />
    </div>
  );
}

/** Desenha o resultado num canvas (recorte + tapagens) e devolve um JPEG. Os metadados do original não passam. */
async function render(img: HTMLImageElement, crop: Rect, masks: Rect[]): Promise<Blob> {
  const { width, height } = outputSize(img.naturalWidth, img.naturalHeight, crop);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, crop.x * img.naturalWidth, crop.y * img.naturalHeight, crop.w * img.naturalWidth, crop.h * img.naturalHeight, 0, 0, width, height);
  ctx.fillStyle = "#000";
  for (const m of masks) {
    const r = maskInCrop(m, crop, width, height);
    if (r) ctx.fillRect(r.x, r.y, r.w, r.h);
  }
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("canvas"))), "image/jpeg", 0.9));
}

export function PhotoEditor({ file, onCancel, onDone }: { file: File; onCancel: () => void; onDone: (blob: Blob) => void }) {
  const t = useTranslations("photos");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [mode, setMode] = useState<Mode>("mask");
  const [crop, setCrop] = useState<Rect>(FULL);
  const [masks, setMasks] = useState<Rect[]>([]);
  const [busy, setBusy] = useState(false);
  const drawing = useRef<{ index: number; x: number; y: number } | null>(null);

  // O URL temporário é criado e revogado no mesmo efeito (o React pode montar o componente duas vezes).
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- recurso externo ligado ao ciclo de vida
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  useEffect(() => {
    if (!dialogRef.current?.open) dialogRef.current?.showModal();
  }, []);

  /** No modo "tapar", arrastar numa zona vazia desenha um retângulo novo. */
  function stagePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (mode !== "mask" || e.target !== e.currentTarget.querySelector("img")) return;
    const stage = stageRef.current!.getBoundingClientRect();
    const x = (e.clientX - stage.left) / stage.width;
    const y = (e.clientY - stage.top) / stage.height;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = { index: masks.length, x, y };
    setMasks((m) => [...m, clampRect({ x, y, w: 0.05, h: 0.05 })]);
  }

  function stagePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const d = drawing.current;
    if (!d) return;
    const stage = stageRef.current!.getBoundingClientRect();
    const x = (e.clientX - stage.left) / stage.width;
    const y = (e.clientY - stage.top) / stage.height;
    const rect = clampRect({ x: Math.min(d.x, x), y: Math.min(d.y, y), w: Math.abs(x - d.x), h: Math.abs(y - d.y) }, 0.03);
    setMasks((m) => m.map((r, i) => (i === d.index ? rect : r)));
  }

  async function confirm() {
    const img = imgRef.current;
    if (!img || !img.naturalWidth) return setFailed(true);
    setBusy(true);
    try {
      onDone(await render(img, crop, masks));
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  const tabs: { key: Mode; label: string; icon: typeof Crop }[] = [
    { key: "mask", label: t("mask"), icon: EyeOff },
    { key: "crop", label: t("crop"), icon: Crop },
  ];

  return (
    <dialog ref={dialogRef} onCancel={(e) => { e.preventDefault(); onCancel(); }} aria-labelledby="editor-title"
      className="m-auto w-[min(100%-2rem,48rem)] animate-scale-in rounded-3xl border border-border bg-surface p-0 text-foreground shadow-lift backdrop:bg-black/60 backdrop:backdrop-blur-sm">
      <div className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="editor-title" className="font-display text-xl font-semibold">{t("editorTitle")}</h2>
          <div role="tablist" aria-label={t("editorTitle")} className="inline-flex rounded-xl border border-border p-1">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button key={key} type="button" role="tab" aria-selected={mode === key} onClick={() => setMode(key)}
                className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  mode === key ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground")}>
                <Icon aria-hidden className="size-4" /> {label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-sm text-muted">{t(mode === "mask" ? "maskHelp" : "cropHelp")}</p>

        <div className="flex justify-center rounded-2xl bg-surface-muted p-2">
          <div ref={stageRef} className="relative touch-none select-none" onPointerDown={stagePointerDown}
            onPointerMove={stagePointerMove} onPointerUp={() => (drawing.current = null)}>
            {/* eslint-disable-next-line @next/next/no-img-element -- imagem local (blob:) a editar */}
            {url && <img ref={imgRef} src={url} alt={t("editorAlt")} draggable={false} onError={() => setFailed(true)}
              className={cn("block max-h-[55vh] w-auto max-w-full", mode === "mask" && "cursor-crosshair")} />}
            {masks.map((m, i) => (
              <Box key={i} rect={m} variant="mask" stageRef={stageRef} label={t("maskBox", { n: i + 1 })}
                onChange={(r) => setMasks((all) => all.map((x, j) => (j === i ? r : x)))}
                onRemove={mode === "mask" ? () => setMasks((all) => all.filter((_, j) => j !== i)) : undefined} />
            ))}
            {mode === "crop" && <Box rect={crop} variant="crop" stageRef={stageRef} label={t("cropBox")} onChange={setCrop} />}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {mode === "mask" ? (
            <button type="button" onClick={() => setMasks((m) => [...m, { x: 0.35, y: 0.42, w: 0.3, h: 0.16 }])}
              className={buttonClasses({ variant: "outline", size: "sm" })}>
              <Plus aria-hidden className="size-4" /> {t("addMask")}
            </button>
          ) : (
            <button type="button" onClick={() => setCrop(FULL)} className={buttonClasses({ variant: "outline", size: "sm" })}>
              <RotateCcw aria-hidden className="size-4" /> {t("resetCrop")}
            </button>
          )}
          <p className="self-center text-xs text-muted">{t("keyboardHelp")}</p>
        </div>

        {failed && <p role="alert" className="text-sm font-medium text-danger">{t("errors.invalidImage")}</p>}
        <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className={buttonClasses({ variant: "ghost" })}>{t("cancel")}</button>
          <button type="button" onClick={confirm} disabled={busy || failed || !url} aria-busy={busy} className={buttonClasses()}>{t("use")}</button>
        </div>
      </div>
    </dialog>
  );
}
