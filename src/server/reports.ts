import "server-only";
import type { Prisma } from "@prisma/client";
import { expiresAt, type FoundReportInput, type LostReportInput } from "@/domain/report";
import { initialStatus, isPubliclyVisible } from "@/domain/report-state";
import { config } from "./config";
import { prisma } from "./db";
import { consumeRateLimit } from "./rate-limit";
import { attachPhotos, PhotoUploadError } from "./photos";

type Locale = "pt" | "en";
const pick = <T extends { namePt: string; nameEn: string }>(o: T, locale: Locale) => (locale === "en" ? o.nameEn : o.namePt);

// ---------------------------------------------------------------------------
// Opções dos formulários e filtros
// ---------------------------------------------------------------------------

export type FormOptions = Awaited<ReturnType<typeof getFormOptions>>;

export async function getFormOptions(locale: Locale) {
  const [categories, campi, points] = await Promise.all([
    prisma.category.findMany({ orderBy: { order: "asc" }, include: { subcategories: { orderBy: { order: "asc" } } } }),
    prisma.campus.findMany({
      orderBy: { order: "asc" },
      include: { locations: { where: { active: true }, orderBy: [{ number: "asc" }, { code: "asc" }] } },
    }),
    prisma.dropOffPoint.findMany({
      where: { active: true },
      include: { campus: true },
      orderBy: [{ campus: { order: "asc" } }, { name: "asc" }],
    }),
  ]);
  return {
    categories: categories.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: pick(c, locale),
      allowPhotos: c.allowPhotos,
      subcategories: c.subcategories.map((s) => ({ id: s.id, name: pick(s, locale) })),
    })),
    campi: campi.map((c) => {
      // Edifícios primeiro, cada um seguido das suas subzonas.
      const top = c.locations.filter((l) => !l.parentId);
      const ordered = top.flatMap((l) => [l, ...c.locations.filter((x) => x.parentId === l.id)]);
      return {
        id: c.id,
        name: pick(c, locale),
        locations: ordered.map((l) => ({ id: l.id, name: pick(l, locale), isSubzone: Boolean(l.parentId) })),
      };
    }),
    /** Sugestões para o campo "onde entregaste" (o texto continua livre). */
    points: points.map((p) => ({
      id: p.id,
      label: `${p.name} — ${pick(p.campus, locale)}`,
    })),
  };
}

// ---------------------------------------------------------------------------
// Criação
// ---------------------------------------------------------------------------

export class ReportError extends Error {
  constructor(public code: "rateLimited" | "invalidReference" | "photosNotAllowed" | "tooManyPhotos" | "invalidPhotos") {
    super(code);
  }
}

/** Cria o anúncio e liga as fotografias na mesma transação (ou tudo, ou nada). */
async function createWithPhotos(
  authorId: string,
  photoIds: string[],
  categoryId: string,
  data: Prisma.ReportUncheckedCreateInput,
) {
  const category = await prisma.category.findUniqueOrThrow({ where: { id: categoryId }, select: { allowPhotos: true } });
  try {
    return await prisma.$transaction(async (tx) => {
      const report = await tx.report.create({ data, select: { id: true } });
      await attachPhotos(tx, { authorId, reportId: report.id, photoIds, allowPhotos: category.allowPhotos });
      return report;
    });
  } catch (error) {
    if (error instanceof PhotoUploadError) {
      throw new ReportError(error.code === "notAllowed" ? "photosNotAllowed" : error.code === "tooMany" ? "tooManyPhotos" : "invalidPhotos");
    }
    throw error;
  }
}

/** Garante que os IDs vindos do formulário existem e são coerentes entre si. */
async function checkReferences(input: {
  categoryId: string;
  subcategoryId?: string;
  campusId: string | null;
  locationId?: string;
  dropOffPointId?: string;
}) {
  const [category, subcategory, campus, location, point] = await Promise.all([
    prisma.category.findUnique({ where: { id: input.categoryId } }),
    input.subcategoryId ? prisma.subcategory.findUnique({ where: { id: input.subcategoryId } }) : null,
    input.campusId ? prisma.campus.findUnique({ where: { id: input.campusId } }) : null,
    input.locationId ? prisma.location.findUnique({ where: { id: input.locationId } }) : null,
    input.dropOffPointId ? prisma.dropOffPoint.findUnique({ where: { id: input.dropOffPointId } }) : null,
  ]);
  const ok =
    category &&
    (!input.subcategoryId || subcategory?.categoryId === category.id) &&
    (!input.campusId || campus) &&
    // Um edifício só pode ser escolhido com o respetivo campus.
    (!input.locationId || (location?.active && location.campusId === input.campusId)) &&
    (!input.dropOffPointId || point?.active);
  if (!ok) throw new ReportError("invalidReference");
}

async function checkDailyLimit(userId: string) {
  const ok = await consumeRateLimit(`report:${userId}`, config.REPORTS_MAX_PER_DAY, 24 * 60 * 60 * 1000);
  if (!ok) throw new ReportError("rateLimited");
}

function commonData(input: LostReportInput | FoundReportInput) {
  return {
    categoryId: input.categoryId,
    subcategoryId: input.subcategoryId ?? null,
    campusId: input.campusId,
    locationId: input.campusId ? (input.locationId ?? null) : null,
    locationNote: input.locationNote ?? null,
    color: input.color ?? null,
    brand: input.brand ?? null,
    description: input.description,
  };
}

export async function createLostReport(authorId: string, input: LostReportInput) {
  await checkReferences(input);
  await checkDailyLimit(authorId);
  const now = new Date();
  return createWithPhotos(authorId, input.photoIds, input.categoryId, {
      type: "LOST",
      status: initialStatus("LOST"),
      authorId,
      ...commonData(input),
      lostFrom: input.lostFrom,
      lostTo: input.lostTo,
      publishedAt: now,
      expiresAt: expiresAt(now, config.REPORT_TTL_DAYS),
  });
}

export async function createFoundReport(authorId: string, input: FoundReportInput) {
  await checkReferences(input);
  await checkDailyLimit(authorId);
  const now = new Date();
  return createWithPhotos(authorId, input.photoIds, input.categoryId, {
      type: "FOUND",
      status: initialStatus("FOUND"),
      authorId,
      ...commonData(input),
      privateDetails: input.privateDetails ?? null,
      foundAt: input.foundAt,
      holderType: input.holderType,
      dropOffText: input.dropOffText ?? null,
      dropOffPointId: input.dropOffPointId ?? null,
      finderContact: input.finderContact ?? null,
      publishedAt: now,
      expiresAt: expiresAt(now, config.REPORT_TTL_DAYS),
  });
}

// ---------------------------------------------------------------------------
// Leitura pública
// ---------------------------------------------------------------------------

/**
 * Campos que podem sair para o público. NUNCA incluir aqui: privateDetails, dropOffText,
 * dropOffPoint (nome, morada), finderContact, nem dados do autor. Da custódia só sai o tipo e,
 * quando o ponto é conhecido, o campus.
 */
const publicSelect = {
  id: true,
  type: true,
  status: true,
  hiddenByModeration: true,
  expiresAt: true,
  publishedAt: true,
  color: true,
  brand: true,
  description: true,
  locationNote: true,
  lostFrom: true,
  lostTo: true,
  foundAt: true,
  holderType: true,
  categoryId: true,
  campusId: true,
  category: { select: { slug: true, namePt: true, nameEn: true } },
  subcategory: { select: { namePt: true, nameEn: true } },
  campus: { select: { namePt: true, nameEn: true } },
  location: { select: { namePt: true, nameEn: true } },
  dropOffPoint: { select: { campus: { select: { namePt: true, nameEn: true } } } },
  photos: { select: { id: true, width: true, height: true }, orderBy: { order: "asc" } },
} satisfies Prisma.ReportSelect;

type PublicRow = Prisma.ReportGetPayload<{ select: typeof publicSelect }>;

function toPublic(r: PublicRow, locale: Locale) {
  const custodyCampus = r.dropOffPoint?.campus ?? null;
  return {
    id: r.id,
    type: r.type,
    categoryId: r.categoryId,
    campusId: r.campusId,
    categorySlug: r.category.slug,
    categoryName: pick(r.category, locale),
    subcategoryName: r.subcategory ? pick(r.subcategory, locale) : null,
    campusName: r.campus ? pick(r.campus, locale) : null,
    locationName: r.location ? pick(r.location, locale) : null,
    locationNote: r.locationNote,
    color: r.color,
    brand: r.brand,
    description: r.description,
    lostFrom: r.lostFrom,
    lostTo: r.lostTo,
    foundAt: r.foundAt,
    /** Data do acontecimento: quando foi encontrado, ou o fim da janela em que se perdeu. */
    eventAt: (r.type === "FOUND" ? r.foundAt : r.lostTo) ?? r.publishedAt,
    photos: r.photos,
    publishedAt: r.publishedAt,
    custody: r.type === "FOUND" && r.holderType
      ? { kind: r.holderType, campusName: custodyCampus ? pick(custodyCampus, locale) : null }
      : null,
  };
}

export type PublicReport = ReturnType<typeof toPublic>;

export type ListFilters = {
  type?: "LOST" | "FOUND";
  campusId?: string;
  locationId?: string;
  categoryId?: string;
  q?: string;
  from?: Date;
  to?: Date;
};

/** Anúncios por página na lista pública. */
export const PAGE_SIZE = 5;

export async function listPublicReports(filters: ListFilters, page: number, locale: Locale) {
  const now = new Date();
  const and: Prisma.ReportWhereInput[] = [
    { hiddenByModeration: false, expiresAt: { gt: now } },
    { OR: [{ type: "LOST", status: initialStatus("LOST") }, { type: "FOUND", status: initialStatus("FOUND") }] },
  ];
  if (filters.type) and.push({ type: filters.type });
  // "Não sei / entre campi" aparece em qualquer campus (como no matching).
  if (filters.campusId) and.push({ OR: [{ campusId: filters.campusId }, { campusId: null }] });
  if (filters.locationId) and.push({ OR: [{ locationId: filters.locationId }, { location: { parentId: filters.locationId } }] });
  if (filters.categoryId) and.push({ categoryId: filters.categoryId });
  if (filters.q) {
    const contains = { contains: filters.q, mode: "insensitive" as const };
    and.push({
      OR: [
        { description: contains }, { brand: contains }, { locationNote: contains },
        { subcategory: { OR: [{ namePt: contains }, { nameEn: contains }] } },
        { category: { OR: [{ namePt: contains }, { nameEn: contains }] } },
        { location: { OR: [{ namePt: contains }, { nameEn: contains }, { aliases: { has: filters.q } }] } },
      ],
    });
  }
  if (filters.from || filters.to) {
    const range = { ...(filters.from && { gte: filters.from }), ...(filters.to && { lte: filters.to }) };
    and.push({
      OR: [
        { type: "FOUND", foundAt: range },
        // Perdidos: a janela [lostFrom, lostTo] tem de tocar no intervalo pedido.
        { type: "LOST", ...(filters.from && { lostTo: { gte: filters.from } }), ...(filters.to && { lostFrom: { lte: filters.to } }) },
      ],
    });
  }

  const where = { AND: and };
  const [rows, total] = await Promise.all([
    prisma.report.findMany({ where, select: publicSelect, orderBy: { publishedAt: "desc" }, skip: page * PAGE_SIZE, take: PAGE_SIZE }),
    prisma.report.count({ where }),
  ]);
  return { items: rows.map((r) => toPublic(r, locale)), total };
}

/**
 * Anúncio para a página de detalhe. O público só o vê enquanto estiver ativo; o autor vê sempre o
 * seu, incluindo os dados privados (que mais ninguém recebe nesta fase).
 */
export async function getReportForViewer(id: string, viewerId: string | null, locale: Locale) {
  const row = await prisma.report.findUnique({
    where: { id },
    select: {
      ...publicSelect,
      authorId: true,
      privateDetails: true,
      dropOffText: true,
      finderContact: true,
      author: { select: { email: true } },
      dropOffPoint: { select: { name: true, directionsPt: true, directionsEn: true, campus: { select: { namePt: true, nameEn: true } } } },
    },
  });
  if (!row) return null;
  const isAuthor = viewerId !== null && row.authorId === viewerId;
  if (!isAuthor && !isPubliclyVisible(row)) return null;

  const report = toPublic(row, locale);
  const owner = isAuthor
    ? {
        privateDetails: row.privateDetails,
        status: row.status,
        expiresAt: row.expiresAt,
        dropOffText: row.dropOffText,
        point: row.dropOffPoint
          ? { name: row.dropOffPoint.name, directions: locale === "en" ? row.dropOffPoint.directionsEn : row.dropOffPoint.directionsPt }
          : null,
        // O que vai ser revelado a quem reclamar (quando quem encontrou fica com o objeto).
        contact: row.holderType === "FINDER" ? { email: row.author.email, extra: row.finderContact } : null,
      }
    : null;
  return { report, isAuthor, owner };
}
