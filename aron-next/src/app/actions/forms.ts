"use server";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { createServiceClient, hasSupabase } from "@/lib/supabase/server";

export type FormState = { ok?: boolean; error?: "invalid" | "rate" | "server" };

const MAX_PER_WINDOW = 5; // số lần gửi tối đa / IP
const WINDOW_MIN = 10; // trong bao nhiêu phút
const MIN_FILL_MS = 2500; // người thật không điền form nhanh hơn thế

const clean = (s: unknown) => String(s ?? "").replace(/\u0000/g, "").trim();

async function guard(fd: FormData, table: "leads" | "applications") {
  // 1) honeypot + thời gian điền: bot thường lọt bẫy → giả vờ thành công
  if (clean(fd.get("website"))) return { silent: true as const };
  const ts = Number(clean(fd.get("ts")));
  if (!ts || Date.now() - ts < MIN_FILL_MS) return { silent: true as const };

  // 2) giới hạn tần suất theo IP (băm kèm muối, không lưu IP thô)
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const ipHash = createHash("sha256").update(ip + (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").slice(-12)).digest("hex");
  const db = createServiceClient();
  const since = new Date(Date.now() - WINDOW_MIN * 60_000).toISOString();
  const { count } = await db.from(table).select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", since);
  if ((count ?? 0) >= MAX_PER_WINDOW) return { rate: true as const };
  return { db, ipHash };
}

const contactSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().min(6).max(40).regex(/^[0-9+()\-.\s]+$/),
  email: z.union([z.string().email().max(200), z.literal("")]).optional(),
  company: z.string().max(200).optional(),
  message: z.string().max(4000).optional(),
  locale: z.enum(["vi", "en"]),
});

export async function submitContact(_prev: FormState | null, fd: FormData): Promise<FormState> {
  if (!hasSupabase()) return { error: "server" };
  const parsed = contactSchema.safeParse({
    name: clean(fd.get("name")),
    phone: clean(fd.get("phone")),
    email: clean(fd.get("email")),
    company: clean(fd.get("company")),
    message: clean(fd.get("message")),
    locale: clean(fd.get("locale")),
  });
  if (!parsed.success) return { error: "invalid" };
  try {
    const g = await guard(fd, "leads");
    if ("silent" in g) return { ok: true };
    if ("rate" in g) return { error: "rate" };
    const d = parsed.data;
    const { error } = await g.db.from("leads").insert({
      name: d.name, phone: d.phone, email: d.email || null, company: d.company || null,
      message: d.message || null, locale: d.locale, ip_hash: g.ipHash,
    });
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    console.error("submitContact", e);
    return { error: "server" };
  }
}

const applySchema = z.object({
  fullName: z.string().min(1).max(200),
  email: z.string().email().max(200),
  phone: z.string().min(6).max(40).regex(/^[0-9+()\-.\s]+$/),
  cvUrl: z.union([z.string().url().max(500).refine((u) => /^https?:\/\//i.test(u)), z.literal("")]).optional(),
  coverLetter: z.string().max(6000).optional(),
  job: z.string().max(200).optional(),
  locale: z.enum(["vi", "en"]),
});

export async function submitApplication(_prev: FormState | null, fd: FormData): Promise<FormState> {
  if (!hasSupabase()) return { error: "server" };
  const parsed = applySchema.safeParse({
    fullName: clean(fd.get("fullName")),
    email: clean(fd.get("email")),
    phone: clean(fd.get("phone")),
    cvUrl: clean(fd.get("cvUrl")),
    coverLetter: clean(fd.get("coverLetter")),
    job: clean(fd.get("job")),
    locale: clean(fd.get("locale")),
  });
  if (!parsed.success) return { error: "invalid" };
  try {
    const g = await guard(fd, "applications");
    if ("silent" in g) return { ok: true };
    if ("rate" in g) return { error: "rate" };
    const d = parsed.data;
    const { error } = await g.db.from("applications").insert({
      full_name: d.fullName, email: d.email, phone: d.phone, cv_url: d.cvUrl || null,
      cover_letter: d.coverLetter || null, job_slug: d.job || null, locale: d.locale, ip_hash: g.ipHash,
    });
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    console.error("submitApplication", e);
    return { error: "server" };
  }
}
