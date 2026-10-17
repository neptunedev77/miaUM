import { describe, expect, it, vi } from "vitest";
import { attachPhotos, PhotoUploadError } from "@/server/attach-photos";

/** Transação falsa: devolve as fotografias que "existem" para aquele autor e regista as atualizações. */
function fakeTx(available: string[]) {
  const update = vi.fn().mockResolvedValue({});
  const findMany = vi.fn(async ({ where }: { where: { id: { in: string[] } } }) =>
    where.id.in.filter((id) => available.includes(id)).map((id) => ({ id })));
  return { tx: { photo: { findMany, update } } as never, update, findMany };
}

const base = { authorId: "u1", reportId: "r1", allowPhotos: true };

describe("attachPhotos", () => {
  it("liga as fotografias ao anúncio, pela ordem escolhida", async () => {
    const { tx, update, findMany } = fakeTx(["p1", "p2"]);
    await attachPhotos(tx, { ...base, photoIds: ["p2", "p1"] });
    expect(findMany).toHaveBeenCalledWith({ where: { id: { in: ["p2", "p1"] }, uploaderId: "u1", reportId: null } });
    expect(update).toHaveBeenNthCalledWith(1, { where: { id: "p2" }, data: { reportId: "r1", order: 0 } });
    expect(update).toHaveBeenNthCalledWith(2, { where: { id: "p1" }, data: { reportId: "r1", order: 1 } });
  });

  it("não faz nada sem fotografias", async () => {
    const { tx, findMany } = fakeTx([]);
    await attachPhotos(tx, { ...base, allowPhotos: false, photoIds: [] });
    expect(findMany).not.toHaveBeenCalled();
  });

  it("recusa fotografias em categorias que não as permitem (documentos)", async () => {
    const { tx } = fakeTx(["p1"]);
    await expect(attachPhotos(tx, { ...base, allowPhotos: false, photoIds: ["p1"] })).rejects.toMatchObject({ code: "notAllowed" });
  });

  it("recusa mais de 3 fotografias", async () => {
    const { tx } = fakeTx(["a", "b", "c", "d"]);
    await expect(attachPhotos(tx, { ...base, photoIds: ["a", "b", "c", "d"] })).rejects.toBeInstanceOf(PhotoUploadError);
  });

  it("recusa fotografias de outra pessoa ou já usadas noutro anúncio", async () => {
    const { tx, update } = fakeTx(["p1"]); // "p2" não pertence ao autor (ou já tem anúncio)
    await expect(attachPhotos(tx, { ...base, photoIds: ["p1", "p2"] })).rejects.toMatchObject({ code: "invalidImage" });
    expect(update).not.toHaveBeenCalled();
  });
});
