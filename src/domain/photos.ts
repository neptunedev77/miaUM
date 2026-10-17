// Regras das fotografias (SPEC §5.4).

export const PHOTO_LIMITS = {
  maxPerReport: 3,
  maxBytes: 5 * 1024 * 1024,
  /** Tamanho máximo (lado maior) da imagem guardada. */
  fullSize: 1600,
  /** Miniatura quadrada para as listas. */
  thumbSize: 400,
  /** Tamanho máximo da imagem enviada pelo editor no browser. */
  uploadMaxSide: 2000,
} as const;

export const ACCEPTED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
export const ACCEPTED_FORMATS = ["jpeg", "png", "webp"] as const;

export type PhotoError = "tooLarge" | "badType" | "tooMany" | "notAllowed" | "rateLimited" | "invalidImage";

/** Validação rápida antes de enviar (o servidor volta a validar, inclusive o conteúdo real do ficheiro). */
export function checkPhotoFile(file: { size: number; type: string }): PhotoError | null {
  if (!(ACCEPTED_MIME as readonly string[]).includes(file.type)) return "badType";
  if (file.size > PHOTO_LIMITS.maxBytes) return "tooLarge";
  return null;
}

/** "a,b,a,,c" -> ["a","b","c"] (sem repetidos nem vazios). */
export function parsePhotoIds(value: unknown): string[] {
  if (typeof value !== "string") return [];
  return [...new Set(value.split(",").map((s) => s.trim()).filter((s) => /^[a-z0-9]{10,40}$/i.test(s)))];
}

export type Rect = { x: number; y: number; w: number; h: number };

/** Limita um retângulo (em frações 0–1 da imagem) aos limites da imagem, com tamanho mínimo. */
export function clampRect(r: Rect, min = 0.05): Rect {
  const w = Math.min(1, Math.max(min, r.w));
  const h = Math.min(1, Math.max(min, r.h));
  const x = Math.min(1 - w, Math.max(0, r.x));
  const y = Math.min(1 - h, Math.max(0, r.y));
  return { x, y, w, h };
}

/**
 * Converte um retângulo de tapagem (em frações da imagem original) para píxeis dentro do recorte,
 * ou null se não houver interseção.
 */
export function maskInCrop(mask: Rect, crop: Rect, outW: number, outH: number) {
  const x1 = Math.max(mask.x, crop.x);
  const y1 = Math.max(mask.y, crop.y);
  const x2 = Math.min(mask.x + mask.w, crop.x + crop.w);
  const y2 = Math.min(mask.y + mask.h, crop.y + crop.h);
  if (x2 <= x1 || y2 <= y1) return null;
  return {
    x: Math.floor(((x1 - crop.x) / crop.w) * outW),
    y: Math.floor(((y1 - crop.y) / crop.h) * outH),
    // Arredonda para cima para não deixar uma linha de píxeis por tapar.
    w: Math.ceil(((x2 - x1) / crop.w) * outW) + 1,
    h: Math.ceil(((y2 - y1) / crop.h) * outH) + 1,
  };
}

/** Tamanho de saída do recorte, limitado ao lado máximo. */
export function outputSize(naturalW: number, naturalH: number, crop: Rect, maxSide: number = PHOTO_LIMITS.uploadMaxSide) {
  const w = naturalW * crop.w;
  const h = naturalH * crop.h;
  const scale = Math.min(1, maxSide / Math.max(w, h));
  return { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)) };
}
