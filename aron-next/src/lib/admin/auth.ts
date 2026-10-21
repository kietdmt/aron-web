import "server-only";
import { redirect } from "next/navigation";
import { createServiceClient, createSessionClient } from "@/lib/supabase/server";
import { can, isRole, type Perm, type Role } from "@/lib/permissions";

export type Ctx = {
  supabase: Awaited<ReturnType<typeof createSessionClient>>;
  userId: string;
  email: string;
  name: string;
  role: Role;
};

/**
 * Lấy người dùng hiện tại. Mặc định BẮT BUỘC đã qua xác thực 2 bước (AAL2).
 * `mfa: false` chỉ dùng cho chính trang cài đặt/nhập mã 2 bước.
 */
export async function getCtx(opts: { mfa?: boolean } = {}): Promise<Ctx> {
  const supabase = await createSessionClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect("/admin/login");

  if (opts.mfa !== false) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel !== "aal2") redirect("/admin/mfa");
  }

  const { data: p } = await supabase.from("profiles").select("role,disabled,email,full_name").eq("id", user.id).maybeSingle();
  const role: Role = p && !p.disabled && isRole(p.role) ? p.role : "viewer";
  return { supabase, userId: user.id, email: p?.email ?? user.email ?? "", name: p?.full_name ?? "", role };
}

/** Dùng ở đầu mỗi trang/Server Action: không đủ quyền → về trang chủ admin. */
export async function requirePerm(perm: Perm): Promise<Ctx> {
  const ctx = await getCtx();
  if (!can(ctx.role, perm)) redirect("/admin?denied=1");
  return ctx;
}

/** Cho Server Action: trả null nếu thiếu quyền (chưa đăng nhập/chưa MFA thì vẫn redirect). */
export async function tryPerm(perm: Perm): Promise<Ctx | null> {
  const ctx = await getCtx();
  return can(ctx.role, perm) ? ctx : null;
}

/** Cho Server Action trả lỗi thay vì redirect. */
export async function assertPerm(perm: Perm): Promise<Ctx> {
  const ctx = await getCtx();
  if (!can(ctx.role, perm)) throw new Error("forbidden");
  return ctx;
}

export async function audit(
  ctx: { userId?: string; email?: string },
  action: string,
  entity?: string,
  entityId?: string,
  detail?: Record<string, unknown>,
) {
  try {
    await createServiceClient().from("audit_log").insert({
      user_id: ctx.userId ?? null,
      email: ctx.email ?? null,
      action,
      entity: entity ?? null,
      entity_id: entityId ?? null,
      detail: detail ?? null,
    });
  } catch (e) {
    console.error("audit failed", e);
  }
}
