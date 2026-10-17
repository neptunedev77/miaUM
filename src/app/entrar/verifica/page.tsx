import { getTranslations } from "next-intl/server";

export default async function CheckEmailPage() {
  const t = await getTranslations("login");
  return (
    <div className="mx-auto max-w-md space-y-3">
      <h1 className="text-2xl font-bold">{t("checkTitle")}</h1>
      <p className="text-muted">{t("checkText")}</p>
    </div>
  );
}
