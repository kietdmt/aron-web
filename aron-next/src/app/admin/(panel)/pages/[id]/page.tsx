import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requirePerm } from "@/lib/admin/auth";
import { can } from "@/lib/permissions";
import BlockEditor from "@/components/admin/BlockEditor";
import { discardDraft, restoreVersion } from "../../../cms-actions";

export const dynamic = "force-dynamic";
const fmt = (d: string | null) => (d ? new Date(d).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "—");

export default async function EditPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ lang?: string }> }) {
  const ctx = await requirePerm("pages.edit");
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const lang: "vi" | "en" = (await searchParams).lang === "en" ? "en" : "vi";

  const { data: page } = await ctx.supabase.from("pages").select("id,slug,published").eq("id", id).maybeSingle();
  if (!page) notFound();
  const { data: tr } = await ctx.supabase.from("page_translations").select("*").eq("page_id", id).eq("locale", lang).maybeSingle();
  if (!tr) notFound();
  const { data: versions } = await ctx.supabase.from("page_versions").select("id,created_at,note,title").eq("page_id", id).eq("locale", lang).order("created_at", { ascending: false }).limit(15);

  const hasDraft = Array.isArray(tr.draft_blocks);
  const blocks = (hasDraft ? tr.draft_blocks : tr.blocks) as Record<string, unknown>[];
  const title = (hasDraft ? tr.draft_title : tr.title) as string;
  const description = (hasDraft ? tr.draft_description : tr.description) as string;

  return (
    <>
      <h1>Sửa trang: <code>{page.slug}</code></h1>
      <div className="tabs">
        <Link href={`/admin/pages/${id}?lang=vi`} className={lang === "vi" ? "on" : ""}>Tiếng Việt</Link>
        <Link href={`/admin/pages/${id}?lang=en`} className={lang === "en" ? "on" : ""}>English</Link>
      </div>
      <div className="toolbar">
        {hasDraft ? <span className="pill warn">Đang có bản nháp ({fmt(tr.draft_updated_at)})</span> : <span className="pill ok">Đang hiển thị bản đã xuất bản</span>}
        <Link className="btn btn-sm btn-outline" href={`/admin/preview/${id}?lang=${lang}`} target="_blank">Xem trước</Link>
        {hasDraft && (
          <form action={discardDraft}>
            <input type="hidden" name="pageId" value={id} /><input type="hidden" name="locale" value={lang} />
            <button className="btn btn-sm btn-outline" type="submit">Bỏ bản nháp</button>
          </form>
        )}
      </div>

      <BlockEditor
        key={`${id}-${lang}-${tr.draft_updated_at ?? tr.published_at ?? ""}`}
        pageId={id}
        locale={lang}
        initialTitle={title}
        initialDescription={description}
        initialBlocks={blocks}
        canPublish={can(ctx.role, "pages.publish")}
        hasDraft={hasDraft}
      />

      <div className="card">
        <h3>Lịch sử xuất bản</h3>
        {(versions ?? []).length === 0 && <p className="muted">Chưa có phiên bản nào được lưu. Phiên bản được tạo mỗi lần xuất bản.</p>}
        <ul>
          {(versions ?? []).map((v) => (
            <li key={v.id} className="status-form" style={{ padding: "6px 0" }}>
              <span>{fmt(v.created_at)} — {v.note ?? ""}</span>
              <form action={restoreVersion}>
                <input type="hidden" name="versionId" value={v.id} />
                <button className="btn btn-sm btn-outline" type="submit">Khôi phục vào bản nháp</button>
              </form>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
