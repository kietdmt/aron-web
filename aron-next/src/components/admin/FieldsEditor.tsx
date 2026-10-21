"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import type { Field } from "@/lib/editorSchema";
import { uploadImage } from "@/app/admin/cms-actions";

type Obj = Record<string, any>;

export function ImageField({ value, onChange, label }: { value: string; onChange: (v: string) => void; label?: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setErr("");
    const fd = new FormData();
    fd.set("file", file);
    try {
      const r = await uploadImage(fd);
      if (r.url) onChange(r.url);
      else setErr(r.error ?? "Tải ảnh thất bại");
    } catch {
      setErr("Tải ảnh thất bại");
    }
    setBusy(false);
  }
  const isImg = value && !/^[a-z_]+$/i.test(value);
  return (
    <div className="imgfield">
      <div className="imgrow">
        {isImg && /* eslint-disable-next-line @next/next/no-img-element */ <img src={value} alt="" className="thumb" />}
        <input type="text" value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder="/img/... hoặc https://..." aria-label={label} />
      </div>
      <label className="btn btn-sm btn-outline upload">
        {busy ? "Đang tải..." : "Tải ảnh lên"}
        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={pick} hidden disabled={busy} />
      </label>
      {err && <span className="note err">{err}</span>}
    </div>
  );
}

function move<T>(arr: T[], i: number, d: number): T[] {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const c = arr.slice();
  [c[i], c[j]] = [c[j], c[i]];
  return c;
}

function Row({ f, value, onChange }: { f: Field; value: any; onChange: (v: any) => void }) {
  switch (f.kind) {
    case "text":
    case "icon":
    case "href":
      return (
        <label className="fe-row">
          <span>{f.label}</span>
          <input type="text" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
        </label>
      );
    case "textarea":
      return (
        <label className="fe-row">
          <span>{f.label}</span>
          <textarea rows={4} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
        </label>
      );
    case "lines":
      return (
        <label className="fe-row">
          <span>{f.label}</span>
          <textarea rows={5} value={Array.isArray(value) ? value.join("\n") : ""} onChange={(e) => onChange(e.target.value.split("\n"))} />
        </label>
      );
    case "number":
      return (
        <label className="fe-row">
          <span>{f.label}</span>
          <input type="number" min={f.min} max={f.max} value={value ?? f.min} onChange={(e) => onChange(Number(e.target.value))} />
        </label>
      );
    case "bool":
      return (
        <label className="fe-row fe-check">
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
          <span>{f.label}</span>
        </label>
      );
    case "select":
      return (
        <label className="fe-row">
          <span>{f.label}</span>
          <select value={value ?? f.options[0].v} onChange={(e) => onChange(e.target.value)}>
            {f.options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        </label>
      );
    case "image":
      return (
        <div className="fe-row">
          <span>{f.label}</span>
          <ImageField value={value ?? ""} onChange={onChange} label={f.label} />
        </div>
      );
    case "object":
      return (
        <fieldset className="fe-group">
          <legend>{f.label}</legend>
          <FieldsEditor fields={f.fields} value={value ?? {}} onChange={onChange} />
        </fieldset>
      );
    case "strings": {
      const arr: string[] = Array.isArray(value) ? value : [];
      return (
        <fieldset className="fe-group">
          <legend>{f.label}</legend>
          {arr.map((s, i) => (
            <div key={i} className="fe-item">
              <div className="fe-item-bar">
                <strong>{f.itemLabel} {i + 1}</strong>
                <span>
                  <button type="button" onClick={() => onChange(move(arr, i, -1))} aria-label="Lên">↑</button>
                  <button type="button" onClick={() => onChange(move(arr, i, 1))} aria-label="Xuống">↓</button>
                  <button type="button" onClick={() => onChange(arr.filter((_, k) => k !== i))} aria-label="Xoá">✕</button>
                </span>
              </div>
              <ImageField value={s} onChange={(v) => onChange(arr.map((x, k) => (k === i ? v : x)))} />
            </div>
          ))}
          <button type="button" className="btn btn-sm btn-outline" onClick={() => onChange([...arr, ""])}>+ Thêm {f.itemLabel.toLowerCase()}</button>
        </fieldset>
      );
    }
    case "list": {
      const arr: Obj[] = Array.isArray(value) ? value : [];
      return (
        <fieldset className="fe-group">
          <legend>{f.label} ({arr.length})</legend>
          {arr.map((it, i) => (
            <details key={i} className="fe-item" open={arr.length <= 3}>
              <summary>
                <strong>{f.itemLabel} {i + 1}</strong>
                <span className="fe-sum">{String(it.title ?? it.label ?? "").slice(0, 60)}</span>
                <span className="fe-ctl" onClick={(e) => e.preventDefault()}>
                  <button type="button" onClick={() => onChange(move(arr, i, -1))} aria-label="Lên">↑</button>
                  <button type="button" onClick={() => onChange(move(arr, i, 1))} aria-label="Xuống">↓</button>
                  <button type="button" onClick={() => onChange(arr.filter((_, k) => k !== i))} aria-label="Xoá">✕</button>
                </span>
              </summary>
              <FieldsEditor fields={f.fields} value={it} onChange={(v) => onChange(arr.map((x, k) => (k === i ? v : x)))} />
            </details>
          ))}
          <button type="button" className="btn btn-sm btn-outline" onClick={() => onChange([...arr, structuredClone(f.blank)])}>+ Thêm {f.itemLabel.toLowerCase()}</button>
        </fieldset>
      );
    }
  }
}

export function FieldsEditor({ fields, value, onChange }: { fields: Field[]; value: Obj; onChange: (v: Obj) => void }) {
  return (
    <div className="fe">
      {fields.map((f) => (
        <Row key={f.k} f={f} value={value[f.k]} onChange={(v) => onChange({ ...value, [f.k]: v })} />
      ))}
    </div>
  );
}
