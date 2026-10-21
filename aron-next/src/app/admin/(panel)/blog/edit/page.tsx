import { notFound } from "next/navigation";
import { z } from "zod";
import { requirePerm } from "@/lib/admin/auth";
import { can } from "@/lib/permissions";
import { deletePost } from "../../../blog-actions";
import PostEditor, { type PostData } from "./PostEditor";

export const dynamic = "force-dynamic";

export default async function EditPost({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const ctx = await requirePerm("blog.edit");
  const id = z.string().uuid().safeParse((await searchParams).id ?? "");
  if (!id.success) notFound();
  const { data } = await ctx.supabase.from("posts").select("id,slug,published,published_at,category,author,cover,translations").eq("id", id.data).maybeSingle();
  if (!data) notFound();
  const tr = (data.translations ?? {}) as Record<string, { title?: string; excerpt?: string; body?: string }>;
  const local = new Date(new Date(data.published_at).getTime() + 7 * 3600_000).toISOString().slice(0, 16); // giờ Việt Nam
  const initial: PostData = {
    id: data.id, slug: data.slug, published: data.published, published_at: local, category: data.category, author: data.author, cover: data.cover,
    vi: { title: tr.vi?.title ?? "", excerpt: tr.vi?.excerpt ?? "", body: tr.vi?.body ?? "" },
    en: { title: tr.en?.title ?? "", excerpt: tr.en?.excerpt ?? "", body: tr.en?.body ?? "" },
  };
  return (
    <>
      <h1>Sửa bài viết</h1>
      <PostEditor key={data.id} initial={initial} />
      {can(ctx.role, "content.delete") && (
        <form action={deletePost} className="card">
          <input type="hidden" name="id" value={data.id} />
          <button className="btn btn-sm btn-outline" type="submit">Xoá bài viết này</button>
        </form>
      )}
    </>
  );
}
