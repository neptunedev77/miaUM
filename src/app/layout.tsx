import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Fraunces, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { THEME_COOKIE, isTheme } from "@/components/theme";
import "./globals.css";

// Fontes servidas pela própria app (sem pedidos a serviços externos em runtime).
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap", axes: ["opsz"] });

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  return { title: { default: "miaUM", template: "%s · miaUM" }, description: t("slogan") };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f6f4" },
    { media: "(prefers-color-scheme: dark)", color: "#131012" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  const t = await getTranslations("common");
  // Tema escolhido pelo utilizador (cookie); sem escolha, o CSS segue o sistema. Renderizado no
  // servidor para não haver um "flash" do tema errado ao carregar.
  const theme = (await cookies()).get(THEME_COOKIE)?.value;
  return (
    <html lang={locale === "pt" ? "pt-PT" : "en"} data-theme={isTheme(theme) ? theme : undefined}
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>
          <a href="#conteudo"
            className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-xl focus:bg-surface focus:px-4 focus:py-2 focus:shadow-lift">
            {t("skipToContent")}
          </a>
          <Header />
          <main id="conteudo" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
            {children}
          </main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
