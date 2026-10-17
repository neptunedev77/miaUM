import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { signInAsDevUser, signInWithEmail, signInWithOidc } from "@/app/actions";
import { config, devLoginEnabled, oidcEnabled } from "@/server/config";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/server/session";

export const metadata: Metadata = { title: "Entrar" };

const KNOWN_ERRORS = ["AccessDenied", "Verification", "limite", "invalidEmail"] as const;

async function devUsers() {
  if (!devLoginEnabled) return [];
  return prisma.user.findMany({
    where: { deletedAt: null, email: { endsWith: "@example.test" } },
    include: { roles: true },
    orderBy: { email: "asc" },
  });
}

export default async function SignInPage({ searchParams }: PageProps<"/entrar">) {
  if (await getCurrentUser()) redirect("/conta");
  // `erro` vem das nossas ações; `error` vem dos redirects do próprio Auth.js (ex.: link expirado).
  const { erro, error } = await searchParams;
  const code = typeof erro === "string" ? erro : typeof error === "string" ? error : null;
  const t = await getTranslations("login");
  const tr = await getTranslations("roles");
  const errorKey = code ? (KNOWN_ERRORS.find((k) => k === code) ?? "default") : null;
  const users = await devUsers();

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      {errorKey && (
        <p role="alert" className="rounded-lg border border-red-600 px-4 py-3 text-red-700 dark:text-red-300">
          {t(`errors.${errorKey}`)}
        </p>
      )}

      <form action={signInWithEmail} className="space-y-3 rounded-lg border border-border bg-surface p-4">
        <p className="text-sm text-muted">{t("intro")}</p>
        <label htmlFor="email" className="block font-medium">{t("emailLabel")}</label>
        <input id="email" name="email" type="email" required autoComplete="email" maxLength={254}
          placeholder={`nome@${config.ALLOWED_EMAIL_DOMAINS[0] ?? "example.test"}`}
          className="w-full rounded border border-border bg-background px-3 py-2" />
        <button type="submit" className="w-full rounded bg-accent px-4 py-2 font-medium text-accent-foreground">
          {t("submit")}
        </button>
      </form>

      {oidcEnabled && (
        <form action={signInWithOidc}>
          <p className="mb-2 text-center text-sm text-muted">{t("or")}</p>
          <button type="submit" className="w-full rounded border border-border px-4 py-2 font-medium">
            {t("oidc", { name: config.OIDC_NAME })}
          </button>
        </form>
      )}

      {users.length > 0 && (
        <section aria-labelledby="dev-login" className="space-y-2 rounded-lg border border-dashed border-amber-500 p-4">
          <h2 id="dev-login" className="font-semibold">{t("devTitle")}</h2>
          {users.map((u) => (
            <form key={u.id} action={signInAsDevUser}>
              <input type="hidden" name="email" value={u.email!} />
              <button type="submit" className="w-full rounded border border-border px-3 py-2 text-left text-sm hover:bg-border/40">
                {t("devAs", { name: u.name ?? u.email!, roles: u.roles.map((r) => tr(r.role)).join(", ") })}
              </button>
            </form>
          ))}
        </section>
      )}
    </div>
  );
}
