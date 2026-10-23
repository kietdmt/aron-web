"use client";
import { useEffect, useRef } from "react";

/** Số chạy tăng dần khi cuộn tới (chỉ áp dụng cho giá trị toàn chữ số). */
export default function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !/^\d{1,7}$/.test(value)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const target = Number(value);
    const from = target >= 1000 ? Math.round(target * 0.96) : 0; // năm (vd 2009) chỉ chạy một đoạn ngắn
    const dur = target >= 1000 ? 1400 : 1700;
    let raf = 0;
    let started = false;
    el.textContent = String(from);
    const run = () => {
      if (started) return;
      started = true;
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / dur);
        const e = 1 - Math.pow(1 - p, 3); // easeOutCubic
        el.textContent = String(Math.round(from + (target - from) * e));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((es) => { if (es.some((x) => x.isIntersecting)) { run(); io.disconnect(); } }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); el.textContent = value; };
  }, [value]);
  return <span ref={ref} className="count-up">{value}</span>;
}
