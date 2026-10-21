-- ARON website – CMS: 4 vai trò, nháp/xuất bản, phiên bản, nhật ký, media.
-- Chạy SAU 0001_init.sql (SQL Editor → New query → dán → Run).

-- ============ 1. Vai trò ============
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin','editor','hr','sales','viewer'));
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists disabled boolean not null default false;

-- Vai trò hiệu lực: tài khoản bị khoá coi như không có quyền.
create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select case when disabled then 'viewer' else role end from public.profiles where id = auth.uid()
$$;
revoke all on function public.my_role() from public;
grant execute on function public.my_role() to authenticated;

-- ============ 2. Nháp / xuất bản ============
alter table public.page_translations add column if not exists draft_title text;
alter table public.page_translations add column if not exists draft_description text;
alter table public.page_translations add column if not exists draft_blocks jsonb;   -- null = không có bản nháp
alter table public.page_translations add column if not exists draft_updated_at timestamptz;
alter table public.page_translations add column if not exists draft_updated_by uuid references auth.users(id);
alter table public.page_translations add column if not exists published_at timestamptz;
alter table public.page_translations add column if not exists published_by uuid references auth.users(id);

-- Bản nháp chứa nội dung chưa duyệt → KHÔNG được lộ ra công khai.
-- Người ngoài chỉ đọc các cột đã xuất bản qua view riêng; bảng gốc chỉ cho nhân viên.
drop policy if exists pt_public_read on public.page_translations;
drop policy if exists pt_staff_write on public.page_translations;
create policy pt_staff_all on public.page_translations for all to authenticated
  using (public.my_role() in ('admin','editor')) with check (public.my_role() in ('admin','editor'));

create or replace view public.published_page_translations
with (security_invoker = false) as
  select pt.page_id, pt.locale, pt.title, pt.description, pt.blocks
  from public.page_translations pt join public.pages p on p.id = pt.page_id
  where p.published;
grant select on public.published_page_translations to anon, authenticated;

-- ============ 3. Lịch sử phiên bản ============
create table if not exists public.page_versions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  locale text not null check (locale in ('vi','en')),
  title text not null,
  description text not null default '',
  blocks jsonb not null,
  note text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);
create index if not exists page_versions_idx on public.page_versions (page_id, locale, created_at desc);
alter table public.page_versions enable row level security;
create policy pv_staff_read on public.page_versions for select to authenticated using (public.my_role() in ('admin','editor'));
create policy pv_staff_insert on public.page_versions for insert to authenticated with check (public.my_role() in ('admin','editor'));

-- ============ 4. Nhật ký thao tác (chỉ ghi qua server, chỉ admin đọc) ============
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  user_id uuid,
  email text,
  action text not null,
  entity text,
  entity_id text,
  detail jsonb
);
create index if not exists audit_log_at on public.audit_log (at desc);
create index if not exists audit_log_login on public.audit_log (action, email, at desc);
alter table public.audit_log enable row level security;
create policy audit_admin_read on public.audit_log for select to authenticated using (public.my_role() = 'admin');
-- không có policy insert/update/delete: chỉ service role (server) ghi được; không ai sửa/xoá được nhật ký.

-- ============ 5. RLS theo chức năng ============
-- Tuyển dụng: admin, editor, hr
drop policy if exists jobs_staff_write on public.jobs;
create policy jobs_staff_write on public.jobs for all to authenticated
  using (public.my_role() in ('admin','editor','hr')) with check (public.my_role() in ('admin','editor','hr'));
drop policy if exists jobs_public_read on public.jobs;
create policy jobs_public_read on public.jobs for select to anon, authenticated
  using (published or public.my_role() in ('admin','editor','hr'));

-- Liên hệ khách hàng: admin, sales
drop policy if exists leads_staff_read on public.leads;
drop policy if exists leads_staff_update on public.leads;
drop policy if exists leads_admin_delete on public.leads;
create policy leads_read   on public.leads for select to authenticated using (public.my_role() in ('admin','sales'));
create policy leads_update on public.leads for update to authenticated
  using (public.my_role() in ('admin','sales')) with check (public.my_role() in ('admin','sales'));
create policy leads_delete on public.leads for delete to authenticated using (public.my_role() = 'admin');

-- Hồ sơ ứng tuyển: admin, hr
drop policy if exists apps_staff_read on public.applications;
drop policy if exists apps_staff_update on public.applications;
drop policy if exists apps_admin_delete on public.applications;
create policy apps_read   on public.applications for select to authenticated using (public.my_role() in ('admin','hr'));
create policy apps_update on public.applications for update to authenticated
  using (public.my_role() in ('admin','hr')) with check (public.my_role() in ('admin','hr'));
create policy apps_delete on public.applications for delete to authenticated using (public.my_role() = 'admin');

-- Người dùng: mỗi người đọc hồ sơ mình; admin quản lý tất cả (đã có ở 0001)

-- ============ 6. Kho ảnh (Storage) ============
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif'];
-- Công khai chỉ để ĐỌC ảnh. Không có policy ghi: upload đi qua server (đã kiểm tra quyền + loại file).
