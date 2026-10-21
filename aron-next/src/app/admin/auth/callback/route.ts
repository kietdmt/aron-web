import { NextResponse, type NextRequest } from "next/server";
import { createSessionClient } from "@/lib/supabase/server";

/** Link trong email đặt lại mật khẩu trỏ về đây: đổi mã một lần thành phiên tạm rồi sang trang đặt mật khẩu mới. */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (code) {
    const supabase = await createSessionClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/admin/reset", req.url));
  }
  return NextResponse.redirect(new URL("/admin/login?error=link", req.url));
}
