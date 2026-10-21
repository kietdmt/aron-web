/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { localizeHref, t, type Locale } from "@/lib/i18n";
import type { Post } from "@/lib/types";

export const fmtDate = (iso: string, locale: Locale) =>
  new Date(iso).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" });

export function PostCard({ post, locale }: { post: Post; locale: Locale }) {
  const href = localizeHref(locale, `/blog/${post.slug}/`);
  return (
    <article className="post-card">
      <Link href={href} className="post-cover" aria-hidden="true" tabIndex={-1}>
        {post.cover ? <img src={post.cover} alt="" loading="lazy" /> : <span className="post-cover-ph" />}
        {post.category && <em>{post.category}</em>}
      </Link>
      <div className="post-body">
        <time dateTime={post.date}>{fmtDate(post.date, locale)}</time>
        <h3><Link href={href}>{post.title}</Link></h3>
        {post.excerpt && <p>{post.excerpt}</p>}
        <Link className="more" href={href}>{t("blogRead", locale)} →</Link>
      </div>
    </article>
  );
}

export function RecentList({ posts, locale }: { posts: Post[]; locale: Locale }) {
  if (!posts.length) return null;
  return (
    <aside className="post-side" aria-label={t("blogRecent", locale)}>
      <h2>{t("blogRecent", locale)}</h2>
      <ul>
        {posts.map((p) => (
          <li key={p.slug}><Link href={localizeHref(locale, `/blog/${p.slug}/`)}>{p.title}</Link><time dateTime={p.date}>{fmtDate(p.date, locale)}</time></li>
        ))}
      </ul>
    </aside>
  );
}
