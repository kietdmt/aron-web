/* Mô tả form sửa cho từng loại khối (dùng ở trình soạn thảo trong admin). */
export type Field =
  | { k: string; label: string; kind: "text" | "textarea" | "image" | "href" | "icon" | "lines" | "bool"; hint?: string }
  | { k: string; label: string; kind: "number"; min: number; max: number }
  | { k: string; label: string; kind: "select"; options: { v: string; l: string }[] }
  | { k: string; label: string; kind: "object"; fields: Field[] }
  | { k: string; label: string; kind: "list"; itemLabel: string; fields: Field[]; blank: Record<string, unknown> }
  | { k: string; label: string; kind: "strings"; itemLabel: string };

const link = (k: string, label: string): Field => ({
  k, label, kind: "object", fields: [
    { k: "label", label: "Chữ trên nút", kind: "text" },
    { k: "href", label: "Đường dẫn (vd: /contact-us/)", kind: "href" },
  ],
});
const imageItems = (k = "items"): Field => ({
  k, label: "Danh sách", kind: "list", itemLabel: "Mục", blank: { title: "", text: "", image: "" },
  fields: [
    { k: "title", label: "Tiêu đề", kind: "text" },
    { k: "text", label: "Nội dung", kind: "textarea" },
    { k: "image", label: "Ảnh", kind: "image" },
  ],
});

export type BlockDef = { label: string; fields: Field[]; blank: Record<string, unknown> };

export const BLOCK_DEFS: Record<string, BlockDef> = {
  "hero:home": {
    label: "Banner trang chủ",
    blank: { type: "hero", variant: "home", kicker: "", brand: "", title: "", image: "/img/banner.jpg", lead: "" },
    fields: [
      { k: "kicker", label: "Nhãn nhỏ phía trên", kind: "text" },
      { k: "brand", label: "Từ nhấn mạnh (màu cam)", kind: "text" },
      { k: "title", label: "Tiêu đề", kind: "textarea" },
      { k: "lead", label: "Mô tả ngắn", kind: "textarea" },
      { k: "image", label: "Ảnh nền", kind: "image" },
      { k: "art", label: "Hình minh hoạ bên phải (để trống nếu không dùng)", kind: "image" },
      link("cta", "Nút chính"),
      link("secondary", "Nút phụ"),
    ],
  },
  "hero:page": {
    label: "Banner trang",
    blank: { type: "hero", variant: "page", title: "", lead: "", image: "/img/banner.jpg" },
    fields: [
      { k: "title", label: "Tiêu đề", kind: "text" },
      { k: "lead", label: "Mô tả", kind: "textarea" },
      { k: "image", label: "Ảnh nền", kind: "image" },
      link("cta", "Nút (tuỳ chọn)"),
    ],
  },
  "features:icons": {
    label: "Lưới biểu tượng",
    blank: { type: "features", variant: "icons", title: "", intro: [], cols: 3, items: [] },
    fields: [
      { k: "title", label: "Tiêu đề khối", kind: "text" },
      { k: "intro", label: "Đoạn giới thiệu (mỗi dòng một đoạn)", kind: "lines" },
      { k: "cols", label: "Số cột", kind: "number", min: 1, max: 4 },
      { k: "items", label: "Các thẻ", kind: "list", itemLabel: "Thẻ", blank: { icon: "", title: "", text: "" }, fields: [
        { k: "icon", label: "Biểu tượng (ảnh SVG hoặc tên Material icon)", kind: "icon" },
        { k: "title", label: "Tiêu đề", kind: "text" },
        { k: "text", label: "Nội dung", kind: "textarea" },
        link("link", "Liên kết (tuỳ chọn)"),
      ] },
    ],
  },
  "features:cards": {
    label: "Lưới thẻ",
    blank: { type: "features", variant: "cards", title: "", cols: 3, items: [] },
    fields: [
      { k: "title", label: "Tiêu đề khối", kind: "text" },
      { k: "cols", label: "Số cột", kind: "number", min: 1, max: 4 },
      { k: "items", label: "Các thẻ", kind: "list", itemLabel: "Thẻ", blank: { icon: "", title: "", text: "" }, fields: [
        { k: "icon", label: "Biểu tượng", kind: "icon" },
        { k: "title", label: "Tiêu đề", kind: "text" },
        { k: "text", label: "Nội dung", kind: "textarea" },
        link("link", "Liên kết (tuỳ chọn)"),
      ] },
    ],
  },
  "linkList:icons": {
    label: "Ô liên kết có biểu tượng",
    blank: { type: "linkList", variant: "icons", title: "", items: [] },
    fields: [
      { k: "title", label: "Tiêu đề khối", kind: "text" },
      { k: "items", label: "Liên kết", kind: "list", itemLabel: "Liên kết", blank: { icon: "arrow_forward", label: "", href: "" }, fields: [
        { k: "icon", label: "Biểu tượng (tên Material icon)", kind: "icon" },
        { k: "label", label: "Chữ hiển thị", kind: "text" },
        { k: "href", label: "Đường dẫn", kind: "href" },
      ] },
    ],
  },
  "linkList:plain": {
    label: "Danh sách liên kết",
    blank: { type: "linkList", variant: "plain", title: "", subtitle: "", items: [] },
    fields: [
      { k: "title", label: "Tiêu đề khối", kind: "text" },
      { k: "subtitle", label: "Phụ đề", kind: "text" },
      { k: "items", label: "Liên kết", kind: "list", itemLabel: "Liên kết", blank: { label: "", href: "" }, fields: [
        { k: "label", label: "Chữ hiển thị", kind: "text" },
        { k: "href", label: "Đường dẫn", kind: "href" },
      ] },
    ],
  },
  cta: {
    label: "Ảnh + lời kêu gọi",
    blank: { type: "cta", imageSide: "left", title: "", text: "", button: { label: "", href: "/contact-us/" }, image: "" },
    fields: [
      { k: "imageSide", label: "Vị trí ảnh", kind: "select", options: [{ v: "left", l: "Bên trái" }, { v: "right", l: "Bên phải" }] },
      { k: "title", label: "Tiêu đề", kind: "text" },
      { k: "text", label: "Nội dung", kind: "textarea" },
      link("button", "Nút"),
      { k: "image", label: "Ảnh", kind: "image" },
    ],
  },
  ctaCollage: {
    label: "Lời kêu gọi + ảnh ghép",
    blank: { type: "ctaCollage", title: "", text: "", button: { label: "", href: "/contact-us/" }, images: [] },
    fields: [
      { k: "title", label: "Tiêu đề", kind: "text" },
      { k: "text", label: "Nội dung", kind: "textarea" },
      link("button", "Nút"),
      { k: "images", label: "Ảnh ghép", kind: "strings", itemLabel: "Ảnh" },
    ],
  },
  carousel: {
    label: "Băng chuyền thẻ ảnh",
    blank: { type: "carousel", title: "", items: [] },
    fields: [{ k: "title", label: "Tiêu đề khối", kind: "text" }, imageItems()],
  },
  imageList: {
    label: "Danh sách ảnh + chữ xen kẽ",
    blank: { type: "imageList", title: "", intro: [], items: [] },
    fields: [
      { k: "title", label: "Tiêu đề khối", kind: "text" },
      { k: "intro", label: "Đoạn giới thiệu (mỗi dòng một đoạn)", kind: "lines" },
      imageItems(),
    ],
  },
  story: {
    label: "Câu chuyện (ảnh + chữ)",
    blank: { type: "story", title: "", text: "", image: "" },
    fields: [
      { k: "title", label: "Tiêu đề", kind: "text" },
      { k: "text", label: "Nội dung", kind: "textarea" },
      { k: "image", label: "Ảnh", kind: "image" },
    ],
  },
  announcement: {
    label: "Dải thông báo",
    blank: { type: "announcement", eyebrow: "", title: "" },
    fields: [
      { k: "eyebrow", label: "Nhãn nhỏ", kind: "text" },
      { k: "title", label: "Tiêu đề", kind: "text" },
      link("button", "Nút (tuỳ chọn)"),
    ],
  },
  richText: {
    label: "Đoạn văn",
    blank: { type: "richText", title: "", paragraphs: [] },
    fields: [
      { k: "title", label: "Tiêu đề", kind: "text" },
      { k: "paragraphs", label: "Nội dung (mỗi dòng một đoạn)", kind: "lines" },
    ],
  },
  cardRow: {
    label: "Hàng thẻ lời kêu gọi",
    blank: { type: "cardRow", title: "", items: [] },
    fields: [
      { k: "title", label: "Tiêu đề khối", kind: "text" },
      { k: "items", label: "Thẻ (tối đa 6)", kind: "list", itemLabel: "Thẻ", blank: { eyebrow: "", title: "", text: "", link: { label: "", href: "" } }, fields: [
        { k: "eyebrow", label: "Nhãn nhỏ", kind: "text" },
        { k: "title", label: "Tiêu đề", kind: "text" },
        { k: "text", label: "Nội dung", kind: "textarea" },
        link("link", "Nút"),
      ] },
    ],
  },
  stats: {
    label: "Số liệu nổi bật",
    blank: { type: "stats", items: [] },
    fields: [
      { k: "items", label: "Số liệu", kind: "list", itemLabel: "Số liệu", blank: { value: "", suffix: "", label: "" }, fields: [
        { k: "value", label: "Giá trị", kind: "text" },
        { k: "suffix", label: "Hậu tố (vd: +)", kind: "text" },
        { k: "label", label: "Nhãn", kind: "text" },
      ] },
      { k: "cta", label: "Lời kêu gọi dưới số liệu (tuỳ chọn)", kind: "object", fields: [
        { k: "title", label: "Tiêu đề", kind: "text" },
        { k: "text", label: "Nội dung", kind: "textarea" },
        link("button", "Nút"),
      ] },
    ],
  },
  clients: { label: "Danh sách khách hàng (lấy từ mục Khách hàng)", blank: { type: "clients", title: "" }, fields: [{ k: "title", label: "Tiêu đề", kind: "text" }] },
  logoStrip: {
    label: "Dải logo khách hàng",
    blank: { type: "logoStrip", title: "", logos: [], link: { label: "", href: "/clients/" } },
    fields: [
      { k: "title", label: "Tiêu đề", kind: "text" },
      { k: "logos", label: "Logo", kind: "strings", itemLabel: "Logo" },
      link("link", "Liên kết xem thêm"),
    ],
  },
  contactForm: {
    label: "Form liên hệ + bản đồ",
    blank: { type: "contactForm", title: "", lead: "", fields: [], submit: "", mapUrl: "" },
    fields: [
      { k: "title", label: "Tiêu đề", kind: "text" },
      { k: "lead", label: "Mô tả", kind: "textarea" },
      { k: "fields", label: "Các ô nhập", kind: "list", itemLabel: "Ô nhập", blank: { key: "name", label: "", placeholder: "", required: false }, fields: [
        { k: "key", label: "Mã ô (name, phone, email, company, message)", kind: "text" },
        { k: "label", label: "Nhãn", kind: "text" },
        { k: "placeholder", label: "Gợi ý", kind: "text" },
        { k: "required", label: "Bắt buộc", kind: "bool" },
      ] },
      { k: "submit", label: "Chữ trên nút gửi", kind: "text" },
      { k: "mapUrl", label: "Link nhúng Google Maps (https://www.google.com/maps/embed...)", kind: "text" },
    ],
  },
  applyForm: {
    label: "Form ứng tuyển",
    blank: { type: "applyForm", heads: [], fields: [], submit: "" },
    fields: [
      { k: "heads", label: "Tiêu đề các phần", kind: "list", itemLabel: "Phần", blank: { title: "", text: "" }, fields: [
        { k: "title", label: "Tiêu đề", kind: "text" },
        { k: "text", label: "Mô tả", kind: "text" },
      ] },
      { k: "fields", label: "Các ô nhập", kind: "list", itemLabel: "Ô nhập", blank: { key: "fullName", label: "", placeholder: "" }, fields: [
        { k: "key", label: "Mã ô (fullName, email, phone, cvUrl, coverLetter)", kind: "text" },
        { k: "label", label: "Nhãn", kind: "text" },
        { k: "placeholder", label: "Gợi ý", kind: "text" },
      ] },
      { k: "submit", label: "Chữ trên nút gửi", kind: "text" },
    ],
  },
};

export const blockKey = (b: Record<string, unknown>) => `${b.type}${b.variant ? ":" + b.variant : ""}`;

/** Các khối được phép thêm mới (trang chủ/trang con). */
export const ADDABLE = Object.keys(BLOCK_DEFS);

export const JOB_FIELDS: Field[] = [
  { k: "title", label: "Tên vị trí", kind: "text" },
  { k: "sections", label: "Nội dung công việc", kind: "list", itemLabel: "Phần", blank: { title: "", lines: [] }, fields: [
    { k: "title", label: "Tiêu đề phần", kind: "text" },
    { k: "lines", label: "Các ý (mỗi dòng một ý)", kind: "lines" },
  ] },
  { k: "facts", label: "Yêu cầu / thông tin", kind: "list", itemLabel: "Mục", blank: { label: "", values: [] }, fields: [
    { k: "label", label: "Nhãn", kind: "text" },
    { k: "values", label: "Giá trị (mỗi dòng một ý)", kind: "lines" },
  ] },
  { k: "apply", label: "Chữ trên nút ứng tuyển", kind: "text" },
];
