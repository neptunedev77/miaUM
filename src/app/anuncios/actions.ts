"use server";

import { redirect } from "next/navigation";
import { fieldErrors, foundReportSchema, lostReportSchema } from "@/domain/report";
import { createFoundReport, createLostReport, ReportError } from "@/server/reports";
import { requireNamedUser } from "@/server/session";

export type ReportFormState = { errors?: Record<string, string> } | undefined;

function formObject(formData: FormData) {
  const out: Record<string, string> = {};
  for (const [k, v] of formData.entries()) if (typeof v === "string") out[k] = v;
  return out;
}

async function run(create: () => Promise<{ id: string }>): Promise<ReportFormState> {
  let id: string;
  try {
    ({ id } = await create());
  } catch (error) {
    if (error instanceof ReportError) return { errors: { _form: error.code } };
    throw error;
  }
  redirect(`/anuncios/${id}?novo=1`);
}

export async function createLostAction(_prev: ReportFormState, formData: FormData): Promise<ReportFormState> {
  const user = await requireNamedUser("/perdi");
  const parsed = lostReportSchema().safeParse(formObject(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  return run(() => createLostReport(user.id, parsed.data));
}

export async function createFoundAction(_prev: ReportFormState, formData: FormData): Promise<ReportFormState> {
  const user = await requireNamedUser("/encontrei");
  const parsed = foundReportSchema().safeParse(formObject(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  return run(() => createFoundReport(user.id, parsed.data));
}
