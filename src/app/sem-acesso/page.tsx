import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function ForbiddenPage() {
  const t = await getTranslations("errors");
  const tc = await getTranslations("common");
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">{t("forbiddenTitle")}</h1>
      <p className="text-muted">{t("forbiddenText")}</p>
      <Link href="/" className="text-accent underline">{tc("backHome")}</Link>
    </div>
  );
}
