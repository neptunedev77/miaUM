import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Header } from "@/components/header";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  return { title: { default: "miaUM", template: "%s · miaUM" }, description: t("slogan") };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  const t = await getTranslations("common");
  return (
    <html lang={locale === "pt" ? "pt-PT" : "en"} className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>
          <a
            href="#conteudo"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-surface focus:px-3 focus:py-2"
          >
            {t("skipToContent")}
          </a>
          <Header />
          <main id="conteudo" className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
            {children}
          </main>
          <footer className="border-t border-border px-4 py-6 text-center text-sm text-muted">
            <p>{t("slogan")}</p>
            <p className="mt-1">{t("provisionalNotice")}</p>
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
