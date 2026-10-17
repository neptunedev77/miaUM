import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { auth } from "./auth";
import { prisma } from "./db";

export type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  locale: string;
  roles: Role[];
};

/**
 * Camada de acesso: o utilizador atual, com os perfis lidos da BD em cada pedido.
 * Devolve null se não houver sessão ou se a conta tiver sido apagada.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const user = await prisma.user.findUnique({ where: { id }, include: { roles: true } });
  if (!user || user.deletedAt || !user.email) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    locale: user.locale,
    roles: user.roles.map((r) => r.role),
  };
});

export function hasRole(user: CurrentUser | null, role: Role) {
  return Boolean(user?.roles.includes(role));
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  return user;
}

export async function requireRole(role: Role): Promise<CurrentUser> {
  const user = await requireUser();
  if (!hasRole(user, role)) redirect("/sem-acesso");
  return user;
}
