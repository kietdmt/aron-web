"use server";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit, tryPerm } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { blocksSchema, jobSlugSchema, jobTranslationSchema, pageMetaSchema } from "@/lib/blockSchema";

export type SaveState = { ok?: string; error?: string };
const NOPERM = "Bạn không có quyền thực hiện thao tác này.";
const publicRefresh = () => revalidatePath("/", "layout");

const LINE_KEYS = new Set(["intro", "paragraphs", "lines", "values"]);
const emptyLink = (v: any) => v && typeof v === "object" && !v.label && !v.href;

/** Dọn dữ liệu từ form: bỏ dòng trống, bỏ liên kết tuỳ chọn để trống. */
function normalize(node: any): any {
  if (Array.isArray(node)) return node.map(normalize);
  if (node && typeof node === "object") {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(node)) {
      if (LINE_KEYS.has(k) && Array.isArray(v)) out[k] = v.map((x) => String(x).trim()).filter(Boolean);
      else out[k] = normalize(v);
    }
    return out;
  }
  return node;
}
function pruneOptional(b: any) {
  if (b.type === "hero") {
    if (emptyLink(b.cta)) delete b.cta;
    if (emptyLink(b.secondary)) delete b.secondary;
    if (!b.lead && b.variant === "home") delete b.lead;
    if (!b.art) delete b.art;
  }
  if (b.type === "features") for (const it of b.items ?? []) if (emptyLink(it.link)) delete it.link;
  if (b.type === "announcement" && emptyLink(b.button)) delete b.button;
  if (b.type === "stats" && b.cta && !b.cta.title && !b.cta.text) delete b.cta;
  return b;
}
const firstIssue = (e: z.ZodError) => {
  const i = e.issues[0];
  return `Dữ liệu chưa hợp lệ${i ? ` (${i.path.join(" › ")}: ${i.message})` : ""}.`;
};
const parseJson = (s: FormDataEntryValue | null) => {
  try { return JSON.parse(String(s ?? "")); } catch { return undefined; }
};

/* ---------------- Ảnh ---------------- */
function sniff(b: Uint8Array): { ext: string; mime: string } | null {
  const eq = (o: number, s: number[]) => s.every((v, i) => b[o + i] === v);
  if (eq(0, [0xff, 0xd8, 0xff])) return { ext: "jpg", mime: "image/jpeg" };
  if (eq(0, [0x89, 0x50, 0x4e, 0x47])) return { ext: "png", mime: "image/png" };
  if (eq(0, [0x47, 0x49, 0x46, 0x38])) return { ext: "gif", mime: "image/gif" };
  if (eq(0, [0x52, 0x49, 0x46, 0x46]) && eq(8, [0x57, 0x45, 0x42, 0x50])) return { ext: "webp", mime: "image/webp" };
  return null;
}

export async function uploadImage(fd: FormData): Promise<{ url?: string; error?: string }> {
  const ctx = await tryPerm("media.upload");
  if (!ctx) return { error: NOPERM };
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Chưa chọn tệp." };
  if (file.size > 5 * 1024 * 1024) return { error: "Ảnh tối đa 5MB." };
  const buf = new Uint8Array(await file.arrayBuffer());
  const kind = sniff(buf); // kiểm tra theo nội dung thật, không tin đuôi tệp
  if (!kind) return { error: "Chỉ nhận ảnh JPG, PNG, WEBP hoặc GIF." };
  const d = new Date();
  const path = `uploads/${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.${kind.ext}`;
  const db = createServiceClient();
  const { error } = await db.storage.from("media").upload(path, buf, { contentType: kind.mime, upsert: false });
  if (error) {
    console.error("upload", error);
    return { error: "Không tải lên được. Kiểm tra bucket 'media' đã tạo chưa (chạy migration 0002)." };
  }
  await audit(ctx, "media.upload", "media", path, { size: file.size });
  return { url: db.storage.from("media").getPublicUrl(path).data.publicUrl };
}

/* ---------------- Trang ---------------- */
export async function savePageDraft(_p: SaveState | null, fd: FormData): Promise<SaveState> {
  const intent = String(fd.get("intent"));
  const ctx = await tryPerm(intent === "publish" ? "pages.publish" : "pages.edit");
  if (!ctx) return { error: NOPERM };

  const pageId = z.string().uuid().safeParse(String(fd.get("pageId")));
  const locale = z.enum(["vi", "en"]).safeParse(String(fd.get("locale")));
  const meta = pageMetaSchema.safeParse({ title: String(fd.get("title") ?? "").trim(), description: String(fd.get("description") ?? "").trim() });
  if (!pageId.success || !locale.success) return { error: "Yêu cầu không hợp lệ." };
  if (!meta.success) return { error: firstIssue(meta.error) };
  const raw = parseJson(fd.get("payload"));
  if (!Array.isArray(raw)) return { error: "Dữ liệu khối không hợp lệ." };
  const blocks = blocksSchema.safeParse(normalize(raw).map(pruneOptional));
  if (!blocks.success) return { error: firstIssue(blocks.error) };

  const now = new Date().toISOString();
  const base = { page_id: pageId.data, locale: locale.data };
  let upd: Record<string, any> = {
    draft_title: meta.data.title, draft_description: meta.data.description, draft_blocks: blocks.data,
    draft_updated_at: now, draft_updated_by: ctx.userId,
  };
  if (intent === "publish") {
    upd = {
      title: meta.data.title, description: meta.data.description, blocks: blocks.data,
      draft_title: null, draft_description: null, draft_blocks: null, draft_updated_at: null, draft_updated_by: null,
      published_at: now, published_by: ctx.userId,
    };
  }
  const { error } = await ctx.supabase.from("page_translations").update(upd).eq("page_id", base.page_id).eq("locale", base.locale);
  if (error) {
    console.error("savePageDraft", error);
    return { error: "Không lưu được (có thể thiếu quyền hoặc lỗi kết nối)." };
  }
  if (intent === "publish") {
    await ctx.supabase.from("page_versions").insert({
      page_id: base.page_id, locale: base.locale, title: meta.data.title, description: meta.data.description,
      blocks: blocks.data, created_by: ctx.userId, note: "Xuất bản",
    });
    publicRefresh();
  }
  await audit(ctx, intent === "publish" ? "page.publish" : "page.draft", "page", base.page_id, { locale: base.locale });
  revalidatePath("/admin/pages");
  return { ok: intent === "publish" ? "Đã xuất bản. Trang công khai sẽ cập nhật trong vài giây." : "Đã lưu nháp (chưa hiển thị công khai)." };
}

export async function discardDraft(fd: FormData) {
  const ctx = await tryPerm("pages.edit");
  if (!ctx) return;
  const id = z.string().uuid().safeParse(String(fd.get("pageId")));
  const locale = z.enum(["vi", "en"]).safeParse(String(fd.get("locale")));
  if (!id.success || !locale.success) return;
  await ctx.supabase.from("page_translations").update({ draft_title: null, draft_description: null, draft_blocks: null, draft_updated_at: null, draft_updated_by: null }).eq("page_id", id.data).eq("locale", locale.data);
  await audit(ctx, "page.discard_draft", "page", id.data, { locale: locale.data });
  redirect(`/admin/pages/${id.data}?lang=${locale.data}`);
}

export async function restoreVersion(fd: FormData) {
  const ctx = await tryPerm("pages.edit");
  if (!ctx) return;
  const vid = z.string().uuid().safeParse(String(fd.get("versionId")));
  if (!vid.success) return;
  const { data: v } = await ctx.supabase.from("page_versions").select("*").eq("id", vid.data).maybeSingle();
  if (!v) return;
  await ctx.supabase.from("page_translations").update({
    draft_title: v.title, draft_description: v.description, draft_blocks: v.blocks,
    draft_updated_at: new Date().toISOString(), draft_updated_by: ctx.userId,
  }).eq("page_id", v.page_id).eq("locale", v.locale);
  await audit(ctx, "page.restore_version", "page", v.page_id, { version: v.id });
  redirect(`/admin/pages/${v.page_id}?lang=${v.locale}`);
}

export async function setPagePublished(fd: FormData) {
  const ctx = await tryPerm("pages.publish");
  if (!ctx) return;
  const id = z.string().uuid().safeParse(String(fd.get("pageId")));
  if (!id.success) return;
  const published = String(fd.get("published")) === "true";
  await ctx.supabase.from("pages").update({ published }).eq("id", id.data);
  await audit(ctx, published ? "page.show" : "page.hide", "page", id.data);
  publicRefresh();
  revalidatePath("/admin/pages");
}

/* ---------------- Tuyển dụng ---------------- */
export async function saveJob(_p: SaveState | null, fd: FormData): Promise<SaveState> {
  const ctx = await tryPerm("jobs.edit");
  if (!ctx) return { error: NOPERM };
  const slug = jobSlugSchema.safeParse(String(fd.get("slug")));
  const locale = z.enum(["vi", "en"]).safeParse(String(fd.get("locale")));
  if (!slug.success || !locale.success) return { error: "Yêu cầu không hợp lệ." };
  const raw = parseJson(fd.get("payload"));
  const tr = jobTranslationSchema.safeParse(normalize(raw));
  if (!tr.success) return { error: firstIssue(tr.error) };
  const { data: cur } = await ctx.supabase.from("jobs").select("translations").eq("slug", slug.data).maybeSingle();
  if (!cur) return { error: "Không tìm thấy vị trí." };
  const translations = { ...(cur.translations as object), [locale.data]: tr.data };
  const { error } = await ctx.supabase.from("jobs").update({ translations, published: fd.get("published") === "on" }).eq("slug", slug.data);
  if (error) return { error: "Không lưu được." };
  await audit(ctx, "job.save", "job", slug.data, { locale: locale.data });
  publicRefresh();
  return { ok: "Đã lưu và cập nhật công khai." };
}

export async function createJob(_p: SaveState | null, fd: FormData): Promise<SaveState> {
  const ctx = await tryPerm("jobs.edit");
  if (!ctx) return { error: NOPERM };
  const slug = jobSlugSchema.safeParse(String(fd.get("slug")).trim());
  const name = z.string().min(1).max(200).safeParse(String(fd.get("name")).trim());
  if (!slug.success) return { error: slug.error.issues[0].message };
  if (!name.success) return { error: "Nhập tên vị trí." };
  const translations = {
    vi: { title: name.data, sections: [], facts: [], apply: "Ứng tuyển ngay" },
    en: { title: name.data, sections: [], facts: [], apply: "Apply now" },
  };
  const { error } = await ctx.supabase.from("jobs").insert({ slug: slug.data, translations, published: false });
  if (error) return { error: "Không tạo được (trùng đường dẫn?)." };
  await audit(ctx, "job.create", "job", slug.data);
  redirect(`/admin/jobs/edit?slug=${encodeURIComponent(slug.data)}`);
}

export async function deleteJob(fd: FormData) {
  const ctx = await tryPerm("content.delete");
  if (!ctx) return;
  const slug = jobSlugSchema.safeParse(String(fd.get("slug")));
  if (!slug.success) return;
  await ctx.supabase.from("jobs").delete().eq("slug", slug.data);
  await audit(ctx, "job.delete", "job", slug.data);
  publicRefresh();
  redirect("/admin/jobs");
}

/* ---------------- Khách hàng ---------------- */
const clientSchema = z.object({
  name: z.string().min(1).max(200),
  logo: z.string().min(1).max(600).refine((v) => (v.startsWith("/") && !v.startsWith("//") && !/[\u0000-\u001f"\\<>]/.test(v)) || /^https:\/\/[^\s"'<>\\]+$/.test(v), "Đường dẫn logo không hợp lệ"),
  industry_vi: z.string().max(200), industry_en: z.string().max(200),
  location_vi: z.string().max(200), location_en: z.string().max(200),
  sort: z.coerce.number().int().min(0).max(100000),
});
const clientRow = (d: z.infer<typeof clientSchema>, fd: FormData) => ({
  name: d.name, logo: d.logo, sort: d.sort,
  industry: { vi: d.industry_vi, en: d.industry_en },
  location: { vi: d.location_vi, en: d.location_en },
  published: fd.get("published") === "on",
});
const clientInput = (fd: FormData) => clientSchema.safeParse(Object.fromEntries(["name", "logo", "industry_vi", "industry_en", "location_vi", "location_en", "sort"].map((k) => [k, String(fd.get(k) ?? "").trim()])));

export async function saveClient(fd: FormData) {
  const ctx = await tryPerm("clients.edit");
  if (!ctx) return;
  const id = z.string().uuid().safeParse(String(fd.get("id")));
  const d = clientInput(fd);
  if (!id.success || !d.success) return;
  await ctx.supabase.from("clients").update(clientRow(d.data, fd)).eq("id", id.data);
  await audit(ctx, "client.save", "client", id.data);
  publicRefresh();
  revalidatePath("/admin/clients");
}

export async function createClient(_p: SaveState | null, fd: FormData): Promise<SaveState> {
  const ctx = await tryPerm("clients.edit");
  if (!ctx) return { error: NOPERM };
  const d = clientInput(fd);
  if (!d.success) return { error: firstIssue(d.error) };
  const { error } = await ctx.supabase.from("clients").insert(clientRow(d.data, fd));
  if (error) return { error: "Không thêm được." };
  await audit(ctx, "client.create", "client", d.data.name);
  publicRefresh();
  revalidatePath("/admin/clients");
  return { ok: "Đã thêm khách hàng." };
}

export async function deleteClient(fd: FormData) {
  const ctx = await tryPerm("content.delete");
  if (!ctx) return;
  const id = z.string().uuid().safeParse(String(fd.get("id")));
  if (!id.success) return;
  await ctx.supabase.from("clients").delete().eq("id", id.data);
  await audit(ctx, "client.delete", "client", id.data);
  publicRefresh();
  revalidatePath("/admin/clients");
}
