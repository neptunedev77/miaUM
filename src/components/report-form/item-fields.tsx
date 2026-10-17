"use client";

import { useTranslations } from "next-intl";
import { Camera, MapPin, Tag } from "lucide-react";
import type { FormOptions } from "@/server/reports";
import { COLORS, LIMITS, UNKNOWN_CAMPUS } from "@/domain/report";
import { CategoryIcon } from "@/components/category-icon";
import { CharCount, Field, Select, Textarea, TextInput } from "@/components/ui/field";
import { ChoiceGroup, FormSection } from "./choices";
import { PhotoPicker } from "@/components/photos/photo-picker";

export type Values = Record<string, string>;
export type SetValue = (name: string, value: string) => void;

const SWATCHES: Record<string, string> = {
  BLACK: "#1c1c1c", WHITE: "#ffffff", GREY: "#9a9a9a", BLUE: "#2563eb", RED: "#dc2626", GREEN: "#16a34a",
  YELLOW: "#facc15", ORANGE: "#f97316", PINK: "#f472b6", PURPLE: "#9333ea", BROWN: "#8b5a2b", BEIGE: "#e8d8b8",
  SILVER: "linear-gradient(135deg,#f1f1f1,#a8a8a8)", GOLD: "linear-gradient(135deg,#fde68a,#b8860b)",
  MULTICOLOR: "conic-gradient(#ef4444,#f59e0b,#22c55e,#3b82f6,#a855f7,#ef4444)", OTHER: "repeating-linear-gradient(45deg,#ccc 0 3px,#eee 3px 6px)",
};

/** Campos comuns a "Perdi" e "Encontrei": o objeto e o sítio. */
export function ItemFields({ options, values, set, errors, whereTitle }: {
  options: FormOptions;
  values: Values;
  set: SetValue;
  errors: Record<string, string>;
  whereTitle: string;
}) {
  const t = useTranslations("reportForm");
  const tc = useTranslations("colors");
  const err = (k: string) => (errors[k] ? t(`errors.${errors[k]}`) : undefined);

  const category = options.categories.find((c) => c.id === values.categoryId);
  const campus = options.campi.find((c) => c.id === values.campusId);

  return (
    <>
      <FormSection icon={<Tag className="size-4" />} title={t("whatTitle")} description={t("whatText")}>
        <ChoiceGroup name="categoryId" label={t("category")} value={values.categoryId ?? ""} error={err("categoryId")}
          onChange={(v) => { set("categoryId", v); set("subcategoryId", ""); }}
          options={options.categories.map((c) => ({ value: c.id, label: c.name, icon: <CategoryIcon slug={c.slug} className="size-4" /> }))} />

        {category && category.subcategories.length > 0 && (
          <div className="animate-fade-up">
            <ChoiceGroup name="subcategoryId" columns="chips" label={<>{t("subcategory")} <span className="font-normal text-muted">· {t("optional")}</span></>}
              value={values.subcategoryId ?? ""} onChange={(v) => set("subcategoryId", values.subcategoryId === v ? "" : v)}
              options={category.subcategories.map((s) => ({ value: s.id, label: s.name }))} />
          </div>
        )}

        <ChoiceGroup name="color" columns="chips" label={<>{t("color")} <span className="font-normal text-muted">· {t("optional")}</span></>}
          value={values.color ?? ""} error={err("color")} onChange={(v) => set("color", values.color === v ? "" : v)}
          options={COLORS.map((c) => ({ value: c, label: tc(c), swatch: SWATCHES[c] }))} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="brand" label={t("brand")} optional={t("optional")} error={err("brand")}>
            <TextInput name="brand" value={values.brand ?? ""} onChange={(e) => set("brand", e.target.value)}
              maxLength={LIMITS.brandMax} placeholder={t("brandPlaceholder")} />
          </Field>
        </div>

        <Field id="description" label={<span className="flex items-center gap-2">{t("description")}</span>}
          hint={t("descriptionHint")} error={err("description")}
          optional={<CharCount value={values.description ?? ""} max={LIMITS.descriptionMax} />}>
          <Textarea name="description" required value={values.description ?? ""} onChange={(e) => set("description", e.target.value)}
            minLength={LIMITS.descriptionMin} maxLength={LIMITS.descriptionMax} placeholder={t("descriptionPlaceholder")} />
        </Field>
      </FormSection>

      <FormSection icon={<Camera className="size-4" />} title={t("photosTitle")} description={t("photosText")}>
        {/* Só é enviado quando a categoria permite fotografias (nunca em documentos de identificação). */}
        {(category?.allowPhotos ?? true) && <input type="hidden" name="photoIds" value={values.photoIds ?? ""} />}
        <PhotoPicker value={values.photoIds ?? ""} onChange={(ids) => set("photoIds", ids)} allowed={category?.allowPhotos ?? true} />
        {err("photoIds") && <p className="text-sm font-medium text-danger">{err("photoIds")}</p>}
      </FormSection>

      <FormSection icon={<MapPin className="size-4" />} title={whereTitle}>
        <ChoiceGroup name="campusId" columns="chips" label={t("campus")} value={values.campusId ?? ""} error={err("campusId")}
          onChange={(v) => { set("campusId", v); set("locationId", ""); }}
          options={[
            ...options.campi.map((c) => ({ value: c.id, label: c.name })),
            { value: UNKNOWN_CAMPUS, label: t("campusUnknown") },
          ]} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="locationId" label={t("location")} optional={t("optional")} error={err("locationId")}
            hint={!campus ? t("locationNeedsCampus") : undefined}>
            <Select name="locationId" value={values.locationId ?? ""} onChange={(e) => set("locationId", e.target.value)} disabled={!campus}>
              <option value="">{t("locationAny")}</option>
              {campus?.locations.map((l) => (
                <option key={l.id} value={l.id}>{l.isSubzone ? `   — ${l.name}` : l.name}</option>
              ))}
            </Select>
          </Field>
          <Field id="locationNote" label={t("locationNote")} optional={t("optional")} error={err("locationNote")}>
            <TextInput name="locationNote" value={values.locationNote ?? ""} onChange={(e) => set("locationNote", e.target.value)}
              maxLength={LIMITS.noteMax} placeholder={t("locationNotePlaceholder")} />
          </Field>
        </div>
      </FormSection>
    </>
  );
}
