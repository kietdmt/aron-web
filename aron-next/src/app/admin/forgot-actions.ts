"use server";
import { headers } from "next/headers";
import { z } from "zod";
import { audit } from "@/lib/admin/auth";
import { createServiceClient, createSessionClient } from "@/lib/supabase/server";

export type FState = { ok?: string; error?: string };
const MAX_PER_HOUR = 3;

/** Gửi email đặt lại mật khẩu. Luôn trả cùng một thông báo để không lộ email nào tồn tại. */
export async function requestReset(_p: FState | null, fd: FormData): Promise<FState> {
  const parsed = z.string().email().max(200).safeParse(String(fd.get("email") ?? "").trim().toLowerCase());
  const generic = { ok: "Nếu email này có tài khoản, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu. Hãy kiểm tra hộp thư (cả thư rác) và mở link trên CÙNG trình duyệt này." };
  if (!parsed.success) return { error: "Email không hợp lệ." };
  const email = parsed.data;

  const db = createServiceClient();
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await db.from("audit_log").select("id", { count: "exact", head: true }).eq("action", "password.reset_request").eq("email", email).gte("at", since);
  if ((count ?? 0) >= MAX_PER_HOUR) return generic;

  const h = await headers();
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.startsWith("http") && process.env.NODE_ENV === "production"
    ? process.env.NEXT_PUBLIC_SITE_URL
    : `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const supabase = await createSessionClient();
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/admin/auth/callback` });
  await audit({ email }, "password.reset_request", "auth");
  return generic;
}
