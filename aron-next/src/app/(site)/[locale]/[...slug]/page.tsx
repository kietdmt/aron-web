import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Blocks from "@/components/Blocks";
import JobDetail from "@/components/JobDetail";
import { allJobSlugs, allPageSlugs, getJob, getPage, slugFromSegments } from "@/lib/content";
import { isLocale, locales } from "@/lib/i18n";

export const revalidate = 300;
export const dynamicParams = true;

export function generateStaticParams() {
  const slugs = [...allPageSlugs().filter((s) => s !== "/"), ...allJobSlugs()];
  return locales.flatMap((locale) => slugs.map((s) => ({ locale, slug: s.split("/").filter(Boolean) })));
}

type P = { params: Promise<{ locale: string; slug: string[] }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const path = slugFromSegments(slug);
  const alt = { canonical: `/${locale}${path}`, languages: { vi: `/vi${path}`, en: `/en${path}` } };
  const page = await getPage(path, locale);
  if (page) return { title: page.title, description: page.description, alternates: alt };
  const job = await getJob(path, locale);
  if (job) return { title: `ARON | ${job.title}`, alternates: alt };
  return { title: "404", robots: { index: false } };
}

export default async function Page({ params }: P) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const path = slugFromSegments(slug);
  const page = await getPage(path, locale);
  if (page) return <Blocks blocks={page.blocks} locale={locale} heroFx={path === "/clients/" ? "data" : path === "/about-us/" ? "ai" : undefined} />;
  const job = await getJob(path, locale);
  if (job) return <JobDetail job={job} locale={locale} />;
  notFound();
}
