"use client";
import { useActionState } from "react";
import { saveNotify, testNotify, type NState } from "../../notify-actions";

type Props = {
  kind: "lead" | "application"; title: string; roleLabel: string; enabled: boolean; includeRole: boolean;
  to: string; cc: string; last: { ok: boolean; err: string; at: string } | null;
};

export default function NotifyCard(p: Props) {
  const [s, save, sp] = useActionState<NState | null, FormData>(saveNotify, null);
  const [t, test, tp] = useActionState<NState | null, FormData>(testNotify, null);
  return (
    <div className="card form">
      <h3>{p.title}</h3>
      <form action={save} className="form">
        <input type="hidden" name="kind" value={p.kind} />
        <label className="fe-row fe-check"><input type="checkbox" name="enabled" defaultChecked={p.enabled} /><span>Bật gửi email cho loại này</span></label>
        <label className="fe-row fe-check"><input type="checkbox" name="include_role" defaultChecked={p.includeRole} /><span>Tự gửi cho mọi tài khoản vai trò “{p.roleLabel}”</span></label>
        <label className="fe-row"><span>Gửi thêm tới (mỗi dòng một email)</span><textarea name="to" rows={3} defaultValue={p.to} placeholder="vd: sales@aron.com.vn" /></label>
        <label className="fe-row"><span>CC cho (mỗi dòng một email)</span><textarea name="cc" rows={3} defaultValue={p.cc} placeholder="vd: giamdoc@aron.com.vn" /></label>
        <button className="btn btn-sm" disabled={sp}>Lưu cấu hình</button>
        {s?.error && <p role="alert" className="note err">{s.error}</p>}
        {s?.ok && <p role="status" className="note ok">{s.ok}</p>}
      </form>
      <form action={test} className="form">
        <input type="hidden" name="kind" value={p.kind} />
        <button className="btn btn-sm btn-outline" disabled={tp}>Gửi thư thử</button>
        {t?.error && <p role="alert" className="note err">{t.error}</p>}
        {t?.ok && <p role="status" className="note ok">{t.ok}</p>}
      </form>
      {p.last && (
        <p className={`note ${p.last.ok ? "ok" : "err"}`}>
          Lần gửi gần nhất ({new Date(p.last.at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}): {p.last.ok ? "thành công" : `lỗi — ${p.last.err}`}
        </p>
      )}
    </div>
  );
}
