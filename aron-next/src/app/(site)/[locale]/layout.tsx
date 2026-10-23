import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { notFound } from "next/navigation";
import { isLocale, locales } from "@/lib/i18n";
import { getNav } from "@/lib/content";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PreFooter from "@/components/PreFooter";
import ChatWidget from "@/components/ChatWidget";
import { chatEnabled } from "@/lib/chat/providers";
import "@/styles/globals.css";

const font = Montserrat({ subsets: ["latin", "vietnamese"], display: "swap", variable: "--font-sans" });

export const dynamicParams = false;
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.aron.com.vn";
export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: "ARON Consulting Services JSC", template: "%s" },
  icons: { icon: "/img/favicon.png" },
  robots: process.env.NEXT_PUBLIC_ALLOW_INDEX === "true" ? undefined : { index: false, follow: false }, // bản xem thử: không cho Google lập chỉ mục
  openGraph: { siteName: "ARON Consulting Services JSC", type: "website", images: ["/img/banner.jpg"] },
};

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const nav = getNav(locale);
  return (
    <html lang={locale} className={font.variable}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
        />
      </head>
      <body>
        <Header locale={locale} nav={nav} />
        <main id="main">{children}</main>
        <PreFooter locale={locale} />
        <Footer locale={locale} nav={nav} />
        {chatEnabled() && <ChatWidget locale={locale} />}
      </body>
    </html>
  );
}
