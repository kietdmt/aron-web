"use client";
import { useEffect, useRef } from "react";

type HNode = { x: number; y: number; r: number; kind: number; z: number; ph: number };
function startAI(canvas: HTMLCanvasElement, host: HTMLElement, opts: { reduce: boolean }): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  const reduce = opts.reduce;
  const TE = [143, 184, 196], TE2 = [190, 222, 228], WH = [244, 237, 226], PE = [240, 180, 138], AM = [208, 158, 96], RO = [207, 162, 168], LV = [165, 139, 196], CO = [224, 122, 95];
  const ACC = [PE, RO, AM, PE, LV, AM, PE];
  let seed = 7; const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const rgba = (c: number[], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  let W = 0, H = 0, dpr = 1, t = 0, tx = 0, ty = 0, ox = 0, oy = 0, small = false;
  let nodes: HNode[] = [];
  const links: number[][] = [[0, 1], [1, 2], [2, 3], [2, 5], [5, 4], [5, 6]];
  let bokeh: number[][] = [], dust: number[][] = [], brain: number[][] = [], edges: number[][] = [], circ: number[][][] = [], city: number[][] = [];
  const build = () => {
    small = W < 760;
    const Lpx = small ? W * .1 : Math.min(Math.max(W * .56, 700), W * .8), Spx = W - Lpx, fz = small ? .8 : Math.max(.6, Math.min(1, Spx / 634));
    const spec: [number, number, number, number][] = [[.12, .36, .30, 0], [.34, .60, .12, 1], [.52, .52, .17, 2], [.80, .20, .15, 3], [.9, .70, .30, 4], [.60, .86, .13, 5], [.06, .88, .09, 6]];
    nodes = spec.map(([fx, fy, r, kind], i) => ({ x: Lpx + fx * Spx, y: fy * H, r: r * H * fz, kind, z: .5 + (i % 3) * .35, ph: rnd() * 6 }));
    bokeh = Array.from({ length: 60 }, () => [rnd() * W, H * (.6 + rnd() * .4), 2 + rnd() * 10, rnd() * 6, .06 + rnd() * .2, rnd() < .35 ? 1 : 0]);
    dust = Array.from({ length: 110 }, () => [rnd() * W, rnd() * H, .5 + rnd() * 1.8, rnd() * 6, .3 + rnd() * 1.1]);
    city = []; let x = -20; while (x < W + 20) { const w = 18 + rnd() * 44, h = H * (.1 + rnd() * .3); city.push([x, w, h]); x += w + 2 + rnd() * 6; }
    brain = []; for (let i = 0; i < 64; i++) { const u = rnd() * 2 - 1, a = rnd() * 6.283, q = Math.sqrt(1 - u * u); brain.push([Math.cos(a) * q * 1.0, u * .66, Math.sin(a) * q * .75]); }
    edges = []; for (let i = 0; i < brain.length; i++) { const d = brain.map((b, j) => [j, (b[0] - brain[i][0]) ** 2 + (b[1] - brain[i][1]) ** 2 + (b[2] - brain[i][2]) ** 2]).filter((a) => a[0] !== i).sort((a, b) => a[1] - b[1]).slice(0, 3); d.forEach((q) => { if (q[0] > i) edges.push([i, q[0]]); }); }
    circ = Array.from({ length: 26 }, () => { const a = rnd() * 6.283; const pts: number[][] = [[Math.cos(a) * .35, Math.sin(a) * .35]]; let ang = a; for (let k = 0; k < 3; k++) { ang += (rnd() < .5 ? -1 : 1) * (Math.PI / 4) * (rnd() < .5 ? 1 : 2); const l = .1 + rnd() * .18; const q = pts[pts.length - 1]; pts.push([q[0] + Math.cos(ang) * l, q[1] + Math.sin(ang) * l]); } return pts; });
  };
  const size = () => { const r = host.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height); dpr = Math.min(window.devicePixelRatio || 1, 1.5); canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); build(); };
  const onMove = (e: PointerEvent) => { const r = host.getBoundingClientRect(); tx = (e.clientX - r.left) / W - .5; ty = (e.clientY - r.top) / H - .5; };
  const onLeave = () => { tx = 0; ty = 0; };
  const arc = (x: number, y: number, r: number, a0: number, a1: number, c: number[], al: number, lw: number) => { ctx.strokeStyle = rgba(c, al); ctx.lineWidth = lw; ctx.beginPath(); ctx.arc(x, y, r, a0, a1); ctx.stroke(); };
  const glowArc = (x: number, y: number, r: number, a0: number, a1: number, c: number[], al: number, lw: number) => { arc(x, y, r, a0, a1, c, al * .22, lw * 3.6); arc(x, y, r, a0, a1, c, al, lw); };
  const ticks = (r0: number, r1: number, n: number, rot: number, c: number[], al: number) => { ctx.strokeStyle = rgba(c, al); ctx.lineWidth = .8; ctx.beginPath(); for (let i = 0; i < n; i++) { const a = rot + i / n * 6.283, cs = Math.cos(a), sn = Math.sin(a); ctx.moveTo(cs * r0, sn * r0); ctx.lineTo(cs * r1, sn * r1); } ctx.stroke(); };
  const sphere = (x: number, y: number, rad: number, c: number[], al: number) => { const g = ctx.createRadialGradient(x - rad * .35, y - rad * .4, rad * .1, x, y, rad); g.addColorStop(0, rgba(WH, al)); g.addColorStop(.35, rgba(c, al)); g.addColorStop(1, rgba([c[0] * .35, c[1] * .35, c[2] * .4], al)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rad, 0, 6.283); ctx.fill(); };
  const icon = (n: HNode, tt: number) => {
    const { r } = n; const u = r * .42; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = rgba(WH, .95); ctx.fillStyle = rgba(WH, .95); ctx.lineWidth = Math.max(1.2, r * .035);
    if (n.kind === 1) { const rot = tt * .6; ctx.beginPath(); ctx.arc(0, 0, u, 0, 6.283); ctx.stroke(); for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(0, 0, Math.max(.5, u * Math.abs(Math.cos(rot + k * .785))), u, 0, 0, 6.283); ctx.stroke(); } for (let k = -1; k <= 1; k++) { const hh = k * u * .5, ww = Math.sqrt(Math.max(0, u * u - hh * hh)); ctx.beginPath(); ctx.moveTo(-ww, hh); ctx.lineTo(ww, hh); ctx.stroke(); } }
    else if (n.kind === 2) { ctx.beginPath(); ctx.moveTo(-u, u * .8); ctx.lineTo(-u, -u * .8); ctx.moveTo(-u, u * .8); ctx.lineTo(u, u * .8); ctx.stroke(); for (let i = 0; i < 6; i++) { const h = u * (.25 + i * .16 + .06 * Math.sin(tt * .9 + i)); ctx.fillStyle = rgba(i % 2 ? PE : WH, .55 + i * .08); ctx.fillRect(-u * .8 + i * u * .3, u * .8 - h, u * .2, h); } }
    else if (n.kind === 3) { ctx.strokeRect(-u, -u * .8, u * 2, u * 1.35); ctx.beginPath(); ctx.moveTo(-u * .4, u * .95); ctx.lineTo(u * .4, u * .95); ctx.moveTo(0, u * .55); ctx.lineTo(0, u * .95); ctx.stroke(); const gear = (gx: number, gy: number, gr: number, rot: number) => { ctx.beginPath(); for (let i = 0; i < 16; i++) { const a = rot + i * .3927, rr = i % 2 ? gr * .78 : gr; ctx.lineTo(gx + Math.cos(a) * rr, gy + Math.sin(a) * rr); } ctx.closePath(); ctx.stroke(); }; gear(-u * .35, -u * .15, u * .4, tt * .5); gear(u * .4, -u * .1, u * .3, -tt * .6); }
    else if (n.kind === 5) { ctx.beginPath(); ctx.moveTo(-u * .5, u); ctx.lineTo(-u * .35, u * .3); ctx.quadraticCurveTo(-u * .9, -u * .1, -u * .5, -u * .7); ctx.quadraticCurveTo(0, -u * 1.1, u * .55, -u * .6); ctx.lineTo(u * .7, -u * .1); ctx.lineTo(u * .95, u * .2); ctx.lineTo(u * .6, u * .3); ctx.lineTo(u * .5, u); ctx.stroke(); ctx.beginPath(); ctx.arc(-u * .05, -u * .35, u * .22, 0, 6.283); ctx.stroke(); }
  };
  const brainDraw = (n: HNode, tt: number) => {
    const { r } = n; const th = tt * .3, cs = Math.cos(th), sn = Math.sin(th), R = r * .62;
    const P = brain.map((b) => { const x = b[0] * cs + b[2] * sn, z = -b[0] * sn + b[2] * cs; const k = 1 / (1 - z * .3); return [x * R * k, b[1] * R * k, z]; });
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, r * .62); gr.addColorStop(0, "rgba(190,222,228,.34)"); gr.addColorStop(1, "rgba(143,184,196,0)"); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, r * .62, 0, 6.283); ctx.fill();
    for (const e of edges) { const a = P[e[0]], b = P[e[1]]; const d = (a[2] + b[2]) / 2; ctx.strokeStyle = rgba(e[0] % 5 === 0 ? LV : TE2, .12 + .35 * (d + 1) / 2); ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
    P.forEach((p, i) => { const g = .5 + .5 * Math.sin(tt * 1.4 + i), dd = (p[2] + 1) / 2; ctx.fillStyle = rgba(i % 7 === 0 ? PE : WH, (.3 + .7 * g) * (.35 + .65 * dd)); ctx.beginPath(); ctx.arc(p[0], p[1], (1 + g * 1.4) * (.6 + dd * .7), 0, 6.283); ctx.fill(); });
    ctx.restore();
    ctx.fillStyle = rgba(WH, .95); ctx.font = `bold ${Math.round(r * .13)}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.strokeStyle = rgba(WH, .9); ctx.lineWidth = 1.2; const bw = r * .2, bh = r * .16; ctx.strokeRect(-bw / 2, -r * .1 - bh / 2, bw, bh); ctx.fillText("AI", 0, -r * .1);
  };
  const circuitDraw = (n: HNode, tt: number) => {
    const { r } = n; ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < circ.length; i++) { const pts = circ[i]; ctx.strokeStyle = rgba(i % 4 === 0 ? PE : TE2, .38); ctx.lineWidth = .8; ctx.beginPath(); pts.forEach((q, k) => (k ? ctx.lineTo(q[0] * r, q[1] * r) : ctx.moveTo(q[0] * r, q[1] * r))); ctx.stroke(); const e = pts[pts.length - 1]; ctx.fillStyle = rgba(WH, .5 + .4 * Math.sin(tt * 2 + i)); ctx.beginPath(); ctx.arc(e[0] * r, e[1] * r, 1.6, 0, 6.283); ctx.fill(); }
    const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, r * .72); gr.addColorStop(0, "rgba(244,225,200,.7)"); gr.addColorStop(.35, "rgba(143,184,196,.3)"); gr.addColorStop(1, "rgba(143,184,196,0)"); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, r * .72, 0, 6.283); ctx.fill();
    const bw = r * .22, bh = r * .5, pul = .85 + .15 * Math.sin(tt * 2); ctx.fillStyle = rgba(WH, .95 * pul); ctx.fillRect(-bw / 2, -bh * .55, bw, bh);
    const g2 = ctx.createRadialGradient(0, -bh * .1, 0, 0, -bh * .1, r * .45); g2.addColorStop(0, "rgba(255,244,230,.55)"); g2.addColorStop(1, "rgba(255,244,230,0)"); ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(0, -bh * .1, r * .45, 0, 6.283); ctx.fill(); ctx.restore();
  };
  const orbit = (n: HNode, tt: number, i: number, front: boolean) => {
    const R = n.r * 1.3, rot = -.5 + i * .35;
    for (let k = 0; k < 2; k++) { const a = tt * (.35 + k * .15) * (k ? -1 : 1) + n.ph + k * 2.6, d = Math.sin(a); if ((d > 0) !== front) continue;
      const ex = Math.cos(a) * R, ey = Math.sin(a) * R * .3, cr = Math.cos(rot), sr = Math.sin(rot); const x = n.x + ex * cr - ey * sr, y = n.y + ex * sr + ey * cr; const rad = Math.max(2, n.r * .055) * (1 + d * .35);
      ctx.save(); ctx.globalCompositeOperation = "lighter"; const gg = ctx.createRadialGradient(x, y, 0, x, y, rad * 3.2); gg.addColorStop(0, rgba(ACC[i], .5)); gg.addColorStop(1, rgba(ACC[i], 0)); ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(x, y, rad * 3.2, 0, 6.283); ctx.fill(); ctx.restore(); sphere(x, y, rad, ACC[i], .95); }
  };
  const hud = (n: HNode, tt: number, i: number) => {
    const { r } = n; const s = (i % 2 ? 1 : -1), A = ACC[i];
    const tilt = .26 * Math.sin(tt * .35 + n.ph) + oy * .5, rotA = -.35 + ox * .4 + .2 * Math.sin(tt * .2 + i), k = Math.cos(tilt);
    // đổ bóng mặt sàn
    ctx.save(); ctx.translate(n.x, n.y + r * 1.55); ctx.scale(1, .16); const sh = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.2); sh.addColorStop(0, "rgba(6,16,24,.45)"); sh.addColorStop(1, "rgba(6,16,24,0)"); ctx.fillStyle = sh; ctx.beginPath(); ctx.arc(0, 0, r * 1.2, 0, 6.283); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(n.x, n.y);
    ctx.globalCompositeOperation = "lighter";
    const gl = ctx.createRadialGradient(0, 0, r * .2, 0, 0, r * 1.4); gl.addColorStop(0, "rgba(58,107,107,.5)"); gl.addColorStop(.7, "rgba(45,81,87,.2)"); gl.addColorStop(1, "rgba(45,81,87,0)"); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 0, r * 1.4, 0, 6.283); ctx.fill();
    // mặt kính (3D)
    ctx.globalCompositeOperation = "source-over"; const gs = ctx.createRadialGradient(-r * .3, -r * .35, r * .05, 0, 0, r * .72); gs.addColorStop(0, "rgba(120,170,185,.28)"); gs.addColorStop(1, "rgba(24,43,56,.35)"); ctx.fillStyle = gs; ctx.beginPath(); ctx.arc(0, 0, r * .72, 0, 6.283); ctx.fill(); ctx.globalCompositeOperation = "lighter";
    // vòng nghiêng + độ dày
    ctx.save(); ctx.rotate(rotA); ctx.scale(1, k); ctx.lineCap = "butt";
    for (let d = 3; d >= 0; d--) { ctx.save(); ctx.translate(0, d * r * .03); const f = d === 0 ? 1 : .22 / d;
      glowArc(0, 0, r, tt * .12 * s, tt * .12 * s + 4.3, TE2, .9 * f, Math.max(1.4, r * .045));
      glowArc(0, 0, r * .86, -tt * .2 * s + 1, -tt * .2 * s + 3.2, A, .95 * f, Math.max(1, r * .03)); ctx.restore(); }
    arc(0, 0, r * 1.12, tt * .06 * s, tt * .06 * s + 5.2, TE, .45, 1);
    ctx.setLineDash([r * .06, r * .05]); arc(0, 0, r * 1.2, -tt * .08 * s, -tt * .08 * s + 6.283, A, .4, 1); ctx.setLineDash([]);
    ticks(r * .72, r * .78, Math.max(40, Math.round(r * .8)), tt * .05 * s, AM, .55);
    arc(0, 0, r * .66, 0, 6.283, TE, .35, 1);
    ctx.restore(); ctx.lineCap = "round";
    // nội dung
    ctx.globalCompositeOperation = "source-over";
    if (n.kind === 0) circuitDraw(n, tt); else if (n.kind === 4) brainDraw(n, tt); else if (n.kind === 6) { ctx.globalCompositeOperation = "lighter"; const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * .55); g.addColorStop(0, "rgba(255,244,230,1)"); g.addColorStop(1, "rgba(240,180,138,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * .55, 0, 6.283); ctx.fill(); } else icon(n, tt);
    // điểm sáng phản chiếu
    ctx.globalCompositeOperation = "lighter"; const hl = ctx.createRadialGradient(-r * .35, -r * .45, 0, -r * .35, -r * .45, r * .35); hl.addColorStop(0, "rgba(255,248,238,.22)"); hl.addColorStop(1, "rgba(255,248,238,0)"); ctx.fillStyle = hl; ctx.beginPath(); ctx.arc(-r * .35, -r * .45, r * .35, 0, 6.283); ctx.fill();
    ctx.restore();
  };
  const pos = (n: HNode, tt: number) => ({ ...n, x: n.x - ox * 30 * n.z, y: n.y - oy * 16 * n.z + Math.sin(tt * .5 + n.ph) * 6 * n.z });
  let last = 0, raf = 0, vis = true;
  const frame = (now: number) => {
    raf = 0; const dt = Math.min(.05, (now - last) / 1000 || .016) * .7; last = now; if (!reduce) t += dt;
    ox += (tx - ox) * Math.min(1, dt * .8); oy += (ty - oy) * Math.min(1, dt * .8);
    ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1; ctx.clearRect(0, 0, W, H);
    let g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#142530"); g.addColorStop(.6, "#182b38"); g.addColorStop(1, "#1f3845"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    g = ctx.createRadialGradient(W * .78, H * .5, 0, W * .78, H * .5, W * .5); g.addColorStop(0, "rgba(58,107,107,.45)"); g.addColorStop(1, "rgba(45,81,87,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(14,28,38,.3)"; for (const c of city) ctx.fillRect(c[0] - ox * 8, H - c[2], c[1], c[2]);
    // sàn lưới phối cảnh
    ctx.save(); ctx.beginPath(); ctx.rect(0, H * .76, W, H * .24); ctx.clip(); const vx = W * .78 - ox * 40, vy = H * .5; ctx.strokeStyle = rgba(TE, .16); ctx.lineWidth = 1; ctx.beginPath(); for (let k = -14; k <= 14; k++) { ctx.moveTo(vx, vy); ctx.lineTo(vx + k * W * .22, H * 1.4); } for (let k = 0; k < 7; k++) { const ph = ((k + t * .15) % 7) / 7; const y = H * .76 + Math.pow(ph, 1.8) * H * .5; ctx.moveTo(0, y); ctx.lineTo(W, y); } ctx.stroke(); ctx.restore();
    ctx.globalCompositeOperation = "lighter";
    for (const b of bokeh) { const gg = ctx.createRadialGradient(b[0], b[1], 0, b[0], b[1], b[2]); const a = b[4] * (.6 + .4 * Math.sin(t * .6 + b[3])); gg.addColorStop(0, rgba(b[5] ? PE : TE, a)); gg.addColorStop(1, rgba(b[5] ? PE : TE, 0)); ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(b[0], b[1], b[2], 0, 6.283); ctx.fill(); }
    for (const d of dust) { const px = (d[0] - ox * 22 * d[4] + W * 4) % W, py = (d[1] - oy * 12 * d[4] - t * 3 * d[4] + H * 40) % H; ctx.fillStyle = rgba(d[2] > 1.5 ? PE : TE2, (.25 + .35 * Math.sin(t * .8 + d[3])) * (.4 + d[4] * .4)); ctx.fillRect(px, py, d[2] * d[4], d[2] * d[4]); }
    ctx.globalCompositeOperation = "source-over";
    const P = nodes.map((n) => pos(n, t));
    P.forEach((n, i) => orbit(n, t, i, false));
    ctx.lineCap = "round";
    links.forEach((l, k) => { const a = P[l[0]], b = P[l[1]]; ctx.strokeStyle = rgba(TE2, .14); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.strokeStyle = rgba(WH, .6); ctx.lineWidth = 1; ctx.stroke();
      const mp = (.42 + (k % 3) * .06); sphere(a.x + (b.x - a.x) * mp, a.y + (b.y - a.y) * mp, 4.5, ACC[k % 7], 1);
      ctx.save(); ctx.globalCompositeOperation = "lighter"; for (let j = 0; j < 2; j++) { const q = ((t * .12 + k * .23 + j * .5) % 1); const px = a.x + (b.x - a.x) * q, py = a.y + (b.y - a.y) * q; const gg = ctx.createRadialGradient(px, py, 0, px, py, 10); gg.addColorStop(0, rgba(j ? PE : WH, .95)); gg.addColorStop(1, rgba(TE, 0)); ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(px, py, 10, 0, 6.283); ctx.fill(); } ctx.restore(); });
    P.forEach((n, i) => hud(n, t, i));
    P.forEach((n, i) => orbit(n, t, i, true));
    ctx.save(); ctx.globalCompositeOperation = "lighter"; const e = P[4]; for (let k = 0; k < 2; k++) { const ph = (t * .1 + k * .5) % 1; arc(e.x, e.y, e.r * (1.25 + ph * .7), 0, 6.283, PE, .3 * (1 - ph), 1.5); } ctx.restore();
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

export default function HeroAI() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return startAI(canvas, host, { reduce });
  }, []);
  return <canvas ref={ref} className="hero-swirl" aria-hidden="true" />;
}
