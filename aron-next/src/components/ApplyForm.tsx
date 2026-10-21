"use client";
import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { submitApplication, type FormState } from "@/app/actions/forms";
import type { Locale } from "@/lib/i18n";
import { SpamTraps, Status, SubmitButton } from "./FormBits";

type Props = {
  locale: Locale;
  heads: { title: string; text: string }[];
  fields: { key: string; label?: string; placeholder: string }[];
  submit: string;
  jobSlug?: string;
};

function Inner({ locale, heads, fields, submit, jobSlug }: Props) {
  const qs = useSearchParams();
  const job = (jobSlug ?? qs.get("job") ?? "").slice(0, 200);
  const [state, action] = useActionState<FormState | null, FormData>(submitApplication, null);
  const personal = fields.filter((f) => f.key !== "coverLetter");
  const cover = fields.find((f) => f.key === "coverLetter");
  return (
    <form action={action} className="form">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="job" value={job} />
      <h2>{heads[0]?.title}</h2>
      <p className="muted">{heads[0]?.text}</p>
      {personal.map((f) => (
        <div className="field" key={f.key}>
          <label htmlFor={`a-${f.key}`}>{f.label}<span className="req"> *</span></label>
          <input
            id={`a-${f.key}`}
            name={f.key}
            required={f.key !== "cvUrl"}
            maxLength={300}
            placeholder={f.placeholder}
            type={f.key === "email" ? "email" : f.key === "phone" ? "tel" : f.key === "cvUrl" ? "url" : "text"}
          />
        </div>
      ))}
      {cover && (
        <>
          <h2>{heads[1]?.title}</h2>
          <p className="muted">{heads[1]?.text}</p>
          <div className="field">
            <label htmlFor="a-cover" className="sr-only">{heads[1]?.title}</label>
            <textarea id="a-cover" name="coverLetter" rows={7} maxLength={6000} placeholder={cover.placeholder} />
          </div>
        </>
      )}
      <SpamTraps />
      <SubmitButton label={submit} locale={locale} />
      <Status state={state} locale={locale} />
    </form>
  );
}

export default function ApplyForm(props: Props) {
  return (
    <Suspense fallback={null}>
      <Inner {...props} />
    </Suspense>
  );
}
