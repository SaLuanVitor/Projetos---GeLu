import type { Metadata } from "next";
import { Be_Vietnam_Pro, Bricolage_Grotesque, Gochi_Hand } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { ToastProvider } from "@/components/ui/Toast";
import { FamilyProvider } from "@/contexts/FamilyContext";
import "../globals.css";

export const metadata: Metadata = {
  title: "Gelu - Menu",
  description: "Organizacao familiar de receitas, dietas, treinos e sugestoes assistivas.",
  icons: [
    { rel: "icon", url: "/icon.svg", type: "image/svg+xml" },
    { rel: "icon", url: "/favicon.ico" },
    { rel: "apple-touch-icon", url: "/icon.svg" },
  ],
};

const displayFont = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"]
});

const bodyFont = Be_Vietnam_Pro({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"]
});

const handFont = Gochi_Hand({
  subsets: ["latin"],
  variable: "--font-hand",
  weight: "400"
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html lang={locale}>
      <body className={`${displayFont.variable} ${bodyFont.variable} ${handFont.variable}`}>
        <NextIntlClientProvider>
          <ToastProvider>
            <FamilyProvider>{children}</FamilyProvider>
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
