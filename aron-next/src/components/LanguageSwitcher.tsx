"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export default function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname() || `/${locale}/`;
  const other: Locale = locale === "vi" ? "en" : "vi";
  const target = pathname.replace(/^\/(vi|en)(?=\/|$)/, `/${other}`);
  return (
    <Link href={target} hrefLang={other} lang={other} className="lang-switch" prefetch={false}>
      <span className="material-symbols-outlined" aria-hidden="true">language</span>
      {t("otherLang", locale)}
    </Link>
  );
}
