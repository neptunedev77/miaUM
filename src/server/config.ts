import "server-only";
import { z } from "zod";

// Configuração lida das variáveis de ambiente (12-factor). Valores por omissão = SPEC.
const csv = z
  .string()
  .default("")
  .transform((s) => s.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean));

const bool = z
  .string()
  .default("false")
  .transform((s) => s === "true" || s === "1");

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  ALLOWED_EMAIL_DOMAINS: csv,
  BOOTSTRAP_ADMIN_EMAIL: z.string().default("").transform((s) => s.trim().toLowerCase()),
  DEV_LOGIN: bool,
  OIDC_ISSUER: z.string().default(""),
  OIDC_CLIENT_ID: z.string().default(""),
  OIDC_CLIENT_SECRET: z.string().default(""),
  OIDC_NAME: z.string().default("SSO"),
  SMTP_HOST: z.string().default("localhost"),
  SMTP_PORT: z.coerce.number().int().default(1025),
  SMTP_SECURE: bool,
  SMTP_USER: z.string().default(""),
  SMTP_PASSWORD: z.string().default(""),
  EMAIL_FROM: z.string().default("miaUM <no-reply@example.test>"),
  MAGIC_LINKS_MAX_PER_HOUR: z.coerce.number().int().positive().default(5),
  REPORT_TTL_DAYS: z.coerce.number().int().positive().default(30),
  REPORTS_MAX_PER_DAY: z.coerce.number().int().positive().default(10),
  CLAIM_REVERT_DAYS: z.coerce.number().int().positive().default(5),
  CLAIMS_MAX_ACTIVE: z.coerce.number().int().positive().default(1),
  CLAIMS_MAX_PER_WINDOW: z.coerce.number().int().positive().default(3),
  CLAIMS_WINDOW_DAYS: z.coerce.number().int().positive().default(7),
});

export const config = schema.parse(process.env);

export const devLoginEnabled = config.NODE_ENV === "development" && config.DEV_LOGIN;
export const oidcEnabled = Boolean(config.OIDC_ISSUER && config.OIDC_CLIENT_ID && config.OIDC_CLIENT_SECRET);
