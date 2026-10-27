export default function Hero({ img, title, sub }: { img: string; title: string; sub?: string }) {
  return (
    <div className="hero" style={{ backgroundImage: `url(${img})` }}>
      <div className="hero-in"><h2>{title}</h2>{sub && <p>{sub}</p>}</div>
    </div>
  );
}
