import type { MetadataRoute } from "next";
import { allJobSlugs, allPageSlugs, allPostSlugs } from "@/lib/content";
import { locales } from "@/lib/i18n";

const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.aron.com.vn";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = (await allPostSlugs()).map((s) => `/blog/${s}/`);
  const slugs = [...allPageSlugs(), ...allJobSlugs(), "/blog/", ...posts];
  return slugs.flatMap((s) =>
    locales.map((l) => ({
      url: `${site}/${l}${s}`,
      changeFrequency: "monthly" as const,
      priority: s === "/" ? 1 : 0.7,
      alternates: { languages: Object.fromEntries(locales.map((x) => [x, `${site}/${x}${s}`])) },
    })),
  );
}
