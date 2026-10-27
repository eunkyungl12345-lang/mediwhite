export default function Hero({ img, title, sub, pos }: { img: string; title: string; sub?: string; pos?: string }) {
  return (
    <div className="hero" style={{ backgroundImage: `url(${img})`, backgroundPosition: pos }}>
      <div className="hero-in"><h2>{title}</h2>{sub && <p>{sub}</p>}</div>
    </div>
  );
}
