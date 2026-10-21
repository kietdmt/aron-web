import { getClients } from "@/lib/content";
import { localizeHref, type Locale } from "@/lib/i18n";
import LogoOrbit, { type OrbitItem } from "./LogoOrbit";

const norm = (s: string) => s.toLowerCase().replace(/\.[a-z0-9]+$/, "").replace(/^logo/, "").replace(/[^a-z0-9]/g, "");

/** Máy chủ: ghép logo trong khối với thông tin khách hàng (theo tên tệp) rồi giao cho vòng quay. */
export default async function LogoOrbitSection({ logos, locale, link }: { logos: string[]; locale: Locale; link: { label: string; href: string } }) {
  const data = await getClients(locale);
  // Hiển thị toàn bộ khách hàng đang bật "Hiển thị"; số thứ tự nhỏ xếp trước (gần tâm nhất)
  const all = [...data.items].filter((c) => c.logo).sort((x, y) => (x.sort ?? 0) - (y.sort ?? 0));
  const items: OrbitItem[] = all.length
    ? all.map((c) => ({ logo: c.logo, name: c.name, industry: c.industry, location: c.location }))
    : logos.map((logo) => {
        const key = norm(decodeURIComponent(logo.split("/").pop() || ""));
        const hit = data.items.find((c) => {
          const nm = norm(c.name);
          return key.length > 2 && nm.length > 2 && (nm.includes(key) || key.includes(nm));
        });
        return { logo, name: hit?.name ?? "", industry: hit?.industry ?? "", location: hit?.location ?? "" };
      });
  const vi = locale === "vi";
  return (
    <LogoOrbit
      items={items}
      industryLabel={data.industryLabel}
      locationLabel={data.locationLabel}
      hint={vi ? "Rê chuột hoặc kéo để lướt · nhấn vào thương hiệu để xem chi tiết" : "Hover or drag to explore · click a brand for details"}
      detailLabel={vi ? "Xem tất cả khách hàng" : "See all clients"}
      closeLabel={vi ? "Đóng" : "Close"}
      detailHref={localizeHref(locale, link.href)}
    />
  );
}
