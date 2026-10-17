import { getTranslations } from "next-intl/server";
import { prisma } from "@/server/db";
import { requireRole } from "@/server/session";

export default async function AdminPage() {
  await requireRole("ADMIN");
  const t = await getTranslations("admin");
  const [campi, locations, categories, points, users] = await Promise.all([
    prisma.campus.count(),
    prisma.location.count(),
    prisma.category.count(),
    prisma.dropOffPoint.count(),
    prisma.user.count({ where: { deletedAt: null } }),
  ]);
  const stats = [
    [t("campi"), campi],
    [t("locations"), locations],
    [t("categories"), categories],
    [t("points"), points],
    [t("users"), users],
  ] as const;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <h2 className="text-lg font-semibold">{t("stats")}</h2>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-border bg-surface p-3">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="text-2xl font-bold">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
