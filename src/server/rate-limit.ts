import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "./db";

/** Chave sem dados pessoais em claro (ex.: emails). */
export function hashedKey(prefix: string, value: string) {
  return `${prefix}:${createHash("sha256").update(value).digest("hex").slice(0, 32)}`;
}

/**
 * Regista uma tentativa e devolve false se o limite já tiver sido atingido na janela.
 * Contado na BD (RateLimitHit): um único processo e carga baixa, por isso não é preciso Redis.
 */
export async function consumeRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const since = new Date(Date.now() - windowMs);
  const used = await prisma.rateLimitHit.count({ where: { key, createdAt: { gte: since } } });
  if (used >= limit) return false;
  await prisma.rateLimitHit.create({ data: { key } });
  return true;
}
