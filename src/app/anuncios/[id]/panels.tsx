import { useFormatter, useTranslations } from "next-intl";
import { CircleCheck, Clock, IdCard, Lock, LogIn, Mail, MapPin, Phone, ShieldCheck, Sparkles, Undo2 } from "lucide-react";
import { closeClaimAction, finderActionForm, recoveredAction } from "@/app/anuncios/claim-actions";
import { ClaimDialog } from "@/components/claim-dialog";
import { ConfirmAction } from "@/components/confirm-action";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import type { getReportForViewer } from "@/server/reports";

type Data = NonNullable<Awaited<ReturnType<typeof getReportForViewer>>>;

function Box({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1.5 rounded-xl bg-surface-muted p-3 text-sm">{children}</div>;
}

/** Local de entrega ou contactos (para o autor e para quem reclamou). */
function WhereToCollect({ dropOffText, directions, contact }: {
  dropOffText: string | null;
  directions: string | null;
  contact: { email: string | null; extra: string | null } | null;
}) {
  const t = useTranslations("report");
  return (
    <>
      {dropOffText && (
        <Box>
          <p className="text-xs text-muted">{t("handedInAt")}</p>
          <p className="flex items-center gap-1.5 font-medium"><ShieldCheck aria-hidden className="size-4 shrink-0" /> {dropOffText}</p>
          {directions && <p className="text-muted">{directions}</p>}
        </Box>
      )}
      {contact && (
        <Box>
          <p className="text-xs text-muted">{t("contactLabel")}</p>
          {contact.email && (
            <a href={`mailto:${contact.email}`} className="flex items-center gap-2 font-medium text-primary-ink underline-offset-2 hover:underline">
              <Mail aria-hidden className="size-4 shrink-0" /> <span className="break-all">{contact.email}</span>
            </a>
          )}
          {contact.extra && <p className="flex items-center gap-2"><Phone aria-hidden className="size-4 shrink-0" /> {contact.extra}</p>}
        </Box>
      )}
    </>
  );
}

/** Painel do autor do anúncio: estado, dados privados e ações. */
export function OwnerPanel({ data }: { data: Data }) {
  const t = useTranslations("report");
  const tc = useTranslations("claim");
  const format = useFormatter();
  const { report: r, owner } = data;
  if (!owner) return null;
  const lost = r.type === "LOST";
  const date = (d: Date) => format.dateTime(d, { dateStyle: "medium", timeStyle: "short" });

  return (
    <Card className="animate-fade-up space-y-4 p-5">
      <div className="flex items-center gap-2">
        <Sparkles aria-hidden className="size-4 text-primary-ink" />
        <h2 className="font-semibold">{t("yours")}</h2>
      </div>

      {owner.status === "CLAIMED" && owner.activeClaim && (
        <div className="space-y-1 rounded-xl border border-accent/40 bg-accent-soft p-3 text-sm text-notice-foreground">
          <p className="font-medium">{tc("reservedBy", { name: owner.activeClaim.claimantName ?? "?" })}</p>
          <p>{tc("reservedSince", { date: date(owner.activeClaim.createdAt) })}</p>
          <p>{tc("reservedUntil", { date: date(owner.activeClaim.deadline) })}</p>
        </div>
      )}
      {(owner.status === "RETURNED" || owner.status === "RECOVERED") && (
        <p className="flex items-center gap-2 rounded-xl bg-success-soft p-3 text-sm font-medium text-success">
          <CircleCheck aria-hidden className="size-4" /> {tc(owner.status === "RETURNED" ? "resolvedReturned" : "resolvedRecovered")}
        </p>
      )}
      {(owner.status === "OPEN" || owner.status === "PUBLISHED") && (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Clock aria-hidden className="size-4 shrink-0" /> {t("expiresOn", { date: format.dateTime(owner.expiresAt, { dateStyle: "long" }) })}
        </p>
      )}

      {owner.contact && <p className="text-xs text-muted">{t("finderKeeps")}</p>}
      <WhereToCollect dropOffText={owner.dropOffText} directions={owner.point?.directions ?? null} contact={owner.contact} />

      {owner.privateDetails && (
        <div className="text-sm">
          <p className="flex items-center gap-1.5 text-xs text-muted"><Lock aria-hidden className="size-3.5" /> {t("privateDetails")}</p>
          <p className="mt-1">{owner.privateDetails}</p>
        </div>
      )}

      {/* Ações */}
      {lost && owner.status === "OPEN" && (
        <ConfirmAction action={recoveredAction} fields={{ reportId: r.id }} variant="primary" className="w-full"
          icon={<CircleCheck aria-hidden className="size-4" />} label={tc("recovered")}
          title={tc("recoveredTitle")} text={tc("recoveredText")} confirmLabel={tc("recovered")} />
      )}
      {!lost && owner.status === "PUBLISHED" && (
        <ConfirmAction action={finderActionForm} fields={{ reportId: r.id, action: "returned" }} className="w-full"
          icon={<CircleCheck aria-hidden className="size-4" />} label={tc("closeReturned")}
          title={tc("closeReturnedTitle")} text={tc("closeReturnedText")} confirmLabel={tc("closeReturned")} />
      )}
      {!lost && owner.status === "CLAIMED" && (
        r.custody?.kind === "FINDER" ? (
          <div className="grid gap-2">
            <ConfirmAction action={finderActionForm} fields={{ reportId: r.id, action: "returned" }} variant="primary"
              icon={<CircleCheck aria-hidden className="size-4" />} label={tc("finderReturned")}
              title={tc("finderReturnedTitle")} text={tc("finderReturnedText")} confirmLabel={tc("finderReturned")} />
            <ConfirmAction action={finderActionForm} fields={{ reportId: r.id, action: "rejected" }} variant="ghost"
              icon={<Undo2 aria-hidden className="size-4" />} label={tc("finderRejected")}
              title={tc("finderRejectedTitle")} text={tc("finderRejectedText")} confirmLabel={tc("finderRejected")} />
          </div>
        ) : (
          <p className="text-xs text-muted">{tc("pointNoAction")}</p>
        )
      )}
    </Card>
  );
}

/** Painel de quem reclamou: onde ir buscar o objeto e como fechar o processo. */
export function ClaimantPanel({ data }: { data: Data }) {
  const tc = useTranslations("claim");
  const format = useFormatter();
  const claim = data.claim;
  if (!claim) return null;

  if (claim.status === "COMPLETED") {
    return (
      <Card className="animate-fade-up space-y-2 p-5">
        <p className="flex items-center gap-2 font-semibold text-success"><CircleCheck aria-hidden className="size-5" /> {tc("completedTitle")}</p>
        <p className="text-sm text-muted">{tc("completedText")}</p>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-up space-y-4 border-primary/30 p-5">
      <div className="space-y-1">
        <h2 className="font-semibold">{tc("reservedTitle")}</h2>
        <p className="text-sm text-muted">{tc(claim.contact ? "reservedTextFinder" : "reservedTextPoint")}</p>
      </div>
      <WhereToCollect dropOffText={claim.dropOffText} directions={claim.directions} contact={claim.contact} />
      <p className="flex items-start gap-2 rounded-xl bg-primary-soft/60 p-3 text-sm">
        <IdCard aria-hidden className="mt-0.5 size-4 shrink-0 text-primary-ink" /> {tc("bringId")}
      </p>
      <p className="flex items-center gap-2 text-xs text-muted">
        <Clock aria-hidden className="size-3.5 shrink-0" /> {tc("deadline", { date: format.dateTime(claim.deadline, { dateStyle: "medium", timeStyle: "short" }) })}
      </p>
      <div className="grid gap-2">
        <form action={closeClaimAction}>
          <input type="hidden" name="claimId" value={claim.id} />
          <input type="hidden" name="action" value="received" />
          <SubmitButton className="w-full"><CircleCheck aria-hidden className="size-4" /> {tc("received")}</SubmitButton>
        </form>
        <ConfirmAction action={closeClaimAction} fields={{ claimId: claim.id, action: "withdrew" }} variant="ghost"
          icon={<Undo2 aria-hidden className="size-4" />} label={tc("withdrew")}
          title={tc("withdrewTitle")} text={tc("withdrewText")} confirmLabel={tc("withdrew")} />
      </div>
    </Card>
  );
}

/** Painel para quem ainda não reclamou: "É meu" (encontrados) ou "Encontrei algo parecido" (perdidos). */
export function VisitorPanel({ data, signedIn, revertDays, similarHref }: { data: Data; signedIn: boolean; revertDays: number; similarHref: string }) {
  const t = useTranslations("report");
  const tc = useTranslations("claim");
  const r = data.report;

  if (r.type === "LOST") {
    return (
      <Card className="animate-fade-up space-y-3 p-5">
        <h2 className="font-semibold">{t("sawItTitle")}</h2>
        <p className="text-sm text-muted">{t("sawItText")}</p>
        <ButtonLink href={similarHref} className="w-full">{t("foundSimilar")}</ButtonLink>
      </Card>
    );
  }
  if (!data.canClaim) return null;
  return (
    <Card className="animate-fade-up space-y-3 p-5">
      <h2 className="font-semibold">{t("isItYoursTitle")}</h2>
      <p className="text-sm text-muted">{t("isItYoursText")}</p>
      {signedIn ? (
        <ClaimDialog reportId={r.id} revertDays={revertDays} />
      ) : (
        <ButtonLink href={`/entrar?next=${encodeURIComponent(`/anuncios/${r.id}`)}`} size="lg" className="w-full">
          <LogIn aria-hidden className="size-4" /> {tc("signInToClaim")}
        </ButtonLink>
      )}
      <p className="flex items-start gap-1.5 text-xs text-muted"><MapPin aria-hidden className="mt-0.5 size-3.5 shrink-0" /> {tc("whatHappens")}</p>
    </Card>
  );
}
