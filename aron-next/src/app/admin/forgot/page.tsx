"use client";
import Link from "next/link";
import { useActionState } from "react";
import { requestReset, type FState } from "../forgot-actions";

export default function Forgot() {
  const [s, action, pending] = useActionState<FState | null, FormData>(requestReset, null);
  return (
    <main className="admin-login">
      <form action={action} className="form admin-card">
        <div className="card-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/Logo.svg" alt="ARON" width={150} height={42} />
        </div>
        <h1>Quên mật khẩu</h1>
        <p className="muted">Nhập email đăng nhập. Chúng tôi sẽ gửi link để đặt mật khẩu mới.</p>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="username" required />
        </div>
        <button className="btn" disabled={pending}>{pending ? "Đang gửi..." : "Gửi link đặt lại mật khẩu"}</button>
        {s?.error && <p role="alert" className="note err">{s.error}</p>}
        {s?.ok && <p role="status" className="note ok">{s.ok}</p>}
        <p className="small"><Link href="/admin/login">← Quay lại đăng nhập</Link></p>
      </form>
    </main>
  );
}
