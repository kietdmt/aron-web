"use client";
import { useEffect, useRef } from "react";

/**
 * Số liệu nổi bật: hiện lần lượt từng ô, số chạy chậm dần tới giá trị thật,
 * dấu "+" bật nảy và một vệt sáng lướt qua chữ số khi chạy xong.
 * Chỉ chạy với giá trị toàn chữ số; kiểu khác hiển thị nguyên văn.
 */
export default function CountUp({ value, suffix }: { value: string; suffix: string }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    const strong = el?.parentElement;
    const li = strong?.closest("li");
    if (!el || !strong || !/^\d{1,7}$/.test(value)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const target = Number(value);
    const from = target >= 1000 ? Math.round(target * 0.96) : 0; // năm (vd 2009) chỉ chạy một đoạn ngắn
    const dur = target >= 1000 ? 2200 : 3200;
    const idx = li && li.parentElement ? Array.from(li.parentElement.children).indexOf(li) : 0;
    let raf = 0, timer: ReturnType<typeof setTimeout> | undefined, started = false;
    el.textContent = String(from);
    li?.classList.add("stat-pre");
    strong.classList.remove("done");

    const run = () => {
      if (started) return;
      started = true;
      timer = setTimeout(() => {
        li?.classList.remove("stat-pre");
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - t0) / dur);
          const e = 1 - Math.pow(1 - p, 4); // easeOutQuart: chạy nhanh rồi chậm dần
          el.textContent = String(Math.round(from + (target - from) * e));
          if (p < 1) raf = requestAnimationFrame(tick);
          else strong.classList.add("done");
        };
        raf = requestAnimationFrame(tick);
      }, 250 + idx * 260);
    };
    const io = new IntersectionObserver((es) => { if (es.some((x) => x.isIntersecting)) { run(); io.disconnect(); } }, { threshold: 0.4 });
    io.observe(el);
    return () => {
      io.disconnect(); cancelAnimationFrame(raf); if (timer) clearTimeout(timer);
      el.textContent = value; li?.classList.remove("stat-pre");
    };
  }, [value]);
  return (<><em ref={ref} className="count-up">{value}</em><em className="stat-suffix">{suffix}</em></>);
}
