import { getTranslations } from "next-intl/server";
import { requireUser } from "@/server/session";

export default async function AccountPage() {
  const user = await requireUser();
  const t = await getTranslations("account");
  const tr = await getTranslations("roles");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded-lg border border-border bg-surface p-4">
        <dt className="font-medium">{t("name")}</dt>
        <dd>{user.name ?? t("noName")}</dd>
        <dt className="font-medium">{t("email")}</dt>
        <dd className="break-all">{user.email}</dd>
        <dt className="font-medium">{t("roles")}</dt>
        <dd data-testid="roles">{user.roles.map((r) => tr(r)).join(", ")}</dd>
      </dl>
    </div>
  );
}
