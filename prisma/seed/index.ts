// Seed idempotente: pode correr várias vezes sem duplicar dados.
import "dotenv/config";
import { createPrismaClient } from "../../src/server/db";
import { campi, places } from "./locations";
import { categories } from "./categories";
import { devUsers } from "./users";

const prisma = createPrismaClient();

async function seedLocations() {
  for (const [order, c] of campi.entries()) {
    await prisma.campus.upsert({
      where: { slug: c.slug },
      update: { namePt: c.namePt, nameEn: c.nameEn, city: c.city, isMainCampus: c.isMainCampus, order },
      create: { slug: c.slug, namePt: c.namePt, nameEn: c.nameEn, city: c.city, isMainCampus: c.isMainCampus, order },
    });
  }
  const campusIds = new Map((await prisma.campus.findMany()).map((c) => [c.slug, c.id]));

  // 1.ª passagem: locais; 2.ª passagem: ligações ao local-pai.
  for (const p of places) {
    const campusId = campusIds.get(p.campus);
    if (!campusId) throw new Error(`Campus desconhecido: ${p.campus} (${p.code})`);
    const data = {
      campusId,
      number: p.number ?? null,
      namePt: p.namePt,
      nameEn: p.nameEn,
      occupants: p.occupants ?? [],
      aliases: p.aliases ?? [],
      status: p.status === "confirmado" ? ("CONFIRMED" as const) : ("PROVISIONAL" as const),
      source: p.source === "—" ? null : p.source,
    };
    await prisma.location.upsert({ where: { code: p.code }, update: data, create: { code: p.code, ...data } });
  }
  for (const p of places.filter((p) => p.parent)) {
    const parent = await prisma.location.findUniqueOrThrow({ where: { code: p.parent! } });
    await prisma.location.update({ where: { code: p.code }, data: { parentId: parent.id } });
  }
  return campusIds;
}

async function seedCategories() {
  for (const [order, c] of categories.entries()) {
    const data = { namePt: c.namePt, nameEn: c.nameEn, allowPhotos: c.allowPhotos ?? true, order };
    const cat = await prisma.category.upsert({ where: { slug: c.slug }, update: data, create: { slug: c.slug, ...data } });
    for (const [subOrder, s] of c.subs.entries()) {
      const subData = { namePt: s.namePt, nameEn: s.nameEn, order: subOrder };
      await prisma.subcategory.upsert({
        where: { categoryId_slug: { categoryId: cat.id, slug: s.slug } },
        update: subData,
        create: { categoryId: cat.id, slug: s.slug, ...subData },
      });
    }
  }
}

// PROVISÓRIO — confirmar com a UMinho. Pontos de exemplo, não são pontos oficiais.
const EXAMPLE_HOURS = {
  mon: [["09:00", "12:30"], ["14:00", "17:30"]],
  tue: [["09:00", "12:30"], ["14:00", "17:30"]],
  wed: [["09:00", "12:30"], ["14:00", "17:30"]],
  thu: [["09:00", "12:30"], ["14:00", "17:30"]],
  fri: [["09:00", "12:30"], ["14:00", "17:30"]],
  sat: [],
  sun: [],
};

const examplePoints = [
  { name: "Ponto de exemplo — Gualtar (PROVISÓRIO)", campus: "gualtar", location: "G-04" },
  { name: "Ponto de exemplo — Azurém (PROVISÓRIO)", campus: "azurem", location: "A-13" },
  { name: "Ponto de exemplo — Couros (PROVISÓRIO)", campus: "couros", location: "C-01" },
];

async function seedDropOffPoints(campusIds: Map<string, string>) {
  for (const p of examplePoints) {
    if (await prisma.dropOffPoint.findFirst({ where: { name: p.name } })) continue;
    const location = await prisma.location.findUnique({ where: { code: p.location } });
    await prisma.dropOffPoint.create({
      data: {
        name: p.name,
        campusId: campusIds.get(p.campus)!,
        locationId: location?.id,
        directionsPt: "Dados de exemplo. Substituir pela descrição oficial.",
        directionsEn: "Example data. Replace with the official directions.",
        hours: EXAMPLE_HOURS,
        hoursNote: "Horário de exemplo (PROVISÓRIO).",
        isPlaceholder: true,
      },
    });
  }
}

// Utilizadores de teste (emails inventados em example.test). Só em desenvolvimento.
async function seedDevUsers() {
  const gualtarPoint = await prisma.dropOffPoint.findFirstOrThrow({ where: { name: examplePoints[0].name } });
  for (const u of devUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name },
      create: { email: u.email, name: u.name, emailVerified: new Date() },
    });
    for (const role of u.roles) {
      await prisma.userRole.upsert({
        where: { userId_role: { userId: user.id, role } },
        update: {},
        create: { userId: user.id, role },
      });
    }
    if (u.roles.includes("STAFF")) {
      await prisma.staffAssignment.upsert({
        where: { userId_dropOffPointId: { userId: user.id, dropOffPointId: gualtarPoint.id } },
        update: {},
        create: { userId: user.id, dropOffPointId: gualtarPoint.id },
      });
    }
  }
}

async function main() {
  const campusIds = await seedLocations();
  await seedCategories();
  await seedDropOffPoints(campusIds);
  if (process.env.NODE_ENV !== "production") await seedDevUsers();

  const [campus, locations, cats, points, users] = await Promise.all([
    prisma.campus.count(), prisma.location.count(), prisma.category.count(),
    prisma.dropOffPoint.count(), prisma.user.count(),
  ]);
  console.log(`Seed concluído: ${campus} campi, ${locations} locais, ${cats} categorias, ${points} pontos, ${users} utilizadores.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
