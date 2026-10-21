import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section">
      <div className="container narrow center">
        <h1 className="section-title">404</h1>
        <p className="lead dark">Không tìm thấy trang · Page not found</p>
        <Link className="btn" href="/">Trang chủ · Home</Link>
      </div>
    </section>
  );
}
