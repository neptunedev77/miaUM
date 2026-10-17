// Regras dos anúncios (SPEC §5): validação partilhada entre cliente e servidor.
// As mensagens de erro são chaves de tradução (namespace "reportForm.errors").
import { z } from "zod";
import { addDays, lisbonLocalToUtc } from "./time";
import { parsePhotoIds, PHOTO_LIMITS } from "./photos";

export const COLORS = [
  "BLACK", "WHITE", "GREY", "BLUE", "RED", "GREEN", "YELLOW", "ORANGE",
  "PINK", "PURPLE", "BROWN", "BEIGE", "SILVER", "GOLD", "MULTICOLOR", "OTHER",
] as const;
export type Color = (typeof COLORS)[number];

export const HOLDER_TYPES = ["POINT", "FINDER"] as const;
export type HolderType = (typeof HOLDER_TYPES)[number];

/** Valor do formulário para "Não sei / entre campi". */
export const UNKNOWN_CAMPUS = "unknown";

export const LIMITS = {
  descriptionMin: 10,
  descriptionMax: 500,
  brandMax: 60,
  noteMax: 120,
  dropOffTextMin: 3,
  dropOffTextMax: 120,
  contactMax: 120,
  privateDetailsMax: 300,
  lostWindowMaxDays: 14,
  /** Tolerância para relógios ligeiramente adiantados ao validar "sem datas futuras". */
  futureSkewMs: 5 * 60 * 1000,
} as const;

/** Campo opcional vindo de um formulário: "" passa a undefined. */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), schema.optional());

const id = z.string().trim().min(1).max(40);
const text = (max: number, error: string) => z.string().trim().max(max, { error });

/** Data em hora de Lisboa vinda de <input type="datetime-local"> -> Date (UTC). */
const lisbonDate = (required: string) =>
  z
    .string({ error: required })
    .min(1, { error: required })
    .transform((v, ctx) => {
      const d = lisbonLocalToUtc(v);
      if (!d) {
        ctx.addIssue({ code: "custom", message: "invalidDate" });
        return z.NEVER;
      }
      return d;
    });

const common = {
  categoryId: z.string({ error: "categoryRequired" }).trim().min(1, { error: "categoryRequired" }).max(40),
  subcategoryId: optional(id),
  // Obrigatório; "unknown" = "Não sei / entre campi" (guardado como null).
  campusId: z
    .string({ error: "campusRequired" })
    .trim()
    .min(1, { error: "campusRequired" })
    .max(40)
    .transform((v) => (v === UNKNOWN_CAMPUS ? null : v)),
  locationId: optional(id),
  locationNote: optional(text(LIMITS.noteMax, "noteTooLong")),
  color: optional(z.enum(COLORS, { error: "invalidColor" })),
  brand: optional(text(LIMITS.brandMax, "brandTooLong")),
  // "id1,id2" -> ["id1","id2"] (fotografias já carregadas, ainda sem anúncio)
  photoIds: z.preprocess(parsePhotoIds, z.array(z.string()).max(PHOTO_LIMITS.maxPerReport, { error: "tooManyPhotos" })),
  description: z
    .string({ error: "descriptionRequired" })
    .trim()
    .min(LIMITS.descriptionMin, { error: "descriptionTooShort" })
    .max(LIMITS.descriptionMax, { error: "descriptionTooLong" }),
};

function notInFuture(now: Date) {
  return (d: Date) => d.getTime() <= now.getTime() + LIMITS.futureSkewMs;
}

/** Uma data inválida já tem o seu erro; as validações cruzadas só correm com datas válidas. */
const isDate = (d: unknown): d is Date => d instanceof Date && !Number.isNaN(d.getTime());

/** Anúncio "Perdi" (SPEC §5.2). `now` é injetável para os testes. */
export function lostReportSchema(now: Date = new Date()) {
  return z
    .object({
      ...common,
      lostFrom: lisbonDate("lostFromRequired"),
      lostTo: lisbonDate("lostToRequired"),
    })
    .superRefine((v, ctx) => {
      if (!isDate(v.lostFrom) || !isDate(v.lostTo)) return;
      const future = notInFuture(now);
      if (!future(v.lostFrom)) ctx.addIssue({ code: "custom", path: ["lostFrom"], message: "dateInFuture" });
      if (!future(v.lostTo)) ctx.addIssue({ code: "custom", path: ["lostTo"], message: "dateInFuture" });
      if (v.lostTo < v.lostFrom) ctx.addIssue({ code: "custom", path: ["lostTo"], message: "lostToBeforeFrom" });
      else if (v.lostTo.getTime() - v.lostFrom.getTime() > LIMITS.lostWindowMaxDays * 24 * 60 * 60 * 1000) {
        ctx.addIssue({ code: "custom", path: ["lostTo"], message: "windowTooLong" });
      }
    });
}

/**
 * Anúncio "Encontrei", incluindo a custódia escolhida no primeiro passo:
 * - POINT: entregue (ou a entregar) num ponto, escrito à mão; pode ligar-se a um ponto conhecido;
 * - FINDER: quem encontrou fica com o objeto e aceita que o seu contacto seja revelado a quem reclamar.
 */
export function foundReportSchema(now: Date = new Date()) {
  return z
    .object({
      ...common,
      foundAt: lisbonDate("foundAtRequired"),
      privateDetails: optional(text(LIMITS.privateDetailsMax, "privateDetailsTooLong")),
      holderType: z.enum(HOLDER_TYPES, { error: "holderRequired" }),
      dropOffText: optional(text(LIMITS.dropOffTextMax, "dropOffTextTooLong")),
      dropOffPointId: optional(id),
      finderContact: optional(text(LIMITS.contactMax, "contactTooLong")),
      finderAccepted: optional(z.enum(["on", "true"])),
    })
    .superRefine((v, ctx) => {
      if (isDate(v.foundAt) && !notInFuture(now)(v.foundAt)) ctx.addIssue({ code: "custom", path: ["foundAt"], message: "dateInFuture" });
      if (v.holderType === "POINT" && (!v.dropOffText || v.dropOffText.length < LIMITS.dropOffTextMin)) {
        ctx.addIssue({ code: "custom", path: ["dropOffText"], message: "dropOffTextRequired" });
      }
      if (v.holderType === "FINDER" && !v.finderAccepted) {
        ctx.addIssue({ code: "custom", path: ["finderAccepted"], message: "finderMustAccept" });
      }
    })
    .transform((v) => {
      // A aceitação só serve para validar; só os campos da custódia escolhida são guardados.
      const out = {
        ...v,
        dropOffText: v.holderType === "POINT" ? v.dropOffText : undefined,
        dropOffPointId: v.holderType === "POINT" ? v.dropOffPointId : undefined,
        finderContact: v.holderType === "FINDER" ? v.finderContact : undefined,
      };
      delete out.finderAccepted;
      return out;
    });
}

export type LostReportInput = z.output<ReturnType<typeof lostReportSchema>>;
export type FoundReportInput = z.output<ReturnType<typeof foundReportSchema>>;

/** Erros por campo: { campo: "chaveDeTradução" } (o primeiro erro de cada campo). */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function expiresAt(publishedAt: Date, ttlDays: number): Date {
  return addDays(publishedAt, ttlDays);
}
