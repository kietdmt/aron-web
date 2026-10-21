import { requirePerm } from "@/lib/admin/auth";
import { can } from "@/lib/permissions";
import { setStatus } from "../../actions";

export const dynamic = "force-dynamic";
const fmt = (d: string) => new Date(d).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
const OPTS = ["new", "contacted", "closed"];

export default async function Leads({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const ctx = await requirePerm("leads.view");
  const { status } = await searchParams;
  let q = ctx.supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(300);
  if (status && OPTS.includes(status)) q = q.eq("status", status);
  const { data } = await q;
  const edit = can(ctx.role, "leads.edit");
  return (
    <>
      <h1>Liên hệ từ website</h1>
      <p className="filters">Lọc: <a href="/admin/leads">Tất cả</a>{OPTS.map((o) => <a key={o} href={`/admin/leads?status=${o}`}>{o}</a>)}</p>
      <div className="table-scroll">
        <table>
          <thead><tr><th>Thời gian</th><th>Họ tên</th><th>Điện thoại</th><th>Email</th><th>Công ty</th><th>Nội dung</th><th>Trạng thái</th></tr></thead>
          <tbody>
            {(data ?? []).map((l) => (
              <tr key={l.id}>
                <td>{fmt(l.created_at)}</td><td>{l.name}</td><td>{l.phone}</td><td>{l.email}</td><td>{l.company}</td>
                <td className="wrap">{l.message}</td>
                <td>
                  {edit ? (
                    <form action={setStatus} className="status-form">
                      <input type="hidden" name="table" value="leads" /><input type="hidden" name="id" value={l.id} />
                      <select name="status" defaultValue={l.status} aria-label="Trạng thái">{OPTS.map((o) => <option key={o}>{o}</option>)}</select>
                      <button className="btn btn-sm" type="submit">Lưu</button>
                    </form>
                  ) : <span className={`pill st-${l.status}`}>{l.status}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
