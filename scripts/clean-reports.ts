// Apaga todos os anúncios de teste (e o que depende deles) e as fotografias carregadas.
// Mantém utilizadores, localizações, categorias e pontos de entrega.
// Uso: npm run db:clean
import "dotenv/config";
import { rm } from "node:fs/promises";
import { createPrismaClient } from "../src/server/db";

if (process.env.NODE_ENV === "production") {
  console.error("Recusado: este comando só pode ser usado em desenvolvimento.");
  process.exit(1);
}

const prisma = createPrismaClient();

async function main() {
  // Apagar os anúncios apaga em cascata fotografias, reclamações, conversas, sugestões e notificações.
  const reports = await prisma.report.deleteMany();
  const orphanPhotos = await prisma.photo.deleteMany(); // fotografias carregadas mas nunca publicadas
  const limits = await prisma.rateLimitHit.deleteMany(); // limites diários (para poderes voltar a testar)
  await rm(process.env.UPLOADS_DIR || "./uploads", { recursive: true, force: true });
  console.log(`Apagados: ${reports.count} anúncios, ${orphanPhotos.count} fotografias por publicar, ${limits.count} registos de limites, e a pasta de uploads.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
