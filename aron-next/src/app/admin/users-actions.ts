"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit, tryPerm } from "@/lib/admin/auth";
import { ROLES } from "@/lib/permissions";
import { createServiceClient } from "@/lib/supabase/server";

export type UState = { ok?: string; error?: string };
const NOPERM = "Bạn không có quyền thực hiện thao tác này.";
const role = z.enum(ROLES as [string, ...string[]]);
const password = z.string().min(12, "Mật khẩu tối thiểu 12 ký tự").max(100)
  .refine((p) => /[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p), "Mật khẩu cần chữ hoa, chữ thường và số");

export async function createUser(_p: UState | null, fd: FormData): Promise<UState> {
  const ctx = await tryPerm("users.manage");
  if (!ctx) return { error: NOPERM };
  const d = z.object({ email: z.string().email().max(200), full_name: z.string().max(200), role, password }).safeParse({
    email: String(fd.get("email") ?? "").trim().toLowerCase(),
    full_name: String(fd.get("full_name") ?? "").trim(),
    role: String(fd.get("role")),
    password: String(fd.get("password") ?? ""),
  });
  if (!d.success) return { error: d.error.issues[0].message };
  const db = createServiceClient();
  const { data, error } = await db.auth.admin.createUser({ email: d.data.email, password: d.data.password, email_confirm: true });
  if (error || !data.user) return { error: "Không tạo được tài khoản (email đã tồn tại?)." };
  await db.from("profiles").upsert({ id: data.user.id, email: d.data.email, full_name: d.data.full_name, role: d.data.role });
  await audit(ctx, "user.create", "user", data.user.id, { email: d.data.email, role: d.data.role });
  revalidatePath("/admin/users");
  return { ok: "Đã tạo tài khoản. Người dùng sẽ phải cài xác thực 2 bước ở lần đăng nhập đầu." };
}

export async function updateUser(fd: FormData) {
  const ctx = await tryPerm("users.manage");
  if (!ctx) return;
  const id = z.string().uuid().safeParse(String(fd.get("userId")));
  const r = role.safeParse(String(fd.get("role")));
  if (!id.success || !r.success) return;
  const disabled = fd.get("disabled") === "on";
  if (id.data === ctx.userId) return; // không tự đổi quyền / tự khoá chính mình
  const db = createServiceClient();
  if (r.data !== "admin" || disabled) {
    // luôn giữ ít nhất 1 admin đang hoạt động
    const { data: target } = await db.from("profiles").select("role,disabled").eq("id", id.data).maybeSingle();
    if (target?.role === "admin" && !target.disabled) {
      const { count } = await db.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin").eq("disabled", false);
      if ((count ?? 0) <= 1) return;
    }
  }
  await db.from("profiles").update({ role: r.data, disabled }).eq("id", id.data);
  await db.auth.admin.updateUserById(id.data, { ban_duration: disabled ? "876000h" : "none" });
  await audit(ctx, "user.update", "user", id.data, { role: r.data, disabled });
  revalidatePath("/admin/users");
}

export async function resetPassword(_p: UState | null, fd: FormData): Promise<UState> {
  const ctx = await tryPerm("users.manage");
  if (!ctx) return { error: NOPERM };
  const id = z.string().uuid().safeParse(String(fd.get("userId")));
  const pw = password.safeParse(String(fd.get("password") ?? ""));
  if (!id.success) return { error: "Yêu cầu không hợp lệ." };
  if (!pw.success) return { error: pw.error.issues[0].message };
  const { error } = await createServiceClient().auth.admin.updateUserById(id.data, { password: pw.data });
  if (error) return { error: "Không đổi được mật khẩu." };
  await audit(ctx, "user.reset_password", "user", id.data);
  return { ok: "Đã đặt mật khẩu mới." };
}

/** Gỡ xác thực 2 bước của người dùng (khi họ mất điện thoại). Họ sẽ phải cài lại khi đăng nhập. */
export async function resetMfa(fd: FormData) {
  const ctx = await tryPerm("users.manage");
  if (!ctx) return;
  const id = z.string().uuid().safeParse(String(fd.get("userId")));
  if (!id.success) return;
  const db = createServiceClient();
  const { data } = await db.auth.admin.mfa.listFactors({ userId: id.data });
  for (const f of data?.factors ?? []) await db.auth.admin.mfa.deleteFactor({ id: f.id, userId: id.data });
  await audit(ctx, "user.reset_mfa", "user", id.data);
  revalidatePath("/admin/users");
}
