-- ARON website – Tin tức / Blog.
-- Chạy SAU 0002_cms.sql (SQL Editor → New query → dán → Run).

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 160),
  published boolean not null default false,          -- false = bản nháp
  published_at timestamptz not null default now(),   -- đặt ngày tương lai = hẹn giờ đăng
  category text not null default '',
  author text not null default '',
  cover text not null default '',
  translations jsonb not null default '{}'::jsonb,   -- { vi: {title, excerpt, body}, en: {...} }
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
create index if not exists posts_pub_idx on public.posts (published, published_at desc);

create or replace function public.touch_post() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists posts_touch on public.posts;
create trigger posts_touch before update on public.posts for each row execute function public.touch_post();

alter table public.posts enable row level security;
-- Công khai chỉ đọc bài đã xuất bản và đã đến giờ đăng.
drop policy if exists posts_public_read on public.posts;
create policy posts_public_read on public.posts for select to anon, authenticated
  using ((published and published_at <= now()) or public.my_role() in ('admin','editor'));
-- Ghi: admin + biên tập. Xoá: chỉ admin.
drop policy if exists posts_staff_insert on public.posts;
create policy posts_staff_insert on public.posts for insert to authenticated
  with check (public.my_role() in ('admin','editor'));
drop policy if exists posts_staff_update on public.posts;
create policy posts_staff_update on public.posts for update to authenticated
  using (public.my_role() in ('admin','editor')) with check (public.my_role() in ('admin','editor'));
drop policy if exists posts_admin_delete on public.posts;
create policy posts_admin_delete on public.posts for delete to authenticated
  using (public.my_role() = 'admin');
