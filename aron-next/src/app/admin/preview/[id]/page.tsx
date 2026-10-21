import { notFound } from "next/navigation";
import { z } from "zod";
import Blocks from "@/components/Blocks";
import { requirePerm } from "@/lib/admin/auth";
import type { Block } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Preview({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ lang?: string }> }) {
  const ctx = await requirePerm("pages.edit");
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const lang: "vi" | "en" = (await searchParams).lang === "en" ? "en" : "vi";
  const { data: tr } = await ctx.supabase.from("page_translations").select("blocks,draft_blocks").eq("page_id", id).eq("locale", lang).maybeSingle();
  if (!tr) notFound();
  const blocks = (Array.isArray(tr.draft_blocks) ? tr.draft_blocks : tr.blocks) as Block[];
  return (
    <>
      <div className="preview-banner">
        XEM TRƯỚC {Array.isArray(tr.draft_blocks) ? "(bản nháp chưa xuất bản)" : "(bản đang hiển thị)"} — chỉ nhân viên thấy trang này
      </div>
      <Blocks blocks={blocks} locale={lang} />
    </>
  );
}
