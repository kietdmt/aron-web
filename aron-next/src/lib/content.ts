import "server-only";
import { cache } from "react";
import seedPages from "../../content/seed/pages.json";
import seedJobs from "../../content/seed/jobs.json";
import seedClients from "../../content/seed/clients.json";
import type { ClientsData, Job, NavItem, Page, Post } from "./types";
import type { Locale } from "./i18n";
import { createPublicClient, hasSupabase } from "./supabase/server";

/**
 * Nguồn nội dung: Supabase (nếu đã cấu hình) → nếu lỗi/chưa có dữ liệu thì dùng JSON seed
 * trong content/seed. Nhờ vậy site luôn dựng được, kể cả khi database chưa sẵn sàng.
 */
type SeedPage = { slug: string; kind: Page["kind"]; title: Record<Locale, string>; description: Record<Locale, string>; blocks: Record<Locale, Page["blocks"]> };
const pagesSeed = seedPages as unknown as SeedPage[];

const norm = (s: string) => {
  let v = s.trim();
  if (!v.startsWith("/")) v = "/" + v;
  if (!v.endsWith("/")) v += "/";
  return v.replace(/\/+/g, "/");
};
export const slugFromSegments = (segs?: string[]) => (segs && segs.length ? norm(segs.join("/")) : "/");

export const allPageSlugs = (): string[] => pagesSeed.map((p) => p.slug);

function fromSeed(slug: string, locale: Locale): Page | null {
  const p = pagesSeed.find((x) => x.slug === slug);
  if (!p) return null;
  return { slug: p.slug, kind: p.kind, title: p.title[locale], description: p.description[locale], blocks: p.blocks[locale] };
}

export const getPage = cache(async (slug: string, locale: Locale): Promise<Page | null> => {
  if (hasSupabase()) {
    try {
      const db = createPublicClient();
      const { data: pg } = await db.from("pages").select("id,slug,kind").eq("slug", slug).eq("published", true).maybeSingle();
      if (pg) {
        const { data: tr } = await db
          .from("published_page_translations")
          .select("title,description,blocks")
          .eq("page_id", pg.id)
          .eq("locale", locale)
          .maybeSingle();
        if (tr) return { slug: pg.slug, kind: pg.kind, title: tr.title, description: tr.description, blocks: tr.blocks };
      }
    } catch {
      /* rơi xuống seed */
    }
  }
  return fromSeed(slug, locale);
});

type SeedJob = { slug: string; title: Record<Locale, string>; sections: Record<Locale, Job["sections"]>; facts: Record<Locale, Job["facts"]>; apply: Record<Locale, string> };
const jobsSeed = seedJobs as unknown as SeedJob[];
const jobFromSeed = (j: SeedJob, l: Locale): Job => ({ slug: j.slug, title: j.title[l], sections: j.sections[l], facts: j.facts[l], apply: j.apply[l] });

export const getJob = cache(async (slug: string, locale: Locale): Promise<Job | null> => {
  if (hasSupabase()) {
    try {
      const { data } = await createPublicClient().from("jobs").select("slug,translations").eq("slug", slug).eq("published", true).maybeSingle();
      const tr = (data as any)?.translations?.[locale];
      if (data && tr) return { slug: data.slug, ...tr };
    } catch {}
  }
  const j = jobsSeed.find((x) => x.slug === slug);
  return j ? jobFromSeed(j, locale) : null;
});
export const allJobSlugs = () => jobsSeed.map((j) => j.slug);

type SeedClients = { labels: { industry: Record<Locale, string>; location: Record<Locale, string> }; items: { name: string; logo: string; industry: Record<Locale, string>; location: Record<Locale, string> }[] };
const clientsSeed = seedClients as unknown as SeedClients;

export const getClients = cache(async (locale: Locale): Promise<ClientsData> => {
  if (hasSupabase()) {
    try {
      const { data } = await createPublicClient().from("clients").select("name,logo,industry,location,sort").eq("published", true).order("sort");
      if (data && data.length)
        return {
          industryLabel: clientsSeed.labels.industry[locale],
          locationLabel: clientsSeed.labels.location[locale],
          items: data.map((c: any) => ({ name: c.name, logo: c.logo, industry: c.industry?.[locale] ?? "", location: c.location?.[locale] ?? "", sort: c.sort ?? 0 })),
        };
    } catch {}
  }
  return {
    industryLabel: clientsSeed.labels.industry[locale],
    locationLabel: clientsSeed.labels.location[locale],
    items: clientsSeed.items.map((c, i) => ({ name: c.name, logo: c.logo, industry: c.industry[locale], location: c.location[locale], sort: (c as { sort?: number }).sort ?? i })),
  };
});

/** Menu điều hướng lấy từ danh sách trang (theo `kind`), nhãn = tiêu đề bỏ tiền tố "ARON | ". */
export function getNav(locale: Locale) {
  const label = (s: string) => s.replace(/^ARON\s*\|\s*/i, "");
  const by = (kind: Page["kind"]): NavItem[] =>
    pagesSeed.filter((p) => p.kind === kind).map((p) => ({ href: p.slug, label: label(p.title[locale]) }));
  return { services: by("service"), industries: by("industry"), solutions: by("solution") };
}

/* ===================== Tin tức / Blog ===================== */
type PostRow = { slug: string; published_at: string; category: string; author: string; cover: string; translations: Record<string, { title?: string; excerpt?: string; body?: string } | undefined> };
const POST_COLS = "slug,published_at,category,author,cover,translations";

function postFromRow(r: PostRow, locale: Locale): Post | null {
  const other: Locale = locale === "vi" ? "en" : "vi";
  const useLocale: Locale = r.translations?.[locale]?.title ? locale : r.translations?.[other]?.title ? other : locale;
  const tr = r.translations?.[useLocale];
  if (!tr?.title) return null;
  return { slug: r.slug, title: tr.title, excerpt: tr.excerpt ?? "", body: tr.body ?? "", cover: r.cover, category: r.category, author: r.author, date: r.published_at, lang: useLocale };
}

/** Danh sách bài đã xuất bản (mới nhất trước), có tìm kiếm và phân trang. */
export const getPosts = cache(async (locale: Locale, opts: { q?: string; page?: number; per?: number } = {}): Promise<{ items: Post[]; total: number }> => {
  const per = opts.per ?? 9;
  const page = Math.max(1, opts.page ?? 1);
  if (!hasSupabase()) return { items: [], total: 0 };
  try {
    const { data } = await createPublicClient().from("posts").select(POST_COLS).eq("published", true).lte("published_at", new Date().toISOString()).order("published_at", { ascending: false }).limit(500);
    let items = ((data ?? []) as PostRow[]).map((r) => postFromRow(r, locale)).filter((p): p is Post => !!p);
    const q = (opts.q ?? "").trim().toLowerCase();
    if (q) items = items.filter((p) => `${p.title} ${p.excerpt} ${p.category} ${p.body}`.toLowerCase().includes(q));
    return { total: items.length, items: items.slice((page - 1) * per, page * per) };
  } catch {
    return { items: [], total: 0 };
  }
});

export const getPost = cache(async (slug: string, locale: Locale): Promise<Post | null> => {
  if (!hasSupabase() || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return null;
  try {
    const { data } = await createPublicClient().from("posts").select(POST_COLS).eq("slug", slug).eq("published", true).lte("published_at", new Date().toISOString()).maybeSingle();
    return data ? postFromRow(data as PostRow, locale) : null;
  } catch {
    return null;
  }
});

export const allPostSlugs = cache(async (): Promise<string[]> => {
  if (!hasSupabase()) return [];
  try {
    const { data } = await createPublicClient().from("posts").select("slug").eq("published", true).lte("published_at", new Date().toISOString());
    return (data ?? []).map((r: { slug: string }) => r.slug);
  } catch {
    return [];
  }
});
