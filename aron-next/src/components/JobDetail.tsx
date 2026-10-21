import Link from "next/link";
import { localizeHref, t, type Locale } from "@/lib/i18n";
import type { Job } from "@/lib/types";

export default function JobDetail({ job, locale }: { job: Job; locale: Locale }) {
  return (
    <>
      <section className="hero" style={{ backgroundImage: 'linear-gradient(90deg,rgba(15,15,15,.78),rgba(15,15,15,.3)),url("/img/about.jpg")' }}>
        <div className="container"><h1>{job.title}</h1></div>
      </section>
      <section className="section">
        <div className="container job">
          <div className="job-main">
            {job.sections.map((s, i) => (
              <div key={i}>
                <h2>{s.title}</h2>
                <ul className="bullets">{s.lines.map((l, k) => <li key={k}>{l}</li>)}</ul>
              </div>
            ))}
          </div>
          <aside className="job-side">
            <h2>{t("requirements", locale)}</h2>
            {job.facts.map((f, i) => (
              <div key={i} className="fact">
                <h3>{f.label}</h3>
                <ul>{f.values.map((v, k) => <li key={k}>{v}</li>)}</ul>
              </div>
            ))}
            <Link className="btn" href={`${localizeHref(locale, "/career/apply-form/")}?job=${encodeURIComponent(job.slug)}`}>
              {job.apply || t("apply", locale)}
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}
