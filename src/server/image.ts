import sharp, { type Metadata } from "sharp";
import { ACCEPTED_FORMATS, PHOTO_LIMITS } from "@/domain/photos";

export class InvalidImageError extends Error {}

/**
 * Prepara uma fotografia para guardar (SPEC §5.4):
 * - confirma pelo conteúdo (e não pela extensão) que é JPEG, PNG ou WebP;
 * - roda segundo a orientação EXIF e depois descarta TODOS os metadados (EXIF, GPS, ICC, XMP);
 * - gera a imagem (máx. 1600 px) e a miniatura quadrada (400 px), ambas em WebP.
 */
export async function processImage(input: Buffer) {
  let meta: Metadata;
  try {
    meta = await sharp(input, { failOn: "error", limitInputPixels: 50_000_000 }).metadata();
  } catch {
    throw new InvalidImageError("Ficheiro de imagem inválido");
  }
  if (!meta.format || !(ACCEPTED_FORMATS as readonly string[]).includes(meta.format)) {
    throw new InvalidImageError(`Formato não suportado: ${meta.format}`);
  }

  // O sharp não copia metadados para a saída a não ser que se peça (keepMetadata/withMetadata).
  const base = sharp(input, { failOn: "error", limitInputPixels: 50_000_000 }).rotate();

  const full = await base
    .clone()
    .resize({ width: PHOTO_LIMITS.fullSize, height: PHOTO_LIMITS.fullSize, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });

  const thumb = await base
    .clone()
    .resize({ width: PHOTO_LIMITS.thumbSize, height: PHOTO_LIMITS.thumbSize, fit: "cover", position: "attention" })
    .webp({ quality: 75 })
    .toBuffer();

  return { full: full.data, thumb, width: full.info.width, height: full.info.height };
}
