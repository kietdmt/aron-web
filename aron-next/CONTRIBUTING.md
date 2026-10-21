# Hướng dẫn cùng phát triển

## Cài đặt
1. `git clone` repo, rồi `npm install`.
2. Sao chép `.env.example` thành `.env.local` và điền khoá Supabase (xin từ quản trị dự án; **không bao giờ commit `.env.local`**).
3. `npm run dev` → http://localhost:3000. Chưa có khoá Supabase vẫn chạy được với nội dung mẫu (không đăng nhập admin được).

## Quy trình làm việc
- Nhánh `main` luôn ở trạng thái chạy được và được bảo vệ: **không push thẳng**, mọi thay đổi đi qua Pull Request.
- Tạo nhánh từ `main`: `feature/ten-tinh-nang` hoặc `fix/ten-loi`. Mỗi PR một việc, nhỏ gọn.
- PR cần: CI xanh (typecheck + build) và ít nhất 1 người duyệt.

## Cấu trúc
- `src/app/(site)` giao diện công khai; `src/app/admin` trang quản trị (đã yêu cầu đăng nhập + xác thực 2 lớp).
- `src/components` thành phần giao diện; `src/lib` logic (nội dung, quyền, kiểm tra dữ liệu).
- `src/styles/globals.css` giao diện website; `admin.css` giao diện quản trị.
- `supabase/migrations` thay đổi cơ sở dữ liệu — **chỉ thêm file mới (0004_..., 0005_...), không sửa file cũ**.
- `content/seed` nội dung mẫu; `scripts` công cụ nạp/nhập dữ liệu.

## Quy tắc bảo mật
- Quyền truy cập luôn kiểm tra ở máy chủ (`requirePerm`/`tryPerm`) **và** ở RLS của cơ sở dữ liệu; không chỉ ẩn nút trên giao diện.
- Dữ liệu từ form phải qua kiểm tra (zod). Không dùng `dangerouslySetInnerHTML`.
- Khoá `SUPABASE_SERVICE_ROLE_KEY` chỉ dùng trong Server Action / Route Handler, không đưa ra trình duyệt.
