"use client";
import { useEffect, useRef, useState } from "react";
import { submitContact } from "@/app/actions/forms";
import type { Locale } from "@/lib/i18n";

type Msg = { role: "user" | "assistant"; content: string };
const KEY = "aron-chat-v1";
const TK = "aron-chat-teaser";

const S = {
  vi: {
    title: "ARON Assistant", online: "Trực tuyến", open: "Mở khung chat", close: "Đóng",
    hello: "Xin chào! Mình là trợ lý của ARON. Bạn muốn tìm hiểu về giải pháp ERP, dịch vụ Oracle hay cơ hội nghề nghiệp?",
    note: "Trợ lý AI có thể nhầm lẫn. Vui lòng không gửi mật khẩu hay thông tin thanh toán trong khung chat.",
    placeholder: "Nhập câu hỏi…", send: "Gửi", typing: "Đang trả lời…",
    teaser: "Xin chào 👋 Bạn cần tư vấn về giải pháp ERP? Mình có thể giúp!",
    chips: ["Dịch vụ của ARON", "Tôi muốn xem demo", "Cơ hội tuyển dụng"],
    errBusy: "Hệ thống đang bận, bạn thử lại sau ít phút nhé.", errRate: "Bạn gửi hơi nhanh, vui lòng chờ một chút rồi thử lại.", errGeneric: "Xin lỗi, hiện chưa trả lời được. Bạn có thể để lại thông tin để chuyên gia ARON liên hệ.",
    leadBtn: "Để lại thông tin", leadTitle: "Để chuyên gia ARON liên hệ bạn", name: "Họ tên *", phone: "Số điện thoại *", email: "Email", company: "Công ty",
    leadSend: "Gửi thông tin", leadOk: "Cảm ơn bạn! ARON sẽ liên hệ sớm nhất có thể.", leadErr: "Chưa gửi được, vui lòng kiểm tra lại thông tin.", cancel: "Để sau",
  },
  en: {
    title: "ARON Assistant", online: "Online", open: "Open chat", close: "Close",
    hello: "Hello! I'm ARON's assistant. Would you like to know about ERP solutions, Oracle services or careers?",
    note: "The AI assistant can make mistakes. Please don't share passwords or payment details in this chat.",
    placeholder: "Type your question…", send: "Send", typing: "Replying…",
    teaser: "Hi 👋 Need help with ERP solutions? I'm here to help!",
    chips: ["ARON services", "I'd like a demo", "Career opportunities"],
    errBusy: "We're busy right now, please try again in a few minutes.", errRate: "You're sending messages a bit fast, please wait a moment.", errGeneric: "Sorry, I can't answer right now. You can leave your details and an ARON expert will contact you.",
    leadBtn: "Leave your details", leadTitle: "Let an ARON expert contact you", name: "Full name *", phone: "Phone *", email: "Email", company: "Company",
    leadSend: "Submit", leadOk: "Thank you! ARON will get back to you shortly.", leadErr: "Couldn't send, please check your details.", cancel: "Later",
  },
} as const;

export default function ChatWidget({ locale }: { locale: Locale }) {
  const s = S[locale];
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [lead, setLead] = useState<"hidden" | "form" | "done">("hidden");
  const [leadErr, setLeadErr] = useState(false);
  const [leadBusy, setLeadBusy] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const t0 = useRef(Date.now());
  const [ready, setReady] = useState(false);
  const [teaser, setTeaser] = useState(false);

  // Nút chat hiện nhẹ nhàng sau ~1,5 giây
  useEffect(() => { const id = setTimeout(() => setReady(true), 1500); return () => clearTimeout(id); }, []);

  // Lời chào nhỏ: hiện một lần mỗi phiên, sau 8 giây hoặc khi khách đã cuộn qua ~1/3 trang; tự ẩn sau 14 giây
  useEffect(() => {
    if (open || !ready) return;
    try { if (sessionStorage.getItem(TK) === "1") return; } catch { /* bỏ qua */ }
    let done = false;
    let hide: ReturnType<typeof setTimeout> | undefined;
    const off = () => window.removeEventListener("scroll", onScroll);
    const show = () => {
      if (done) return;
      done = true; off();
      setTeaser(true);
      try { sessionStorage.setItem(TK, "1"); } catch { /* bỏ qua */ }
      hide = setTimeout(() => setTeaser(false), 14000);
    };
    const onScroll = () => {
      const h = document.documentElement;
      if (window.scrollY > (h.scrollHeight - h.clientHeight) * 0.35) show();
    };
    const timer = setTimeout(show, 8000);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { clearTimeout(timer); if (hide) clearTimeout(hide); off(); };
  }, [open, ready]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) { const v = JSON.parse(raw) as Msg[]; if (Array.isArray(v)) setMsgs(v.slice(-30)); }
    } catch { /* bỏ qua */ }
  }, []);
  useEffect(() => {
    try { sessionStorage.setItem(KEY, JSON.stringify(msgs.slice(-30))); } catch { /* bỏ qua */ }
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight });
  }, [msgs, busy, lead]);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open]);

  async function send(text: string) {
    const content = text.trim().slice(0, 1000);
    if (!content || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content }];
    setMsgs(next); setInput(""); setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale, messages: next.slice(-10) }),
      });
      const j = (await res.json().catch(() => ({}))) as { reply?: string; lead?: boolean; error?: string };
      if (res.ok && j.reply) {
        setMsgs([...next, { role: "assistant", content: j.reply }]);
        if (j.lead && lead !== "done") setLead("form");
      } else {
        const m = j.error === "rate" ? s.errRate : j.error === "busy" ? s.errBusy : s.errGeneric;
        setMsgs([...next, { role: "assistant", content: m }]);
        if (j.error !== "rate" && j.error !== "busy" && lead !== "done") setLead("form");
      }
    } catch {
      setMsgs([...next, { role: "assistant", content: s.errGeneric }]);
    } finally { setBusy(false); }
  }

  async function submitLead(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (leadBusy) return;
    setLeadBusy(true); setLeadErr(false);
    const f = new FormData(e.currentTarget);
    const transcript = msgs.map((m) => `${m.role === "user" ? "Khách" : "Bot"}: ${m.content}`).join("\n").slice(-3600);
    const fd = new FormData();
    fd.set("name", String(f.get("name") ?? "")); fd.set("phone", String(f.get("phone") ?? ""));
    fd.set("email", String(f.get("email") ?? "")); fd.set("company", String(f.get("company") ?? ""));
    fd.set("message", `[Từ chatbot ARON Assistant]\n${transcript}`);
    fd.set("locale", locale); fd.set("website", ""); fd.set("ts", String(t0.current));
    try {
      const r = await submitContact(null, fd);
      if (r.ok) { setLead("done"); setMsgs((m) => [...m, { role: "assistant", content: s.leadOk }]); }
      else setLeadErr(true);
    } catch { setLeadErr(true); } finally { setLeadBusy(false); }
  }

  return (
    <>
      {!open && ready && (
        <div className="chat-dock">
          {teaser && (
            <div className="chat-teaser" role="status">
              <button type="button" className="chat-teaser-main" onClick={() => { setTeaser(false); setOpen(true); }}>
                <span className="chat-teaser-ava material-symbols-outlined" aria-hidden="true">smart_toy</span>
                <span>{s.teaser}</span>
              </button>
              <button type="button" className="chat-teaser-x" onClick={() => setTeaser(false)} aria-label={s.close}>
                <span className="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            </div>
          )}
          <button type="button" className={`chat-fab${teaser ? " ping" : ""}`} onClick={() => { setTeaser(false); setOpen(true); }} aria-label={s.open}>
            <span className="material-symbols-outlined" aria-hidden="true">chat</span>
          </button>
        </div>
      )}
      {open && (
        <section className="chat-panel" role="dialog" aria-label={s.title}>
          <header className="chat-head">
            <span className="chat-ava material-symbols-outlined" aria-hidden="true">smart_toy</span>
            <div><strong>{s.title}</strong><small><i aria-hidden="true" /> {s.online}</small></div>
            <button type="button" className="chat-x" onClick={() => setOpen(false)} aria-label={s.close}>
              <span className="material-symbols-outlined" aria-hidden="true">close</span>
            </button>
          </header>
          <div className="chat-body" ref={boxRef} aria-live="polite">
            <div className="chat-msg bot">{s.hello}<small>{s.note}</small></div>
            {msgs.length === 0 && (
              <div className="chat-chips">{s.chips.map((c) => <button key={c} type="button" onClick={() => send(c)}>{c}</button>)}</div>
            )}
            {msgs.map((m, i) => <div key={i} className={`chat-msg ${m.role === "user" ? "me" : "bot"}`}>{m.content}</div>)}
            {busy && <div className="chat-msg bot chat-typing" aria-label={s.typing}><i /><i /><i /></div>}
            {lead === "form" && (
              <form className="chat-lead" onSubmit={submitLead}>
                <strong>{s.leadTitle}</strong>
                <input name="name" placeholder={s.name} required maxLength={200} autoComplete="name" />
                <input name="phone" type="tel" placeholder={s.phone} required maxLength={40} autoComplete="tel" pattern="[0-9+()\-.\s]{6,40}" />
                <input name="email" type="email" placeholder={s.email} maxLength={200} autoComplete="email" />
                <input name="company" placeholder={s.company} maxLength={200} autoComplete="organization" />
                {leadErr && <p role="alert">{s.leadErr}</p>}
                <div><button className="btn" type="submit" disabled={leadBusy}>{s.leadSend}</button>
                  <button type="button" className="chat-link" onClick={() => setLead("hidden")}>{s.cancel}</button></div>
              </form>
            )}
          </div>
          {lead === "hidden" && msgs.length > 0 && (
            <button type="button" className="chat-leadbtn" onClick={() => setLead("form")}>{s.leadBtn}</button>
          )}
          <form className="chat-input" onSubmit={(e) => { e.preventDefault(); void send(input); }}>
            <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder={s.placeholder} maxLength={1000} aria-label={s.placeholder} />
            <button type="submit" disabled={busy || !input.trim()} aria-label={s.send}>
              <span className="material-symbols-outlined" aria-hidden="true">send</span>
            </button>
          </form>
        </section>
      )}
    </>
  );
}
