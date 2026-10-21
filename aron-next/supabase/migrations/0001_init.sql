-- ARON website – schema + RLS. Chạy trong Supabase → SQL Editor (hoặc `supabase db push`).

create extension if not exists pgcrypto;

-- ============ Vai trò nhân viên ============
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'viewer' check (role in ('admin','editor','viewer')),
  created_at timestamptz not null default now()
);

-- Tự tạo profile (role viewer) khi có user mới. Nâng quyền bằng tay: xem README.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email) on conflict do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;
revoke all on function public.my_role() from public;
grant execute on function public.my_role() to authenticated;

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ============ Nội dung ============
create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,                       -- vd: '/', '/about-us/', '/services/oracle-database/'
  kind text not null check (kind in ('home','about','career','apply','clients','contact','industry','solution','service')),
  published boolean not null default true,
  updated_at timestamptz not null default now()
);
create table if not exists public.page_translations (
  page_id uuid not null references public.pages(id) on delete cascade,
  locale text not null check (locale in ('vi','en')),
  title text not null,
  description text not null default '',
  blocks jsonb not null default '[]'::jsonb,
  primary key (page_id, locale)
);
create table if not exists public.jobs (
  slug text primary key,                           -- '/career/business-development/'
  published boolean not null default true,
  translations jsonb not null,                     -- {vi:{title,sections,facts,apply}, en:{...}}
  updated_at timestamptz not null default now()
);
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  sort int not null default 0,
  name text not null,
  logo text not null,
  industry jsonb not null default '{}'::jsonb,     -- {vi,en}
  location jsonb not null default '{}'::jsonb,
  published boolean not null default true
);
create trigger pages_touch before update on public.pages for each row execute function public.touch_updated_at();
create trigger jobs_touch before update on public.jobs for each row execute function public.touch_updated_at();

-- ============ Form gửi từ website ============
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null, phone text not null, email text, company text, message text,
  locale text not null default 'vi',
  status text not null default 'new' check (status in ('new','contacted','closed')),
  ip_hash text
);
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null, email text not null, phone text not null,
  cv_url text, cover_letter text, job_slug text,
  locale text not null default 'vi',
  status text not null default 'new' check (status in ('new','reviewing','interview','rejected','hired')),
  ip_hash text
);
create index if not exists leads_ip_time on public.leads (ip_hash, created_at desc);
create index if not exists applications_ip_time on public.applications (ip_hash, created_at desc);

-- ============ RLS ============
alter table public.profiles          enable row level security;
alter table public.pages             enable row level security;
alter table public.page_translations enable row level security;
alter table public.jobs              enable row level security;
alter table public.clients           enable row level security;
alter table public.leads             enable row level security;
alter table public.applications      enable row level security;

-- profiles: mỗi người đọc được hồ sơ của mình; admin đọc/sửa tất cả
create policy profiles_self_read on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_admin_all on public.profiles for all to authenticated
  using (public.my_role() = 'admin') with check (public.my_role() = 'admin');

-- nội dung: công khai đọc bản đã xuất bản; admin/editor ghi
create policy pages_public_read on public.pages for select to anon, authenticated using (published or public.my_role() in ('admin','editor'));
create policy pages_staff_write on public.pages for all to authenticated
  using (public.my_role() in ('admin','editor')) with check (public.my_role() in ('admin','editor'));

create policy pt_public_read on public.page_translations for select to anon, authenticated
  using (exists (select 1 from public.pages p where p.id = page_id and (p.published or public.my_role() in ('admin','editor'))));
create policy pt_staff_write on public.page_translations for all to authenticated
  using (public.my_role() in ('admin','editor')) with check (public.my_role() in ('admin','editor'));

create policy jobs_public_read on public.jobs for select to anon, authenticated using (published or public.my_role() in ('admin','editor'));
create policy jobs_staff_write on public.jobs for all to authenticated
  using (public.my_role() in ('admin','editor')) with check (public.my_role() in ('admin','editor'));

create policy clients_public_read on public.clients for select to anon, authenticated using (published or public.my_role() in ('admin','editor'));
create policy clients_staff_write on public.clients for all to authenticated
  using (public.my_role() in ('admin','editor')) with check (public.my_role() in ('admin','editor'));

-- leads/applications: KHÔNG có policy insert cho anon → chỉ Server Action (service role) ghi được.
-- Nhân viên (admin/editor) xem và đổi trạng thái; chỉ admin xoá.
create policy leads_staff_read on public.leads for select to authenticated using (public.my_role() in ('admin','editor'));
create policy leads_staff_update on public.leads for update to authenticated
  using (public.my_role() in ('admin','editor')) with check (public.my_role() in ('admin','editor'));
create policy leads_admin_delete on public.leads for delete to authenticated using (public.my_role() = 'admin');

create policy apps_staff_read on public.applications for select to authenticated using (public.my_role() in ('admin','editor'));
create policy apps_staff_update on public.applications for update to authenticated
  using (public.my_role() in ('admin','editor')) with check (public.my_role() in ('admin','editor'));
create policy apps_admin_delete on public.applications for delete to authenticated using (public.my_role() = 'admin');
