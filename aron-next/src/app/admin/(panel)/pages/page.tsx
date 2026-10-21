import Link from "next/link";
import { requirePerm } from "@/lib/admin/auth";
import { can } from "@/lib/permissions";
import { setPagePublished } from "../../cms-actions";

export const dynamic = "force-dynamic";
const fmt = (d: string | null) => (d ? new Date(d).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "—");
const KIND: Record<string, string> = { home: "Trang chủ", about: "Giới thiệu", career: "Tuyển dụng", apply: "Ứng tuyển", clients: "Khách hàng", contact: "Liên hệ", industry: "Ngành", solution: "Giải pháp", service: "Dịch vụ" };

type Row = { id: string; slug: string; kind: string; published: boolean; page_translations: { locale: string; title: string; draft_updated_at: string | null; published_at: string | null }[] };

export default async function PagesList() {
  const ctx = await requirePerm("pages.edit");
  const { data } = await ctx.supabase
    .from("pages")
    .select("id,slug,kind,published,page_translations(locale,title,draft_updated_at,published_at)")
    .order("slug");
  const rows = (data ?? []) as Row[];
  const publish = can(ctx.role, "pages.publish");
  return (
    <>
      <h1>Trang nội dung</h1>
      <p className="muted">Chọn một trang để sửa từng khối nội dung. Thay đổi chỉ hiển thị công khai sau khi bấm <strong>Xuất bản</strong>.</p>
      <div className="table-scroll">
        <table>
          <thead><tr><th>Trang</th><th>Đường dẫn</th><th>Loại</th><th>Bản nháp</th><th>Xuất bản lần cuối</th><th>Hiển thị</th><th></th></tr></thead>
          <tbody>
            {rows.map((r) => {
              const vi = r.page_translations.find((t) => t.locale === "vi");
              const drafts = r.page_translations.filter((t) => t.draft_updated_at).map((t) => t.locale.toUpperCase());
              const last = r.page_translations.map((t) => t.published_at).filter(Boolean).sort().pop() ?? null;
              return (
                <tr key={r.id}>
                  <td><strong>{(vi?.title ?? r.slug).replace(/^ARON\s*\|\s*/, "")}</strong></td>
                  <td><code>{r.slug}</code></td>
                  <td>{KIND[r.kind] ?? r.kind}</td>
                  <td>{drafts.length ? <span className="pill warn">Nháp {drafts.join(", ")}</span> : "—"}</td>
                  <td>{fmt(last)}</td>
                  <td>
                    {publish ? (
                      <form action={setPagePublished}>
                        <input type="hidden" name="pageId" value={r.id} />
                        <input type="hidden" name="published" value={r.published ? "false" : "true"} />
                        <button className="btn btn-sm btn-outline" type="submit">{r.published ? "Đang hiện – Ẩn" : "Đang ẩn – Hiện"}</button>
                      </form>
                    ) : r.published ? <span className="pill ok">Đang hiện</span> : <span className="pill">Đang ẩn</span>}
                  </td>
                  <td><Link className="btn btn-sm" href={`/admin/pages/${r.id}`}>Sửa</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
