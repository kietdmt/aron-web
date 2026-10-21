export const locales = ["vi", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "vi";
export const isLocale = (v: string): v is Locale => (locales as readonly string[]).includes(v);

/** Gắn tiền tố ngôn ngữ cho đường dẫn nội bộ ("/about-us/" → "/vi/about-us/"). */
export function localizeHref(locale: Locale, href: string): string {
  if (!href) return `/${locale}/`;
  if (/^(https?:|mailto:|tel:|#)/i.test(href)) return href;
  const h = href.startsWith("/") ? href : `/${href}`;
  return `/${locale}${h === "/" ? "/" : h}`;
}

type Dict = Record<string, { vi: string; en: string }>;
const dict: Dict = {
  home: { vi: "Trang chủ", en: "Home" },
  about: { vi: "Giới thiệu", en: "About us" },
  services: { vi: "Dịch vụ", en: "Services" },
  industries: { vi: "Ngành", en: "Industries" },
  solutions: { vi: "Giải pháp", en: "Solutions" },
  clients: { vi: "Khách hàng", en: "Clients" },
  career: { vi: "Tuyển dụng", en: "Careers" },
  contact: { vi: "Liên hệ", en: "Contact" },
  skip: { vi: "Bỏ qua đến nội dung", en: "Skip to content" },
  menu: { vi: "Menu", en: "Menu" },
  apply: { vi: "Ứng tuyển ngay", en: "Apply now" },
  address: { vi: "Địa chỉ", en: "Address" },
  follow: { vi: "Theo dõi chúng tôi", en: "Follow us" },
  blog: { vi: "Blog", en: "Blog" },
  blogTitle: { vi: "Tin tức & Blog", en: "News & Blog" },
  blogSub: { vi: "Cập nhật về Oracle, ERP và các dự án của ARON.", en: "Updates on Oracle, ERP and ARON's projects." },
  blogSearch: { vi: "Tìm bài viết…", en: "Search articles…" },
  blogNone: { vi: "Chưa có bài viết phù hợp.", en: "No articles found." },
  blogRead: { vi: "Đọc tiếp", en: "Read more" },
  blogRecent: { vi: "Bài mới nhất", en: "Latest articles" },
  blogBack: { vi: "← Tất cả bài viết", en: "← All articles" },
  blogBy: { vi: "Đăng bởi", en: "By" },
  blogPrev: { vi: "Trang trước", en: "Previous" },
  blogNext: { vi: "Trang sau", en: "Next" },
  blogLangNote: { vi: "Bài viết này hiện chỉ có bản tiếng Anh.", en: "This article is currently available in Vietnamese only." },
  rights: { vi: "Bảo lưu mọi quyền.", en: "All rights reserved." },
  sending: { vi: "Đang gửi...", en: "Sending..." },
  sentOk: { vi: "Cảm ơn bạn! Chúng tôi sẽ liên hệ sớm nhất.", en: "Thank you! We will get back to you shortly." },
  sentErr: { vi: "Không gửi được. Vui lòng kiểm tra thông tin và thử lại.", en: "Could not send. Please check the form and try again." },
  tooMany: { vi: "Bạn gửi quá nhanh, vui lòng thử lại sau ít phút.", en: "Too many requests, please try again in a few minutes." },
  required: { vi: "Bắt buộc", en: "Required" },
  notFound: { vi: "Không tìm thấy trang", en: "Page not found" },
  backHome: { vi: "Về trang chủ", en: "Back to home" },
  requirements: { vi: "Thông tin vị trí", en: "Position details" },
  demo: { vi: "Yêu cầu demo", en: "Request a demo" },
  megaServices: { vi: "Tư vấn, triển khai và vận hành hệ thống Oracle cho doanh nghiệp.", en: "Consulting, implementation and operation of Oracle systems for your business." },
  megaIndustries: { vi: "Giải pháp Oracle ERP phù hợp đặc thù từng ngành.", en: "Oracle ERP solutions tailored to each industry." },
  megaSolutions: { vi: "Ứng dụng, hạ tầng và tích hợp Oracle cho nhu cầu của bạn.", en: "Oracle applications, infrastructure and integration for your needs." },
  viewAll: { vi: "Liên hệ tư vấn", en: "Talk to us" },
  company: { vi: "Công ty", en: "Company" },
  sitemap: { vi: "Sơ đồ trang", en: "Sitemap" },
  beforeYouGo: { vi: "Trước khi bạn rời đi", en: "Before you go" },
  pfContactT: { vi: "Trao đổi với chuyên gia", en: "Talk to an expert" },
  pfContactX: { vi: "Cho chúng tôi biết nhu cầu, đội ngũ ARON sẽ tư vấn giải pháp Oracle phù hợp.", en: "Tell us what you need and the ARON team will recommend the right Oracle solution." },
  pfServiceT: { vi: "Khám phá dịch vụ", en: "Explore our services" },
  pfServiceX: { vi: "Từ triển khai, nâng cấp đến bảo trì và đào tạo Oracle.", en: "From implementation and upgrades to Oracle support and training." },
  pfCareerT: { vi: "Gia nhập đội ngũ", en: "Join our team" },
  pfCareerX: { vi: "Cùng phát triển sự nghiệp với các dự án Oracle ERP.", en: "Grow your career on Oracle ERP projects." },
  learnMore: { vi: "Tìm hiểu thêm", en: "Learn more" },
  otherLang: { vi: "English", en: "Tiếng Việt" },
};
export const t = (key: keyof typeof dict, locale: Locale) => dict[key][locale];
