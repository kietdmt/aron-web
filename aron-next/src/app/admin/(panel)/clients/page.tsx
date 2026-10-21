import { requirePerm } from "@/lib/admin/auth";
import { can } from "@/lib/permissions";
import ClientForm, { type ClientRow } from "./ClientForm";

export const dynamic = "force-dynamic";

export default async function Clients() {
  const ctx = await requirePerm("clients.edit");
  const { data } = await ctx.supabase.from("clients").select("id,sort,name,logo,industry,location,published").order("sort");
  const canDelete = can(ctx.role, "content.delete");
  return (
    <>
      <h1>Khách hàng (logo)</h1>
      <p className="muted">Danh sách này hiển thị ở trang Khách hàng. Mỗi dòng lưu riêng.</p>
      <ClientForm mode="create" />
      {((data ?? []) as ClientRow[]).map((c) => <ClientForm key={c.id} mode="edit" row={c} canDelete={canDelete} />)}
    </>
  );
}
