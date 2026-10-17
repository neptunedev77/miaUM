import { describe, expect, it } from "vitest";
import { expiresAt, fieldErrors, foundReportSchema, lostReportSchema } from "@/domain/report";
import { initialStatus, isPubliclyVisible, isValidStatus } from "@/domain/report-state";

// "Agora" fixo: 17/10/2026 15:00 em Lisboa (14:00 UTC)
const NOW = new Date("2026-10-17T14:00:00Z");

const baseLost = {
  categoryId: "cat1",
  campusId: "campus1",
  description: "Mochila preta com autocolantes",
  lostFrom: "2026-10-17T09:00",
  lostTo: "2026-10-17T12:00",
};

const baseFound = {
  categoryId: "cat1",
  campusId: "campus1",
  description: "Garrafa térmica azul",
  foundAt: "2026-10-17T11:00",
  holderType: "POINT",
  dropOffText: "Biblioteca Geral, balcão do piso 0",
};

function errorsOf(result: { success: boolean; error?: unknown }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return result.success ? {} : fieldErrors(result.error as any);
}

describe("lostReportSchema", () => {
  const schema = lostReportSchema(NOW);

  it("aceita um anúncio válido e converte as datas para UTC", () => {
    const r = schema.parse(baseLost);
    expect(r.lostFrom.toISOString()).toBe("2026-10-17T08:00:00.000Z");
    expect(r.campusId).toBe("campus1");
  });

  it("trata campos vazios como ausentes e 'unknown' como 'Não sei'", () => {
    const r = schema.parse({ ...baseLost, campusId: "unknown", brand: "  ", color: "" });
    expect(r.campusId).toBeNull();
    expect(r.brand).toBeUndefined();
    expect(r.color).toBeUndefined();
  });

  it("exige o campus (mesmo que seja 'Não sei')", () => {
    expect(errorsOf(schema.safeParse({ ...baseLost, campusId: "" }))).toMatchObject({ campusId: "campusRequired" });
    expect(errorsOf(schema.safeParse({ ...baseLost, campusId: undefined }))).toMatchObject({ campusId: "campusRequired" });
  });

  it("exige categoria e descrição com 10 a 500 caracteres", () => {
    expect(errorsOf(schema.safeParse({ ...baseLost, categoryId: "" }))).toMatchObject({ categoryId: "categoryRequired" });
    expect(errorsOf(schema.safeParse({ ...baseLost, description: "curta" }))).toMatchObject({ description: "descriptionTooShort" });
    expect(errorsOf(schema.safeParse({ ...baseLost, description: "x".repeat(501) }))).toMatchObject({ description: "descriptionTooLong" });
  });

  it("limita marca e nota", () => {
    expect(errorsOf(schema.safeParse({ ...baseLost, brand: "x".repeat(61) }))).toMatchObject({ brand: "brandTooLong" });
    expect(errorsOf(schema.safeParse({ ...baseLost, locationNote: "x".repeat(121) }))).toMatchObject({ locationNote: "noteTooLong" });
  });

  it("rejeita cores fora da lista", () => {
    expect(errorsOf(schema.safeParse({ ...baseLost, color: "TURQUOISE" }))).toMatchObject({ color: "invalidColor" });
  });

  it("exige as datas e rejeita datas inválidas", () => {
    expect(errorsOf(schema.safeParse({ ...baseLost, lostFrom: "" }))).toMatchObject({ lostFrom: "lostFromRequired" });
    expect(errorsOf(schema.safeParse({ ...baseLost, lostTo: "ontem" }))).toMatchObject({ lostTo: "invalidDate" });
  });

  it("rejeita datas no futuro", () => {
    expect(errorsOf(schema.safeParse({ ...baseLost, lostTo: "2026-10-17T18:00" }))).toMatchObject({ lostTo: "dateInFuture" });
  });

  it("aceita uma pequena diferença de relógio", () => {
    expect(schema.safeParse({ ...baseLost, lostTo: "2026-10-17T15:03" }).success).toBe(true);
  });

  it("exige lostTo >= lostFrom", () => {
    expect(errorsOf(schema.safeParse({ ...baseLost, lostFrom: "2026-10-17T12:00", lostTo: "2026-10-17T09:00" })))
      .toMatchObject({ lostTo: "lostToBeforeFrom" });
  });

  it("limita a janela a 14 dias", () => {
    expect(schema.safeParse({ ...baseLost, lostFrom: "2026-10-03T12:00", lostTo: "2026-10-17T12:00" }).success).toBe(true);
    expect(errorsOf(schema.safeParse({ ...baseLost, lostFrom: "2026-10-03T11:00", lostTo: "2026-10-17T12:00" })))
      .toMatchObject({ lostTo: "windowTooLong" });
  });
});

describe("foundReportSchema", () => {
  const schema = foundReportSchema(NOW);

  it("aceita entrega num ponto escrito à mão", () => {
    const r = schema.parse(baseFound);
    expect(r.holderType).toBe("POINT");
    expect(r.dropOffText).toBe("Biblioteca Geral, balcão do piso 0");
    expect(r.dropOffPointId).toBeUndefined();
    expect(r.foundAt.toISOString()).toBe("2026-10-17T10:00:00.000Z");
  });

  it("aceita ligar o texto a um ponto conhecido", () => {
    expect(schema.parse({ ...baseFound, dropOffPointId: "point1" }).dropOffPointId).toBe("point1");
  });

  it("exige o local de entrega com pelo menos 3 caracteres e no máximo 120", () => {
    expect(errorsOf(schema.safeParse({ ...baseFound, dropOffText: "" }))).toMatchObject({ dropOffText: "dropOffTextRequired" });
    expect(errorsOf(schema.safeParse({ ...baseFound, dropOffText: "ab" }))).toMatchObject({ dropOffText: "dropOffTextRequired" });
    expect(errorsOf(schema.safeParse({ ...baseFound, dropOffText: "x".repeat(121) }))).toMatchObject({ dropOffText: "dropOffTextTooLong" });
  });

  it("exige a aceitação quando quem encontrou fica com o objeto", () => {
    const finder = { ...baseFound, holderType: "FINDER", dropOffText: "" };
    expect(errorsOf(schema.safeParse(finder))).toMatchObject({ finderAccepted: "finderMustAccept" });
    expect(schema.safeParse({ ...finder, finderAccepted: "on" }).success).toBe(true);
  });

  it("aceita um contacto extra opcional, até 120 caracteres", () => {
    const finder = { ...baseFound, holderType: "FINDER", finderAccepted: "on" };
    expect(schema.parse({ ...finder, finderContact: "912 345 678" }).finderContact).toBe("912 345 678");
    expect(errorsOf(schema.safeParse({ ...finder, finderContact: "x".repeat(121) }))).toMatchObject({ finderContact: "contactTooLong" });
  });

  it("guarda só os campos da custódia escolhida", () => {
    const f = schema.parse({ ...baseFound, holderType: "FINDER", finderAccepted: "on", finderContact: "912", dropOffPointId: "p1" });
    expect(f.dropOffText).toBeUndefined();
    expect(f.dropOffPointId).toBeUndefined();
    expect(f.finderContact).toBe("912");
    expect("finderAccepted" in f).toBe(false);

    const p = schema.parse({ ...baseFound, finderContact: "912" });
    expect(p.finderContact).toBeUndefined();
  });

  it("exige a custódia e rejeita valores desconhecidos", () => {
    expect(errorsOf(schema.safeParse({ ...baseFound, holderType: "" }))).toMatchObject({ holderType: "holderRequired" });
    expect(errorsOf(schema.safeParse({ ...baseFound, holderType: "OTHER" }))).toMatchObject({ holderType: "holderRequired" });
    expect(errorsOf(schema.safeParse({ ...baseFound, holderType: "INFORMAL" }))).toMatchObject({ holderType: "holderRequired" });
  });

  it("limita os detalhes privados e rejeita datas futuras", () => {
    expect(errorsOf(schema.safeParse({ ...baseFound, privateDetails: "x".repeat(301) })))
      .toMatchObject({ privateDetails: "privateDetailsTooLong" });
    expect(errorsOf(schema.safeParse({ ...baseFound, foundAt: "2026-10-18T10:00" }))).toMatchObject({ foundAt: "dateInFuture" });
    expect(errorsOf(schema.safeParse({ ...baseFound, foundAt: "" }))).toMatchObject({ foundAt: "foundAtRequired" });
  });
});

describe("expiresAt", () => {
  it("soma o prazo de vida ao momento da publicação", () => {
    expect(expiresAt(new Date("2026-10-17T14:00:00Z"), 30).toISOString()).toBe("2026-11-16T14:00:00.000Z");
  });
});

describe("estados", () => {
  it("define o estado inicial por tipo", () => {
    expect(initialStatus("LOST")).toBe("OPEN");
    expect(initialStatus("FOUND")).toBe("PUBLISHED");
  });

  it("valida combinações de tipo e estado", () => {
    expect(isValidStatus("LOST", "OPEN")).toBe(true);
    expect(isValidStatus("LOST", "CLAIMED")).toBe(false);
    expect(isValidStatus("FOUND", "RETURNED")).toBe(true);
    expect(isValidStatus("FOUND", "RECOVERED")).toBe(false);
  });

  it("só mostra ao público anúncios ativos, não ocultos e não expirados", () => {
    const base = { type: "FOUND" as const, status: "PUBLISHED" as const, hiddenByModeration: false, expiresAt: new Date("2026-11-01T00:00:00Z") };
    expect(isPubliclyVisible(base, NOW)).toBe(true);
    expect(isPubliclyVisible({ ...base, hiddenByModeration: true }, NOW)).toBe(false);
    expect(isPubliclyVisible({ ...base, status: "CLAIMED" }, NOW)).toBe(false);
    expect(isPubliclyVisible({ ...base, expiresAt: new Date("2026-10-17T13:00:00Z") }, NOW)).toBe(false);
    expect(isPubliclyVisible({ ...base, type: "LOST", status: "OPEN" }, NOW)).toBe(true);
    expect(isPubliclyVisible({ ...base, type: "LOST", status: "RECOVERED" }, NOW)).toBe(false);
  });
});
