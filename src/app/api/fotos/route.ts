import { NextResponse } from "next/server";
import { PhotoUploadError, savePhoto } from "@/server/photos";
import { getCurrentUser } from "@/server/session";

/** Carrega uma fotografia (já recortada/tapada no browser). Devolve o id para o formulário. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return NextResponse.json({ error: "invalidImage" }, { status: 400 });
  }
  if (!(file instanceof File)) return NextResponse.json({ error: "invalidImage" }, { status: 400 });

  try {
    const photo = await savePhoto(user.id, file);
    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    if (error instanceof PhotoUploadError) {
      const status = error.code === "rateLimited" ? 429 : error.code === "tooLarge" ? 413 : 400;
      return NextResponse.json({ error: error.code }, { status });
    }
    throw error;
  }
}
