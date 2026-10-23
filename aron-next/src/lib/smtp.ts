import net from "node:net";
import tls from "node:tls";
import { randomBytes } from "node:crypto";

/**
 * Gửi email qua SMTP (Microsoft 365, Gmail, máy chủ mail công ty…) — không cần thư viện ngoài.
 * Luôn dùng mã hoá: cổng 465 (TLS ngay) hoặc cổng 587 (STARTTLS, bắt buộc). Không bao giờ gửi mật khẩu ở dạng thô.
 */
export type SmtpConfig = { host: string; port: number; user: string; pass: string; from: string };
export type MailInput = { to: string[]; cc?: string[]; replyTo?: string; subject: string; text: string };

const ADDR = /^[^\s<>@,;"()]+@[^\s<>@,;"()]+\.[^\s<>@,;"()]+$/;
export const isEmail = (s: string) => s.length <= 254 && ADDR.test(s);

const noCrlf = (s: string) => s.replace(/[\r\n\u0000]+/g, " ").trim();
const b64 = (s: string | Buffer) => Buffer.from(s).toString("base64");
const ascii = (s: string) => /^[\x20-\x7e]*$/.test(s);

/** RFC 2047: tiêu đề/tên có dấu tiếng Việt, mỗi "từ mã hoá" ≤ 75 ký tự. */
function encodeWord(s: string): string {
  s = noCrlf(s);
  if (ascii(s)) return s;
  const parts: string[] = [];
  let cur = "";
  for (const ch of s) {
    if (Buffer.byteLength(cur + ch) > 42) { parts.push(cur); cur = ""; }
    cur += ch;
  }
  if (cur) parts.push(cur);
  return parts.map((p) => `=?UTF-8?B?${b64(p)}?=`).join("\r\n ");
}

function parseFrom(from: string): { name: string; addr: string } {
  const m = /^(.*)<([^<>]+)>\s*$/.exec(from.trim());
  const addr = noCrlf(m ? m[2] : from).trim();
  const name = m ? noCrlf(m[1]).replace(/^"|"$/g, "").trim() : "";
  return { name, addr };
}

const fmtAddr = (name: string, addr: string) => {
  if (!name) return addr;
  const n = ascii(name) ? `"${name.replace(/["\\]/g, "")}"` : encodeWord(name);
  return `${n} <${addr}>`;
};

export function buildMessage(cfg: Pick<SmtpConfig, "from">, m: MailInput): { raw: string; envFrom: string; rcpt: string[] } {
  const f = parseFrom(cfg.from);
  const to = m.to.map(noCrlf);
  const cc = (m.cc ?? []).map(noCrlf);
  const domain = f.addr.split("@")[1] || "localhost";
  const headers = [
    `From: ${fmtAddr(f.name, f.addr)}`,
    `To: ${to.join(", ")}`,
    cc.length ? `Cc: ${cc.join(", ")}` : "",
    m.replyTo && isEmail(noCrlf(m.replyTo)) ? `Reply-To: ${noCrlf(m.replyTo)}` : "",
    `Subject: ${encodeWord(m.subject)}`,
    `Date: ${new Date().toUTCString().replace("GMT", "+0000")}`,
    `Message-ID: <${randomBytes(12).toString("hex")}@${domain}>`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: base64",
    "Auto-Submitted: auto-generated",
  ].filter(Boolean);
  const body = (b64(m.text.replace(/\r?\n/g, "\r\n").normalize("NFC")).match(/.{1,76}/g) ?? []).join("\r\n");
  return { raw: headers.join("\r\n") + "\r\n\r\n" + body, envFrom: f.addr, rcpt: [...to, ...cc] };
}

type Reply = { code: number; lines: string[] };

class Conn {
  sock!: net.Socket;
  private buf = "";
  private cur: string[] = [];
  private queue: Reply[] = [];
  private waiter: { ok: (r: Reply) => void; fail: (e: Error) => void } | null = null;
  private err: Error | null = null;
  private onData = (d: Buffer) => {
    this.buf += d.toString("utf8");
    let i: number;
    while ((i = this.buf.indexOf("\n")) >= 0) {
      const line = this.buf.slice(0, i).replace(/\r$/, "");
      this.buf = this.buf.slice(i + 1);
      this.cur.push(line);
      if (/^\d{3} /.test(line) || /^\d{3}$/.test(line)) {
        const r = { code: Number(line.slice(0, 3)), lines: this.cur };
        this.cur = [];
        if (this.waiter) { const w = this.waiter; this.waiter = null; w.ok(r); } else this.queue.push(r);
      }
    }
  };
  private onErr = (e: Error) => {
    this.err = e;
    if (this.waiter) { const w = this.waiter; this.waiter = null; w.fail(e); }
  };
  attach(s: net.Socket) {
    this.sock = s;
    this.buf = "";
    s.on("data", this.onData);
    s.on("error", this.onErr);
    s.on("close", () => this.onErr(new Error("Máy chủ email đã đóng kết nối")));
  }
  detach() {
    this.sock.off("data", this.onData);
    this.sock.off("error", this.onErr);
  }
  read(): Promise<Reply> {
    const q = this.queue.shift();
    if (q) return Promise.resolve(q);
    if (this.err) return Promise.reject(this.err);
    return new Promise((ok, fail) => { this.waiter = { ok, fail }; });
  }
  write(s: string) { this.sock.write(s); }
  async cmd(line: string, expect: number[], secret = false): Promise<Reply> {
    this.write(line + "\r\n");
    const r = await this.read();
    if (!expect.includes(r.code)) {
      throw new Error(`SMTP lỗi ${r.code} sau lệnh ${secret ? "(đăng nhập)" : line.split(" ")[0]}: ${r.lines.join(" ").slice(0, 200)}`);
    }
    return r;
  }
}

export async function sendMail(cfg: SmtpConfig, m: MailInput, timeoutMs = 15000): Promise<void> {
  const { raw, envFrom, rcpt } = buildMessage(cfg, m);
  if (!isEmail(envFrom)) throw new Error("SMTP_FROM không hợp lệ");
  if (rcpt.length === 0 || !rcpt.every(isEmail)) throw new Error("Danh sách người nhận không hợp lệ");

  const c = new Conn();
  const secure = cfg.port === 465;
  let finished = false;
  let stage = "kết nối tới máy chủ";
  const run = async () => {
    const sock: net.Socket = await new Promise((ok, fail) => {
      const s = secure
        ? tls.connect({ host: cfg.host, port: cfg.port, servername: cfg.host }, () => ok(s))
        : net.connect({ host: cfg.host, port: cfg.port }, () => ok(s));
      s.once("error", fail);
    });
    c.attach(sock);
    stage = "chờ máy chủ chào (220)";
    const hello = await c.read();
    if (hello.code !== 220) throw new Error(`Máy chủ email từ chối kết nối (${hello.code})`);
    const me = "aron-web";
    stage = "bắt tay EHLO";
    let caps = (await c.cmd(`EHLO ${me}`, [250])).lines.join("\n").toUpperCase();
    if (!secure) {
      if (!caps.includes("STARTTLS")) throw new Error("Máy chủ email không hỗ trợ mã hoá STARTTLS — từ chối gửi để bảo vệ mật khẩu");
      stage = "mã hoá STARTTLS";
      await c.cmd("STARTTLS", [220]);
      c.detach();
      const t: tls.TLSSocket = await new Promise((ok, fail) => {
        const s = tls.connect({ socket: c.sock, servername: cfg.host }, () => ok(s));
        s.once("error", fail);
      });
      c.attach(t);
      caps = (await c.cmd(`EHLO ${me}`, [250])).lines.join("\n").toUpperCase();
    }
    stage = "đăng nhập";
    if (cfg.user) {
      if (/AUTH[ =].*PLAIN/.test(caps)) {
        await c.cmd(`AUTH PLAIN ${b64(`\u0000${cfg.user}\u0000${cfg.pass}`)}`, [235], true);
      } else {
        await c.cmd("AUTH LOGIN", [334]);
        await c.cmd(b64(cfg.user), [334], true);
        await c.cmd(b64(cfg.pass), [235], true);
      }
    }
    stage = "gửi thư";
    await c.cmd(`MAIL FROM:<${envFrom}>`, [250]);
    for (const r of rcpt) await c.cmd(`RCPT TO:<${r}>`, [250, 251]);
    await c.cmd("DATA", [354]);
    c.write(raw.replace(/\r\n\./g, "\r\n..").replace(/^\./, "..") + "\r\n.\r\n");
    const done = await c.read();
    if (done.code !== 250) throw new Error(`Máy chủ email không nhận thư (${done.code}): ${done.lines.join(" ").slice(0, 200)}`);
    finished = true;
    try { c.write("QUIT\r\n"); } catch { /* bỏ qua */ }
  };

  let timer: NodeJS.Timeout | undefined;
  try {
    await Promise.race([
      run(),
      new Promise<never>((_, fail) => { timer = setTimeout(() => fail(new Error(`Hết thời gian chờ máy chủ email (kẹt ở bước: ${stage}; máy chủ ${cfg.host}:${cfg.port})`)), timeoutMs); }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
    try { c.sock?.destroy(); } catch { /* bỏ qua */ }
    void finished;
  }
}
