import Link from "next/link";
import { requirePerm } from "@/lib/admin/auth";
import NewJob from "./NewJob";

export const dynamic = "force-dynamic";

export default async function Jobs() {
  const ctx = await requirePerm("jobs.edit");
  const { data } = await ctx.supabase.from("jobs").select("slug,published,translations,updated_at").order("slug");
  return (
    <>
      <h1>Tuyển dụng</h1>
      <p className="muted">Sau khi tạo vị trí mới, nhớ thêm liên kết tới vị trí đó trong trang <strong>/career/</strong> (mục Trang nội dung).</p>
      <div className="table-scroll">
        <table>
          <thead><tr><th>Vị trí</th><th>Đường dẫn</th><th>Trạng thái</th><th></th></tr></thead>
          <tbody>
            {(data ?? []).map((j) => (
              <tr key={j.slug}>
                <td><strong>{(j.translations as { vi?: { title?: string } })?.vi?.title ?? j.slug}</strong></td>
                <td><code>{j.slug}</code></td>
                <td>{j.published ? <span className="pill ok">Đang hiện</span> : <span className="pill">Đang ẩn</span>}</td>
                <td><Link className="btn btn-sm" href={`/admin/jobs/edit?slug=${encodeURIComponent(j.slug)}`}>Sửa</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <NewJob />
    </>
  );
}
