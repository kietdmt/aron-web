import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { defaultLocale, isLocale } from "@/lib/i18n";

function pickLocale(req: NextRequest) {
  const cookie = req.cookies.get("NEXT_LOCALE")?.value;
  if (cookie && isLocale(cookie)) return cookie;
  const al = req.headers.get("accept-language")?.toLowerCase() ?? "";
  if (al.startsWith("vi")) return "vi";
  if (al.startsWith("en")) return "en";
  return defaultLocale;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // --- Khu quản trị: làm mới phiên Supabase + chặn khi chưa đăng nhập ---
  if (pathname.startsWith("/admin")) {
    let res = NextResponse.next({ request: req });
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return new NextResponse("Supabase chưa được cấu hình.", { status: 503 });
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list: { name: string; value: string; options: CookieOptions }[]) => {
          list.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    });
    const { data } = await supabase.auth.getUser();
    const open = ["/admin/login", "/admin/forgot", "/admin/auth/callback"];
    if (!data.user && !open.includes(pathname)) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  }

  // --- Khu công khai: bắt buộc có tiền tố /vi hoặc /en ---
  const first = pathname.split("/")[1];
  if (isLocale(first)) {
    const res = NextResponse.next();
    res.cookies.set("NEXT_LOCALE", first, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    return res;
  }
  const locale = pickLocale(req);
  const dest = req.nextUrl.clone();
  dest.pathname = `/${locale}${pathname === "/" ? "/" : pathname}`;
  return NextResponse.redirect(dest, 308);
}

export const config = {
  // bỏ qua _next, api, file tĩnh (có đuôi), sitemap/robots
  matcher: ["/((?!_next|api|img|.*\\..*).*)"],
};
