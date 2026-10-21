// Nhập bài viết từ blog WordPress cũ (blog.aron.com.vn) vào bảng `posts` của Supabase.
// - Tải luôn ảnh bìa và ảnh trong bài về kho ảnh Supabase (bucket "media"), nên blog cũ tắt đi cũng không mất ảnh.
// - Không ghi đè bài đã có (trùng slug) trừ khi thêm --force.
// Dùng:  node --env-file=.env.local scripts/import-wp.mjs [https://blog.aron.com.vn] [--force]
import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const BASE = (args.find((a) => a.startsWith("http")) || "https://blog.aron.com.vn").replace(/\/+$/, "");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY (chạy với --env-file=.env.local)"); process.exit(1); }
const db = createClient(url, key, { auth: { persistSession: false } });

const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", hellip: "…", rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”" };
const decode = (s) => s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => {
  if (e[0] === "#") { const n = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return Number.isFinite(n) ? String.fromCodePoint(n) : m; }
  return ENT[e.toLowerCase()] ?? m;
});
const strip = (s) => decode(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const slugify = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 150).replace(/-+$/, "") || "bai-viet";
const isVi = (s) => /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(s);

async function getJson(u) {
  const r = await fetch(u, { headers: { "user-agent": "aron-importer" } });
  if (!r.ok) throw new Error(`${r.status} ${u}`);
  return { json: await r.json(), pages: Number(r.headers.get("x-wp-totalpages") || 1) };
}

const sniff = (b) => {
  if (b[0] === 0xff && b[1] === 0xd8) return ["jpg", "image/jpeg"];
  if (b[0] === 0x89 && b[1] === 0x50) return ["png", "image/png"];
  if (b[0] === 0x47 && b[1] === 0x49) return ["gif", "image/gif"];
  if (b[0] === 0x52 && b[1] === 0x49 && b[8] === 0x57) return ["webp", "image/webp"];
  return null;
};
const imgCache = new Map();
async function mirror(src, slug, n) {
  if (!src) return "";
  try { src = new URL(src, BASE).toString(); } catch { return ""; }
  if (imgCache.has(src)) return imgCache.get(src);
  let out = "";
  try {
    const r = await fetch(src, { headers: { "user-agent": "aron-importer" } });
    const buf = new Uint8Array(await r.arrayBuffer());
    const kind = r.ok && buf.length <= 5 * 1024 * 1024 ? sniff(buf) : null;
    if (kind) {
      const path = `blog/${slug}/${n}-${Math.random().toString(36).slice(2, 7)}.${kind[0]}`;
      const { error } = await db.storage.from("media").upload(path, buf, { contentType: kind[1], upsert: false });
      if (!error) out = db.storage.from("media").getPublicUrl(path).data.publicUrl;
      else console.warn("  ! không tải ảnh lên được:", error.message);
    } else console.warn("  ! bỏ qua ảnh (không đọc được hoặc quá 5MB):", src);
  } catch (e) { console.warn("  ! lỗi tải ảnh:", src, e.message); }
  imgCache.set(src, out);
  return out;
}

/** HTML của WordPress → Markdown (đủ dùng cho bài viết: tiêu đề, đoạn, danh sách, liên kết, ảnh, trích dẫn). */
async function toMarkdown(html, slug) {
  let h = html.replace(/<!--[\s\S]*?-->/g, "").replace(/<(script|style)[\s\S]*?<\/\1>/gi, "");
  // ảnh: tải về rồi thay bằng token
  const imgs = [];
  const imgRe = /<img\b[^>]*>/gi;
  for (const tag of h.match(imgRe) ?? []) {
    const src = (tag.match(/\bsrc=["']([^"']+)["']/i) || [])[1];
    const alt = decode((tag.match(/\balt=["']([^"']*)["']/i) || [])[1] || "").replace(/[\[\]\n]/g, " ").trim();
    const mirrored = await mirror(src ? decode(src) : "", slug, imgs.length + 1);
    imgs.push(mirrored ? `\n\n![${alt}](${mirrored})\n\n` : "");
  }
  let i = 0;
  h = h.replace(imgRe, () => imgs[i++] ?? "");
  h = h
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, t) => `\n\n## ${strip(t)}\n\n`)
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, t) => `\n\n## ${strip(t)}\n\n`)
    .replace(/<h[3-6][^>]*>([\s\S]*?)<\/h[3-6]>/gi, (_, t) => `\n\n### ${strip(t)}\n\n`)
    .replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, u, t) => { const tx = strip(t); const hr = decode(u).trim(); return tx && /^(https?:\/\/|mailto:|\/)/i.test(hr) && !/[\s()]/.test(hr) ? `[${tx}](${hr})` : tx; })
    .replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, t) => (t.trim() ? `**${strip(t)}**` : ""))
    .replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, t) => (t.trim() ? `*${strip(t)}*` : ""))
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, t) => `\n\n> ${strip(t)}\n\n`)
    .replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, t) => { let n = 0; return "\n\n" + (t.match(/<li[\s\S]*?<\/li>/gi) ?? []).map((li) => `${++n}. ${stripKeep(li)}`).join("\n") + "\n\n"; })
    .replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, t) => "\n\n" + (t.match(/<li[\s\S]*?<\/li>/gi) ?? []).map((li) => `- ${stripKeep(li)}`).join("\n") + "\n\n")
    .replace(/<hr\s*\/?>/gi, "\n\n---\n\n")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|figure|section|table|tr)>/gi, "\n\n")
    .replace(/<[^>]+>/g, "");
  h = decode(h).replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/ {2,}/g, " ").trim();
  return h;
}
// giữ **đậm**/liên kết đã chuyển trong mục danh sách, chỉ gỡ thẻ còn lại
const stripKeep = (s) => decode(s.replace(/<li[^>]*>|<\/li>/gi, "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

const posts = [];
for (let page = 1, pages = 1; page <= pages; page++) {
  const { json, pages: tp } = await getJson(`${BASE}/wp-json/wp/v2/posts?per_page=50&page=${page}&_embed=1&orderby=date&order=desc`);
  pages = tp;
  posts.push(...json);
}
console.log(`Tìm thấy ${posts.length} bài trên ${BASE}`);

const { data: have } = await db.from("posts").select("slug");
const exist = new Set((have ?? []).map((r) => r.slug));
let ok = 0, skipped = 0;
for (const p of posts) {
  let slug = slugify(decodeURIComponent(p.slug || ""));
  if (!slug || slug === "bai-viet") slug = slugify(strip(p.title?.rendered || "")) || `bai-${p.id}`;
  if (exist.has(slug) && !FORCE) { skipped++; console.log("• bỏ qua (đã có):", slug); continue; }
  const title = strip(p.title?.rendered || "");
  const excerpt = strip(p.excerpt?.rendered || "").slice(0, 480);
  console.log("→", title);
  const body = await toMarkdown(p.content?.rendered || "", slug);
  const media = p._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
  const cover = await mirror(media, slug, 0);
  const cat = p._embedded?.["wp:term"]?.[0]?.[0]?.name;
  const author = p._embedded?.author?.[0]?.name || "";
  const lang = isVi(title + body.slice(0, 400)) ? "vi" : "en";
  const row = {
    slug, published: true, published_at: new Date(`${p.date}+07:00`).toISOString(),
    category: cat && !/uncategorized/i.test(cat) ? decode(cat).slice(0, 60) : "", author: author.slice(0, 100), cover,
    translations: { [lang]: { title: title.slice(0, 200), excerpt, body: body.slice(0, 120000) } },
  };
  const { error } = await db.from("posts").upsert(row, { onConflict: "slug" });
  if (error) { console.error("  ✗", error.message); continue; }
  ok++;
}
console.log(`\nXong: nhập ${ok} bài, bỏ qua ${skipped}. Mở /admin/blog để rà soát (bài tiếng Anh nên thêm bản tiếng Việt nếu cần).`);
