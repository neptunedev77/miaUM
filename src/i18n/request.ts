import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { defaultLocale, isLocale, LOCALE_COOKIE } from "./config";

// Sem prefixo de idioma no URL: o idioma vem de um cookie (PT por omissão).
export default getRequestConfig(async () => {
  const stored = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isLocale(stored) ? stored : defaultLocale;
  return {
    locale,
    timeZone: "Europe/Lisbon",
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
