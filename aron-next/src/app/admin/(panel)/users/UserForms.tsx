"use client";
import { useActionState } from "react";
import { createUser, resetPassword, type UState } from "../../users-actions";
import { ROLES, ROLE_LABEL } from "@/lib/permissions";

export default function UserForms({ users }: { users: { id: string; email: string }[] }) {
  const [c, createAction, cp] = useActionState<UState | null, FormData>(createUser, null);
  const [r, resetAction, rp] = useActionState<UState | null, FormData>(resetPassword, null);
  return (
    <div className="two-col">
      <form action={createAction} className="card form">
        <h3>Tạo tài khoản mới</h3>
        <label className="fe-row"><span>Email</span><input name="email" type="email" required autoComplete="off" /></label>
        <label className="fe-row"><span>Họ tên</span><input name="full_name" maxLength={200} /></label>
        <label className="fe-row"><span>Vai trò</span>
          <select name="role" defaultValue="editor">{ROLES.filter((x) => x !== "viewer").map((x) => <option key={x} value={x}>{ROLE_LABEL[x]}</option>)}</select></label>
        <label className="fe-row"><span>Mật khẩu tạm (≥12 ký tự, có chữ hoa, thường, số)</span><input name="password" type="password" minLength={12} required autoComplete="new-password" /></label>
        <button className="btn btn-sm" disabled={cp}>Tạo tài khoản</button>
        {c?.error && <p role="alert" className="note err">{c.error}</p>}
        {c?.ok && <p role="status" className="note ok">{c.ok}</p>}
      </form>
      <form action={resetAction} className="card form">
        <h3>Đặt lại mật khẩu</h3>
        <label className="fe-row"><span>Tài khoản</span><select name="userId" required>{users.map((u) => <option key={u.id} value={u.id}>{u.email}</option>)}</select></label>
        <label className="fe-row"><span>Mật khẩu mới</span><input name="password" type="password" minLength={12} required autoComplete="new-password" /></label>
        <button className="btn btn-sm" disabled={rp}>Đặt mật khẩu</button>
        {r?.error && <p role="alert" className="note err">{r.error}</p>}
        {r?.ok && <p role="status" className="note ok">{r.ok}</p>}
      </form>
    </div>
  );
}
