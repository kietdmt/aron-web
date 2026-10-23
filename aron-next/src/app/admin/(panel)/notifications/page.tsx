import { requirePerm } from "@/lib/admin/auth";
import { KIND_META, smtpConfig, type NotifyKind } from "@/lib/mail";
import NotifyCard from "./NotifyCard";

export const dynamic = "force-dynamic";
export const maxDuration = 30;
type Row = { kind: NotifyKind; enabled: boolean; include_role: boolean; to_emails: string[]; cc_emails: string[]; last_status: string | null; last_error: string | null; last_at: string | null };

export default async function Notifications() {
  const ctx = await requirePerm("notify.manage");
  const { data, error } = await ctx.supabase.from("notify_rules").select("*");
  const rows = (data ?? []) as Row[];
  const cfg = smtpConfig();
  return (
    <>
      <h1>Thông báo email</h1>
      <p className="muted">Khi khách gửi form trên website, hệ thống tự gửi email cho đúng bộ phận. Người nhận gồm: tài khoản đang hoạt động của vai trò tương ứng (nếu bật), cộng thêm các địa chỉ bạn nhập; người ở mục CC nhận bản sao.</p>
      {!cfg && <p role="alert" className="note err">Chưa cấu hình máy chủ gửi email. Cần đặt các biến SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM trong Vercel (xem hướng dẫn), rồi Redeploy.</p>}
      {error && <p role="alert" className="note err">Chưa có bảng cấu hình. Hãy chạy file supabase/migrations/0004_notify.sql trong Supabase → SQL Editor.</p>}
      <div className="two-col">
        {(Object.keys(KIND_META) as NotifyKind[]).map((k) => {
          const r = rows.find((x) => x.kind === k);
          return (
            <NotifyCard key={k} kind={k} title={KIND_META[k].title} roleLabel={KIND_META[k].roleLabel}
              enabled={r?.enabled ?? true} includeRole={r?.include_role ?? true}
              to={(r?.to_emails ?? []).join("\n")} cc={(r?.cc_emails ?? []).join("\n")}
              last={r?.last_status ? { ok: r.last_status === "ok", err: r.last_error ?? "", at: r.last_at ?? "" } : null} />
          );
        })}
      </div>
    </>
  );
}
