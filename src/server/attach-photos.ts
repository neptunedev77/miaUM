import type { Prisma } from "@prisma/client";
import { PHOTO_LIMITS, type PhotoError } from "@/domain/photos";

export class PhotoUploadError extends Error {
  constructor(public code: PhotoError) {
    super(code);
  }
}

type PhotoTx = Pick<Prisma.TransactionClient, "photo">;

/**
 * Liga as fotografias ao anúncio acabado de criar (dentro da mesma transação).
 * Só aceita fotografias do próprio autor, ainda não usadas, e só se a categoria as permitir.
 */
export async function attachPhotos(
  tx: PhotoTx,
  { authorId, reportId, photoIds, allowPhotos }: { authorId: string; reportId: string; photoIds: string[]; allowPhotos: boolean },
) {
  if (photoIds.length === 0) return;
  if (!allowPhotos) throw new PhotoUploadError("notAllowed");
  if (photoIds.length > PHOTO_LIMITS.maxPerReport) throw new PhotoUploadError("tooMany");
  const photos = await tx.photo.findMany({ where: { id: { in: photoIds }, uploaderId: authorId, reportId: null } });
  if (photos.length !== photoIds.length) throw new PhotoUploadError("invalidImage");
  for (const [order, id] of photoIds.entries()) {
    await tx.photo.update({ where: { id }, data: { reportId, order } });
  }
}
