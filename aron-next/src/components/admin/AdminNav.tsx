"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavLink = { href: string; label: string; icon: string };
export type NavGroup = { label: string; links: NavLink[] };

export default function AdminNav({ groups }: { groups: NavGroup[] }) {
  const path = usePathname();
  return (
    <nav className="side-nav" aria-label="Quản trị">
      {groups.map((g) => (
        <div key={g.label} className="side-group">
          {g.label && <p className="side-label">{g.label}</p>}
          {g.links.map((l) => {
            const on = l.href === "/admin" ? path === "/admin" : path.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href} aria-current={on ? "page" : undefined} className={on ? "on" : ""}>
                <span className="material-symbols-outlined" aria-hidden="true">{l.icon}</span>
                {l.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
