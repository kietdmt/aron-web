-- Thông báo email khi có liên hệ / yêu cầu demo / hồ sơ ứng tuyển mới.
-- Chỉ Quản trị viên xem và sửa. Máy chủ (service role) đọc để gửi thư.
create table if not exists public.notify_rules (
  kind text primary key check (kind in ('lead','application')),
  enabled boolean not null default true,
  include_role boolean not null default true,      -- tự thêm mọi tài khoản đang hoạt động của vai trò tương ứng (lead→sales, application→hr)
  to_emails text[] not null default '{}',
  cc_emails text[] not null default '{}',
  last_status text,
  last_error text,
  last_at timestamptz,
  updated_at timestamptz not null default now(),
  updated_by uuid
);
alter table public.notify_rules enable row level security;
drop policy if exists notify_admin_all on public.notify_rules;
create policy notify_admin_all on public.notify_rules for all to authenticated
  using (public.my_role() = 'admin') with check (public.my_role() = 'admin');
insert into public.notify_rules (kind) values ('lead'), ('application') on conflict do nothing;
