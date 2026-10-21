"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowser } from "@/lib/supabase/browser";

type Mode = "loading" | "enroll" | "challenge";

export default function MfaPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("loading");
  const [factorId, setFactorId] = useState("");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const sb = createBrowser();
      const { data: u } = await sb.auth.getUser();
      if (!u.user) return router.replace("/admin/login");
      const { data: aal } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.currentLevel === "aal2") return router.replace("/admin");
      const { data: f } = await sb.auth.mfa.listFactors();
      const verified = f?.totp?.find((x) => x.status === "verified");
      if (verified) {
        setFactorId(verified.id);
        return setMode("challenge");
      }
      for (const x of f?.all ?? []) if (x.status === "unverified") await sb.auth.mfa.unenroll({ factorId: x.id });
      const { data, error } = await sb.auth.mfa.enroll({ factorType: "totp", friendlyName: "ARON Admin" });
      if (error || !data) return setErr("Không khởi tạo được xác thực 2 bước. Thử tải lại trang.");
      setFactorId(data.id);
      setQr(data.totp.qr_code);
      setSecret(data.totp.secret);
      setMode("enroll");
    })();
  }, [router]);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const sb = createBrowser();
    const { error } = await sb.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
    setBusy(false);
    if (error) return setErr("Mã không đúng hoặc đã hết hạn. Thử lại với mã mới.");
    router.replace("/admin");
    router.refresh();
  }

  return (
    <main className="admin-login">
      <form onSubmit={verify} className="form admin-card">
        <div className="card-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/Logo.svg" alt="ARON" width={150} height={42} />
        </div>
        <h1>Xác thực 2 bước</h1>
        {mode === "loading" && !err && <p>Đang tải...</p>}
        {mode === "enroll" && (
          <>
            <p>Lần đầu đăng nhập, bạn cần cài xác thực 2 bước:</p>
            <ol className="steps">
              <li>Cài ứng dụng <strong>Google Authenticator</strong> hoặc <strong>Microsoft Authenticator</strong> trên điện thoại.</li>
              <li>Chọn thêm tài khoản và quét mã QR bên dưới.</li>
              <li>Nhập mã 6 số hiện trong ứng dụng.</li>
            </ol>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {qr && <img src={qr} alt="Mã QR xác thực 2 bước" width={200} height={200} className="qr" />}
            <p className="muted small">Không quét được? Nhập mã này vào ứng dụng: <code>{secret}</code></p>
          </>
        )}
        {mode === "challenge" && <p>Nhập mã 6 số trong ứng dụng xác thực trên điện thoại của bạn.</p>}
        {mode !== "loading" && (
          <>
            <div className="field">
              <label htmlFor="code">Mã 6 số</label>
              <input id="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} required autoFocus />
            </div>
            <button className="btn" disabled={busy || code.length !== 6}>{busy ? "Đang xác thực..." : "Xác nhận"}</button>
          </>
        )}
        {err && <p role="alert" className="note err">{err}</p>}
      </form>
    </main>
  );
}
