-- Giới hạn tần suất cho chatbot (chỉ máy chủ ghi/đọc, không có policy cho người dùng).
create table if not exists public.chat_usage (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  ip_hash text not null
);
create index if not exists chat_usage_ip_time on public.chat_usage (ip_hash, created_at desc);
create index if not exists chat_usage_time on public.chat_usage (created_at desc);
alter table public.chat_usage enable row level security;
