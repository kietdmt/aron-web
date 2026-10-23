import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { isEmail, sendMail, type SmtpConfig } from "@/lib/smtp";

export type NotifyKind = "lead" | "application";
export const KIND_META: Record<NotifyKind, { title: string; role: "sales" | "hr"; roleLabel: string; path: string }> = {
  lead: { title: "Liên hệ & yêu cầu demo", role: "sales", roleLabel: "Kinh doanh", path: "/admin/leads" },
  application: { title: "Hồ sơ ứng tuyển", role: "hr", roleLabel: "Nhân sự (HR)", path: "/admin/applications" },
};

export function smtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim() ?? "";
  const pass = process.env.SMTP_PASS ?? "";
  const from = process.env.SMTP_FROM?.trim() || user;
  if (!host || !from || !user || !pass) return null;
  const port = Number(process.env.SMTP_PORT || 587);
  return { host, port: Number.isFinite(port) ? port : 587, user, pass, from };
}

type Rule = { enabled: boolean; include_role: boolean; to_emails: string[]; cc_emails: string[] };

export async function resolveRecipients(kind: NotifyKind, rule?: Rule | null) {
  const db = createServiceClient();
  const r = rule ?? ((await db.from("notify_rules").select("enabled,include_role,to_emails,cc_emails").eq("kind", kind).maybeSingle()).data as Rule | null);
  if (!r || !r.enabled) return null;
  const norm = (a: string[]) => [...new Set(a.map((x) => x.trim().toLowerCase()).filter(isEmail))];
  let to = norm(r.to_emails ?? []);
  if (r.include_role) {
    const { data } = await db.from("profiles").select("email").eq("role", KIND_META[kind].role).eq("disabled", false);
    to = norm([...to, ...(data ?? []).map((p: { email: string | null }) => p.email ?? "")]);
  }
  let cc = norm(r.cc_emails ?? []).filter((x) => !to.includes(x));
  if (to.length === 0 && cc.length > 0) { to = cc; cc = []; }
  return to.length ? { to, cc } : null;
}

async function record(kind: NotifyKind, ok: boolean, err?: string) {
  try {
    await createServiceClient().from("notify_rules")
      .update({ last_status: ok ? "ok" : "error", last_error: ok ? null : (err ?? "").slice(0, 300), last_at: new Date().toISOString() })
      .eq("kind", kind);
  } catch { /* không để lỗi ghi trạng thái ảnh hưởng người gửi form */ }
}

const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");

export function buildBody(kind: NotifyKind, rows: [string, string][]) {
  const lines = rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v.slice(0, 4000)}`);
  const link = siteUrl() ? `\n\nXem và xử lý trong trang quản trị:\n${siteUrl()}${KIND_META[kind].path}` : "";
  return `Website ARON vừa nhận được: ${KIND_META[kind].title.toLowerCase()} mới.\n\n${lines.join("\n")}${link}\n\n— Thư tự động từ website ARON, vui lòng không trả lời thư này.`;
}

/** Gửi thông báo; KHÔNG BAO GIỜ ném lỗi (người dùng form không bị ảnh hưởng nếu email lỗi). */
export async function notifyNew(kind: NotifyKind, subject: string, rows: [string, string][], replyTo?: string) {
  try {
    const cfg = smtpConfig();
    if (!cfg) return;
    const rec = await resolveRecipients(kind);
    if (!rec) return;
    await sendMail(cfg, { to: rec.to, cc: rec.cc, replyTo, subject, text: buildBody(kind, rows) }, 8000);
    await record(kind, true);
  } catch (e) {
    console.error("notifyNew", kind, e);
    await record(kind, false, e instanceof Error ? e.message : String(e));
  }
}
