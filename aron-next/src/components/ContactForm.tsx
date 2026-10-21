"use client";
import { useActionState } from "react";
import { submitContact, type FormState } from "@/app/actions/forms";
import { t, type Locale } from "@/lib/i18n";
import { SpamTraps, Status, SubmitButton } from "./FormBits";

type Field = { key: string; label: string; placeholder: string; required: boolean };

export default function ContactForm({ locale, fields, submit }: { locale: Locale; fields: Field[]; submit: string }) {
  const [state, action] = useActionState<FormState | null, FormData>(submitContact, null);
  return (
    <form action={action} className="form" noValidate={false}>
      <input type="hidden" name="locale" value={locale} />
      {fields.map((f) => {
        const id = `c-${f.key}`;
        const common = { id, name: f.key, placeholder: f.placeholder, required: f.required, maxLength: f.key === "message" ? 4000 : 200 };
        return (
          <div className="field" key={f.key}>
            <label htmlFor={id}>{f.label}{f.required && <span className="req" title={t("required", locale)}> *</span>}</label>
            {f.key === "message" ? (
              <textarea {...common} rows={5} />
            ) : (
              <input {...common} type={f.key === "email" ? "email" : f.key === "phone" ? "tel" : "text"} autoComplete={f.key === "email" ? "email" : f.key === "phone" ? "tel" : f.key === "name" ? "name" : "off"} />
            )}
          </div>
        );
      })}
      <SpamTraps />
      <SubmitButton label={submit} locale={locale} />
      <Status state={state} locale={locale} />
    </form>
  );
}
