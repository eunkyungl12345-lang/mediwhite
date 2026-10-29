/** 오늘의 핫뉴스: 언론사 RSS(제목·링크만) + 시세 (서버에서 30분마다 갱신) */
export type News = { title: string; link: string; source: string; at: number };
const FEEDS: Record<string, { url: string; source: string }[]> = {
  macro: [{ url: "https://www.yna.co.kr/rss/economy.xml", source: "연합뉴스" }, { url: "https://www.hankyung.com/feed/economy", source: "한국경제" }],
  stock: [{ url: "https://www.hankyung.com/feed/finance", source: "한국경제" }, { url: "https://www.yna.co.kr/rss/market.xml", source: "연합뉴스" }],
  global: [{ url: "https://www.hankyung.com/feed/international", source: "한국경제" }],
  estate: [{ url: "https://www.hankyung.com/feed/realestate", source: "한국경제" }],
  it: [{ url: "https://www.hankyung.com/feed/it", source: "한국경제" }],
  coin: [{ url: "https://www.tokenpost.kr/rss", source: "토큰포스트" }, { url: "https://www.blockmedia.co.kr/feed", source: "블록미디어" }],
  med: [{ url: "https://www.docdocdoc.co.kr/rss/allArticle.xml", source: "청년의사" }, { url: "https://www.yna.co.kr/rss/health.xml", source: "연합뉴스" }],
};
const un = (s: string) => s.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/<[^>]+>/g, "").trim();
async function feed(url: string, source: string): Promise<News[]> {
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (MediWhite news reader)" }, next: { revalidate: 1800 } });
    if (!r.ok) return [];
    const xml = await r.text();
    return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 40).map(m => {
      const g = (t: string) => un((m[1].match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)<\\/${t}>`)) ?? [])[1] ?? "");
      return { title: g("title"), link: g("link"), source, at: Date.parse(g("pubDate")) || 0 };
    }).filter(x => x.title && /^https?:\/\//.test(x.link));
  } catch { return []; }
}
const uniq = (a: News[]) => { const seen = new Set<string>(); return a.filter(x => { const k = x.title.slice(0, 18); if (seen.has(k)) return false; seen.add(k); return true; }); };
export const NEWS_TABS = [
  { key: "global", name: "🌙 간밤 미국증시" }, { key: "stock", name: "📈 주식" }, { key: "macro", name: "🏦 거시경제" },
  { key: "coin", name: "🪙 코인" }, { key: "estate", name: "🏠 부동산" }, { key: "med", name: "🏥 의료·병원" },
] as const;
export async function getNews() {
  const all = Object.fromEntries(await Promise.all(Object.entries(FEEDS).map(async ([k, fs]) => [k, uniq((await Promise.all(fs.map(f => feed(f.url, f.source)))).flat().sort((a, b) => b.at - a.at))]))) as Record<string, News[]>;
  const pool = uniq([...all.macro, ...all.stock, ...all.global, ...all.it].sort((a, b) => b.at - a.at));
  const usRe = /뉴욕증시|뉴욕 증시|나스닥|S&P|다우|월가|미 증시|미국 증시|엔비디아|테슬라|애플|빅테크|미 국채|파월|연준|Fed|FOMC/;
  const coinRe = /비트코인|가상자산|코인|이더리움|암호화폐|업비트|빗썸|스테이블|가상화폐|리플|솔라나/;
  const global = uniq([...all.global.filter(x => usRe.test(x.title)), ...pool.filter(x => usRe.test(x.title))]).sort((a, b) => b.at - a.at);
  return {
    global: global.length >= 4 ? global : uniq([...global, ...all.global]),
    stock: all.stock, macro: all.macro, coin: uniq([...all.coin, ...pool.filter(x => coinRe.test(x.title))]).sort((a, b) => b.at - a.at), estate: all.estate, med: all.med,
  } as Record<(typeof NEWS_TABS)[number]["key"], News[]>;
}

export type Quote = { name: string; price: number; pct: number; unit?: string };
async function yahoo(sym: string, name: string, unit = ""): Promise<Quote | null> {
  try {
    const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=5d&interval=1d`, { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 900 } });
    const j = await r.json(); const m = j?.chart?.result?.[0]?.meta; if (!m) return null;
    const prev = m.chartPreviousClose ?? m.previousClose, p = m.regularMarketPrice;
    const pct = typeof m.regularMarketChangePercent === "number" ? m.regularMarketChangePercent : prev ? (p - prev) / prev * 100 : 0;
    return { name, price: p, pct, unit };
  } catch { return null; }
}
async function upbit(): Promise<Quote[]> {
  try {
    const r = await fetch("https://api.upbit.com/v1/ticker?markets=KRW-BTC,KRW-ETH", { next: { revalidate: 300 } });
    const j = await r.json(); return (j as any[]).map(t => ({ name: t.market === "KRW-BTC" ? "비트코인" : "이더리움", price: t.trade_price, pct: t.signed_change_rate * 100, unit: "원" }));
  } catch { return []; }
}
export async function getQuotes(): Promise<Quote[]> {
  const ys = await Promise.all([yahoo("^IXIC", "나스닥"), yahoo("^GSPC", "S&P500"), yahoo("^DJI", "다우"), yahoo("^KS11", "코스피"), yahoo("^KQ11", "코스닥"), yahoo("KRW=X", "원/달러", "원")]);
  return [...ys.filter(Boolean) as Quote[], ...(await upbit())];
}
