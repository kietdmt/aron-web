/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { localizeHref, t, type Locale } from "@/lib/i18n";
import type { NavItem } from "@/lib/types";

type Nav = { services: NavItem[]; industries: NavItem[]; solutions: NavItem[] };

export default function Footer({ locale, nav }: { locale: Locale; nav: Nav }) {
  const L = (h: string) => localizeHref(locale, h);
  const col = (title: string, items: NavItem[]) => (
    <div>
      <h3>{title}</h3>
      <ul>
        {items.map((i) => (
          <li key={i.href}><Link href={L(i.href)}>{i.label}</Link></li>
        ))}
      </ul>
    </div>
  );
  return (
    <footer className="site-footer">
      <div className="container grid">
        <div className="contact-col">
          <img src="/img/Logo.svg" alt="ARON" height={36} className="footer-logo" />
          <p>
            <strong>{t("address", locale)}:</strong><br />
            {locale === "vi"
              ? "Tầng 10, 47 Điện Biên Phủ, P. Tân Định, TP.HCM"
              : "10th Floor, 47 Dien Bien Phu St, Tan Dinh Ward, HCMC"}
          </p>
          <p><a href="mailto:tuanlt@aron.com.vn">tuanlt@aron.com.vn</a></p>
          <p>
            <Link href={localizeHref(locale, "/blog/")}>{t("blog", locale)}</Link>
          </p>
          <p className="social" aria-label={t("follow", locale)}>
            <a href="https://www.facebook.com/aron.com.vn" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><img src="/img/icon/facebook.svg" alt="" width={28} height={28} /></a>
            <a href="https://www.linkedin.com/company/aron-consulting-services-jsc" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><img src="/img/icon/linkedin.svg" alt="" width={28} height={28} /></a>
          </p>
        </div>
        {col(t("company", locale), [
          { href: "/about-us/", label: t("about", locale) },
          { href: "/clients/", label: t("clients", locale) },
          { href: "/career/", label: t("career", locale) },
          { href: "/contact-us/", label: t("contact", locale) },
        ])}
        {col(t("services", locale), nav.services)}
        {col(t("solutions", locale), nav.solutions)}
        {col(t("industries", locale), nav.industries)}
      </div>
      <div className="container legal">
        <span>© {new Date().getFullYear()} ARON Consulting Services JSC. {t("rights", locale)}</span>
        <Link href={localizeHref(locale, "/sitemap/")}>{t("sitemap", locale)}</Link>
      </div>
    </footer>
  );
}
