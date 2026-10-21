/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from "react";

/**
 * Bộ hiển thị Markdown AN TOÀN (không dùng dangerouslySetInnerHTML, không cho HTML thô).
 * Hỗ trợ: # ## ### tiêu đề, **đậm**, *nghiêng*, `mã`, [chữ](liên kết), ![mô tả](ảnh),
 * danh sách - và 1., trích dẫn >, đường kẻ ---, đoạn văn.
 */
const safeHref = (u: string) => (/^(https?:\/\/|mailto:|\/(?!\/)|#)/i.test(u) && !/[\s"'<>\\]/.test(u) ? u : "");
const safeImg = (u: string) => (/^(https:\/\/|\/(?!\/))/i.test(u) && !/[\s"'<>\\]/.test(u) ? u : "");

let uid = 0;
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  // ảnh | liên kết | đậm | nghiêng | mã
  const re = /!\[([^\]]*)\]\(([^)\s]+)\)|\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|(?<![*\w])\*([^*\n]+)\*(?!\*)|`([^`]+)`/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const key = `i${uid++}`;
    if (m[2] !== undefined) {
      const src = safeImg(m[2]);
      out.push(src ? <img key={key} src={src} alt={m[1]} loading="lazy" /> : m[0]);
    } else if (m[4] !== undefined) {
      const href = safeHref(m[4]);
      const ext = /^https?:/i.test(href);
      out.push(href ? <a key={key} href={href} {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{inline(m[3])}</a> : m[3]);
    } else if (m[5] !== undefined) out.push(<strong key={key}>{inline(m[5])}</strong>);
    else if (m[6] !== undefined) out.push(<em key={key}>{inline(m[6])}</em>);
    else if (m[7] !== undefined) out.push(<code key={key}>{m[7]}</code>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ source }: { source: string }) {
  uid = 0;
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const nodes: ReactNode[] = [];
  let i = 0, k = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^(#{1,3})\s+(.*)$/))) {
      const lvl = m[1].length + 1; // # → h2 (h1 dành cho tiêu đề bài)
      const Tag = (`h${lvl}`) as "h2" | "h3" | "h4";
      nodes.push(<Tag key={k++}>{inline(m[2])}</Tag>); i++; continue;
    }
    if (/^---+\s*$/.test(line)) { nodes.push(<hr key={k++} />); i++; continue; }
    if (/^>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ""));
      nodes.push(<blockquote key={k++}>{inline(buf.join(" "))}</blockquote>); continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*]\s+/, ""));
      nodes.push(<ul key={k++}>{items.map((t, j) => <li key={j}>{inline(t)}</li>)}</ul>); continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+[.)]\s+/, ""));
      nodes.push(<ol key={k++}>{items.map((t, j) => <li key={j}>{inline(t)}</li>)}</ol>); continue;
    }
    if (/^!\[[^\]]*\]\([^)\s]+\)\s*$/.test(line.trim())) { nodes.push(<figure key={k++}>{inline(line.trim())}</figure>); i++; continue; }
    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s|---+\s*$|>\s?|\s*[-*]\s+|\s*\d+[.)]\s+)/.test(lines[i])) buf.push(lines[i++]);
    nodes.push(<p key={k++}>{inline(buf.join(" "))}</p>);
  }
  return <>{nodes}</>;
}
