import "server-only";
import nodemailer from "nodemailer";
import { config } from "./config";

const transport = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: config.SMTP_SECURE,
  auth: config.SMTP_USER ? { user: config.SMTP_USER, pass: config.SMTP_PASSWORD } : undefined,
});

export type Mail = { to: string; subject: string; text: string; html: string };

/**
 * Envio direto. Usado apenas para links de login (têm de chegar de imediato).
 * Todos os outros emails passam pelo EmailOutbox (Fase 3).
 */
export async function sendMailNow(mail: Mail) {
  await transport.sendMail({ from: config.EMAIL_FROM, ...mail });
}
