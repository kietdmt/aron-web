import { z } from "zod";

/* Kiểm tra dữ liệu khối trước khi lưu: chặn URL nguy hiểm (javascript:, data:), ký tự phá CSS/HTML. */
const BAD = /[\u0000-\u001f"\\<>]/;
const text = z.string().max(6000);
const short = z.string().max(400);
const href = z
  .string()
  .max(600)
  .refine((v) => v === "" || (v.startsWith("/") && !v.startsWith("//") && !BAD.test(v)) || /^https:\/\/[^\s"'<>\\]+$/.test(v) || /^(mailto:|tel:)[^\s"'<>\\]+$/.test(v), "URL không hợp lệ");
const img = z
  .string()
  .max(600)
  .refine((v) => v === "" || (v.startsWith("/") && !v.startsWith("//") && !BAD.test(v)) || /^https:\/\/[^\s"'<>\\]+$/.test(v), "Đường dẫn ảnh không hợp lệ");
const link = z.object({ href, label: short });
const lines = z.array(text).max(60);

const hero = z.union([
  z.object({ type: z.literal("hero"), variant: z.literal("home"), kicker: short, brand: short, title: text, image: img, art: img.optional(), lead: text.optional(), cta: link.optional(), secondary: link.optional() }),
  z.object({ type: z.literal("hero"), variant: z.literal("page"), title: text, lead: text, image: img, cta: link.optional() }),
]);
const features = z.object({
  type: z.literal("features"),
  variant: z.enum(["icons", "cards"]),
  title: short,
  intro: lines.optional(),
  cols: z.number().int().min(1).max(4),
  items: z.array(z.object({ icon: z.string().max(200), title: short, text, link: link.optional() })).max(24),
});
const linkList = z.union([
  z.object({ type: z.literal("linkList"), variant: z.literal("icons"), title: short, items: z.array(z.object({ icon: z.string().max(100), label: short, href })).max(24) }),
  z.object({ type: z.literal("linkList"), variant: z.literal("plain"), title: short, subtitle: short.optional(), items: z.array(z.object({ label: short, href })).max(40) }),
]);
const imageItem = z.object({ title: short, text, image: img });

export const blockSchema = z.union([
  hero,
  features,
  linkList,
  z.object({ type: z.literal("cta"), imageSide: z.enum(["left", "right"]), title: short, text, button: link, image: img }),
  z.object({ type: z.literal("ctaCollage"), title: short, text, button: link, images: z.array(img).max(6) }),
  z.object({ type: z.literal("carousel"), title: short, items: z.array(imageItem).max(24) }),
  z.object({ type: z.literal("imageList"), title: short, intro: lines.optional(), items: z.array(imageItem).max(24) }),
  z.object({ type: z.literal("story"), title: short, text, image: img }),
  z.object({ type: z.literal("announcement"), eyebrow: short.optional(), title: short, button: link.optional() }),
  z.object({ type: z.literal("richText"), title: short.optional(), paragraphs: lines }),
  z.object({ type: z.literal("cardRow"), title: short.optional(), items: z.array(z.object({ eyebrow: short.optional(), title: short, text, link })).max(6) }),
  z.object({
    type: z.literal("stats"),
    items: z.array(z.object({ value: z.string().max(20), suffix: z.string().max(10), label: short })).max(8),
    cta: z.object({ title: short, text, button: link }).optional(),
  }),
  z.object({ type: z.literal("clients"), title: short }),
  z.object({ type: z.literal("logoStrip"), title: short, logos: z.array(img).max(30), link }),
  z.object({
    type: z.literal("contactForm"),
    title: short,
    lead: text,
    fields: z.array(z.object({ key: z.string().max(40), label: short, placeholder: short, required: z.boolean() })).max(12),
    submit: short,
    mapUrl: z.string().max(1200).refine((v) => v === "" || v.startsWith("https://www.google.com/maps/embed"), "Chỉ cho phép URL nhúng Google Maps"),
  }),
  z.object({
    type: z.literal("applyForm"),
    heads: z.array(z.object({ title: short, text })).max(4),
    fields: z.array(z.object({ key: z.string().max(40), label: short.optional(), placeholder: short })).max(12),
    submit: short,
  }),
]);

export const blocksSchema = z.array(blockSchema).max(60);

export const pageMetaSchema = z.object({ title: z.string().min(1).max(200), description: z.string().max(500) });

export const jobTranslationSchema = z.object({
  title: z.string().min(1).max(200),
  sections: z.array(z.object({ title: short, lines })).max(20),
  facts: z.array(z.object({ label: short, values: lines })).max(20),
  apply: short,
});

export const jobSlugSchema = z.string().regex(/^\/career\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/, "Dạng đúng: /career/ten-vi-tri/");
