"use client";
import Link from "next/link";
import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { login } from "../actions";

function Form() {
  const [state, action, pending] = useActionState(login, null);
  const qs = useSearchParams();
  return (
    <form action={action} className="form admin-card">
      <div className="card-brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/Logo.svg" alt="ARON" width={150} height={42} />
      </div>
      <h1>ARON Admin</h1>
      {qs.get("reset") && <p role="status" className="note ok">Đã đổi mật khẩu. Hãy đăng nhập bằng mật khẩu mới.</p>}
      {qs.get("error") && <p role="alert" className="note err">Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Hãy yêu cầu link mới.</p>}
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required />
      </div>
      <div className="field">
        <label htmlFor="password">Mật khẩu</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <button className="btn" disabled={pending}>{pending ? "Đang đăng nhập..." : "Đăng nhập"}</button>
      {state?.error && <p role="alert" className="note err">{state.error}</p>}
      <p className="small"><Link href="/admin/forgot">Quên mật khẩu?</Link></p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="admin-login">
      <Suspense fallback={null}>
        <Form />
      </Suspense>
    </main>
  );
}
