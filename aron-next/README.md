# ARON Website (Next.js + Supabase)

Viết lại toàn bộ website ARON: Next.js 15 (App Router) + TypeScript + Supabase (Postgres, Auth, RLS), triển khai trên Vercel.

- 28 trang nội dung + 3 trang tuyển dụng, song ngữ `/vi` và `/en`
- Nội dung lưu dạng **block JSON** theo ngôn ngữ trong database; nếu database chưa sẵn sàng, site tự dùng `content/seed/*.json` nên vẫn chạy được
- Form Liên hệ & Ứng tuyển → bảng `leads`, `applications` (Server Action + zod + honeypot + giới hạn tần suất theo IP)
- Khu quản trị `/admin` (đăng nhập Supabase Auth, phân quyền admin/editor/viewer) để xem liên hệ, hồ sơ và đổi trạng thái
- Bảo mật: RLS bật cho mọi bảng, form chỉ ghi qua service role phía server, security headers, `/admin` noindex

## 1. Chạy thử trên máy

```bash
cd aron-next
npm install
cp .env.example .env.local     # điền khoá Supabase (bước 2)
npm run dev                    # http://localhost:3000
```

Chưa có Supabase vẫn xem được toàn bộ trang (đọc từ `content/seed`), chỉ form và `/admin` chưa hoạt động.

## 2. Thiết lập Supabase

1. Tạo project mới trên supabase.com.
2. SQL Editor → New query → dán `supabase/migrations/0001_init.sql` → Run. Sau đó làm tiếp với `supabase/migrations/0002_cms.sql` (vai trò, nháp/xuất bản, nhật ký, kho ảnh).
3. Project Settings → API: chép URL, khoá publishable (anon) và khoá secret (service_role) vào `.env.local`. Khoá secret chỉ để phía server, không đặt tiền tố `NEXT_PUBLIC_`.
4. Nạp nội dung: `node --env-file=.env.local scripts/seed.mjs`. Lệnh này **không ghi đè** nội dung đã có; muốn nạp lại từ đầu thì thêm `--force` (sẽ mất các chỉnh sửa trong admin).
5. Tạo tài khoản quản trị đầu tiên: Authentication → Users → Add user (email + mật khẩu ≥ 12 ký tự). Sau đó SQL Editor:
   ```sql
   update public.profiles set role = 'admin', full_name = 'Tên của bạn' where email = 'email-cua-ban@aron.com.vn';
   ```
6. Authentication → tắt **Allow new users to sign up**. Tài khoản khác do Admin tạo trong `/admin/users`.
7. Authentication → Multi-Factor: bảo đảm TOTP đang bật (mặc định bật).

## Hệ thống quản trị `/admin`

| Vai trò | Quyền |
|---|---|
| Admin | Tất cả: người dùng, xoá dữ liệu, nhật ký |
| Biên tập | Sửa và xuất bản trang, tuyển dụng, logo khách hàng, tải ảnh |
| HR | Tin tuyển dụng, hồ sơ ứng tuyển |
| Kinh doanh | Liên hệ từ website |

Quy trình sửa trang: Trang nội dung → Sửa → chỉnh từng khối (đổi thứ tự, thêm, xoá, tải ảnh) → **Lưu nháp** → **Xem trước** → **Xuất bản**. Mỗi lần xuất bản tạo một phiên bản trong lịch sử và có thể khôi phục.

Bảo mật: đăng nhập bắt buộc xác thực 2 bước (Google/Microsoft Authenticator); khoá 15 phút sau 5 lần sai mật khẩu; phân quyền kiểm tra cả ở mã nguồn lẫn database (RLS); mọi thao tác ghi vào nhật ký không sửa được; dữ liệu khối được kiểm tra chặt (chặn link `javascript:`, chèn CSS/HTML); ảnh tải lên kiểm tra theo nội dung thật, tối đa 5MB; có Content-Security-Policy và các header bảo mật. Nếu một người mất điện thoại, Admin vào Người dùng → "Gỡ 2 bước" để họ cài lại.

## 3. Kiểm tra trước khi đưa lên

```bash
npm run typecheck && npm run build
```

## 4. Triển khai Vercel

1. Đẩy mã lên GitHub (repo **private**), Vercel → Add New Project → chọn repo.
2. Environment Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`.
3. Deploy, rồi gắn tên miền; sau đó trỏ DNS `www.aron.com.vn` về Vercel.
4. Dùng `301` từ các URL cũ nếu cấu trúc đường dẫn khác (các đường dẫn cũ đã được giữ nguyên, chỉ thêm tiền tố `/vi` `/en`).

## Cấu trúc

```
content/seed/        nội dung vi/en trích từ web cũ (pages, jobs, clients)
public/img/          ảnh đã nén (76MB → ~9MB)
scripts/seed.mjs     nạp content/seed vào Supabase
scripts/import-wp.mjs nhập bài viết từ blog WordPress cũ vào mục Tin tức
supabase/migrations/ schema + RLS
src/lib/content.ts   lớp đọc nội dung (Supabase → fallback seed)
src/components/      Header, Footer, Blocks (renderer), forms
src/app/(site)/[locale]/   trang công khai
src/app/admin/       trang quản trị
src/app/actions/     Server Action cho form
```

## Thêm / sửa nội dung

Sửa nội dung trong `/admin` (xem trên). Các kiểu khối: `hero, features, linkList, cta, ctaCollage, carousel, imageList, story, stats, clients, logoStrip, contactForm, applyForm` (xem `src/lib/types.ts`).

## Lưu ý

- Thư mục rỗng `src/app/[locale]` là phần thừa khi dựng khung; có thể xoá (không ảnh hưởng chạy).
- Xoay (rotate) hoặc xoá khoá/ project Supabase của hệ thống cũ nếu các khoá đó từng nằm trong mã nguồn hoặc zip đã gửi đi.


## Tin tức / Blog

1. Chạy thêm `supabase/migrations/0003_blog.sql` trong Supabase (SQL Editor → New query → dán → Run).
2. Trong admin sẽ có mục **Tin tức & Blog** (vai trò Admin và Biên tập). Mỗi bài có tiếng Việt + English, ảnh bìa, chuyên mục, ngày đăng (đặt ngày tương lai để hẹn giờ), trạng thái nháp/xuất bản và khung xem trước.
3. Nhập bài từ blog cũ (tuỳ chọn, chạy trên máy có internet): `node --env-file=.env.local scripts/import-wp.mjs`
   Lệnh này tải cả ảnh về kho ảnh Supabase, không ghi đè bài đã có (thêm `--force` nếu muốn ghi đè).
