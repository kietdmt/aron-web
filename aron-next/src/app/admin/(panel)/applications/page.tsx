import { requirePerm } from "@/lib/admin/auth";
import { can } from "@/lib/permissions";
import { setStatus } from "../../actions";

export const dynamic = "force-dynamic";
const fmt = (d: string) => new Date(d).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
const OPTS = ["new", "reviewing", "interview", "rejected", "hired"];

export default async function Applications({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const ctx = await requirePerm("applications.view");
  const { status } = await searchParams;
  let q = ctx.supabase.from("applications").select("*").order("created_at", { ascending: false }).limit(300);
  if (status && OPTS.includes(status)) q = q.eq("status", status);
  const { data } = await q;
  const edit = can(ctx.role, "applications.edit");
  return (
    <>
      <h1>Hồ sơ ứng tuyển</h1>
      <p className="filters">Lọc: <a href="/admin/applications">Tất cả</a>{OPTS.map((o) => <a key={o} href={`/admin/applications?status=${o}`}>{o}</a>)}</p>
      <div className="table-scroll">
        <table>
          <thead><tr><th>Thời gian</th><th>Họ tên</th><th>Email</th><th>Điện thoại</th><th>Vị trí</th><th>CV</th><th>Thư xin việc</th><th>Trạng thái</th></tr></thead>
          <tbody>
            {(data ?? []).map((a) => (
              <tr key={a.id}>
                <td>{fmt(a.created_at)}</td><td>{a.full_name}</td><td>{a.email}</td><td>{a.phone}</td><td>{a.job_slug}</td>
                <td>{a.cv_url && /^https?:\/\//i.test(a.cv_url) ? <a href={a.cv_url} target="_blank" rel="noopener noreferrer nofollow">Mở CV</a> : "—"}</td>
                <td className="wrap">{a.cover_letter}</td>
                <td>
                  {edit ? (
                    <form action={setStatus} className="status-form">
                      <input type="hidden" name="table" value="applications" /><input type="hidden" name="id" value={a.id} />
                      <select name="status" defaultValue={a.status} aria-label="Trạng thái">{OPTS.map((o) => <option key={o}>{o}</option>)}</select>
                      <button className="btn btn-sm" type="submit">Lưu</button>
                    </form>
                  ) : <span className={`pill st-${a.status}`}>{a.status}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
