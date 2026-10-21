/* eslint-disable @next/next/no-img-element */
"use client";
import { useActionState, useRef, useState } from "react";
import { ImageField } from "@/components/admin/FieldsEditor";
import { Markdown } from "@/lib/markdown";
import { savePost, type PostState } from "../../../blog-actions";
import { uploadImage } from "../../../cms-actions";

type Tr = { title: string; excerpt: string; body: string };
export type PostData = { id: string; slug: string; published: boolean; published_at: string; category: string; author: string; cover: string; vi: Tr; en: Tr };
type Lang = "vi" | "en";

export default function PostEditor({ initial }: { initial: PostData }) {
  const [state, action, pending] = useActionState<PostState | null, FormData>(savePost, null);
  const [lang, setLang] = useState<Lang>("vi");
  const [cover, setCover] = useState(initial.cover);
  const [tr, setTr] = useState<Record<Lang, Tr>>({ vi: initial.vi, en: initial.en });
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const area = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (k: keyof Tr, v: string) => setTr((p) => ({ ...p, [lang]: { ...p[lang], [k]: v } }));

  /** Chèn/bao quanh phần đang chọn trong ô nội dung. */
  function wrap(before: string, after = "", placeholder = "") {
    const el = area.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b, value } = el;
    const sel = value.slice(a, b) || placeholder;
    const next = value.slice(0, a) + before + sel + after + value.slice(b);
    set("body", next);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + before.length, a + before.length + sel.length); });
  }
  function linePrefix(prefix: string) {
    const el = area.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b, value } = el;
    const start = value.lastIndexOf("\n", a - 1) + 1;
    const block = value.slice(start, b).split("\n").map((l) => prefix + l).join("\n");
    set("body", value.slice(0, start) + block + value.slice(b));
    requestAnimationFrame(() => el.focus());
  }
  async function pickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true); setErr("");
    const fd = new FormData(); fd.set("file", file);
    try {
      const r = await uploadImage(fd);
      if (r.url) wrap(`\n\n![${file.name.replace(/\.[a-z0-9]+$/i, "").replace(/[\[\]]/g, "")}](${r.url})\n\n`);
      else setErr(r.error ?? "Tải ảnh thất bại");
    } catch { setErr("Tải ảnh thất bại"); }
    setBusy(false);
  }
  const t = tr[lang];

  return (
    <form action={action} className="card form post-form">
      <input type="hidden" name="id" value={initial.id} />
      <input type="hidden" name="cover" value={cover} />
      {(["vi", "en"] as Lang[]).map((l) => (
        <span key={l} hidden>
          <input name={`title_${l}`} value={tr[l].title} readOnly />
          <input name={`excerpt_${l}`} value={tr[l].excerpt} readOnly />
          <textarea name={`body_${l}`} value={tr[l].body} readOnly />
        </span>
      ))}

      <div className="two-col">
        <label className="fe-row"><span>Đường dẫn (slug)</span><input name="slug" defaultValue={initial.slug} required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={160} /><small className="muted">Đổi đường dẫn sẽ làm hỏng liên kết cũ tới bài này.</small></label>
        <label className="fe-row"><span>Chuyên mục</span><input name="category" defaultValue={initial.category} maxLength={60} placeholder="VD: Oracle E-Business Suite" /></label>
        <label className="fe-row"><span>Tác giả</span><input name="author" defaultValue={initial.author} maxLength={100} /></label>
        <label className="fe-row"><span>Ngày đăng (giờ Việt Nam; đặt ngày tương lai để hẹn giờ)</span><input name="published_at" type="datetime-local" defaultValue={initial.published_at} required /></label>
      </div>
      <div className="fe-row"><span>Ảnh bìa</span><ImageField value={cover} onChange={setCover} label="Ảnh bìa" /></div>

      <div className="tabs" role="tablist">
        <button type="button" role="tab" aria-selected={lang === "vi"} className={lang === "vi" ? "on" : ""} onClick={() => setLang("vi")}>Tiếng Việt</button>
        <button type="button" role="tab" aria-selected={lang === "en"} className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>English</button>
      </div>
      <p className="muted">Bỏ trống tiêu đề của một ngôn ngữ thì bài chỉ có ngôn ngữ còn lại (trang bên kia sẽ hiện bản đang có).</p>

      <label className="fe-row"><span>Tiêu đề ({lang === "vi" ? "tiếng Việt" : "English"})</span><input value={t.title} onChange={(e) => set("title", e.target.value)} maxLength={200} /></label>
      <label className="fe-row"><span>Tóm tắt (hiện ở danh sách bài)</span><textarea rows={2} value={t.excerpt} onChange={(e) => set("excerpt", e.target.value)} maxLength={500} /></label>

      <div className="md-wrap">
        <div className="md-bar" role="toolbar" aria-label="Định dạng">
          <button type="button" onClick={() => linePrefix("## ")} title="Tiêu đề lớn"><b>H2</b></button>
          <button type="button" onClick={() => linePrefix("### ")} title="Tiêu đề nhỏ"><b>H3</b></button>
          <button type="button" onClick={() => wrap("**", "**", "chữ đậm")} title="In đậm"><b>B</b></button>
          <button type="button" onClick={() => wrap("*", "*", "chữ nghiêng")} title="In nghiêng"><i>I</i></button>
          <button type="button" onClick={() => linePrefix("- ")} title="Danh sách chấm"><span className="material-symbols-outlined">format_list_bulleted</span></button>
          <button type="button" onClick={() => linePrefix("1. ")} title="Danh sách số"><span className="material-symbols-outlined">format_list_numbered</span></button>
          <button type="button" onClick={() => linePrefix("> ")} title="Trích dẫn"><span className="material-symbols-outlined">format_quote</span></button>
          <button type="button" onClick={() => wrap("[", "](https://)", "chữ liên kết")} title="Chèn liên kết"><span className="material-symbols-outlined">link</span></button>
          <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} title="Chèn ảnh"><span className="material-symbols-outlined">{busy ? "hourglass_top" : "image"}</span></button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={pickImage} />
          <span className="md-spacer" />
          <button type="button" className={preview ? "on" : ""} onClick={() => setPreview((v) => !v)}><span className="material-symbols-outlined">visibility</span> {preview ? "Đang xem trước" : "Xem trước"}</button>
        </div>
        {err && <p role="alert" className="note err">{err}</p>}
        <div className={"md-panes" + (preview ? " split" : "")}>
          <textarea ref={area} className="md-area" rows={22} value={t.body} onChange={(e) => set("body", e.target.value)} placeholder="Viết nội dung bài ở đây. Dùng thanh công cụ phía trên để định dạng, hoặc gõ ## cho tiêu đề, - cho danh sách…" maxLength={120000} />
          {preview && <div className="md-preview prose"><Markdown source={t.body || "*Chưa có nội dung*"} /></div>}
        </div>
      </div>

      <label className="fe-check"><input type="checkbox" name="published" defaultChecked={initial.published} /> <span><strong>Xuất bản</strong> (bỏ chọn = lưu nháp, chưa hiện công khai)</span></label>
      <div className="status-form">
        <button className="btn btn-sm" disabled={pending}>Lưu</button>
        {state?.error && <span role="alert" className="note err">{state.error}</span>}
        {state?.ok && <span role="status" className="note ok">{state.ok}</span>}
      </div>
    </form>
  );
}
