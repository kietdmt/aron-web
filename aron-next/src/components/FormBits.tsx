"use client";
import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { t, type Locale } from "@/lib/i18n";

/** Trường bẫy bot (ẩn với người dùng) + mốc thời gian chống gửi tự động. */
export function SpamTraps() {
  const [ts, setTs] = useState("");
  useEffect(() => setTs(String(Date.now())), []);
  return (
    <>
      <div aria-hidden="true" className="hp">
        <label>Website<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <input type="hidden" name="ts" value={ts} />
    </>
  );
}

export function SubmitButton({ label, locale }: { label: string; locale: Locale }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn" type="submit" disabled={pending}>
      {pending ? t("sending", locale) : label}
    </button>
  );
}

export function Status({ state, locale }: { state: { ok?: boolean; error?: string } | null; locale: Locale }) {
  if (!state) return null;
  if (state.ok) return <p role="status" className="note ok">{t("sentOk", locale)}</p>;
  if (state.error) return <p role="alert" className="note err">{state.error === "rate" ? t("tooMany", locale) : t("sentErr", locale)}</p>;
  return null;
}
