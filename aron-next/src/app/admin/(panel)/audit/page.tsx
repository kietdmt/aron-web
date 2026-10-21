import { requirePerm } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";
const fmt = (d: string) => new Date(d).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

export default async function Audit() {
  const ctx = await requirePerm("audit.view");
  const { data } = await ctx.supabase.from("audit_log").select("*").order("at", { ascending: false }).limit(300);
  return (
    <>
      <h1>Nhật ký thao tác</h1>
      <p className="muted">300 sự kiện gần nhất. Nhật ký chỉ ghi thêm, không ai sửa hoặc xoá được.</p>
      <div className="table-scroll">
        <table>
          <thead><tr><th>Thời gian</th><th>Người dùng</th><th>Hành động</th><th>Đối tượng</th><th>Chi tiết</th></tr></thead>
          <tbody>
            {(data ?? []).map((r) => (
              <tr key={r.id} className={String(r.action).endsWith(".fail") ? "bad" : ""}>
                <td>{fmt(r.at)}</td><td>{r.email}</td><td>{r.action}</td><td className="wrap">{r.entity} {r.entity_id}</td>
                <td className="wrap">{r.detail ? JSON.stringify(r.detail) : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
