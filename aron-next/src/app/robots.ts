import type { MetadataRoute } from "next";

const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.aron.com.vn";
// Chỉ cho Google lập chỉ mục khi đặt NEXT_PUBLIC_ALLOW_INDEX=true (bản chính thức). Bản xem thử thì chặn hết.
const allowIndex = process.env.NEXT_PUBLIC_ALLOW_INDEX === "true";

export default function robots(): MetadataRoute.Robots {
  if (!allowIndex) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin"] }], sitemap: `${site}/sitemap.xml` };
}
