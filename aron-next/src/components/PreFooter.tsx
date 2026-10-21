import Link from "next/link";
import { localizeHref, t, type Locale } from "@/lib/i18n";

export default function PreFooter({ locale }: { locale: Locale }) {
  const L = (h: string) => localizeHref(locale, h);
  const cards = [
    { icon: "forum", title: t("pfContactT", locale), text: t("pfContactX", locale), href: L("/contact-us/"), label: t("demo", locale) },
    { icon: "apps", title: t("pfServiceT", locale), text: t("pfServiceX", locale), href: L("/services/oracle-implementation/"), label: t("learnMore", locale) },
    { icon: "groups", title: t("pfCareerT", locale), text: t("pfCareerX", locale), href: L("/career/"), label: t("career", locale) },
  ];
  return (
    <section className="section prefooter" aria-labelledby="pf-title">
      <div className="container">
        <p className="eyebrow">{t("beforeYouGo", locale)}</p>
        <h2 id="pf-title" className="visually-hidden">{t("beforeYouGo", locale)}</h2>
        <ul className="card-row">
          {cards.map((c) => (
            <li key={c.href} className="info-card">
              <span className="material-symbols-outlined" aria-hidden="true">{c.icon}</span>
              <h3>{c.title}</h3>
              <p>{c.text}</p>
              <Link className="btn btn-outline btn-sm" href={c.href}>{c.label}</Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
