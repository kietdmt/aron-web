export type Role = "admin" | "editor" | "hr" | "sales" | "viewer";
export type Perm =
  | "pages.edit" | "pages.publish"
  | "jobs.edit"
  | "blog.edit"
  | "clients.edit"
  | "media.upload"
  | "leads.view" | "leads.edit"
  | "applications.view" | "applications.edit"
  | "content.delete"
  | "users.manage" | "audit.view";

export const ROLES: Role[] = ["admin", "editor", "hr", "sales", "viewer"];
export const ROLE_LABEL: Record<Role, string> = {
  admin: "Quản trị viên",
  editor: "Biên tập nội dung",
  hr: "Nhân sự (HR)",
  sales: "Kinh doanh",
  viewer: "Chưa cấp quyền",
};

const MATRIX: Record<Role, Perm[] | "all"> = {
  admin: "all",
  editor: ["pages.edit", "pages.publish", "jobs.edit", "blog.edit", "clients.edit", "media.upload"],
  hr: ["jobs.edit", "applications.view", "applications.edit", "media.upload"],
  sales: ["leads.view", "leads.edit"],
  viewer: [],
};

export const isRole = (v: unknown): v is Role => typeof v === "string" && (ROLES as string[]).includes(v);
export const can = (role: Role, perm: Perm) => {
  const m = MATRIX[role];
  return m === "all" || m.includes(perm);
};
