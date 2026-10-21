import { getCtx } from "@/lib/admin/auth";
import { can, ROLE_LABEL, type Perm } from "@/lib/permissions";
import AdminNav, { type NavGroup, type NavLink } from "@/components/admin/AdminNav";
import { logout } from "../actions";

type L = NavLink & { perm?: Perm };
const GROUPS: { label: string; links: L[] }[] = [
  { label: "", links: [{ href: "/admin", label: "Tổng quan", icon: "space_dashboard" }] },
  {
    label: "Nội dung",
    links: [
      { href: "/admin/pages", label: "Trang nội dung", icon: "web", perm: "pages.edit" },
      { href: "/admin/blog", label: "Tin tức & Blog", icon: "newspaper", perm: "blog.edit" },
      { href: "/admin/jobs", label: "Tuyển dụng", icon: "work", perm: "jobs.edit" },
      { href: "/admin/clients", label: "Khách hàng (logo)", icon: "apartment", perm: "clients.edit" },
    ],
  },
  {
    label: "Tương tác",
    links: [
      { href: "/admin/leads", label: "Liên hệ từ website", icon: "contact_mail", perm: "leads.view" },
      { href: "/admin/applications", label: "Hồ sơ ứng tuyển", icon: "badge", perm: "applications.view" },
    ],
  },
  {
    label: "Hệ thống",
    links: [
      { href: "/admin/users", label: "Người dùng & quyền", icon: "admin_panel_settings", perm: "users.manage" },
      { href: "/admin/audit", label: "Nhật ký thao tác", icon: "history", perm: "audit.view" },
    ],
  },
];

const initials = (s: string) =>
  s.split(/[\s@.]+/).filter(Boolean).slice(-2).map((w) => w[0]?.toUpperCase()).join("") || "A";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getCtx();
  const groups: NavGroup[] = GROUPS.map((g) => ({
    label: g.label,
    links: g.links.filter((l) => !l.perm || can(ctx.role, l.perm)).map(({ href, label, icon }) => ({ href, label, icon })),
  })).filter((g) => g.links.length);
  const who = ctx.name || ctx.email;
  return (
    <div className="shell">
      <aside className="side">
        <div className="side-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/Logo.svg" alt="ARON" width={140} height={39} />
          <span>Quản trị website</span>
        </div>
        <AdminNav groups={groups} />
        <a className="side-site" href="/" target="_blank" rel="noopener noreferrer">
          <span className="material-symbols-outlined" aria-hidden="true">open_in_new</span> Xem website
        </a>
      </aside>
      <div className="main">
        <header className="topbar">
          <span className="topbar-date">
            {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" })}
          </span>
          <div className="topbar-user">
            <span className="avatar" aria-hidden="true">{initials(who)}</span>
            <span className="who"><strong>{who}</strong><small>{ROLE_LABEL[ctx.role]}</small></span>
            <form action={logout}>
              <button className="icon-btn" type="submit" title="Đăng xuất" aria-label="Đăng xuất">
                <span className="material-symbols-outlined">logout</span>
              </button>
            </form>
          </div>
        </header>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
