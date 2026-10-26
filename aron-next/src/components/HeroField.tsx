"use client";
import { useEffect, useRef } from "react";

/**
 * "Thảm cỏ lụa": những chiếc lá nhỏ trong hero cúi theo con trỏ rồi nảy lại như lò xo mềm,
 * đầu lá trễ hơn gốc nên uốn cong tự nhiên. Kèm vầng sáng + bụi vàng li ti theo tay,
 * và hình chính nghiêng nhẹ theo chuột. Chỉ chạy khi hero đang hiện trên màn hình.
 */
type Leaf = {
  nx: number; ny: number; len: number; wid: number; th: number; col: string; a: number; depth: number; ph: number;
  bx: number; by: number; bvx: number; bvy: number; tx: number; ty: number; tvx: number; tvy: number;
};
type Dust = { x: number; y: number; vx: number; vy: number; life: number; max: number; r: number };

const PALETTE: [string, number][] = [
  ["224,122,95", 0.24], ["240,180,138", 0.22], ["243,220,192", 0.18], ["143,184,196", 0.18], ["208,158,96", 0.1], ["165,139,196", 0.08],
];
function rng(seed: number) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const pick = (r: number) => { let a = 0; for (const [c, w] of PALETTE) { a += w; if (r <= a) return c; } return PALETTE[0][0]; };

export default function HeroField() {
  const cv = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = cv.current;
    const host = canvas?.parentElement as HTMLElement | null;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !host || !ctx) return;
    const art = host.querySelector<HTMLElement>(".hero-art-wrap");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0, H = 0, dpr = 1;
    let leaves: Leaf[] = [];
    const dust: Dust[] = [];
    const R = rng(11);
    const seeds = Array.from({ length: 230 }, () => [R(), R(), R(), R(), R(), R(), R()]);

    const build = () => {
      const n = Math.max(70, Math.min(190, Math.round((W * H) / 7500)));
      leaves = seeds.slice(0, n).map((s) => {
        const nx = s[0], depth = 0.65 + s[1] * 0.8;
        const len = (15 + s[2] * 34) * (0.85 + depth * 0.3);
        const left = nx < 0.5 ? 0.55 : 1; // vùng chữ: lá mờ hơn để không rối mắt
        return { nx, ny: s[3], len, wid: 0.34 + s[4] * 0.06, th: s[5] * Math.PI * 2, col: pick(s[6]), a: (0.35 + s[2] * 0.55) * left, depth, ph: s[4] * 40,
          bx: 0, by: 0, bvx: 0, bvy: 0, tx: 0, ty: 0, tvx: 0, tvy: 0 };
      });
    };
    const size = () => {
      const r = host.getBoundingClientRect();
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    };

    // con trỏ
    let mx = -9999, my = -9999, pvx = 0, pvy = 0, lx = 0, ly = 0, lt = 0, active = false, lastMove = 0;
    let gx = -9999, gy = -9999, glow = 0;
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top, now = performance.now();
      if (active && now - lt > 0) {
        const dt = (now - lt) / 1000;
        pvx = pvx * 0.6 + ((x - lx) / dt) * 0.4; pvy = pvy * 0.6 + ((y - ly) / dt) * 0.4;
      } else { gx = x; gy = y; }
      mx = x; my = y; lx = x; ly = y; lt = now; lastMove = now; active = true;
    };
    const onLeave = () => { active = false; mx = -9999; my = -9999; };

    let raf = 0, visible = true, last = 0, t = 0;
    let tiltX = 0, tiltY = 0, shX = 0, shY = 0;

    const draw = (dtRaw: number) => {
      const dt = Math.min(dtRaw, 1 / 30);
      t += dt;
      if (performance.now() - lastMove > 90) { pvx *= 0.9; pvy *= 0.9; }
      ctx.clearRect(0, 0, W, H);

      // vầng sáng mềm theo tay
      glow += ((active ? 1 : 0) - glow) * Math.min(1, dt * 3);
      gx += (mx - gx) * Math.min(1, dt * 7); gy += (my - gy) * Math.min(1, dt * 7);
      if (glow > 0.01 && gx > -5000) {
        const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, 300);
        g.addColorStop(0, `rgba(243,227,166,${0.16 * glow})`); g.addColorStop(0.45, `rgba(95,185,181,${0.07 * glow})`); g.addColorStop(1, "rgba(95,185,181,0)");
        ctx.fillStyle = g; ctx.fillRect(gx - 300, gy - 300, 600, 600);
      }

      const RAD = 190, speed = Math.hypot(pvx, pvy);
      const steps = 2, h = dt / steps;
      for (const L of leaves) {
        const sx = Math.sin(t * 0.6 + L.ph) * 3.2 * L.depth, sy = Math.cos(t * 0.5 + L.ph * 1.3) * 2.6 * L.depth;
        const th = L.th + Math.sin(t * 0.7 + L.ph * 0.7) * 0.2;
        const rx = Math.cos(th) * L.len, ry = Math.sin(th) * L.len;
        const baseX = L.nx * W, baseY = L.ny * H;
        let fx = 0, fy = 0, fd = 0;
        if (active) {
          const dx = baseX + L.bx - mx, dy = baseY + L.by - my, d = Math.hypot(dx, dy);
          if (d < RAD && d > 0.01) {
            fd = 1 - d / RAD;
            const push = fd * fd * 620 / L.depth;
            fx = (dx / d) * push + pvx * fd * 0.9; fy = (dy / d) * push + pvy * fd * 0.9;
          }
        }
        for (let i = 0; i < steps; i++) {
          // gốc: lò xo mềm, giảm chấn vừa phải → nảy lại êm
          L.bvx += (-38 * (L.bx - sx) - 8.5 * L.bvx + fx) * h; L.bvy += (-38 * (L.by - sy) - 8.5 * L.bvy + fy) * h;
          L.bx += L.bvx * h; L.by += L.bvy * h;
          // đầu lá: trễ hơn, mềm hơn → uốn cong
          L.tvx += (-55 * L.tx - 6.2 * L.tvx + fx * 1.7) * h; L.tvy += (-55 * L.ty - 6.2 * L.tvy + fy * 1.7) * h;
          L.tx += L.tvx * h; L.ty += L.tvy * h;
        }
        const x0 = baseX + L.bx, y0 = baseY + L.by;
        const x1 = x0 + rx + L.tx, y1 = y0 + ry + L.ty;
        const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
        const nxp = -dy / len, nyp = dx / len, w = L.len * L.wid * 0.5 * (0.7 + L.depth * 0.4);
        const mxp = x0 + rx * 0.5 + L.tx * 0.3, myp = y0 + ry * 0.5 + L.ty * 0.3;
        const a = Math.min(1, L.a * (1 + fd * 0.25));
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.quadraticCurveTo(mxp + nxp * w * 1.7, myp + nyp * w * 1.7, x1, y1);
        ctx.quadraticCurveTo(mxp - nxp * w * 1.7, myp - nyp * w * 1.7, x0, y0);
        ctx.fillStyle = `rgba(${L.col},${a.toFixed(3)})`;
        ctx.fill();
      }

      // bụi vàng li ti theo tay
      if (active && speed > 160 && dust.length < 40 && Math.random() < 0.7) {
        dust.push({ x: mx + (Math.random() - 0.5) * 16, y: my + (Math.random() - 0.5) * 16, vx: pvx * 0.03 + (Math.random() - 0.5) * 18, vy: pvy * 0.03 - 10 - Math.random() * 16, life: 0, max: 0.9 + Math.random() * 0.9, r: 0.8 + Math.random() * 1.7 });
      }
      ctx.globalCompositeOperation = "lighter";
      for (let i = dust.length - 1; i >= 0; i--) {
        const p = dust[i];
        p.life += dt; if (p.life >= p.max) { dust.splice(i, 1); continue; }
        p.vx *= 0.985; p.vy *= 0.985; p.x += p.vx * dt; p.y += p.vy * dt;
        const k = 1 - p.life / p.max;
        ctx.fillStyle = `rgba(255,236,180,${(0.8 * k * k).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (0.6 + k * 0.6), 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";

      // hình chính nghiêng nhẹ theo chuột (kiểu kính, rất tiết chế)
      if (art) {
        const nx = active ? Math.max(-1, Math.min(1, (mx / W - 0.5) * 2)) : 0, ny = active ? Math.max(-1, Math.min(1, (my / H - 0.5) * 2)) : 0;
        const k = Math.min(1, dt * 4);
        tiltY += (nx * 5 - tiltY) * k; tiltX += (-ny * 4 - tiltX) * k; shX += (-nx * 12 - shX) * k; shY += (-ny * 9 - shY) * k;
        art.style.transform = `perspective(1200px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) translate3d(${shX.toFixed(1)}px,${shY.toFixed(1)}px,0)`;
      }
    };

    const loop = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      draw(last ? (now - last) / 1000 : 1 / 60);
      last = now;
      raf = requestAnimationFrame(loop);
    };
    const start = () => { if (!raf && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(loop); } };

    size();
    const ro = new ResizeObserver(() => { size(); if (reduce) draw(1 / 60); });
    ro.observe(host);
    if (reduce) {
      draw(1 / 60);
      return () => ro.disconnect();
    }
    const io = new IntersectionObserver((es) => { visible = es.some((e) => e.isIntersecting); if (visible) start(); }, { threshold: 0 });
    io.observe(host);
    host.addEventListener("pointermove", onMove, { passive: true });
    host.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", start);
    start();
    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      host.removeEventListener("pointermove", onMove); host.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", start);
      if (art) art.style.transform = "";
    };
  }, []);
  return <canvas ref={cv} className="hero-field" aria-hidden="true" />;
}
