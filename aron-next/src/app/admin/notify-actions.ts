"use server";
import { revalidatePath } from "next/cache";
import { audit, tryPerm } from "@/lib/admin/auth";
import { isEmail, sendMail } from "@/lib/smtp";
import { buildBody, KIND_META, resolveRecipients, smtpConfig, type NotifyKind } from "@/lib/mail";

export type NState = { ok?: string; error?: string };
const NOPERM = "Bạn không có quyền thực hiện thao tác này.";
const kindOf = (v: FormDataEntryValue | null): NotifyKind | null => (v === "lead" || v === "application" ? v : null);

function parseList(raw: string, label: string): { list?: string[]; error?: string } {
  const items = [...new Set(raw.split(/[\s,;]+/).map((s) => s.trim().toLowerCase()).filter(Boolean))];
  const bad = items.find((x) => !isEmail(x));
  if (bad) return { error: `${label}: "${bad}" không phải địa chỉ email hợp lệ.` };
  if (items.length > 10) return { error: `${label}: tối đa 10 địa chỉ.` };
  return { list: items };
}

export async function saveNotify(_p: NState | null, fd: FormData): Promise<NState> {
  const ctx = await tryPerm("notify.manage");
  if (!ctx) return { error: NOPERM };
  const kind = kindOf(fd.get("kind"));
  if (!kind) return { error: "Loại thông báo không hợp lệ." };
  const to = parseList(String(fd.get("to") ?? ""), "Người nhận");
  if (to.error) return { error: to.error };
  const cc = parseList(String(fd.get("cc") ?? ""), "CC");
  if (cc.error) return { error: cc.error };
  const { error } = await ctx.supabase.from("notify_rules").upsert({
    kind, enabled: fd.get("enabled") === "on", include_role: fd.get("include_role") === "on",
    to_emails: to.list, cc_emails: cc.list, updated_at: new Date().toISOString(), updated_by: ctx.userId,
  });
  if (error) return { error: "Không lưu được. Hãy chắc chắn đã chạy file 0004_notify.sql trong Supabase." };
  await audit(ctx, "notify.save", "notify_rules", kind, { to: to.list, cc: cc.list });
  revalidatePath("/admin/notifications");
  return { ok: "Đã lưu cấu hình." };
}

export async function testNotify(_p: NState | null, fd: FormData): Promise<NState> {
  const ctx = await tryPerm("notify.manage");
  if (!ctx) return { error: NOPERM };
  const kind = kindOf(fd.get("kind"));
  if (!kind) return { error: "Loại thông báo không hợp lệ." };
  const cfg = smtpConfig();
  if (!cfg) return { error: "Chưa cấu hình máy chủ gửi email (SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM trên Vercel)." };
  const rec = await resolveRecipients(kind);
  if (!rec) return { error: "Chưa có người nhận (hoặc thông báo đang tắt). Hãy lưu cấu hình trước rồi gửi thử." };
  try {
    await sendMail(cfg, {
      to: rec.to, cc: rec.cc, subject: `[ARON Website] THƯ THỬ — ${KIND_META[kind].title}`,
      text: buildBody(kind, [["Ghi chú", "Đây là thư gửi thử từ trang quản trị, không phải dữ liệu thật."], ["Người gửi thử", ctx.email]]),
    }, 25000);
    await audit(ctx, "notify.test", "notify_rules", kind);
    return { ok: `Đã gửi thư thử tới: ${rec.to.join(", ")}${rec.cc.length ? ` (CC: ${rec.cc.join(", ")})` : ""}. Hãy kiểm tra hộp thư (cả thư rác).` };
  } catch (e) {
    return { error: `Gửi không được: ${e instanceof Error ? e.message : "lỗi không xác định"}` };
  }
}
