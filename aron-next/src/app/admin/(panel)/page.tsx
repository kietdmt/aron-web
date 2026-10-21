import Link from "next/link";
import { getCtx } from "@/lib/admin/auth";
import { can, ROLE_LABEL } from "@/lib/permissions";

export const dynamic = "force-dynamic";
const fmt = (d: string) => new Date(d).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const ctx = await getCtx();
  const sp = await searchParams;
  const sb = ctx.supabase;

  const stats: { label: string; value: number; href: string; icon: string; tone: string }[] = [];
  let leads: { id: string; name: string; company: string | null; created_at: string; status: string }[] = [];
  let apps: { id: string; full_name: string; job_slug: string | null; created_at: string; status: string }[] = [];
  let audit: { id: number; at: string; email: string | null; action: string }[] = [];

  if (can(ctx.role, "leads.view")) {
    const { count } = await sb.from("leads").select("id", { count: "exact", head: true }).eq("status", "new");
    stats.push({ label: "Liên hệ mới", value: count ?? 0, href: "/admin/leads", icon: "contact_mail", tone: "orange" });
    leads = (await sb.from("leads").select("id,name,company,created_at,status").order("created_at", { ascending: false }).limit(5)).data ?? [];
  }
  if (can(ctx.role, "applications.view")) {
    const { count } = await sb.from("applications").select("id", { count: "exact", head: true }).eq("status", "new");
    stats.push({ label: "Hồ sơ ứng tuyển mới", value: count ?? 0, href: "/admin/applications", icon: "badge", tone: "blue" });
    apps = (await sb.from("applications").select("id,full_name,job_slug,created_at,status").order("created_at", { ascending: false }).limit(5)).data ?? [];
  }
  if (can(ctx.role, "pages.edit")) {
    const { count } = await sb.from("page_translations").select("page_id", { count: "exact", head: true }).not("draft_blocks", "is", null);
    stats.push({ label: "Trang đang có bản nháp", value: count ?? 0, href: "/admin/pages", icon: "edit_note", tone: "violet" });
  }
  if (can(ctx.role, "audit.view")) {
    audit = (await sb.from("audit_log").select("id,at,email,action").order("at", { ascending: false }).limit(6)).data ?? [];
  }

  const actions = [
    { href: "/admin/pages", label: "Sửa nội dung trang", icon: "web", perm: "pages.edit" as const },
    { href: "/admin/jobs", label: "Đăng tin tuyển dụng", icon: "work", perm: "jobs.edit" as const },
    { href: "/admin/clients", label: "Thêm logo khách hàng", icon: "apartment", perm: "clients.edit" as const },
    { href: "/admin/users", label: "Thêm người dùng", icon: "person_add", perm: "users.manage" as const },
  ].filter((a) => can(ctx.role, a.perm));

  const hour = Number(new Date().toLocaleString("en-GB", { hour: "2-digit", hour12: false, timeZone: "Asia/Ho_Chi_Minh" }));
  const greet = hour < 11 ? "Chào buổi sáng" : hour < 14 ? "Chào buổi trưa" : hour < 18 ? "Chào buổi chiều" : "Chào buổi tối";

  return (
    <>
      <section className="hero-card">
        <div>
          <p className="hero-eyebrow">{ROLE_LABEL[ctx.role]}</p>
          <h1>{greet}{ctx.name ? `, ${ctx.name.split(" ").slice(-1)[0]}` : ""} 👋</h1>
          <p>Quản lý nội dung, tuyển dụng và liên hệ khách hàng của website ARON tại một nơi.</p>
        </div>
        <div className="hero-art" aria-hidden="true"><span /><span /><span /></div>
      </section>

      {sp.denied && <p className="note err">Bạn không có quyền vào chức năng đó.</p>}
      {ctx.role === "viewer" && <p className="note err">Tài khoản chưa được cấp quyền. Liên hệ quản trị viên.</p>}

      {stats.length > 0 && (
        <div className="stat-cards">
          {stats.map((c) => (
            <Link key={c.href} href={c.href} className={`stat-card tone-${c.tone}`}>
              <span className="stat-icon"><span className="material-symbols-outlined" aria-hidden="true">{c.icon}</span></span>
              <strong>{c.value}</strong>
              <span>{c.label}</span>
            </Link>
          ))}
        </div>
      )}

      {actions.length > 0 && (
        <>
          <h2 className="section-h">Thao tác nhanh</h2>
          <div className="quick">
            {actions.map((a) => (
              <Link key={a.href} href={a.href} className="quick-item">
                <span className="material-symbols-outlined" aria-hidden="true">{a.icon}</span>
                {a.label}
                <span className="material-symbols-outlined go" aria-hidden="true">arrow_forward</span>
              </Link>
            ))}
          </div>
        </>
      )}

      <div className="two-col">
        {leads.length > 0 && (
          <section className="card feed">
            <h3>Liên hệ gần đây</h3>
            <ul>{leads.map((l) => (
              <li key={l.id}><span className="dot" /><div><strong>{l.name}</strong><small>{l.company || "—"}</small></div><time>{fmt(l.created_at)}</time></li>
            ))}</ul>
            <Link href="/admin/leads" className="more">Xem tất cả →</Link>
          </section>
        )}
        {apps.length > 0 && (
          <section className="card feed">
            <h3>Ứng viên gần đây</h3>
            <ul>{apps.map((a) => (
              <li key={a.id}><span className="dot blue" /><div><strong>{a.full_name}</strong><small>{a.job_slug || "—"}</small></div><time>{fmt(a.created_at)}</time></li>
            ))}</ul>
            <Link href="/admin/applications" className="more">Xem tất cả →</Link>
          </section>
        )}
        {audit.length > 0 && (
          <section className="card feed">
            <h3>Hoạt động hệ thống</h3>
            <ul>{audit.map((a) => (
              <li key={a.id}><span className={`dot ${a.action.endsWith(".fail") ? "red" : "violet"}`} /><div><strong>{a.action}</strong><small>{a.email || "—"}</small></div><time>{fmt(a.at)}</time></li>
            ))}</ul>
            <Link href="/admin/audit" className="more">Xem nhật ký →</Link>
          </section>
        )}
      </div>
    </>
  );
}
