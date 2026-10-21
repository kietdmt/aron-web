/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fmtDate, RecentList } from "@/components/BlogBits";
import { Markdown } from "@/lib/markdown";
import { getPost, getPosts } from "@/lib/content";
import { isLocale, localizeHref, t } from "@/lib/i18n";

export const revalidate = 300;
type P = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const post = await getPost(slug, locale);
  if (!post) return { title: "404", robots: { index: false } };
  return {
    title: `ARON | ${post.title}`,
    description: post.excerpt || undefined,
    alternates: { canonical: `/${locale}/blog/${slug}/` },
    openGraph: { type: "article", title: post.title, description: post.excerpt || undefined, publishedTime: post.date, ...(post.cover ? { images: [post.cover] } : {}) },
  };
}

export default async function BlogPost({ params }: P) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const post = await getPost(slug, locale);
  if (!post) notFound();
  const recent = (await getPosts(locale, { per: 6 })).items.filter((p) => p.slug !== slug).slice(0, 5);
  return (
    <>
      <section className="hero blog-hero post-hero" style={{ backgroundImage: 'url("/img/art/bg-hex.svg")' }}>
        <div className="container">
          {post.category && <p className="eyebrow">{post.category}</p>}
          <h1>{post.title}</h1>
          <p className="post-meta">
            <time dateTime={post.date}>{fmtDate(post.date, locale)}</time>
            {post.author && <> · {t("blogBy", locale)} {post.author}</>}
          </p>
        </div>
      </section>
      <section className="section">
        <div className="container blog-layout">
          <article className="post-article">
            {post.lang !== locale && <p className="note">{t("blogLangNote", locale)}</p>}
            {post.cover && <img className="post-hero-img" src={post.cover} alt="" />}
            <div className="prose"><Markdown source={post.body} /></div>
            <p><Link className="btn btn-outline btn-sm" href={localizeHref(locale, "/blog/")}>{t("blogBack", locale)}</Link></p>
          </article>
          <RecentList posts={recent} locale={locale} />
        </div>
      </section>
    </>
  );
}
