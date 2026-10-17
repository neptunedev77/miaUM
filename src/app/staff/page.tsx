import { getTranslations } from "next-intl/server";
import { prisma } from "@/server/db";
import { requireRole } from "@/server/session";

export default async function StaffPage() {
  const user = await requireRole("STAFF");
  const t = await getTranslations("staff");
  const points = await prisma.dropOffPoint.findMany({
    where: { staff: { some: { userId: user.id } } },
    include: { campus: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <h2 className="text-lg font-semibold">{t("points")}</h2>
      {points.length === 0 ? (
        <p className="text-muted">{t("noPoints")}</p>
      ) : (
        <ul className="space-y-2">
          {points.map((p) => (
            <li key={p.id} className="rounded-lg border border-border bg-surface px-4 py-3">
              <span className="font-medium">{p.name}</span>
              <span className="block text-sm text-muted">{p.campus.namePt}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
