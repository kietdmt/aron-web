"use client";
import { useActionState } from "react";
import { createPost, type PostState } from "../../blog-actions";

export default function NewPost() {
  const [s, action, pending] = useActionState<PostState | null, FormData>(createPost, null);
  return (
    <form action={action} className="card form">
      <h3>Viết bài mới</h3>
      <label className="fe-row"><span>Tiêu đề (tiếng Việt hoặc tiếng Anh)</span><input name="title" required maxLength={200} /></label>
      <button className="btn btn-sm" disabled={pending}>Tạo bài (ở trạng thái nháp)</button>
      {s?.error && <p role="alert" className="note err">{s.error}</p>}
    </form>
  );
}
