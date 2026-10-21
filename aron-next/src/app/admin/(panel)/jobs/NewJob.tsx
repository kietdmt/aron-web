"use client";
import { useActionState } from "react";
import { createJob, type SaveState } from "../../cms-actions";

export default function NewJob() {
  const [s, action, pending] = useActionState<SaveState | null, FormData>(createJob, null);
  return (
    <form action={action} className="card form">
      <h3>Thêm vị trí tuyển dụng</h3>
      <label className="fe-row"><span>Tên vị trí</span><input name="name" required maxLength={200} /></label>
      <label className="fe-row"><span>Đường dẫn (dạng /career/ten-vi-tri/, chữ thường không dấu)</span><input name="slug" required placeholder="/career/ten-vi-tri/" /></label>
      <button className="btn btn-sm" disabled={pending}>Tạo (ở trạng thái ẩn)</button>
      {s?.error && <p role="alert" className="note err">{s.error}</p>}
    </form>
  );
}
