"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit, tryPerm } from "@/lib/admin/auth";

export type PostState = { ok?: string; error?: string };
const NOPERM = "Bạn không có quyền thực hiện thao tác này.";
const publicRefresh = () => revalidatePath("/", "layout");

/** "Giới thiệu Oracle 26ai!" → "gioi-thieu-oracle-26ai" */
function slugify(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "d")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100).replace(/-+$/, "") || "bai-viet";
}

const coverOk = (v: string) => v === "" || (v.startsWith("/") && !v.startsWith("//") && !/[\u0000-\u001f"\\<>\s]/.test(v)) || /^https:\/\/[^\s"'<>\\]+$/.test(v);
const tr = z.object({ title: z.string().max(200), excerpt: z.string().max(500), body: z.string().max(120000) });
const postSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Đường dẫn chỉ gồm chữ thường không dấu, số và dấu gạch ngang.").max(160),
  category: z.string().max(60), author: z.string().max(100),
  cover: z.string().max(600).refine(coverOk, "Đường dẫn ảnh bìa không hợp lệ"),
  published_at: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Ngày đăng không hợp lệ"),
  vi: tr, en: tr,
});

export async function createPost(_p: PostState | null, fd: FormData): Promise<PostState> {
  const ctx = await tryPerm("blog.edit");
  if (!ctx) return { error: NOPERM };
  const title = z.string().min(1).max(200).safeParse(String(fd.get("title") ?? "").trim());
  if (!title.success) return { error: "Nhập tiêu đề bài viết." };
  let slug = slugify(title.data);
  const { data: dup } = await ctx.supabase.from("posts").select("id").eq("slug", slug).maybeSingle();
  if (dup) slug = `${slug.slice(0, 90)}-${Math.random().toString(36).slice(2, 6)}`;
  const { data, error } = await ctx.supabase.from("posts")
    .insert({ slug, published: false, author: ctx.name || "", translations: { vi: { title: title.data, excerpt: "", body: "" } }, updated_by: ctx.userId })
    .select("id").single();
  if (error || !data) return { error: "Không tạo được bài viết." };
  await audit(ctx, "post.create", "post", data.id);
  redirect(`/admin/blog/edit?id=${data.id}`);
}

export async function savePost(_p: PostState | null, fd: FormData): Promise<PostState> {
  const ctx = await tryPerm("blog.edit");
  if (!ctx) return { error: NOPERM };
  const g = (k: string) => String(fd.get(k) ?? "");
  const d = postSchema.safeParse({
    id: g("id"), slug: g("slug").trim(), category: g("category").trim(), author: g("author").trim(), cover: g("cover").trim(), published_at: g("published_at"),
    vi: { title: g("title_vi").trim(), excerpt: g("excerpt_vi").trim(), body: g("body_vi") },
    en: { title: g("title_en").trim(), excerpt: g("excerpt_en").trim(), body: g("body_en") },
  });
  if (!d.success) return { error: d.error.issues[0]?.message ?? "Dữ liệu chưa hợp lệ." };
  const v = d.data;
  if (!v.vi.title && !v.en.title) return { error: "Cần ít nhất một tiêu đề (tiếng Việt hoặc tiếng Anh)." };
  const when = new Date(`${v.published_at}:00+07:00`);
  if (isNaN(+when)) return { error: "Ngày đăng không hợp lệ." };
  const translations: Record<string, unknown> = {};
  if (v.vi.title) translations.vi = v.vi;
  if (v.en.title) translations.en = v.en;
  const published = fd.get("published") === "on";
  const { error } = await ctx.supabase.from("posts")
    .update({ slug: v.slug, category: v.category, author: v.author, cover: v.cover, published, published_at: when.toISOString(), translations, updated_by: ctx.userId })
    .eq("id", v.id);
  if (error) return { error: error.code === "23505" ? "Đường dẫn này đã có bài khác dùng." : "Không lưu được." };
  await audit(ctx, published ? "post.publish" : "post.save", "post", v.id);
  publicRefresh();
  revalidatePath("/admin/blog");
  return { ok: published ? "Đã lưu. Bài viết hiển thị công khai (đúng giờ đăng đã đặt)." : "Đã lưu nháp (chưa hiển thị công khai)." };
}

export async function deletePost(fd: FormData) {
  const ctx = await tryPerm("content.delete");
  if (!ctx) return;
  const id = z.string().uuid().safeParse(String(fd.get("id")));
  if (!id.success) return;
  await ctx.supabase.from("posts").delete().eq("id", id.data);
  await audit(ctx, "post.delete", "post", id.data);
  publicRefresh();
  redirect("/admin/blog");
}
