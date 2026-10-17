import "server-only";
import NextAuth, { type DefaultSession } from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./db";
import { config, devLoginEnabled, oidcEnabled } from "./config";
import { sendMailNow } from "./mail";
import { consumeRateLimit, hashedKey } from "./rate-limit";
import { isAllowedEmail, normalizeEmail } from "@/domain/email";
import { magicLinkEmail } from "./emails/magic-link";

declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

const MAGIC_LINK_MAX_AGE_SECONDS = 15 * 60;

const providers: Provider[] = [
  // Link mágico por email: login principal, funciona com qualquer email institucional.
  {
    id: "email",
    type: "email",
    name: "Email",
    maxAge: MAGIC_LINK_MAX_AGE_SECONDS,
    normalizeIdentifier: normalizeEmail,
    async sendVerificationRequest({ identifier, url }) {
      const user = await prisma.user.findUnique({ where: { email: identifier }, select: { locale: true } });
      await sendMailNow({ to: identifier, ...magicLinkEmail(url, user?.locale === "en" ? "en" : "pt") });
    },
  },
];

if (oidcEnabled) {
  // OIDC genérico (ex.: SSO da UMinho). Só guardamos o primeiro nome e o email (RGPD).
  providers.push({
    id: "oidc",
    name: config.OIDC_NAME,
    type: "oidc",
    issuer: config.OIDC_ISSUER,
    clientId: config.OIDC_CLIENT_ID,
    clientSecret: config.OIDC_CLIENT_SECRET,
    // O fornecedor institucional verifica o email; permite ligar à conta criada por link mágico.
    allowDangerousEmailAccountLinking: true,
    profile(profile) {
      const given = typeof profile.given_name === "string" ? profile.given_name : undefined;
      const full = typeof profile.name === "string" ? profile.name : undefined;
      return {
        id: String(profile.sub),
        email: normalizeEmail(String(profile.email ?? "")),
        name: (given ?? full)?.trim().split(/\s+/)[0] ?? null,
      };
    },
  });
}

if (devLoginEnabled) {
  // Login rápido com os utilizadores de teste do seed. Nunca ativo fora de NODE_ENV=development.
  providers.push(
    Credentials({
      id: "dev",
      name: "Desenvolvimento",
      credentials: { email: {} },
      async authorize(credentials) {
        if (!devLoginEnabled) return null;
        const email = normalizeEmail(String(credentials?.email ?? ""));
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.deletedAt) return null;
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  );
}

/** Garante o perfil USER e, para o BOOTSTRAP_ADMIN_EMAIL, o perfil ADMIN. */
async function ensureBaseRoles(userId: string, email: string | null | undefined) {
  const roles: ("USER" | "ADMIN")[] = ["USER"];
  if (email && config.BOOTSTRAP_ADMIN_EMAIL && normalizeEmail(email) === config.BOOTSTRAP_ADMIN_EMAIL) {
    roles.push("ADMIN");
  }
  await prisma.userRole.createMany({ data: roles.map((role) => ({ userId, role })), skipDuplicates: true });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // JWT para suportar o login de desenvolvimento (Credentials). Os perfis e o estado da conta
  // são sempre relidos da BD em src/server/session.ts, por isso uma conta apagada perde o acesso.
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  providers,
  pages: { signIn: "/entrar", verifyRequest: "/entrar/verifica", error: "/entrar" },
  callbacks: {
    async signIn({ user, email }) {
      const address = user.email ? normalizeEmail(user.email) : "";
      if (!isAllowedEmail(address, config.ALLOWED_EMAIL_DOMAINS)) return false;
      if (email?.verificationRequest) {
        const ok = await consumeRateLimit(hashedKey("magic", address), config.MAGIC_LINKS_MAX_PER_HOUR, 60 * 60 * 1000);
        if (!ok) return "/entrar?erro=limite";
      }
      return true;
    },
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (user.id) await ensureBaseRoles(user.id, user.email);
    },
  },
});
