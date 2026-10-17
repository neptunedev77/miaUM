import "server-only";
import type { Prisma } from "@prisma/client";
import {
  claimRefusal, isClaimStale, transition, type ClaimRefusal, type ReportEvent, type ReportStatus, type ReportType,
} from "@/domain/report-state";
import { config } from "./config";
import { prisma } from "./db";

export class ClaimError extends Error {
  constructor(public code: ClaimRefusal | "notAllowed") {
    super(code);
  }
}

const DAY = 24 * 60 * 60 * 1000;
const claimKey = (userId: string) => `claim:${userId}`;

type Tx = Prisma.TransactionClient;

/**
 * Aplica um acontecimento ao anúncio (e à reclamação ativa, se houver) dentro de uma transação.
 * A atualização é condicional ao estado lido: se outro pedido mudou o anúncio entretanto, falha.
 */
async function apply(
  tx: Tx,
  report: { id: string; type: ReportType; status: ReportStatus },
  event: ReportEvent,
  actorId: string | null,
  claimId: string | null,
) {
  const next = transition(report.type, report.status, event);
  const updated = await tx.report.updateMany({ where: { id: report.id, status: report.status }, data: { status: next.status } });
  if (updated.count !== 1) throw new ClaimError("notAvailable");
  if (next.claim && claimId) {
    const closed = await tx.claim.updateMany({
      where: { id: claimId, status: "ACTIVE" },
      data: { status: next.claim.to, closedAt: new Date(), closedById: actorId, closeReason: event },
    });
    if (closed.count !== 1) throw new ClaimError("notAvailable");
  }
  return next.status;
}

/**
 * Reservas sem resposta há mais de N dias voltam a estar públicas. Chamado ao abrir as páginas
 * (barato: usa o índice das reclamações); na Fase 4 passa também a correr numa tarefa periódica.
 */
export async function expireStaleClaims(now: Date = new Date()) {
  const cutoff = new Date(now.getTime() - config.CLAIM_REVERT_DAYS * DAY);
  const stale = await prisma.claim.findMany({
    where: { status: "ACTIVE", createdAt: { lte: cutoff } },
    select: { id: true, createdAt: true, report: { select: { id: true, type: true, status: true } } },
    take: 50,
  });
  for (const c of stale) {
    if (!isClaimStale(c.createdAt, config.CLAIM_REVERT_DAYS, now)) continue;
    await prisma.$transaction((tx) => apply(tx, c.report, "claimExpired", null, c.id)).catch(() => {
      // Outro pedido tratou desta reclamação ao mesmo tempo: ignorar.
    });
  }
}

/** "É meu": reserva o objeto para o utilizador, depois de aceitar os termos. */
export async function claimReport(userId: string, reportId: string, termsAccepted: boolean) {
  await expireStaleClaims();
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: { id: true, type: true, status: true, hiddenByModeration: true, expiresAt: true, authorId: true },
  });
  if (!report) throw new ClaimError("notAvailable");

  const since = new Date(Date.now() - config.CLAIMS_WINDOW_DAYS * DAY);
  const [activeClaims, claimsInWindow] = await Promise.all([
    prisma.claim.count({ where: { claimantId: userId, status: "ACTIVE" } }),
    // Contado à parte (RateLimitHit), para sobreviver à eliminação dos anúncios.
    prisma.rateLimitHit.count({ where: { key: claimKey(userId), createdAt: { gte: since } } }),
  ]);
  const refusal = claimRefusal({
    report, userId, termsAccepted, activeClaims, claimsInWindow,
    limits: { maxActive: config.CLAIMS_MAX_ACTIVE, maxPerWindow: config.CLAIMS_MAX_PER_WINDOW },
  });
  if (refusal) throw new ClaimError(refusal);

  try {
    return await prisma.$transaction(async (tx) => {
      await apply(tx, report, "claim", userId, null);
      const claim = await tx.claim.create({ data: { reportId, claimantId: userId }, select: { id: true } });
      await tx.rateLimitHit.create({ data: { key: claimKey(userId) } });
      return claim;
    });
  } catch (error) {
    // Índice único parcial: outra pessoa reclamou no mesmo instante.
    if ((error as { code?: string }).code === "P2002") throw new ClaimError("notAvailable");
    throw error;
  }
}

/** Reclamante: "Recebi o objeto" ou "Afinal não era meu". */
export async function closeOwnClaim(userId: string, claimId: string, action: "received" | "withdrew") {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    select: { id: true, status: true, claimantId: true, report: { select: { id: true, type: true, status: true } } },
  });
  if (!claim || claim.claimantId !== userId || claim.status !== "ACTIVE") throw new ClaimError("notAllowed");
  const event: ReportEvent = action === "received" ? "claimantReceived" : "claimantWithdrew";
  await prisma.$transaction((tx) => apply(tx, claim.report, event, userId, claim.id));
  return claim.report.id;
}

/** Quem encontrou: "Devolvido" (encerra) ou "Não era dele" (volta a público). */
export async function finderAction(userId: string, reportId: string, action: "returned" | "rejected") {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: { id: true, type: true, status: true, authorId: true, claims: { where: { status: "ACTIVE" }, select: { id: true } } },
  });
  if (!report || report.authorId !== userId || report.type !== "FOUND") throw new ClaimError("notAllowed");
  const event: ReportEvent = action === "returned" ? "finderReturned" : "finderRejected";
  await prisma.$transaction((tx) => apply(tx, report, event, userId, report.claims[0]?.id ?? null));
}

/** Quem perdeu: "Já recuperei". */
export async function markRecovered(userId: string, reportId: string) {
  const report = await prisma.report.findUnique({ where: { id: reportId }, select: { id: true, type: true, status: true, authorId: true } });
  if (!report || report.authorId !== userId || report.type !== "LOST") throw new ClaimError("notAllowed");
  await prisma.$transaction((tx) => apply(tx, report, "recovered", userId, null));
}
