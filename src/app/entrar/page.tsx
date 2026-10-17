import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ChevronRight, KeyRound, Mail } from "lucide-react";
import { signInAsDevUser, signInWithEmail, signInWithOidc } from "@/app/actions";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Page } from "@/components/ui/page";
import { SubmitButton } from "@/components/ui/submit-button";
import { LogoMark } from "@/components/logo";
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
    <Page className="mx-auto max-w-md">
      <div className="animate-fade-up space-y-3 text-center">
        <LogoMark className="mx-auto size-12" />
        <h1 className="font-display text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted">{t("intro")}</p>
      </div>

      {errorKey && <Alert tone="danger">{t(`errors.${errorKey}`)}</Alert>}

      <Card className="animate-fade-up p-6">
        <form action={signInWithEmail} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium">{t("emailLabel")}</label>
            <div className="relative">
              <Mail aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
              <input id="email" name="email" type="email" required autoComplete="email" maxLength={254}
                placeholder={`nome@${config.ALLOWED_EMAIL_DOMAINS[0] ?? "example.test"}`}
                className="h-12 w-full rounded-xl border border-border-strong bg-background pr-4 pl-10 transition-[border-color,box-shadow] duration-200 placeholder:text-muted/70 focus:border-primary focus:ring-4 focus:ring-primary/15 focus:outline-none" />
            </div>
          </div>
          <SubmitButton size="lg" className="w-full">{t("submit")}</SubmitButton>
        </form>

        {oidcEnabled && (
          <form action={signInWithOidc} className="mt-4 space-y-4">
            <div className="flex items-center gap-3 text-xs text-muted uppercase">
              <span className="h-px flex-1 bg-border" />{t("or")}<span className="h-px flex-1 bg-border" />
            </div>
            <SubmitButton variant="outline" size="lg" className="w-full">
              <KeyRound aria-hidden className="size-4" /> {t("oidc", { name: config.OIDC_NAME })}
            </SubmitButton>
          </form>
        )}
      </Card>

      {users.length > 0 && (
        <section aria-labelledby="dev-login" className="animate-fade-up space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="dev-login" className="text-sm font-semibold">{t("devTitle")}</h2>
            <Badge tone="accent">{t("devBadge")}</Badge>
          </div>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface shadow-soft">
            {users.map((u) => {
              const name = u.name ?? u.email!;
              return (
                <li key={u.id}>
                  <form action={signInAsDevUser}>
                    <input type="hidden" name="email" value={u.email!} />
                    <button type="submit" aria-label={t("devAs", { name })}
                      className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-muted">
                      <Avatar name={name} size="md" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{name}</span>
                        <span className="block truncate text-xs text-muted">{u.email}</span>
                      </span>
                      <span className="hidden gap-1 sm:flex">
                        {u.roles.filter((r) => r.role !== "USER").map((r) => (
                          <Badge key={r.role} tone={r.role === "ADMIN" ? "primary" : "success"}>{tr(r.role)}</Badge>
                        ))}
                      </span>
                      <ChevronRight aria-hidden className="size-4 text-muted transition-transform duration-200 group-hover:translate-x-0.5" />
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </Page>
  );
}
