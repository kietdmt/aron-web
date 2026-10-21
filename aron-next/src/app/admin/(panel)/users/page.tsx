import { requirePerm } from "@/lib/admin/auth";
import { ROLES, ROLE_LABEL } from "@/lib/permissions";
import { resetMfa, updateUser } from "../../users-actions";
import UserForms from "./UserForms";

export const dynamic = "force-dynamic";

export default async function Users() {
  const ctx = await requirePerm("users.manage");
  const { data } = await ctx.supabase.from("profiles").select("id,email,full_name,role,disabled,created_at").order("created_at");
  return (
    <>
      <h1>Người dùng & phân quyền</h1>
      <div className="card perm-matrix">
        <h3>Quyền theo vai trò</h3>
        <table>
          <thead><tr><th>Chức năng</th><th>Admin</th><th>Biên tập</th><th>HR</th><th>Kinh doanh</th></tr></thead>
          <tbody>
            <tr><td>Sửa & xuất bản trang nội dung</td><td>✓</td><td>✓</td><td>—</td><td>—</td></tr>
            <tr><td>Tuyển dụng (tin đăng)</td><td>✓</td><td>✓</td><td>✓</td><td>—</td></tr>
            <tr><td>Khách hàng (logo)</td><td>✓</td><td>✓</td><td>—</td><td>—</td></tr>
            <tr><td>Hồ sơ ứng tuyển</td><td>✓</td><td>—</td><td>✓</td><td>—</td></tr>
            <tr><td>Liên hệ từ website</td><td>✓</td><td>—</td><td>—</td><td>✓</td></tr>
            <tr><td>Xoá dữ liệu, người dùng, nhật ký</td><td>✓</td><td>—</td><td>—</td><td>—</td></tr>
          </tbody>
        </table>
      </div>

      <UserForms users={(data ?? []).map((u) => ({ id: u.id, email: u.email ?? "" }))} />

      <h2>Danh sách tài khoản</h2>
      <div className="table-scroll">
        <table>
          <thead><tr><th>Email</th><th>Họ tên</th><th>Vai trò</th><th>Khoá</th><th></th><th>2 bước</th></tr></thead>
          <tbody>
            {(data ?? []).map((u) => {
              const self = u.id === ctx.userId;
              return (
                <tr key={u.id}>
                  <td>{u.email}{self && " (bạn)"}</td><td>{u.full_name}</td>
                  <td colSpan={3}>
                    <form action={updateUser} className="status-form">
                      <input type="hidden" name="userId" value={u.id} />
                      <select name="role" defaultValue={u.role} disabled={self} aria-label="Vai trò">{ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select>
                      <label className="fe-check"><input type="checkbox" name="disabled" defaultChecked={u.disabled} disabled={self} /> Khoá</label>
                      {!self && <button className="btn btn-sm" type="submit">Lưu</button>}
                    </form>
                  </td>
                  <td>
                    {!self && (
                      <form action={resetMfa}><input type="hidden" name="userId" value={u.id} /><button className="btn btn-sm btn-outline" type="submit">Gỡ 2 bước</button></form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
