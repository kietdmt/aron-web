"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowser } from "@/lib/supabase/browser";

const strong = (p: string) => p.length >= 12 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p);

export default function ResetPassword() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!strong(pw)) return setErr("Mật khẩu tối thiểu 12 ký tự, có chữ hoa, chữ thường và số.");
    if (pw !== pw2) return setErr("Hai mật khẩu chưa giống nhau.");
    setBusy(true);
    const sb = createBrowser();
    const { error } = await sb.auth.updateUser({ password: pw });
    if (error) {
      setBusy(false);
      return setErr("Không đặt được mật khẩu. Link có thể đã hết hạn, hãy yêu cầu link mới.");
    }
    await sb.auth.signOut();
    router.replace("/admin/login?reset=1");
  }

  return (
    <main className="admin-login">
      <form onSubmit={submit} className="form admin-card">
        <div className="card-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/Logo.svg" alt="ARON" width={150} height={42} />
        </div>
        <h1>Đặt mật khẩu mới</h1>
        <div className="field">
          <label htmlFor="pw">Mật khẩu mới</label>
          <input id="pw" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={12} />
        </div>
        <div className="field">
          <label htmlFor="pw2">Nhập lại mật khẩu</label>
          <input id="pw2" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} required />
        </div>
        <p className="muted small">Tối thiểu 12 ký tự, có chữ hoa, chữ thường và số. Sau khi đổi, bạn đăng nhập lại và nhập mã 2 bước như thường lệ.</p>
        <button className="btn" disabled={busy}>{busy ? "Đang lưu..." : "Lưu mật khẩu"}</button>
        {err && <p role="alert" className="note err">{err}</p>}
      </form>
    </main>
  );
}
