"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit, tryPerm } from "@/lib/admin/auth";
import { createServiceClient, createSessionClient } from "@/lib/supabase/server";

const MAX_FAILS = 5;
const LOCK_MIN = 15;

export async function login(_prev: { error?: string } | null, fd: FormData) {
  const parsed = z.object({ email: z.string().email().max(200), password: z.string().min(1).max(200) }).safeParse({
    email: String(fd.get("email") ?? "").trim().toLowerCase(),
    password: String(fd.get("password") ?? ""),
  });
  if (!parsed.success) return { error: "Email hoặc mật khẩu không đúng." };
  const { email, password } = parsed.data;

  const ip = ((await headers()).get("x-forwarded-for") ?? "").split(",")[0].trim().slice(0, 64);
  const db = createServiceClient();

  // Khoá tạm theo email sau nhiều lần sai (chống dò mật khẩu).
  const since = new Date(Date.now() - LOCK_MIN * 60_000).toISOString();
  const { count } = await db.from("audit_log").select("id", { count: "exact", head: true }).eq("action", "login.fail").eq("email", email).gte("at", since);
  if ((count ?? 0) >= MAX_FAILS) {
    return { error: `Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ${LOCK_MIN} phút.` };
  }

  const supabase = await createSessionClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    await audit({ email }, "login.fail", "auth", undefined, { ip });
    return { error: "Email hoặc mật khẩu không đúng." }; // thông báo chung, không lộ tài khoản có tồn tại
  }
  await audit({ userId: data.user.id, email }, "login.ok", "auth", undefined, { ip });
  redirect("/admin");
}

export async function logout() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

const LEAD = ["new", "contacted", "closed"] as const;
const APP = ["new", "reviewing", "interview", "rejected", "hired"] as const;

export async function setStatus(fd: FormData) {
  const table = String(fd.get("table"));
  const id = z.string().uuid().safeParse(String(fd.get("id")));
  const status = String(fd.get("status"));
  if (!id.success) return;
  if (table === "leads" && (LEAD as readonly string[]).includes(status)) {
    const ctx = await tryPerm("leads.edit");
    if (!ctx) return;
    await ctx.supabase.from("leads").update({ status }).eq("id", id.data);
    await audit(ctx, "lead.status", "lead", id.data, { status });
    revalidatePath("/admin/leads");
  } else if (table === "applications" && (APP as readonly string[]).includes(status)) {
    const ctx = await tryPerm("applications.edit");
    if (!ctx) return;
    await ctx.supabase.from("applications").update({ status }).eq("id", id.data);
    await audit(ctx, "application.status", "application", id.data, { status });
    revalidatePath("/admin/applications");
  }
}
