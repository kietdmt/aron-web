"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Khi cuộn xuống lần đầu, các khối nội dung (tiêu đề, thẻ, hình ảnh…) hiện lên nhẹ nhàng:
 * mờ → rõ, trồi từ dưới lên, các thẻ trong cùng hàng nối nhau từng chút một.
 * Chỉ áp dụng cho phần chưa nhìn thấy lúc tải trang → không nhấp nháy; không có JS thì nội dung vẫn hiện bình thường.
 */
const SKIP = ".stats, .hive, .visually-hidden, script, style, [data-no-reveal]";

export default function ScrollReveal() {
  const path = usePathname();
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const timers: number[] = [];
    let io: IntersectionObserver | undefined;
    let cancelled = false;

    const setup = () => {
      if (cancelled) return;
      const vh = window.innerHeight;
      io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          io?.unobserve(el);
          el.classList.add("rv-in");
          timers.push(window.setTimeout(() => { el.classList.remove("rv", "rv-in", "rv-img"); el.style.removeProperty("--rv-d"); }, 1600));
        }
      }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });

      const mark = (el: HTMLElement, i: number) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top < vh * 0.92) return; // đã thấy sẵn khi tải trang → để nguyên
        el.classList.add("rv");
        if (el.tagName === "IMG" || el.matches("figure, picture")) el.classList.add("rv-img");
        el.style.setProperty("--rv-d", `${Math.min(i, 7) * 90}ms`);
        io?.observe(el);
      };
      const walk = (parent: Element, depth: number) => {
        let i = 0;
        for (const c of Array.from(parent.children)) {
          const el = c as HTMLElement;
          if (el.matches(SKIP)) continue;
          const grid = getComputedStyle(el).display.includes("grid") || ((el.tagName === "UL" || el.tagName === "OL") && el.children.length > 1);
          if (grid && el.children.length > 1 && depth < 2) { walk(el, depth + 1); continue; }
          mark(el, depth === 0 ? 0 : i++);
        }
      };
      document.querySelectorAll("main .section, main .announce, .prefooter").forEach((sec) => {
        walk(sec.querySelector(":scope > .container") ?? sec, 0);
      });
    };

    const id = requestAnimationFrame(() => requestAnimationFrame(setup));
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
      io?.disconnect();
      timers.forEach(clearTimeout);
      document.querySelectorAll(".rv").forEach((el) => { el.classList.remove("rv", "rv-in", "rv-img"); (el as HTMLElement).style.removeProperty("--rv-d"); });
    };
  }, [path]);
  return null;
}
