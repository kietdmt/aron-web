"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from "react";

function startData(canvas: HTMLCanvasElement, host: HTMLElement, opts: { reduce: boolean }): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  const reduce = opts.reduce;
  const TEAL = [159,195,198], CREAM = [240,214,184], AMB = [208,158,96], ROSE = [207,162,168], PEACH = [240,180,138], LAV = [165,139,196];
  let seed = 21; const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const rgba = (c: number[], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  let W = 0, H = 0, dpr = 1, V: number[] = [0, 0];
  let lanes: any[] = [], cols: any[] = [], stars: any[] = [];
  let tx = 0, ty = 0, ox = 0, oy = 0, t = 0;
  const build = () => {
    const small = W < 700;
    V = [W * (small ? .72 : W < 1100 ? .68 : .6), H * .72];
    lanes = []; const nl = small ? 34 : 64;
    for (let i = 0; i < nl; i++) {
      const right = i % 5 !== 0; const gold = i % 17 === 3;
      const xi = right ? V[0] + (W * 1.15 - V[0]) * Math.pow(rnd(), .8) : V[0] - (V[0] + W * .25) * Math.pow(rnd(), .8);
      const yi = H * (.78 + rnd() * .45);
      const c = gold ? AMB : rnd() < .72 ? TEAL : rnd() < .6 ? CREAM : rnd() < .5 ? ROSE : PEACH;
      lanes.push({ xi, yi, c, w: gold ? 1.9 : .6 + rnd() * .9, a: gold ? .85 : .16 + rnd() * .3, k: .55 + rnd() * .5, pulses: Array.from({ length: gold ? 3 : 2 }, () => ({ p: rnd(), v: (.035 + rnd() * .06) })), bend: .12 + rnd() * .14 });
    }
    cols = []; const Pw = W * (small ? .13 : W < 1100 ? .085 : .105); let x = W * 1.02; let s = 1;
    const n = small ? 6 : 9;
    for (let j = 0; j < n; j++) { const w = Pw * s; if (!small && x - w < Math.max(W * .58, 700)) break; cols.push({ xr: x, w, s, j, seed: rnd() * 10 }); x -= w * .985; s *= .845; }
    stars = Array.from({ length: small ? 70 : 150 }, () => ({ x: rnd() * W, y: rnd() * H * .75, s: .3 + rnd() * rnd() * 1.6, a: .2 + rnd() * .6, tw: rnd() * 6 }));
  };
  const size = () => { const r = host.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height); dpr = Math.min(window.devicePixelRatio || 1, 1.5); canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); build(); };
  const onMove = (e: PointerEvent) => { const r = host.getBoundingClientRect(); tx = ((e.clientX - r.left) / W - .5); ty = ((e.clientY - r.top) / H - .5); };
  const onLeave = () => { tx = 0; ty = 0; };
  const lanePt = (L: any, p: number, vx: number, vy: number): number[] => { const x1 = vx + (L.xi - vx) * (1 - L.bend) , y1 = vy + (L.yi - vy) * L.bend; const u = 1 - p; return [u * u * vx + 2 * u * p * x1 + p * p * L.xi, u * u * vy + 2 * u * p * y1 + p * p * L.yi]; };
  // ---- bảng biểu đồ kiểu AI (hệ toạ độ 100 x 66)
  const NAMES = ["NEURAL LOAD", "REVENUE AI", "FORECAST", "SEGMENTS", "GROWTH KPI", "SKILL RADAR", "LIVE HEATMAP"];
  const panel = (type: number, tt: number, sd: number) => {
    let g = ctx.createLinearGradient(0, 0, 100, 66); g.addColorStop(0, "rgba(22,52,64,.88)"); g.addColorStop(1, "rgba(10,24,34,.9)"); ctx.fillStyle = g; ctx.fillRect(0, 0, 100, 66);
    ctx.save(); ctx.globalAlpha = .12; ctx.strokeStyle = rgba(TEAL, 1); ctx.lineWidth = .4; for (let i = 1; i < 10; i++) { ctx.beginPath(); ctx.moveTo(i * 10, 12); ctx.lineTo(i * 10, 66); ctx.stroke(); } for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(0, 12 + i * 9); ctx.lineTo(100, 12 + i * 9); ctx.stroke(); } ctx.restore();
    const pulse = .5 + .5 * Math.sin(tt * 1.3 + sd);
    ctx.fillStyle = rgba(TEAL, .9); ctx.font = "bold 5.5px monospace"; ctx.textAlign = "left"; ctx.fillText(NAMES[type], 8, 8.5);
    ctx.fillStyle = rgba(PEACH, .4 + .6 * pulse); ctx.beginPath(); ctx.arc(93, 6.5, 2, 0, 6.283); ctx.fill();
    ctx.strokeStyle = rgba(TEAL, .35); ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(4, 11.5); ctx.lineTo(96, 11.5); ctx.stroke();
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    if (type === 0) {
      const v = .55 + .3 * Math.sin(tt * .5 + sd), a0 = Math.PI * .8, a1 = Math.PI * 2.2, av = a0 + (a1 - a0) * v;
      ctx.lineWidth = 5; ctx.strokeStyle = rgba(TEAL, .18); ctx.beginPath(); ctx.arc(50, 45, 23, a0, a1); ctx.stroke();
      for (let k = 0; k < 2; k++) { ctx.lineWidth = k ? 2.4 : 6; ctx.strokeStyle = rgba(PEACH, k ? 1 : .25); ctx.beginPath(); ctx.arc(50, 45, 23, a0, av); ctx.stroke(); }
      for (let i = 0; i <= 20; i++) { const a = a0 + (a1 - a0) * i / 20; ctx.strokeStyle = rgba(CREAM, i / 20 < v ? .8 : .25); ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(50 + Math.cos(a) * 28, 45 + Math.sin(a) * 28); ctx.lineTo(50 + Math.cos(a) * 31, 45 + Math.sin(a) * 31); ctx.stroke(); }
      ctx.fillStyle = rgba(CREAM, 1); ctx.font = "bold 13px sans-serif"; ctx.textAlign = "center"; ctx.fillText(Math.round(v * 100) + "", 50, 49); ctx.fillStyle = rgba(TEAL, .8); ctx.font = "5px monospace"; ctx.fillText("AI SCORE", 50, 57);
    } else if (type === 1) {
      const sc = (tt * .6 + sd) % 3;
      for (let i = 0; i < 12; i++) { const h = 8 + 36 * (.5 + .5 * Math.sin(tt * .7 + sd + i * .7)) * (.6 + .4 * Math.sin(i * .5 + sd)); const x = 8 + i * 7.4, c = i % 4 === 0 ? PEACH : i % 4 === 1 ? TEAL : i % 4 === 2 ? CREAM : ROSE;
        g = ctx.createLinearGradient(0, 60 - h, 0, 60); g.addColorStop(0, rgba(c, 1)); g.addColorStop(1, rgba(c, .15)); ctx.fillStyle = g; ctx.fillRect(x, 60 - h, 4.8, h);
        ctx.fillStyle = rgba(CREAM, .95); ctx.fillRect(x, 60 - h - 1, 4.8, 1.2);
        const hl = Math.max(0, 1 - Math.abs(i / 4 - sc) * 1.2); if (hl > 0) { ctx.fillStyle = rgba(CREAM, .55 * hl); ctx.fillRect(x, 60 - h, 4.8, h); } }
    } else if (type === 2) {
      const pts = (k: number) => { const a: number[][] = []; for (let i = 0; i <= 44; i++) { a.push([6 + i * 2.05, 42 - 13 * Math.sin(i * .26 + tt * .7 * k + sd) - 6 * Math.sin(i * .63 + sd * 2 + tt * .3) - (k === 1 ? 0 : 6)]); } return a; };
      const A = pts(1); ctx.beginPath(); A.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.lineTo(96, 62); ctx.lineTo(6, 62); g = ctx.createLinearGradient(0, 20, 0, 62); g.addColorStop(0, rgba(TEAL, .5)); g.addColorStop(1, rgba(TEAL, 0)); ctx.fillStyle = g; ctx.fill();
      for (let k = 0; k < 2; k++) { ctx.beginPath(); A.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.strokeStyle = rgba(TEAL, k ? 1 : .25); ctx.lineWidth = k ? 1.6 : 5; ctx.stroke(); }
      const B = pts(.6); ctx.beginPath(); B.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1] + 8) : ctx.moveTo(p[0], p[1] + 8))); ctx.strokeStyle = rgba(PEACH, .9); ctx.lineWidth = 1.1; ctx.setLineDash([3, 2]); ctx.stroke(); ctx.setLineDash([]);
      const hp = A[Math.floor(((tt * .25 + sd) % 1) * 44)]; ctx.fillStyle = rgba(CREAM, 1); ctx.beginPath(); ctx.arc(hp[0], hp[1], 2.2, 0, 6.283); ctx.fill(); ctx.strokeStyle = rgba(CREAM, .5); ctx.lineWidth = .8; ctx.beginPath(); ctx.arc(hp[0], hp[1], 4 + 2 * Math.sin(tt * 3), 0, 6.283); ctx.stroke();
    } else if (type === 3) {
      const parts = [.34, .26, .22, .18], cs = [AMB, ROSE, TEAL, LAV]; let a0 = -Math.PI / 2 + tt * .15;
      parts.forEach((p, i) => { const sw = p * 6.283 - .12; ctx.lineWidth = 7; ctx.strokeStyle = rgba(cs[i], .95); ctx.beginPath(); ctx.arc(50, 39, 19 + 1.2 * Math.sin(tt * 1.2 + i), a0, a0 + sw); ctx.stroke(); ctx.lineWidth = 1; ctx.strokeStyle = rgba(CREAM, .6); ctx.beginPath(); ctx.arc(50, 39, 25, a0, a0 + sw); ctx.stroke(); a0 += p * 6.283; });
      ctx.fillStyle = rgba(CREAM, 1); ctx.font = "bold 10px sans-serif"; ctx.textAlign = "center"; ctx.fillText((84 + Math.round(5 * Math.sin(tt * .4 + sd))) + "%", 50, 42);
    } else if (type === 4) {
      const n = 18 + Math.round(8 * Math.sin(tt * .35 + sd)); ctx.fillStyle = rgba(CREAM, 1); ctx.font = "bold 17px sans-serif"; ctx.textAlign = "left"; ctx.fillText("+" + n + "." + (Math.floor(tt * 7 + sd * 3) % 10) + "%", 8, 33);
      ctx.fillStyle = rgba(TEAL, .85); ctx.font = "5px monospace"; ctx.fillText("▲ YoY · ERP · CLOUD", 8, 41);
      ctx.beginPath(); for (let i = 0; i <= 30; i++) { const x = 8 + i * 2.9, y = 58 - 6 - 8 * Math.sin(i * .3 + tt * .8 + sd) - i * .25; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.strokeStyle = rgba(PEACH, 1); ctx.lineWidth = 1.5; ctx.stroke();
    } else if (type === 5) {
      const cx = 50, cy = 40, R = 22;
      for (let r = 1; r <= 3; r++) { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + i * 1.047; const x = cx + Math.cos(a) * R * r / 3, y = cy + Math.sin(a) * R * r / 3; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); ctx.strokeStyle = rgba(TEAL, .3); ctx.lineWidth = .6; ctx.stroke(); }
      ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + i * 1.047, v = .55 + .4 * Math.sin(tt * .6 + sd + i * 1.3); const x = cx + Math.cos(a) * R * v, y = cy + Math.sin(a) * R * v; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); ctx.fillStyle = rgba(TEAL, .28); ctx.fill(); ctx.strokeStyle = rgba(PEACH, 1); ctx.lineWidth = 1.4; ctx.stroke();
    } else {
      for (let i = 0; i < 12; i++) for (let j = 0; j < 5; j++) { const v = .5 + .5 * Math.sin(tt * .9 + i * .6 + j * 1.3 + sd); ctx.fillStyle = rgba(v > .75 ? PEACH : v > .45 ? TEAL : LAV, .1 + .8 * v * v); ctx.fillRect(7 + i * 7.5, 16 + j * 9.4, 6.2, 7.4); }
    }
    const sx = ((tt * .3 + sd * .13) % 1.7) * 150 - 40; ctx.save(); ctx.globalCompositeOperation = "lighter"; g = ctx.createLinearGradient(sx - 18, 0, sx + 18, 20); g.addColorStop(0, "rgba(159,195,198,0)"); g.addColorStop(.5, "rgba(190,230,235,.28)"); g.addColorStop(1, "rgba(159,195,198,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, 100, 66); ctx.restore();
  };
  let last = 0, raf = 0, vis = true;
  const frame = (now: number) => {
    raf = 0; const dt = Math.min(.05, (now - last) / 1000 || .016) * .6; last = now; if (!reduce) t += dt;
    ox += (tx - ox) * Math.min(1, dt * .7); oy += (ty - oy) * Math.min(1, dt * .7);
    ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1; ctx.clearRect(0, 0, W, H);
    let g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#112230"); g.addColorStop(1, "#1a3541"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const vx = V[0] - ox * 22, vy = V[1] - oy * 12;
    g = ctx.createRadialGradient(vx, vy, 0, vx, vy, W * .55); g.addColorStop(0, "rgba(70,130,135,.5)"); g.addColorStop(.5, "rgba(45,90,100,.22)"); g.addColorStop(1, "rgba(30,60,75,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter"; for (let k = 0; k < 3; k++) { const ph = ((t * .09 + k / 3) % 1); ctx.strokeStyle = rgba(TEAL, .22 * (1 - ph)); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(vx, vy, 40 + ph * W * .7, 12 + ph * H * .45, 0, 0, 6.283); ctx.stroke(); } ctx.globalCompositeOperation = "source-over";
    for (const s of stars) { ctx.fillStyle = rgba(CREAM, s.a * (.6 + .4 * Math.sin(t + s.tw))); ctx.fillRect(s.x, s.y, s.s, s.s); }
    // luồng sáng
    ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
    const SEG = 34;
    for (const L of lanes) {
      let prev = lanePt(L, 0, vx, vy);
      for (let k = 1; k <= SEG; k++) { const p = Math.pow(k / SEG, 1.6); const q = lanePt(L, p, vx, vy); ctx.strokeStyle = rgba(L.c, L.a * (.15 + p * .9)); ctx.lineWidth = L.w * (.25 + p * 2.2); ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); prev = q; }
      for (const pl of L.pulses) { pl.p += pl.v * dt * (reduce ? 0 : 1) * L.k; if (pl.p > 1.12) pl.p = -.1; const len = .14; let pp = lanePt(L, Math.max(0, Math.pow(Math.max(0, pl.p - len), 1.6)), vx, vy);
        for (let k = 1; k <= 8; k++) { const pr = Math.pow(Math.max(0, Math.min(1, pl.p - len + len * k / 8)), 1.6); const q = lanePt(L, pr, vx, vy); const f = k / 8; ctx.strokeStyle = rgba(L.c.map((v: number) => Math.min(255, v + 40)), (.9 * f) * (pr < .02 ? 0 : 1)); ctx.lineWidth = L.w * (.6 + pr * 3.4) * (.5 + f * .6); ctx.beginPath(); ctx.moveTo(pp[0], pp[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); pp = q; }
        const hp = lanePt(L, Math.pow(Math.max(0, Math.min(1, pl.p)), 1.6), vx, vy); const hr = 3 + 9 * Math.pow(Math.max(0, pl.p), 1.6) * L.w * .6; const gg = ctx.createRadialGradient(hp[0], hp[1], 0, hp[0], hp[1], hr); gg.addColorStop(0, rgba(CREAM, .85)); gg.addColorStop(1, rgba(L.c, 0)); ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(hp[0], hp[1], hr, 0, 6.283); ctx.fill(); }
    }
    // bức tường biểu đồ cong 3D
    ctx.globalCompositeOperation = "source-over";
    const wallVy = vy; 
    for (const c of cols) {
      const parx = -ox * 30 * c.s, pary = -oy * 16 * c.s + Math.sin(t * .8 + c.j * .9) * 5 * c.s;
      const hTot = H * .62 * c.s, yc = wallVy + (H * .36 - wallVy) * c.s * .9 + pary; // trung tâm cột
      const xr = c.xr + parx, xl = xr - c.w;
      const nextS = c.s * .845, hFar = H * .62 * nextS, ycF = wallVy + (H * .36 - wallVy) * nextS * .9 + pary;
      const rows = 3, gap = .06;
      for (let r = 0; r < rows; r++) {
        const f0 = (r + gap / 2) / rows - .5, f1 = (r + 1 - gap / 2) / rows - .5;
        const topR = yc + f0 * hTot, botR = yc + f1 * hTot, topL = ycF + f0 * hFar, botL = ycF + f1 * hFar;
        // khung kính
        ctx.save(); ctx.beginPath(); ctx.moveTo(xl, topL); ctx.lineTo(xr, topR); ctx.lineTo(xr, botR); ctx.lineTo(xl, botL); ctx.closePath(); ctx.clip();
        const hAvg = ((botR - topR) + (botL - topL)) / 2;
        ctx.setTransform(dpr * (xr - xl) / 100, dpr * (topR - topL) / 100, 0, dpr * hAvg / 66, dpr * xl, dpr * topL);
        panel((c.j * 2 + r * 3 + (c.j % 2)) % 7, t, c.seed + r * 1.7);
        ctx.restore();
        const bp = .5 + .5 * Math.sin(t * 1.1 + c.j * .8 + r * 1.9); ctx.beginPath(); ctx.moveTo(xl, topL); ctx.lineTo(xr, topR); ctx.lineTo(xr, botR); ctx.lineTo(xl, botL); ctx.closePath(); ctx.strokeStyle = rgba(TEAL, .12 + .2 * bp); ctx.lineWidth = 4; ctx.stroke(); ctx.strokeStyle = rgba(bp > .8 ? CREAM : TEAL, .55 + .4 * bp); ctx.lineWidth = 1; ctx.stroke();
      }
    }
    ctx.globalCompositeOperation = "lighter";
    g = ctx.createRadialGradient(vx, vy, 0, vx, vy, 90); g.addColorStop(0, "rgba(255,240,215,.55)"); g.addColorStop(1, "rgba(240,180,138,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(vx, vy, 90, 0, 6.283); ctx.fill();
    ctx.globalCompositeOperation = "source-over";
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

export default function HeroData() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return startData(canvas, host, { reduce });
  }, []);
  return <canvas ref={ref} className="hero-swirl" aria-hidden="true" />;
}
