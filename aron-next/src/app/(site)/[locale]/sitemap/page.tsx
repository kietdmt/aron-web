import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getNav, getPosts } from "@/lib/content";
import { isLocale, localizeHref, t } from "@/lib/i18n";

export const revalidate = 300;
type P = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: `ARON | ${t("sitemap", locale)}`, alternates: { canonical: `/${locale}/sitemap/` } };
}

export default async function SitemapPage({ params }: P) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const L = (h: string) => localizeHref(locale, h);
  const nav = getNav(locale);
  const posts = (await getPosts(locale, { per: 8 })).items;
  const groups: { title: string; icon: string; links: { href: string; label: string }[] }[] = [
    {
      title: locale === "vi" ? "Công ty" : "Company", icon: "apartment",
      links: [
        { href: "/", label: t("home", locale) },
        { href: "/about-us/", label: t("about", locale) },
        { href: "/clients/", label: t("clients", locale) },
        { href: "/career/", label: t("career", locale) },
        { href: "/contact-us/", label: t("contact", locale) },
      ],
    },
    { title: t("services", locale), icon: "build_circle", links: nav.services },
    { title: t("solutions", locale), icon: "extension", links: nav.solutions },
    { title: t("industries", locale), icon: "factory", links: nav.industries },
    {
      title: t("blogTitle", locale), icon: "newspaper",
      links: [{ href: "/blog/", label: t("blogTitle", locale) }, ...posts.map((p) => ({ href: `/blog/${p.slug}/`, label: p.title }))],
    },
  ];
  return (
    <>
      <section className="hero blog-hero" style={{ backgroundImage: 'url("/img/art/bg-rings.svg")' }}>
        <div className="container">
          <h1>{t("sitemap", locale)}</h1>
          <p className="lead">{locale === "vi" ? "Tất cả các trang của website ARON, theo từng nhóm." : "Every page of the ARON website, by section."}</p>
        </div>
      </section>
      <section className="section">
        <div className="container map-grid">
          {groups.map((g) => (
            <div key={g.title} className="map-card">
              <h2><span className="material-symbols-outlined" aria-hidden="true">{g.icon}</span>{g.title}</h2>
              <ul>
                {g.links.map((l) => <li key={l.href}><Link href={L(l.href)}>{l.label}</Link></li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
