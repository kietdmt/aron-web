/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

export type OrbitItem = { logo: string; name: string; industry: string; location: string };
type Props = {
  items: OrbitItem[];
  industryLabel: string;
  locationLabel: string;
  hint?: string;
  detailLabel: string;
  closeLabel: string;
  detailHref: string;
};

const D = 258; // khoảng cách giữa tâm hai logo
const CARD = 228; // đường kính mỗi logo tròn
const IDLE_MS = 1800; // sau bao lâu không tương tác thì lưới tự trôi chậm
const easeOutBack = (x: number) => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };

/**
 * Lưới tổ ong kiểu Apple Watch, có hiệu ứng:
 * logo gần tâm to – xa tâm nhỏ; lưới tự trôi chậm khi để yên; mỗi logo nhấp nhô nhẹ;
 * bay từ tâm ra khi xuất hiện; phóng to khi con trỏ lại gần; rê chuột / kéo để lướt; nhấn để xem chi tiết.
 */
export default function LogoOrbit({ items, industryLabel, locationLabel, detailLabel, closeLabel, detailHref }: Props) {
  const [sel, setSel] = useState<number | null>(null);
  const selRef = useRef<number | null>(null);
  selRef.current = sel;
  const boxRef = useRef<HTMLDivElement>(null);
  const els = useRef<(HTMLButtonElement | null)[]>([]);
  const pan = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const ptr = useRef({ in: false, x: 0, y: 0 });
  const lastAct = useRef(0);
  const drag = useRef<{ id: number; x: number; y: number; moved: number } | null>(null);
  const size = useRef({ w: 600, h: 480 });
  const n = items.length;

  // Toạ độ lục giác (xếp xoắn từ tâm ra ngoài), tự mở rộng theo số logo
  const pos = useMemo(() => {
    const K = Math.ceil((-3 + Math.sqrt(9 - 12 * (1 - n))) / 6) + 1;
    const all: { x: number; y: number; d: number }[] = [];
    for (let q = -K; q <= K; q++)
      for (let r = Math.max(-K, -q - K); r <= Math.min(K, -q + K); r++) {
        const x = D * (q + r / 2), y = D * r * 0.866;
        all.push({ x, y, d: Math.hypot(x / 1.7, y) }); // sắp theo hình elip rộng
      }
    return all.sort((a, b) => a.d - b.d).slice(0, n);
  }, [n]);
  const maxR = useMemo(() => Math.max(0, ...pos.map((p) => p.d)), [pos]);

  const unit = () => Math.min(1, Math.max(0.5, size.current.w / 1230)); // màn hình nhỏ thì thu nhỏ cả lưới
  const maxPan = () => { const e = Math.min(size.current.w, size.current.h) / 2; return Math.max(maxR * unit() - e * 0.3, e * 0.55) / unit(); };
  const clamp = (v: number) => Math.max(-maxPan(), Math.min(maxPan(), v));

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, visible = true, t0 = 0;

    const frame = (now: number) => {
      raf = 0;
      if (!visible) return;
      if (!t0) t0 = now;
      const { w, h } = size.current;
      const p = pan.current;
      // tự trôi chậm khi người dùng không tương tác và không mở chi tiết
      if (!reduced && selRef.current === null && !drag.current && now - lastAct.current > IDLE_MS) {
        const A = maxPan() * 0.85;
        p.tx = A * Math.sin(now * 0.00016);
        p.ty = A * 0.75 * Math.sin(now * 0.00021 + 1.3);
      }
      p.x += (p.tx - p.x) * 0.06;
      p.y += (p.ty - p.y) * 0.06;

      const edge = Math.max(220, Math.min(w, h) / 2);
      const k0 = unit();
      const sx = Math.min(1.7, Math.max(1, w / h));
      const intro = reduced ? 1 : Math.min(1, (now - t0) / 1500);
      const pr = ptr.current;
      pos.forEach((it, i) => {
        const el = els.current[i];
        if (!el) return;
        const local = Math.min(1, Math.max(0, intro * 1.6 - (i / n) * 0.6));
        const ez = local >= 1 ? 1 : easeOutBack(local);
        const bob = reduced ? 0 : 1;
        const x = ((it.x - p.x) * ez + Math.sin(now * 0.0011 + i * 1.9) * 7 * bob) * k0;
        const y = ((it.y - p.y) * ez + Math.cos(now * 0.0013 + i * 2.3) * 8 * bob) * k0;
        const t = Math.hypot(x / k0 / sx, y / k0) / edge;
        const k = Math.min(1, Math.max(0, (t - 0.42) / 0.78));
        let s = 1.08 - (k * k * (3 - 2 * k));
        if (pr.in) s *= 1 + 0.16 * Math.max(0, 1 - Math.hypot(x - pr.x, y - pr.y) / 300); // lại gần thì phóng to
        s = Math.max(0.06, s) * k0 * Math.max(0.01, ez);
        el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${s.toFixed(3)})`;
        el.style.opacity = (Math.max(0, 1 - k * 0.35) * Math.min(1, local * 2)).toFixed(2);
        el.style.zIndex = String(Math.round(s * 100));
        el.style.pointerEvents = s < 0.3 ? "none" : "auto";
      });
      raf = requestAnimationFrame(frame);
    };
    const start = () => { if (!raf && visible) raf = requestAnimationFrame(frame); };

    const upd = () => { size.current = { w: box.clientWidth, h: box.clientHeight }; };
    upd();
    const ro = new ResizeObserver(upd);
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); }, { threshold: 0.05 });
    io.observe(box);
    start();
    return () => { ro.disconnect(); io.disconnect(); cancelAnimationFrame(raf); };
  }, [pos, n]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (sel === null) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSel(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sel]);

  const onMove = (e: React.PointerEvent) => {
    const el = boxRef.current;
    if (!el || sel !== null) return;
    const p = pan.current;
    const r = el.getBoundingClientRect();
    if (e.pointerType === "mouse") ptr.current = { in: true, x: e.clientX - r.left - r.width / 2, y: e.clientY - r.top - r.height / 2 };
    lastAct.current = performance.now();
    if (drag.current && drag.current.id === e.pointerId) {
      const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y;
      drag.current.x = e.clientX; drag.current.y = e.clientY; drag.current.moved += Math.abs(dx) + Math.abs(dy);
      p.tx = clamp(p.tx - dx / unit()); p.ty = clamp(p.ty - dy / unit());
    } else if (e.pointerType === "mouse") {
      p.tx = clamp(((e.clientX - r.left - r.width / 2) / (r.width / 2)) * maxPan());
      p.ty = clamp(((e.clientY - r.top - r.height / 2) / (r.height / 2)) * maxPan());
    }
  };
  const cur = sel !== null ? items[sel] : null;

  return (
    <div className="orbit">
      <div
        className="hive"
        ref={boxRef}
        onPointerDown={(e) => { drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0 }; lastAct.current = performance.now(); }}
        onPointerMove={onMove}
        onPointerUp={() => { lastAct.current = performance.now(); setTimeout(() => { drag.current = null; }, 0); }}
        onPointerCancel={() => { drag.current = null; }}
        onPointerLeave={() => { ptr.current.in = false; lastAct.current = performance.now(); }}
      >
        {items.map((c, i) => (
          <button
            key={c.logo}
            ref={(el) => { els.current[i] = el; }}
            type="button"
            className="hive-dot"
            style={{ width: CARD, height: CARD, marginLeft: -CARD / 2, marginTop: -CARD / 2, opacity: 0 }}
            onClick={() => { if (!drag.current || drag.current.moved < 6) setSel(i); }}
            aria-label={c.name || "logo"}
            title={c.name}
            draggable={false}
          >
            <img src={c.logo} alt={c.name} loading="lazy" draggable={false} />
          </button>
        ))}

        {cur && (
          <>
            <button type="button" className="orbit-backdrop" aria-label={closeLabel} onClick={() => setSel(null)} />
            <div className="orbit-detail" role="dialog" aria-label={cur.name}>
              <button type="button" className="orbit-x" onClick={() => setSel(null)} aria-label={closeLabel}>×</button>
              <div className="od-logo"><img src={cur.logo} alt={cur.name} /></div>
              {cur.name && <h3>{cur.name}</h3>}
              {cur.industry && <p><span>{industryLabel}</span>{cur.industry}</p>}
              {cur.location && <p><span>{locationLabel}</span>{cur.location}</p>}
              <Link className="btn btn-sm" href={detailHref}>{detailLabel}</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
