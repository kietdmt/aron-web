// Nạp nội dung từ content/seed/*.json vào Supabase (idempotent: chạy lại sẽ ghi đè).
// Dùng: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed.mjs
// (hoặc đặt trong .env.local rồi: node --env-file=.env.local scripts/seed.mjs)
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });
const load = (f) => JSON.parse(readFileSync(new URL(`../content/seed/${f}`, import.meta.url), "utf8"));
const check = (what, { error }) => {
  if (error) {
    console.error(`✗ ${what}:`, error.message);
    process.exit(1);
  }
};

const FORCE = process.argv.includes("--force");
if (FORCE) console.log("⚠ --force: ghi đè nội dung đã có (mất các chỉnh sửa trong admin)");
const now = new Date().toISOString();

const pages = load("pages.json");
const { data: existing } = await db.from("pages").select("slug");
const have = new Set((existing ?? []).map((r) => r.slug));
let skipped = 0;
for (const p of pages) {
  if (have.has(p.slug) && !FORCE) { skipped++; continue; }
  const { data, error } = await db
    .from("pages")
    .upsert({ slug: p.slug, kind: p.kind, published: true }, { onConflict: "slug" })
    .select("id")
    .single();
  check(`page ${p.slug}`, { error });
  const rows = ["vi", "en"].map((locale) => ({
    page_id: data.id,
    locale,
    title: p.title[locale],
    description: p.description[locale] ?? "",
    blocks: p.blocks[locale],
    draft_title: null, draft_description: null, draft_blocks: null,
    published_at: now,
  }));
  check(`translations ${p.slug}`, await db.from("page_translations").upsert(rows, { onConflict: "page_id,locale" }));
}
console.log(`✓ ${pages.length - skipped} trang${skipped ? ` (bỏ qua ${skipped} trang đã có, dùng --force để ghi đè)` : ""}`);

const jobs = load("jobs.json");
check(
  "jobs",
  await db.from("jobs").upsert(
    jobs.map((j) => ({
      slug: j.slug,
      published: true,
      translations: Object.fromEntries(
        ["vi", "en"].map((l) => [l, { title: j.title[l], sections: j.sections[l], facts: j.facts[l], apply: j.apply[l] }]),
      ),
    })),
    { onConflict: "slug", ignoreDuplicates: !FORCE },
  ),
);
console.log(`✓ ${jobs.length} vị trí tuyển dụng`);

const clients = load("clients.json");
const { count: nClients } = await db.from("clients").select("id", { count: "exact", head: true });
if ((nClients ?? 0) > 0 && !FORCE) {
  console.log(`✓ khách hàng: đã có ${nClients}, bỏ qua (dùng --force để ghi đè)`);
  process.exit(0);
}
check("clear clients", await db.from("clients").delete().neq("id", "00000000-0000-0000-0000-000000000000"));
check(
  "clients",
  await db.from("clients").insert(
    clients.items.map((c) => ({ sort: c.sort, name: c.name, logo: c.logo, industry: c.industry, location: c.location })),
  ),
);
console.log(`✓ ${clients.items.length} khách hàng`);
