export type Link = { href: string; label: string };
export type Block =
  | { type: "hero"; variant: "home"; kicker: string; brand: string; title: string; image: string; art?: string; lead?: string; cta?: Link; secondary?: Link }
  | { type: "hero"; variant: "page"; title: string; lead: string; image: string; cta?: Link }
  | {
      type: "features";
      variant: "icons" | "cards";
      title: string;
      intro?: string[];
      cols: number;
      items: { icon: string; title: string; text: string; link?: Link }[];
    }
  | { type: "linkList"; variant: "icons"; title: string; items: { icon: string; label: string; href: string }[] }
  | { type: "linkList"; variant: "plain"; title: string; subtitle?: string; items: { label: string; href: string }[] }
  | { type: "cta"; imageSide: "left" | "right"; title: string; text: string; button: Link & { label: string }; image: string }
  | { type: "ctaCollage"; title: string; text: string; button: Link; images: string[] }
  | { type: "carousel"; title: string; items: { title: string; text: string; image: string }[] }
  | { type: "imageList"; title: string; intro?: string[]; items: { title: string; text: string; image: string }[] }
  | { type: "story"; title: string; text: string; image: string }
  | { type: "announcement"; eyebrow?: string; title: string; button?: Link }
  | { type: "richText"; title?: string; paragraphs: string[] }
  | { type: "cardRow"; title?: string; items: { eyebrow?: string; title: string; text: string; link: Link }[] }
  | {
      type: "stats";
      items: { value: string; suffix: string; label: string }[];
      cta?: { title: string; text: string; button: Link };
    }
  | { type: "clients"; title: string }
  | { type: "logoStrip"; title: string; logos: string[]; link: Link }
  | {
      type: "contactForm";
      title: string;
      lead: string;
      fields: { key: string; label: string; placeholder: string; required: boolean }[];
      submit: string;
      mapUrl: string;
    }
  | {
      type: "applyForm";
      heads: { title: string; text: string }[];
      fields: { key: string; label?: string; placeholder: string }[];
      submit: string;
    };

export type PageKind = "home" | "about" | "career" | "apply" | "clients" | "contact" | "industry" | "solution" | "service";

export type Page = { slug: string; kind: PageKind; title: string; description: string; blocks: Block[] };

export type Job = {
  slug: string;
  title: string;
  sections: { title: string; lines: string[] }[];
  facts: { label: string; values: string[] }[];
  apply: string;
};

export type Client = { name: string; logo: string; industry: string; location: string; sort?: number };
export type ClientsData = { industryLabel: string; locationLabel: string; items: Client[] };

export type NavItem = { href: string; label: string };

/** Bài viết Tin tức / Blog (đã chọn ngôn ngữ hiển thị). */
export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  cover: string;
  category: string;
  author: string;
  date: string; // ISO
  lang: "vi" | "en"; // ngôn ngữ thực tế của nội dung (có thể khác ngôn ngữ trang nếu chưa dịch)
};
