import { NextResponse, type NextRequest } from "next/server";
import { deletePendingPhoto, readPhotoForViewer } from "@/server/photos";
import { getCurrentUser } from "@/server/session";

/** Serve a fotografia (?t=thumb para a miniatura), verificando sempre quem a pode ver. */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/fotos/[id]">) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  const variant = request.nextUrl.searchParams.get("t") === "thumb" ? "thumb" : "full";
  const photo = await readPhotoForViewer(id, user?.id ?? null, variant);
  if (!photo) return new NextResponse(null, { status: 404 });

  return new NextResponse(new Uint8Array(photo.data), {
    headers: {
      "Content-Type": "image/webp",
      // Cache curta: se o anúncio deixar de ser público (reclamado, expirado), a foto deixa de ser servida.
      "Cache-Control": photo.isPublic ? "public, max-age=300" : "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

/** Remove uma fotografia carregada que ainda não foi publicada. */
export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/fotos/[id]">) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  const ok = await deletePendingPhoto(user.id, id);
  return new NextResponse(null, { status: ok ? 204 : 404 });
}
