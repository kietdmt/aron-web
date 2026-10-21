"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useActionState, useState } from "react";
import { savePageDraft, type SaveState } from "@/app/admin/cms-actions";
import { ADDABLE, BLOCK_DEFS, blockKey } from "@/lib/editorSchema";
import { FieldsEditor } from "./FieldsEditor";

type Obj = Record<string, any>;

export default function BlockEditor(props: {
  pageId: string;
  locale: "vi" | "en";
  initialTitle: string;
  initialDescription: string;
  initialBlocks: Obj[];
  canPublish: boolean;
  hasDraft: boolean;
}) {
  const [blocks, setBlocks] = useState<Obj[]>(props.initialBlocks);
  const [add, setAdd] = useState(ADDABLE[0]);
  const [state, action, pending] = useActionState<SaveState | null, FormData>(savePageDraft, null);

  const update = (i: number, v: Obj) => setBlocks((b) => b.map((x, k) => (k === i ? v : x)));
  const swap = (i: number, d: number) =>
    setBlocks((b) => {
      const j = i + d;
      if (j < 0 || j >= b.length) return b;
      const c = b.slice();
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });

  return (
    <form action={action} className="editor">
      <input type="hidden" name="pageId" value={props.pageId} />
      <input type="hidden" name="locale" value={props.locale} />
      <input type="hidden" name="payload" value={JSON.stringify(blocks)} />

      <div className="card">
        <h3>Thông tin trang (SEO)</h3>
        <label className="fe-row"><span>Tiêu đề trang (hiện trên tab trình duyệt)</span>
          <input name="title" defaultValue={props.initialTitle} required maxLength={200} /></label>
        <label className="fe-row"><span>Mô tả (hiện trên Google)</span>
          <textarea name="description" rows={2} defaultValue={props.initialDescription} maxLength={500} /></label>
      </div>

      {blocks.map((b, i) => {
        const def = BLOCK_DEFS[blockKey(b)];
        return (
          <details key={i} className="card block" open={i === 0}>
            <summary>
              <span className="badge">{i + 1}</span>
              <strong>{def?.label ?? String(b.type)}</strong>
              <span className="fe-sum">{String(b.title ?? "").slice(0, 70)}</span>
              <span className="fe-ctl" onClick={(e) => e.preventDefault()}>
                <button type="button" onClick={() => swap(i, -1)} aria-label="Đưa lên">↑</button>
                <button type="button" onClick={() => swap(i, 1)} aria-label="Đưa xuống">↓</button>
                <button type="button" onClick={() => setBlocks((x) => [...x.slice(0, i + 1), structuredClone(x[i]), ...x.slice(i + 1)])} aria-label="Nhân đôi">⧉</button>
                <button type="button" onClick={() => confirm("Xoá khối này?") && setBlocks((x) => x.filter((_, k) => k !== i))} aria-label="Xoá">✕</button>
              </span>
            </summary>
            {def ? <FieldsEditor fields={def.fields} value={b} onChange={(v) => update(i, v)} /> : <p className="note err">Loại khối không có form sửa.</p>}
          </details>
        );
      })}

      <div className="card addbar">
        <select value={add} onChange={(e) => setAdd(e.target.value)} aria-label="Loại khối">
          {ADDABLE.map((k) => <option key={k} value={k}>{BLOCK_DEFS[k].label}</option>)}
        </select>
        <button type="button" className="btn btn-sm btn-outline" onClick={() => setBlocks((x) => [...x, structuredClone(BLOCK_DEFS[add].blank)])}>+ Thêm khối</button>
      </div>

      <div className="stickybar">
        {state?.error && <span role="alert" className="note err">{state.error}</span>}
        {state?.ok && <span role="status" className="note ok">{state.ok}</span>}
        <button className="btn btn-outline" name="intent" value="draft" disabled={pending}>Lưu nháp</button>
        {props.canPublish && <button className="btn" name="intent" value="publish" disabled={pending}>Xuất bản</button>}
      </div>
    </form>
  );
}
