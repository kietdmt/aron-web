"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { localizeHref, t, type Locale } from "@/lib/i18n";
import type { NavItem } from "@/lib/types";
import LanguageSwitcher from "./LanguageSwitcher";

type Nav = { services: NavItem[]; industries: NavItem[]; solutions: NavItem[] };
type MenuKey = "services" | "industries" | "solutions";

export default function Header({ locale, nav }: { locale: Locale; nav: Nav }) {
  const [mobile, setMobile] = useState(false);
  const [open, setOpen] = useState<MenuKey | null>(null);
  const pathname = usePathname();
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    setMobile(false);
    setOpen(null);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    const onClick = (e: MouseEvent) => root.current && !root.current.contains(e.target as Node) && setOpen(null);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  const L = (href: string) => localizeHref(locale, href);
  const menus: { key: MenuKey; label: string; desc: string; items: NavItem[] }[] = [
    { key: "services", label: t("services", locale), desc: t("megaServices", locale), items: nav.services },
    { key: "industries", label: t("industries", locale), desc: t("megaIndustries", locale), items: nav.industries },
    { key: "solutions", label: t("solutions", locale), desc: t("megaSolutions", locale), items: nav.solutions },
  ];

  return (
    <header className="site-header" ref={root}>
      <a href="#main" className="skip">{t("skip", locale)}</a>

      <div className="utility">
        <div className="container utility-in">
          <span className="utility-right">
            <LanguageSwitcher locale={locale} />
          </span>
        </div>
      </div>

      <div className="container bar">
        <Link href={L("/")} className="brand" aria-label="ARON Consulting Services">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/Logo.svg" alt="ARON" width={155} height={44} />
        </Link>
        <button
          type="button"
          className="burger"
          aria-expanded={mobile}
          aria-controls="primary-nav"
          aria-label={t("menu", locale)}
          onClick={() => setMobile((v) => !v)}
        >
          <span className="material-symbols-outlined">{mobile ? "close" : "menu"}</span>
        </button>

        <nav id="primary-nav" className={mobile ? "nav open" : "nav"} aria-label="Primary">
          <ul className="nav-list">
            <li><Link href={L("/about-us/")}>{t("about", locale)}</Link></li>
            {menus.map((m) => (
              <li
                key={m.key}
                className={`has-mega ${open === m.key ? "is-open" : ""}`}
                onMouseEnter={() => window.matchMedia("(min-width: 981px)").matches && setOpen(m.key)}
                onMouseLeave={() => window.matchMedia("(min-width: 981px)").matches && setOpen(null)}
              >
                <button type="button" aria-expanded={open === m.key} aria-haspopup="true" onClick={() => setOpen(open === m.key ? null : m.key)}>
                  {m.label}
                  <span className="material-symbols-outlined chev" aria-hidden="true">expand_more</span>
                </button>
                <div className="mega" hidden={open !== m.key}>
                  <div className="container mega-in">
                    <div className="mega-intro">
                      <p className="mega-title">{m.label}</p>
                      <p>{m.desc}</p>
                      <Link href={L("/contact-us/")} className="btn btn-sm">{t("viewAll", locale)}</Link>
                    </div>
                    <ul className="mega-links">
                      {m.items.map((i) => (
                        <li key={i.href}>
                          <Link href={L(i.href)}>
                            <span>{i.label}</span>
                            <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </li>
            ))}
            <li><Link href={L("/clients/")}>{t("clients", locale)}</Link></li>
            <li><Link href={L("/career/")}>{t("career", locale)}</Link></li>
            <li><Link href={L("/blog/")}>{t("blog", locale)}</Link></li>
          </ul>
          <Link href={L("/contact-us/")} className="btn btn-sm nav-cta">{t("demo", locale)}</Link>
        </nav>
      </div>
    </header>
  );
}
