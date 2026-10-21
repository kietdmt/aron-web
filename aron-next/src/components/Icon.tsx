/* eslint-disable @next/next/no-img-element */
/** Icon: đường dẫn "/img/..." → ảnh SVG; còn lại coi là tên Material Symbol. */
export default function Icon({ name, size = 28 }: { name: string; size?: number }) {
  if (!name) return null;
  if (name.startsWith("/")) return <img src={name} alt="" width={size} height={size} loading="lazy" className="ico-img" />;
  return (
    <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: size }}>
      {name}
    </span>
  );
}
