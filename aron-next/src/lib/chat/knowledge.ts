import "server-only";
import { allPageSlugs, getPage } from "@/lib/content";
import type { Locale } from "@/lib/i18n";

type Chunk = { slug: string; title: string; text: string; folded: string; ftitle: string };
const TTL = 10 * 60 * 1000;
const store = new Map<Locale, { at: number; chunks: Chunk[] }>();

export const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "d").toLowerCase();
const SKIP = new Set(["type", "variant", "image", "art", "href", "icon", "logo", "logos", "mapUrl", "url", "src", "key", "slug", "kind", "cover", "fields", "submit"]);

function collect(v: unknown, out: string[], depth = 0) {
  if (depth > 8) return;
  if (typeof v === "string") {
    const s = v.trim();
    if (s.length > 1 && !/^(https?:)?\/\//.test(s) && !s.startsWith("/img/") && !s.startsWith("/")) out.push(s);
  } else if (Array.isArray(v)) v.forEach((x) => collect(x, out, depth + 1));
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) if (!SKIP.has(k)) collect(x, out, depth + 1);
}

async function load(locale: Locale): Promise<Chunk[]> {
  const hit = store.get(locale);
  if (hit && Date.now() - hit.at < TTL) return hit.chunks;
  const pages = await Promise.all(allPageSlugs().map((s) => getPage(s, locale).catch(() => null)));
  const chunks: Chunk[] = [];
  for (const p of pages) {
    if (!p) continue;
    const parts: string[] = [p.title, p.description];
    collect(p.blocks, parts);
    const text = [...new Set(parts.filter(Boolean))].join("\n").slice(0, 6000);
    if (text.length < 40) continue;
    chunks.push({ slug: p.slug, title: p.title, text, folded: fold(text), ftitle: fold(p.title) });
  }
  store.set(locale, { at: Date.now(), chunks });
  return chunks;
}

const STOP = new Set(["la", "va", "cua", "co", "cho", "the", "and", "of", "to", "in", "is", "a", "an", "toi", "ban", "muon", "can", "gi", "nao", "what", "how", "do", "you", "your", "about", "me", "i"]);

/** Chọn vài trang liên quan nhất tới câu hỏi (đơn giản, không cần dịch vụ ngoài). */
export async function relevantKnowledge(locale: Locale, question: string): Promise<string> {
  const chunks = await load(locale);
  if (!chunks.length) return "";
  const words = [...new Set(fold(question).split(/[^a-z0-9]+/).filter((w) => w.length >= 2 && !STOP.has(w)))];
  const scored = chunks.map((c) => {
    let s = 0;
    for (const w of words) {
      const n = c.folded.split(w).length - 1;
      s += Math.min(n, 5) + (c.ftitle.includes(w) ? 4 : 0);
    }
    return { c, s };
  }).sort((a, b) => b.s - a.s);
  const home = chunks.find((c) => c.slug === "/");
  const picked = scored.filter((x) => x.s > 0).slice(0, 4).map((x) => x.c);
  const list = home && !picked.includes(home) ? [home, ...picked] : picked.length ? picked : chunks.slice(0, 3);
  return list.map((c, i) => `### Tài liệu ${i + 1}: ${c.title}\n${c.text.slice(0, i === 0 && c === home ? 1800 : 3500)}`).join("\n\n");
}
