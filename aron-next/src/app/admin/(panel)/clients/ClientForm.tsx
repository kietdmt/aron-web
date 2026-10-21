"use client";
import { useActionState, useState } from "react";
import { ImageField } from "@/components/admin/FieldsEditor";
import { createClient, deleteClient, saveClient, type SaveState } from "../../cms-actions";

export type ClientRow = {
  id: string; sort: number; name: string; logo: string; published: boolean;
  industry: { vi?: string; en?: string }; location: { vi?: string; en?: string };
};

export default function ClientForm({ mode, row, canDelete }: { mode: "create" | "edit"; row?: ClientRow; canDelete?: boolean }) {
  const [logo, setLogo] = useState(row?.logo ?? "");
  const [state, create, pending] = useActionState<SaveState | null, FormData>(createClient, null);
  return (
    <form action={mode === "create" ? create : saveClient} className="card form">
      {row && <input type="hidden" name="id" value={row.id} />}
      <input type="hidden" name="logo" value={logo} />
      <h3>{mode === "create" ? "Thêm khách hàng" : row?.name}</h3>
      <div className="two-col">
        <label className="fe-row"><span>Tên</span><input name="name" defaultValue={row?.name} required maxLength={200} /></label>
        <label className="fe-row"><span>Thứ tự</span><input name="sort" type="number" min={0} defaultValue={row?.sort ?? 0} /></label>
        <label className="fe-row"><span>Ngành (VI)</span><input name="industry_vi" defaultValue={row?.industry?.vi ?? ""} /></label>
        <label className="fe-row"><span>Ngành (EN)</span><input name="industry_en" defaultValue={row?.industry?.en ?? ""} /></label>
        <label className="fe-row"><span>Địa điểm (VI)</span><input name="location_vi" defaultValue={row?.location?.vi ?? ""} /></label>
        <label className="fe-row"><span>Địa điểm (EN)</span><input name="location_en" defaultValue={row?.location?.en ?? ""} /></label>
      </div>
      <div className="fe-row"><span>Logo</span><ImageField value={logo} onChange={setLogo} label="Logo" /></div>
      <label className="fe-check"><input type="checkbox" name="published" defaultChecked={row?.published ?? true} /> <span>Hiển thị</span></label>
      <div className="status-form">
        <button className="btn btn-sm" disabled={pending}>{mode === "create" ? "Thêm" : "Lưu"}</button>
        {mode === "edit" && canDelete && (
          <button className="btn btn-sm btn-outline" formAction={deleteClient} onClick={(e) => { if (!confirm("Xoá khách hàng này?")) e.preventDefault(); }}>Xoá</button>
        )}
        {mode === "create" && state?.error && <span role="alert" className="note err">{state.error}</span>}
        {mode === "create" && state?.ok && <span role="status" className="note ok">{state.ok}</span>}
      </div>
    </form>
  );
}
