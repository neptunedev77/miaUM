import { getLocale, getTranslations } from "next-intl/server";
import { Globe, Mail, ShieldCheck, UserRound } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Page, PageHeader } from "@/components/ui/page";
import { displayName } from "@/domain/email";
import { requireUser } from "@/server/session";

export default async function AccountPage() {
  const user = await requireUser();
  const [t, tr, locale] = await Promise.all([getTranslations("account"), getTranslations("roles"), getLocale()]);
  const name = displayName(user.name, user.email);

  const rows = [
    { icon: UserRound, label: t("name"), value: user.name ?? t("noName") },
    { icon: Mail, label: t("email"), value: user.email },
    { icon: Globe, label: t("language"), value: locale === "en" ? "English" : "Português" },
  ];

  return (
    <Page className="mx-auto max-w-2xl">
      <PageHeader title={t("title")} description={t("description")} />

      <Card className="animate-fade-up overflow-hidden">
        <div className="bg-hero flex items-center gap-4 border-b border-border p-6">
          <Avatar name={name} size="xl" />
          <div className="min-w-0">
            <p className="truncate font-display text-xl font-semibold">{name}</p>
            <p className="truncate text-sm text-muted">{user.email}</p>
          </div>
        </div>
        <dl className="divide-y divide-border">
          {rows.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-4 px-6 py-4">
              <Icon aria-hidden className="size-4 shrink-0 text-muted" />
              <dt className="w-24 shrink-0 text-sm text-muted">{label}</dt>
              <dd className="min-w-0 truncate font-medium">{value}</dd>
            </div>
          ))}
          <div className="flex items-center gap-4 px-6 py-4">
            <ShieldCheck aria-hidden className="size-4 shrink-0 text-muted" />
            <dt className="w-24 shrink-0 text-sm text-muted">{t("roles")}</dt>
            <dd data-testid="roles" className="flex flex-wrap gap-1.5">
              {user.roles.map((r) => (
                <Badge key={r} tone={r === "ADMIN" ? "primary" : r === "STAFF" ? "success" : "neutral"}>{tr(r)}</Badge>
              ))}
            </dd>
          </div>
        </dl>
      </Card>
    </Page>
  );
}
