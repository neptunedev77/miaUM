"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn, signOut } from "@/server/auth";
import { devLoginEnabled, oidcEnabled } from "@/server/config";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/server/session";
import { isLocale, LOCALE_COOKIE } from "@/i18n/config";
import { firstNameFrom, safeNext } from "@/domain/navigation";

const emailSchema = z.string().trim().toLowerCase().email().max(254);

// signIn() termina com um redirect (que é lançado como exceção): só tratamos os AuthError.
async function runSignIn(fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (error) {
    if (error instanceof AuthError) redirect(`/entrar?erro=${encodeURIComponent(error.type)}`);
    throw error;
  }
}

/** Depois do login passa sempre por /bem-vindo, que pede o primeiro nome se ainda não existir. */
function afterLogin(formData: FormData) {
  const next = safeNext(formData.get("next"), "/");
  return `/bem-vindo?next=${encodeURIComponent(next)}`;
}

export async function signInWithEmail(formData: FormData) {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) redirect("/entrar?erro=invalidEmail");
  await runSignIn(() => signIn("email", { email: parsed.data, redirectTo: afterLogin(formData) }));
}

export async function signInWithOidc(formData: FormData) {
  if (!oidcEnabled) redirect("/entrar");
  await runSignIn(() => signIn("oidc", { redirectTo: afterLogin(formData) }));
}

export async function signInAsDevUser(formData: FormData) {
  if (!devLoginEnabled) redirect("/entrar");
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) redirect("/entrar?erro=invalidEmail");
  await runSignIn(() => signIn("dev", { email: parsed.data, redirectTo: afterLogin(formData) }));
}

export async function saveFirstName(_prev: { error?: string } | undefined, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  const name = firstNameFrom(formData.get("name"));
  if (!name) return { error: "invalidName" };
  await prisma.user.update({ where: { id: user.id }, data: { name } });
  redirect(safeNext(formData.get("next"), "/"));
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export async function setLocale(formData: FormData) {
  const locale = formData.get("locale");
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  // Guardado também na conta, para os emails saírem no idioma certo.
  const user = await getCurrentUser();
  if (user) await prisma.user.update({ where: { id: user.id }, data: { locale } });
}
