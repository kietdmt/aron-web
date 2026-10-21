"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useActionState, useState } from "react";
import { saveJob, type SaveState } from "../../../cms-actions";
import { FieldsEditor } from "@/components/admin/FieldsEditor";
import { JOB_FIELDS } from "@/lib/editorSchema";

export default function JobEditor({ slug, locale, initial, published }: { slug: string; locale: string; initial: Record<string, any>; published: boolean }) {
  const [v, setV] = useState<Record<string, any>>(initial);
  const [s, action, pending] = useActionState<SaveState | null, FormData>(saveJob, null);
  return (
    <form action={action} className="editor">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="payload" value={JSON.stringify(v)} />
      <div className="card">
        <label className="fe-check"><input type="checkbox" name="published" defaultChecked={published} /> <span>Hiển thị công khai (áp dụng cho cả 2 ngôn ngữ)</span></label>
      </div>
      <div className="card"><FieldsEditor fields={JOB_FIELDS} value={v} onChange={setV} /></div>
      <div className="stickybar">
        {s?.error && <span role="alert" className="note err">{s.error}</span>}
        {s?.ok && <span role="status" className="note ok">{s.ok}</span>}
        <button className="btn" disabled={pending}>Lưu</button>
      </div>
    </form>
  );
}
