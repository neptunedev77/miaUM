"use server";

import { redirect } from "next/navigation";
import { InvalidTransitionError } from "@/domain/report-state";
import { ClaimError, claimReport, closeOwnClaim, finderAction, markRecovered } from "@/server/claims";
import { requireNamedUser, requireUser } from "@/server/session";

const ID_RE = /^[a-z0-9]{10,40}$/i;
const idFrom = (formData: FormData, key: string) => {
  const v = formData.get(key);
  return typeof v === "string" && ID_RE.test(v) ? v : null;
};

/** Converte erros conhecidos num código para mostrar ao utilizador; os restantes sobem. */
function errorCode(error: unknown): string {
  if (error instanceof ClaimError) return error.code;
  if (error instanceof InvalidTransitionError) return "notAllowed";
  throw error;
}

export type ClaimFormState = { error?: string } | undefined;

/** "É meu" (depois de aceitar os termos no modal). */
export async function claimAction(_prev: ClaimFormState, formData: FormData): Promise<ClaimFormState> {
  const reportId = idFrom(formData, "reportId");
  if (!reportId) return { error: "notAvailable" };
  const user = await requireNamedUser(`/anuncios/${reportId}`);
  try {
    await claimReport(user.id, reportId, formData.get("terms") === "on");
  } catch (error) {
    return { error: errorCode(error) };
  }
  redirect(`/anuncios/${reportId}?reservado=1`);
}

/** Reclamante: "Recebi o objeto" / "Afinal não era meu". */
export async function closeClaimAction(formData: FormData) {
  const user = await requireUser();
  const claimId = idFrom(formData, "claimId");
  const action = formData.get("action") === "received" ? "received" : "withdrew";
  if (!claimId) redirect("/meus-anuncios?separador=pedidos");
  let reportId: string;
  try {
    reportId = await closeOwnClaim(user.id, claimId, action);
  } catch (error) {
    redirect(`/meus-anuncios?separador=pedidos&erro=${errorCode(error)}`);
  }
  redirect(action === "received" ? `/anuncios/${reportId}?concluido=1` : "/meus-anuncios?separador=pedidos&desistiu=1");
}

/** Quem encontrou: "Devolvido" / "Não era dele". */
export async function finderActionForm(formData: FormData) {
  const user = await requireUser();
  const reportId = idFrom(formData, "reportId");
  if (!reportId) redirect("/meus-anuncios?separador=encontrados");
  const action = formData.get("action") === "returned" ? "returned" : "rejected";
  try {
    await finderAction(user.id, reportId, action);
  } catch (error) {
    redirect(`/anuncios/${reportId}?erro=${errorCode(error)}`);
  }
  redirect(`/anuncios/${reportId}?${action === "returned" ? "encerrado" : "reaberto"}=1`);
}

/** Quem perdeu: "Já recuperei". */
export async function recoveredAction(formData: FormData) {
  const user = await requireUser();
  const reportId = idFrom(formData, "reportId");
  if (!reportId) redirect("/meus-anuncios");
  try {
    await markRecovered(user.id, reportId);
  } catch (error) {
    redirect(`/anuncios/${reportId}?erro=${errorCode(error)}`);
  }
  redirect(`/anuncios/${reportId}?recuperado=1`);
}
