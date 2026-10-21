import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePerm } from "@/lib/admin/auth";
import { can } from "@/lib/permissions";
import { jobSlugSchema } from "@/lib/blockSchema";
import { deleteJob } from "../../../cms-actions";
import JobEditor from "./JobEditor";

export const dynamic = "force-dynamic";

export default async function EditJob({ searchParams }: { searchParams: Promise<{ slug?: string; lang?: string }> }) {
  const ctx = await requirePerm("jobs.edit");
  const sp = await searchParams;
  const slug = jobSlugSchema.safeParse(sp.slug ?? "");
  if (!slug.success) notFound();
  const lang: "vi" | "en" = sp.lang === "en" ? "en" : "vi";
  const { data: job } = await ctx.supabase.from("jobs").select("slug,published,translations").eq("slug", slug.data).maybeSingle();
  if (!job) notFound();
  const tr = (job.translations as Record<string, unknown>)[lang] as Record<string, unknown>;
  const q = encodeURIComponent(job.slug);
  return (
    <>
      <h1>Sửa vị trí: <code>{job.slug}</code></h1>
      <div className="tabs">
        <Link href={`/admin/jobs/edit?slug=${q}&lang=vi`} className={lang === "vi" ? "on" : ""}>Tiếng Việt</Link>
        <Link href={`/admin/jobs/edit?slug=${q}&lang=en`} className={lang === "en" ? "on" : ""}>English</Link>
      </div>
      <JobEditor key={`${job.slug}-${lang}`} slug={job.slug} locale={lang} initial={tr} published={job.published} />
      {can(ctx.role, "content.delete") && (
        <form action={deleteJob} className="card">
          <input type="hidden" name="slug" value={job.slug} />
          <button className="btn btn-sm btn-outline" type="submit">Xoá vị trí này</button>
        </form>
      )}
    </>
  );
}
