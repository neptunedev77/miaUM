// Prepara o ambiente de desenvolvimento num clone limpo (Windows, macOS ou Linux).
// Uso: npm run setup
import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

function run(cmd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

if (!existsSync(".env")) {
  const env = readFileSync(".env.example", "utf8")
    .replace(/^AUTH_SECRET=.*$/m, `AUTH_SECRET="${randomBytes(32).toString("base64")}"`)
    .replace(/^CRON_SECRET=.*$/m, `CRON_SECRET="${randomBytes(24).toString("hex")}"`);
  writeFileSync(".env", env);
  console.log("Criado .env a partir de .env.example (com segredos aleatórios).");
}

run("docker compose -f infra/compose.yml up -d --wait");
run("npx prisma migrate deploy");
run("npx prisma generate");
run("npx prisma db seed");

console.log(`
Pronto. Agora corre:  npm run dev
  App:      http://localhost:3000
  Mailpit:  http://localhost:8025  (emails de login)
`);
