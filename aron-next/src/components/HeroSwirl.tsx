"use client";
import { useEffect, useRef } from "react";

/**
 * Banner trang con: thiên hà elip (kiểu Andromeda) — lõi vàng cam, dải bụi nâu cam, cánh tím-xanh, sao nền dày,
 * thiên hà vệ tinh nhỏ. Quay rất chậm; rê chuột thì thiên hà nghiêng nhẹ và các lớp dịch theo độ sâu.
 * Chỉ chạy khi banner đang hiện; tôn trọng chế độ giảm chuyển động.
 */
type Part = { r: number; th: number; c: number; s: number; a: number; w: number; tw: number };
type Dust = { r: number; th: number; s: number; a: number; w: number };
type Star = { x: number; y: number; s: number; a: number; tw: number; c: number; d: number };
type Bright = { x: number; y: number; r: number; c: number };

function startSwirl(canvas: HTMLCanvasElement, host: HTMLElement, opts: { reduce: boolean }): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  const reduce = opts.reduce;
  // 0 vàng-trắng, 1 cam, 2 hồng tím, 3 tím, 4 xanh, 5 trắng xanh, 6 nâu cam (bụi)
  const CL: number[][] = [[248,226,196],[208,158,96],[207,162,168],[165,139,196],[143,184,196],[243,232,218],[200,110,90]];
  let seed = 5; const rnd = (): number => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const gauss = (): number => (rnd() + rnd() + rnd() - 1.5) / 1.5;
  const sprites = CL.map((c: number[]) => { const s = document.createElement("canvas"); s.width = s.height = 48; const x = s.getContext("2d") as CanvasRenderingContext2D; const g = x.createRadialGradient(24, 24, 0, 24, 24, 24); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(.16, `rgba(${c[0]},${c[1]},${c[2]},.95)`); g.addColorStop(.5, `rgba(${c[0]},${c[1]},${c[2]},.2)`); g.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`); x.fillStyle = g; x.fillRect(0, 0, 48, 48); return s; });
  let W = 0, H = 0, dpr = 1, A = 300, gx = 0, gy = 0;
  let parts: Part[] = [], dust: Dust[] = [], stars: Star[] = [], bright: Bright[] = [];
  let tx = 0, ty = 0, ox = 0, oy = 0, t = 0, spin = 0;
  const build = () => {
    const small = W < 700;
    A = Math.min(W * (small ? .85 : .34), H * 1.05);
    gx = W * (small ? .56 : .66); gy = H * .52;
    parts = []; const n = small ? 1600 : 4200;
    for (let i = 0; i < n; i++) {
      const u = Math.pow(rnd(), 1.7); const r = .03 + u * .97; const arm = rnd() < .5 ? 0 : Math.PI;
      const th = arm + Math.log(r * 8 + 1) * 1.7 + gauss() * (.5 + r * .6);
      const c = r < .22 ? (rnd() < .75 ? 0 : 1) : r < .5 ? (rnd() < .5 ? 1 : 2) : r < .75 ? (rnd() < .5 ? 2 : 3) : (rnd() < .6 ? 4 : 3);
      parts.push({ r, th, c, s: .35 + rnd() * rnd() * 1.6, a: (.25 + rnd() * .6) * (r < .2 ? .6 : 1), w: .06 / (r * 3 + .6), tw: rnd() * 6.283 });
    }
    dust = []; const nd = small ? 300 : 700;
    for (let i = 0; i < nd; i++) { const lane = i % 3; const r = .12 + rnd() * .5; const th = lane * 2.1 + Math.log(r * 8 + 1) * 1.7 + gauss() * .09; dust.push({ r, th, s: .5 + rnd() * 1.4, a: .25 + rnd() * .5, w: .06 / (r * 3 + .6) }); }
    stars = []; for (let i = 0; i < (small ? 380 : 900); i++) stars.push({ x: rnd() * W, y: rnd() * H, s: .3 + rnd() * rnd() * 2.2, a: .3 + rnd() * .7, tw: rnd() * 6.283, c: rnd() < .12 ? 1 : rnd() < .4 ? 5 : 0, d: .2 + rnd() * .8 });
    bright = [{ x: .33, y: .42, r: 14, c: 5 }, { x: .31, y: .5, r: 5, c: 5 }, { x: .83, y: .2, r: 6, c: 1 }, { x: .12, y: .22, r: 7, c: 5 }];
  };
  const size = () => { const r = host.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height); dpr = Math.min(window.devicePixelRatio || 1, 1.5); canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); build(); };
  const onMove = (e: PointerEvent) => { const r = host.getBoundingClientRect(); tx = ((e.clientX - r.left) / W - .5); ty = ((e.clientY - r.top) / H - .5); };
  const onLeave = () => { tx = 0; ty = 0; };
  const glow = (x: number, y: number, r: number, c: number, a: number) => { ctx.globalAlpha = a; ctx.drawImage(sprites[c], x - r, y - r, r * 2, r * 2); };
  let last = 0, raf = 0, vis = true;
  const frame = (now: number) => {
    raf = 0; const dt = Math.min(.05, (now - last) / 1000 || .016); last = now; t += dt;
    ox += (tx - ox) * Math.min(1, dt * .7); oy += (ty - oy) * Math.min(1, dt * .7);
    if (!reduce) spin += dt;
    ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1; ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#142530"; ctx.fillRect(0, 0, W, H);
    const tilt = -.5 + ox * .18, ratio = .38 + oy * .1, ct = Math.cos(tilt), st = Math.sin(tilt);
    const cxp = gx - ox * 26, cyp = gy - oy * 16;
    // sao nền
    ctx.globalCompositeOperation = "lighter";
    for (const s of stars) glow(s.x - ox * 16 * s.d, s.y - oy * 10 * s.d, s.s * 3.2, s.c, s.a * (.65 + .35 * Math.sin(t * 1.2 + s.tw)));
    // quầng elip (lõi vàng, vành tím, vành xanh)
    const halo = (rad: number, stops: [number, string][]) => { ctx.save(); ctx.translate(cxp, cyp); ctx.rotate(tilt); ctx.scale(1, ratio); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rad); for (const s of stops) g.addColorStop(s[0], s[1]); ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rad, 0, 6.283); ctx.fill(); ctx.restore(); };
    halo(A * 1.05, [[0, "rgba(90,120,160,.0)"], [.45, "rgba(110,120,170,.14)"], [.8, "rgba(95,150,170,.2)"], [1, "rgba(80,130,160,0)"]]);
    halo(A * .72, [[0, "rgba(248,226,196,.0)"], [.2, "rgba(208,158,96,.12)"], [.6, "rgba(190,140,185,.2)"], [1, "rgba(140,120,190,0)"]]);
    halo(A * .6, [[0, "rgba(252,236,210,.95)"], [.25, "rgba(236,190,135,.75)"], [.6, "rgba(207,150,105,.4)"], [1, "rgba(180,110,95,0)"]]);
    // hạt đĩa
    const P = (r: number, th: number): [number, number] => { const x0 = Math.cos(th) * r * A, y0 = Math.sin(th) * r * A * ratio; return [cxp + x0 * ct - y0 * st, cyp + x0 * st + y0 * ct]; };
    for (const p of parts) { p.th += p.w * dt * (reduce ? 0 : 1) * .5; const q = P(p.r, p.th); glow(q[0], q[1], p.s * 3.8, p.c, p.a * (.75 + .25 * Math.sin(t * 1.1 + p.tw))); }
    // dải bụi nâu cam
    ctx.globalCompositeOperation = "source-over";
    for (const d of dust) { d.th += d.w * dt * (reduce ? 0 : 1) * .5; const q = P(d.r, d.th); glow(q[0], q[1], d.s * 4.2, 6, d.a * .55); }
    ctx.globalCompositeOperation = "lighter";
    // nhân sáng
    glow(cxp, cyp, A * .13, 0, .95); glow(cxp, cyp, A * .045, 5, 1);
    // sao sáng + thiên hà vệ tinh
    for (const b of bright) { const x = b.x * W - ox * 20, y = b.y * H - oy * 12; glow(x, y, b.r * 2.6, b.c, .55); glow(x, y, b.r * .8, 5, 1); }
    const sx = W * .9 - ox * 30, sy = H * .88 - oy * 18; ctx.save(); ctx.translate(sx, sy); ctx.rotate(-.4); ctx.scale(1, .5); const g2 = ctx.createRadialGradient(0, 0, 0, 0, 0, 44); g2.addColorStop(0, "rgba(245,228,218,.95)"); g2.addColorStop(.3, "rgba(207,162,168,.6)"); g2.addColorStop(1, "rgba(120,120,180,0)"); ctx.globalAlpha = 1; ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(0, 0, 44, 0, 6.283); ctx.fill(); ctx.restore();
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    if (!reduce && vis) raf = requestAnimationFrame(frame);
  };
  size();
  const start = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  if (reduce) frame(performance.now()); else start();
  const io = new IntersectionObserver((es: IntersectionObserverEntry[]) => { vis = es[0].isIntersecting; if (vis) start(); else if (raf) { cancelAnimationFrame(raf); raf = 0; } });
  io.observe(host);
  const ro = new ResizeObserver(() => { size(); if (reduce) frame(performance.now()); }); ro.observe(host);
  host.addEventListener("pointermove", onMove); host.addEventListener("pointerleave", onLeave);
  return () => { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); host.removeEventListener("pointermove", onMove); host.removeEventListener("pointerleave", onLeave); };
}

export default function HeroSwirl() {
  const cv = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = cv.current;
    const host = canvas?.parentElement as HTMLElement | null;
    if (!canvas || !host) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return startSwirl(canvas, host, { reduce });
  }, []);
  return <canvas ref={cv} className="hero-swirl" aria-hidden="true" />;
}
