import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostCard, RecentList } from "@/components/BlogBits";
import { getPosts } from "@/lib/content";
import { isLocale, localizeHref, t } from "@/lib/i18n";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string; page?: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: `ARON | ${t("blogTitle", locale)}`, description: t("blogSub", locale), alternates: { canonical: `/${locale}/blog/`, languages: { vi: "/vi/blog/", en: "/en/blog/" } } };
}

export default async function BlogIndex({ params, searchParams }: P) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const sp = await searchParams;
  const q = String(sp.q ?? "").slice(0, 80);
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const per = 9;
  const { items, total } = await getPosts(locale, { q, page, per });
  const recent = (await getPosts(locale, { per: 5 })).items;
  const pages = Math.max(1, Math.ceil(total / per));
  const base = localizeHref(locale, "/blog/");
  const qs = (n: number) => `${base}?${new URLSearchParams({ ...(q ? { q } : {}), page: String(n) })}`;
  return (
    <>
      <section className="hero blog-hero" style={{ backgroundImage: 'url("/img/art/bg-net.svg")' }}>
        <div className="container">
          <h1>{t("blogTitle", locale)}</h1>
          <p className="lead">{t("blogSub", locale)}</p>
          <form className="blog-search" action={base} method="get" role="search">
            <input type="search" name="q" defaultValue={q} placeholder={t("blogSearch", locale)} aria-label={t("blogSearch", locale)} maxLength={80} />
            <button type="submit" aria-label={t("blogSearch", locale)}><span className="material-symbols-outlined" aria-hidden="true">search</span></button>
          </form>
        </div>
      </section>
      <section className="section">
        <div className="container blog-layout">
          <div>
            {items.length ? <div className="post-grid">{items.map((p) => <PostCard key={p.slug} post={p} locale={locale} />)}</div> : <p className="muted center">{t("blogNone", locale)}</p>}
            {pages > 1 && (
              <nav className="pager" aria-label="Pagination">
                {page > 1 && <Link className="btn btn-outline btn-sm" href={qs(page - 1)}>← {t("blogPrev", locale)}</Link>}
                <span>{page} / {pages}</span>
                {page < pages && <Link className="btn btn-outline btn-sm" href={qs(page + 1)}>{t("blogNext", locale)} →</Link>}
              </nav>
            )}
          </div>
          <RecentList posts={recent} locale={locale} />
        </div>
      </section>
    </>
  );
}
