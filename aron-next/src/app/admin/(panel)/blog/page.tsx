import Link from "next/link";
import { requirePerm } from "@/lib/admin/auth";
import NewPost from "./NewPost";

export const dynamic = "force-dynamic";
type Row = { id: string; slug: string; published: boolean; published_at: string; category: string; translations: { vi?: { title?: string }; en?: { title?: string } } };

export default async function BlogAdmin() {
  const ctx = await requirePerm("blog.edit");
  const { data } = await ctx.supabase.from("posts").select("id,slug,published,published_at,category,translations").order("published_at", { ascending: false });
  const rows = (data ?? []) as Row[];
  const now = Date.now();
  return (
    <>
      <h1>Tin tức & Blog</h1>
      <p className="muted">Bài ở trạng thái <strong>nháp</strong> hoặc có ngày đăng trong tương lai sẽ chưa hiện ra công khai.</p>
      <NewPost />
      <div className="table-scroll">
        <table>
          <thead><tr><th>Bài viết</th><th>Chuyên mục</th><th>Ngày đăng</th><th>Trạng thái</th><th></th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={5} className="muted">Chưa có bài viết nào.</td></tr>}
            {rows.map((p) => {
              const t = p.translations?.vi?.title || p.translations?.en?.title || p.slug;
              const live = p.published && new Date(p.published_at).getTime() <= now;
              return (
                <tr key={p.id}>
                  <td><strong>{t}</strong><br /><code>{p.slug}</code>{p.translations?.vi?.title && p.translations?.en?.title && <> <span className="pill">VI + EN</span></>}</td>
                  <td>{p.category || "—"}</td>
                  <td>{new Date(p.published_at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "medium", timeStyle: "short" })}</td>
                  <td>{live ? <span className="pill ok">Đang hiện</span> : p.published ? <span className="pill warn">Hẹn giờ</span> : <span className="pill">Nháp</span>}</td>
                  <td><Link className="btn btn-sm" href={`/admin/blog/edit?id=${p.id}`}>Sửa</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
