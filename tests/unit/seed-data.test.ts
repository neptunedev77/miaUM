import { describe, expect, it } from "vitest";
import { campi, places } from "../../prisma/seed/locations";
import { categories } from "../../prisma/seed/categories";
import { devUsers } from "../../prisma/seed/users";

describe("seed de localizações", () => {
  it("tem códigos de local únicos", () => {
    const codes = places.map((p) => p.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("só usa campi que existem", () => {
    const slugs = new Set(campi.map((c) => c.slug));
    for (const p of places) expect(slugs.has(p.campus), p.code).toBe(true);
  });

  it("os locais-pai existem e são do mesmo campus", () => {
    const byCode = new Map(places.map((p) => [p.code, p]));
    for (const p of places.filter((x) => x.parent)) {
      const parent = byCode.get(p.parent!);
      expect(parent, p.code).toBeDefined();
      expect(parent!.campus, p.code).toBe(p.campus);
    }
  });

  it("cada local indica o estado", () => {
    for (const p of places) expect(["confirmado", "provisorio"], p.code).toContain(p.status);
  });
});

describe("seed de categorias", () => {
  it("tem slugs únicos e subcategorias únicas dentro de cada categoria", () => {
    const slugs = categories.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const c of categories) {
      const subs = c.subs.map((s) => s.slug);
      expect(new Set(subs).size, c.slug).toBe(subs.length);
    }
  });

  it("não permite fotografias em documentos de identificação", () => {
    expect(categories.find((c) => c.slug === "documentos")?.allowPhotos).toBe(false);
  });
});

describe("utilizadores de teste", () => {
  it("usam apenas o domínio inventado example.test", () => {
    for (const u of devUsers) expect(u.email.endsWith("@example.test"), u.email).toBe(true);
  });

  it("cobrem os perfis de utilizador e administrador", () => {
    const roles = new Set(devUsers.flatMap((u) => u.roles));
    expect([...roles].sort()).toEqual(["ADMIN", "USER"]);
  });
});
