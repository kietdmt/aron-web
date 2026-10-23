/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import CountUp from "./CountUp";
import { localizeHref, type Locale } from "@/lib/i18n";
import type { Block } from "@/lib/types";
import { getClients } from "@/lib/content";
import Icon from "./Icon";
import LogoOrbitSection from "./LogoOrbitSection";
import ContactForm from "./ContactForm";
import ApplyForm from "./ApplyForm";

/** Mã hoá ký tự có thể phá chuỗi CSS url("...") (chống chèn CSS nếu dữ liệu bị sửa trực tiếp trong DB). */
const cssUrl = (u: string) => u.replace(/["'\\()<>\s]/g, (c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"));

/** Nền banner: ảnh SVG minh hoạ dùng nguyên bản; ảnh chụp thì phủ lớp tối để chữ dễ đọc. */
const heroBg = (img: string, strength = 0.78) =>
  img.toLowerCase().endsWith(".svg")
    ? `url("${cssUrl(img)}")`
    : `linear-gradient(90deg,rgba(15,15,15,${strength}),rgba(15,15,15,.3)),url("${cssUrl(img)}")`;

/** Số liệu tự tăng: nhập "auto:2009" ở ô Giá trị → hiển thị (năm hiện tại − 2009). */
const statValue = (v: string) => {
  const m = /^auto:(\d{4})$/.exec(v.trim());
  if (!m) return v;
  const year = Number(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric" }));
  return String(Math.max(0, year - Number(m[1])));
};

/** Chỉ cho phép URL nhúng bản đồ Google (tránh iframe tuỳ ý nếu dữ liệu DB bị sửa). */
const safeMap = (u: string) => (u.startsWith("https://www.google.com/maps/embed") ? u : "");

function Paragraphs({ items }: { items?: string[] }) {
  if (!items?.length) return null;
  return <div className="intro">{items.map((p, i) => <p key={i}>{p}</p>)}</div>;
}

async function Clients({ locale, title }: { locale: Locale; title: string }) {
  const data = await getClients(locale);
  return (
    <section className="section">
      <div className="container">
        <h2 className="section-title">{title}</h2>
        <ul className="client-grid">
          {data.items.map((c) => (
            <li key={c.name} className="client-card">
              <div className="logo"><img src={c.logo} alt={c.name} loading="lazy" /></div>
              <h3>{c.name}</h3>
              <p><span>{data.industryLabel}:</span> {c.industry}</p>
              <p><span>{data.locationLabel}:</span> {c.location}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default function Blocks({ blocks, locale, jobSlug }: { blocks: Block[]; locale: Locale; jobSlug?: string }) {
  const L = (h: string) => localizeHref(locale, h);
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.type) {
          case "hero":
            if (b.variant === "home")
              return (
                <section key={i} className="hero hero-home" style={{ backgroundImage: heroBg(b.image, 0.9) }}>
                  <div className={`container hero-grid${b.art ? " has-art" : ""}`}>
                    <div className="hero-copy">
                      <p className="eyebrow light">{b.kicker}</p>
                      <h1>
                        <span className="accent">{b.brand}</span>{" "}
                        {b.title.split(/(Oracle)/g).map((t, k) =>
                          t === "Oracle" ? <span key={k} className="oracle-red">{t}</span> : t
                        )}
                      </h1>
                      {b.lead && <p className="lead">{b.lead}</p>}
                      <div className="btn-row">
                        <Link className="btn" href={L(b.cta?.href || "/contact-us/")}>{b.cta?.label || (locale === "vi" ? "Yêu cầu demo" : "Request a demo")}</Link>
                        <Link className="btn btn-ghost" href={L(b.secondary?.href || "/services/oracle-implementation/")}>{b.secondary?.label || (locale === "vi" ? "Khám phá dịch vụ" : "Explore services")}</Link>
                      </div>
                    </div>
                    {b.art && <img className="hero-art-img" src={b.art} alt="" />}
                  </div>
                </section>
              );
            return (
              <section key={i} className="hero" style={{ backgroundImage: heroBg(b.image) }}>
                <div className="container">
                  <h1>{b.title}</h1>
                  {b.lead && <p className="lead">{b.lead}</p>}
                  {b.cta?.label && <Link className="btn" href={L(b.cta.href)}>{b.cta.label}</Link>}
                </div>
              </section>
            );

          case "features":
            return (
              <section key={i} className="section">
                <div className="container">
                  {b.title && <h2 className="section-title">{b.title}</h2>}
                  <Paragraphs items={b.intro} />
                  <ul className={`feature-grid cols-${b.cols || 3} ${b.variant}`}>
                    {b.items.map((it, k) => (
                      <li key={k} className="feature">
                        <span className="ico-tile"><Icon name={it.icon} size={b.variant === "icons" ? 40 : 32} /></span>
                        <h3>{it.title}</h3>
                        {it.text && <p>{it.text}</p>}
                        {it.link && <Link className="more" href={L(it.link.href)}>{it.link.label} →</Link>}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            );

          case "linkList":
            if (b.variant === "icons")
              return (
                <section key={i} className="section alt">
                  <div className="container">
                    <h2 className="section-title">{b.title}</h2>
                    <ul className="tile-grid">
                      {b.items.map((it) => (
                        <li key={it.href}>
                          <Link href={L(it.href)} className="tile">
                            <Icon name={it.icon} size={40} />
                            <span>{it.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              );
            return (
              <section key={i} className="section">
                <div className="container narrow">
                  <h2 className="section-title">{b.title}</h2>
                  {b.subtitle && <p className="lead dark">{b.subtitle}</p>}
                  <ul className="plain-links">
                    {b.items.map((it) => (
                      <li key={it.href}><Link href={L(it.href)}>{it.label} <span aria-hidden="true">→</span></Link></li>
                    ))}
                  </ul>
                </div>
              </section>
            );

          case "cta":
            return (
              <section key={i} className="section">
                <div className={`container split ${b.imageSide === "left" ? "img-left" : "img-right"}`}>
                  {b.image && <img src={b.image} alt="" loading="lazy" />}
                  <div>
                    <h2>{b.title}</h2>
                    <p>{b.text}</p>
                    <Link className="btn" href={L(b.button.href)}>{b.button.label}</Link>
                  </div>
                </div>
              </section>
            );

          case "ctaCollage":
            return (
              <section key={i} className="section dark">
                <div className="container split">
                  <div>
                    <h2>{b.title}</h2>
                    <p>{b.text}</p>
                    <Link className="btn" href={L(b.button.href)}>{b.button.label}</Link>
                  </div>
                  <div className="collage">
                    {b.images.map((src, k) => <img key={k} src={src} alt="" loading="lazy" />)}
                  </div>
                </div>
              </section>
            );

          case "carousel":
            if (!b.items.length) return null;
            return (
              <section key={i} className="section alt">
                <div className="container">
                  <h2 className="section-title">{b.title}</h2>
                  <ul className="slides" tabIndex={0} aria-label={b.title}>
                    {b.items.map((it, k) => (
                      <li key={k} className="slide">
                        {it.image && <img src={it.image} alt="" loading="lazy" />}
                        <div>
                          <h3>{it.title}</h3>
                          <p>{it.text}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            );

          case "imageList":
            return (
              <section key={i} className="section">
                <div className="container">
                  {b.title && <h2 className="section-title">{b.title}</h2>}
                  <Paragraphs items={b.intro} />
                  <ul className="rows">
                    {b.items.map((it, k) => (
                      <li key={k} className={`row ${k % 2 ? "rev" : ""}`}>
                        {it.image && <img src={it.image} alt="" loading="lazy" />}
                        <div>
                          <h3>{it.title}</h3>
                          {it.text && <p>{it.text}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            );

          case "story":
            return (
              <section key={i} className="section">
                <div className="container split img-left">
                  {b.image && <img src={b.image} alt="" loading="lazy" />}
                  <div>
                    <h2>{b.title}</h2>
                    {b.text.split(/\n+/).map((p, k) => <p key={k}>{p}</p>)}
                  </div>
                </div>
              </section>
            );

          case "stats":
            return (
              <section key={i} className="section alt">
                <div className="container">
                  <ul className="stats">
                    {b.items.map((s, k) => (
                      <li key={k}>
                        <strong><CountUp value={statValue(s.value)} />{s.suffix}</strong>
                        <span>{s.label}</span>
                      </li>
                    ))}
                  </ul>
                  {b.cta && (
                    <div className="stats-cta">
                      <h2>{b.cta.title}</h2>
                      <p>{b.cta.text}</p>
                      <Link className="btn" href={L(b.cta.button.href)}>{b.cta.button.label}</Link>
                    </div>
                  )}
                </div>
              </section>
            );

          case "logoStrip":
            return (
              <section key={i} className="section">
                <div className="container">
                  <h2 className="section-title">{b.title}</h2>
                  <LogoOrbitSection logos={b.logos} locale={locale} link={b.link} />
                  <p className="center"><Link className="btn btn-outline" href={L(b.link.href)}>{b.link.label}</Link></p>
                </div>
              </section>
            );

          case "announcement":
            return (
              <section key={i} className="announce">
                <div className="container announce-in">
                  <div>
                    {b.eyebrow && <p className="eyebrow light">{b.eyebrow}</p>}
                    <h2>{b.title}</h2>
                  </div>
                  {b.button && <Link className="btn" href={L(b.button.href)}>{b.button.label}</Link>}
                </div>
              </section>
            );

          case "richText":
            return (
              <section key={i} className="section">
                <div className="container narrow">
                  {b.title && <h2>{b.title}</h2>}
                  {b.paragraphs.map((p, k) => <p key={k}>{p}</p>)}
                </div>
              </section>
            );

          case "cardRow":
            return (
              <section key={i} className="section alt">
                <div className="container">
                  {b.title && <h2 className="section-title">{b.title}</h2>}
                  <ul className="card-row">
                    {b.items.map((it, k) => (
                      <li key={k} className="info-card">
                        {it.eyebrow && <p className="eyebrow">{it.eyebrow}</p>}
                        <h3>{it.title}</h3>
                        <p>{it.text}</p>
                        <Link className="btn btn-outline btn-sm" href={L(it.link.href)}>{it.link.label}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            );

          case "clients":
            return <Clients key={i} locale={locale} title={b.title} />;

          case "contactForm":
            return (
              <section key={i} className="section">
                <div className="container contact">
                  <div>
                    <h1 className="section-title left">{b.title}</h1>
                    <p className="lead dark">{b.lead}</p>
                    <ContactForm locale={locale} fields={b.fields} submit={b.submit} />
                  </div>
                  {safeMap(b.mapUrl) && (
                    <iframe className="map" src={safeMap(b.mapUrl)} title="ARON map" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                  )}
                </div>
              </section>
            );

          case "applyForm":
            return (
              <section key={i} className="section">
                <div className="container narrow">
                  <ApplyForm locale={locale} heads={b.heads} fields={b.fields} submit={b.submit} jobSlug={jobSlug} />
                </div>
              </section>
            );
        }
      })}
    </>
  );
}
