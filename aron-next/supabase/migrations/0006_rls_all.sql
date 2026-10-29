-- Bật Row-Level Security cho MỌI bảng trong schema public (an toàn: chạy lại nhiều lần không sao).
-- Bảng đã có policy (pages, posts, jobs, clients...) vẫn hoạt động như cũ.
-- Bảng nào chưa có policy sẽ bị chặn với người ngoài; website dùng khoá server nên vẫn đọc/ghi bình thường.
do $$
declare r record;
begin
  for r in
    select schemaname, tablename from pg_tables
    where schemaname = 'public'
  loop
    execute format('alter table %I.%I enable row level security', r.schemaname, r.tablename);
  end loop;
end $$;

-- Kiểm tra: kết quả mong đợi là mọi dòng đều rls_enabled = true
select tablename, rowsecurity as rls_enabled from pg_tables where schemaname = 'public' order by tablename;
