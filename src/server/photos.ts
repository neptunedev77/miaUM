import "server-only";
import { checkPhotoFile } from "@/domain/photos";
import { isPubliclyVisible } from "@/domain/report-state";
import { PhotoUploadError } from "./attach-photos";
import { prisma } from "./db";
import { createId } from "./ids";
import { InvalidImageError, processImage } from "./image";
import { consumeRateLimit } from "./rate-limit";
import { storage } from "./storage";

export { attachPhotos, PhotoUploadError } from "./attach-photos";

const UPLOADS_PER_HOUR = 30;

/** Recebe uma fotografia já editada no browser, processa-a e guarda-a (ainda sem anúncio). */
export async function savePhoto(uploaderId: string, file: File) {
  const quick = checkPhotoFile(file);
  if (quick) throw new PhotoUploadError(quick);
  if (!(await consumeRateLimit(`upload:${uploaderId}`, UPLOADS_PER_HOUR, 60 * 60 * 1000))) {
    throw new PhotoUploadError("rateLimited");
  }

  let processed: Awaited<ReturnType<typeof processImage>>;
  try {
    processed = await processImage(Buffer.from(await file.arrayBuffer()));
  } catch (error) {
    if (error instanceof InvalidImageError) throw new PhotoUploadError("invalidImage");
    throw error;
  }

  const id = createId();
  const fileKey = `photos/${id}.webp`;
  const thumbKey = `photos/${id}-thumb.webp`;
  await Promise.all([storage.put(fileKey, processed.full), storage.put(thumbKey, processed.thumb)]);
  return prisma.photo.create({
    data: { id, uploaderId, fileKey, thumbKey, width: processed.width, height: processed.height },
    select: { id: true, width: true, height: true },
  });
}

/** Apaga uma fotografia carregada mas ainda não publicada (só quem a carregou). */
export async function deletePendingPhoto(uploaderId: string, id: string) {
  const photo = await prisma.photo.findUnique({ where: { id } });
  if (!photo || photo.uploaderId !== uploaderId || photo.reportId) return false;
  await prisma.photo.delete({ where: { id } });
  await Promise.all([storage.delete(photo.fileKey), storage.delete(photo.thumbKey)]);
  return true;
}

/**
 * Devolve o ficheiro de uma fotografia, se quem pede a puder ver:
 * - fotografia ainda sem anúncio: só quem a carregou;
 * - fotografia de um anúncio: o público se o anúncio estiver visível; o autor sempre.
 */
export async function readPhotoForViewer(id: string, viewerId: string | null, variant: "full" | "thumb") {
  const photo = await prisma.photo.findUnique({
    where: { id },
    include: { report: { select: { authorId: true, type: true, status: true, hiddenByModeration: true, expiresAt: true } } },
  });
  if (!photo) return null;
  const isUploader = viewerId !== null && photo.uploaderId === viewerId;
  const canSee = photo.report
    ? isPubliclyVisible(photo.report) || photo.report.authorId === viewerId
    : isUploader;
  if (!canSee) return null;
  const data = await storage.get(variant === "thumb" ? photo.thumbKey : photo.fileKey);
  if (!data) return null;
  return { data, isPublic: Boolean(photo.report && isPubliclyVisible(photo.report)) };
}
