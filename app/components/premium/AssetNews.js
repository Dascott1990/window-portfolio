"use client";
/**
 * AssetNews.js — Markets
 * Live crypto / equities / FX / commodities ticker + AI market analyst.
 *
 * Data strategy (fixes the "always unavailable" bug):
 *   Every price used to be fetched directly from the browser (CoinGecko,
 *   Yahoo Finance, Frankfurter). Those calls die silently in production —
 *   CORS, per-IP rate limits, and Yahoo's anti-bot checks all block a
 *   browser tab in ways they'd never block a server. That's why rows sat
 *   on "unavailable" forever.
 *
 *   Fix: prices are now requested from OUR OWN backend first, exactly like
 *   every other panel in this app (Health.js, the AI chat call below) — the
 *   backend has no CORS restriction and a stable IP, so it isn't blocked.
 *   If that route isn't deployed yet, each asset transparently falls back
 *   to a direct client fetch (with multi-host retry for Yahoo) so nothing
 *   regresses in the meantime.
 *
 * Backend contract needed for the primary path:
 *   GET /api/v1/markets/quotes?ids=bitcoin,ethereum,solana,AAPL,TSLA,NVDA,eur,gbp,XAUUSD
 *     -> { data: { [id]: { price: number, change: number|null } } }
 *   GET /api/v1/markets/quote?id=AAPL
 *     -> { data: { price: number, change: number|null } }
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

// ── API ──────────────────────────────────────────────────────────────────────
async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...opts.headers },
    ...opts,
  });
  if (res.status === 204) return null;
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
  return json.data ?? json;
}

// ── Design tokens — shared language with Health.js / Resume Studio ──────────────
const C = {
  bg:      "#080B10",
  panel:   "#0D1017",
  surface: "#111520",
  raised:  "#161C28",
  border:  "rgba(255,255,255,0.09)",
  text:    "#E8E4DC",
  muted:   "#93A0B0",
  faint:   "rgba(147,160,176,0.55)",
  yellow:  "#F5C542", yBg: "rgba(245,197,66,0.1)",  yBr: "rgba(245,197,66,0.25)",
  red:     "#EF4444", rBg: "rgba(239,68,68,0.1)",   rBr: "rgba(239,68,68,0.25)",
  green:   "#22C55E", gBg: "rgba(34,197,94,0.08)",  gBr: "rgba(34,197,94,0.2)",
  blue:    "#3B82F6", bBg: "rgba(59,130,246,0.1)",  bBr: "rgba(59,130,246,0.22)",
  orange:  "#F5934C", oBg: "rgba(245,147,76,0.1)",  oBr: "rgba(245,147,76,0.22)",
  violet:  "#8B7CF6", vBg: "rgba(139,124,246,0.12)",vBr: "rgba(139,124,246,0.25)",
  sans:    "-apple-system,'SF Pro Display',Inter,system-ui,sans-serif",
  mono:    "'SF Mono','JetBrains Mono',monospace",
};

// ── Icons — single stroke-icon primitive, same shape as Health.js's Ic ──────────
const PATHS = {
  X:        "M18 6 6 18M6 6l12 12",
  Refresh:  ["M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8", "M21 3v5h-5", "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16", "M8 16H3v5"],
  Sparkle:  "M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3zM5 17l.75 2.25L8 20l-2.25.75L5 23l-.75-2.25L2 20l2.25-.75L5 17zM19 3l.75 2.25L22 6l-2.25.75L19 9l-.75-2.25L16 6l2.25-.75L19 3z",
  Chart:    ["M3 3v18h18", "M18 17V9", "M13 17V5", "M8 17v-3"],
  Send:     "M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z",
};

function Ic({ d, size = 16, color = "currentColor", sw = 1.8 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }} aria-hidden="true">
      {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}

// Small filled triangle for up/down — distinct from stroke icons on purpose,
// filled shapes read faster at a glance than outlined ones for this use.
function Triangle({ up, color, size = 7 }) {
  const points = up ? `0,${size} ${size * 2},${size} ${size},0` : `0,0 ${size * 2},0 ${size},${size}`;
  return (
    <svg width={size * 2} height={size} viewBox={`0 0 ${size * 2} ${size}`} aria-hidden="true">
      <polygon points={points} fill={color} />
    </svg>
  );
}

function Spinner({ size = 16, color = C.blue }) {
  return (
    <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.85, ease: "linear" }}
      style={{ display: "inline-block", width: size, height: size, borderRadius: "50%",
        border: "2px solid rgba(255,255,255,0.1)", borderTopColor: color }} />
  );
}

function Btn({ children, onClick, disabled, variant = "ghost", small, active, ariaLabel, ariaPressed, title }) {
  const v = {
    primary: { bg: C.blue, br: C.bBr, fg: "#fff" },
    ghost:   { bg: active ? C.raised : "transparent", br: active ? C.border : "transparent", fg: active ? C.text : C.muted },
    danger:  { bg: C.rBg, br: C.rBr, fg: C.red },
  }[variant] || {};
  return (
    <motion.button whileTap={!disabled ? { scale: 0.94 } : undefined}
      onClick={disabled ? undefined : onClick} disabled={disabled}
      aria-label={ariaLabel} aria-pressed={ariaPressed} title={title}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
        padding: small ? "7px 11px" : "9px 14px", minHeight: small ? 34 : 40,
        borderRadius: 9, border: `1px solid ${v.br}`, background: v.bg, color: v.fg,
        fontSize: small ? 12 : 13, fontWeight: 700, fontFamily: C.sans,
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
        transition: "background 0.12s, color 0.12s", whiteSpace: "nowrap" }}
      className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400">
      {children}
    </motion.button>
  );
}

// ── Asset config ─────────────────────────────────────────────────────────────
const ASSETS = [
  { id: "bitcoin",  symbol: "BTC",     label: "Bitcoin",  cat: "crypto",    source: "coingecko", geckoId: "bitcoin" },
  { id: "ethereum", symbol: "ETH",     label: "Ethereum", cat: "crypto",    source: "coingecko", geckoId: "ethereum" },
  { id: "solana",   symbol: "SOL",     label: "Solana",   cat: "crypto",    source: "coingecko", geckoId: "solana" },
  { id: "AAPL",     symbol: "AAPL",    label: "Apple",    cat: "stock",     source: "yahoo" },
  { id: "TSLA",     symbol: "TSLA",    label: "Tesla",    cat: "stock",     source: "yahoo" },
  { id: "NVDA",     symbol: "NVDA",    label: "NVIDIA",   cat: "stock",     source: "yahoo" },
  { id: "eur",      symbol: "EUR/USD", label: "Euro",     cat: "forex",     source: "frankfurter", from: "EUR", to: "USD" },
  { id: "gbp",      symbol: "GBP/USD", label: "Pound",    cat: "forex",     source: "frankfurter", from: "GBP", to: "USD" },
  { id: "XAUUSD",   symbol: "XAU/USD", label: "Gold",     cat: "commodity", source: "yahoo", yahooTicker: "GC=F" },
];

const CAT_STYLE = {
  crypto:    { fg: C.orange, bg: C.oBg, br: C.oBr },
  stock:     { fg: C.blue,   bg: C.bBg, br: C.bBr },
  forex:     { fg: C.violet, bg: C.vBg, br: C.vBr },
  commodity: { fg: C.yellow, bg: C.yBg, br: C.yBr },
};

// ── Direct (fallback-only) fetchers ───────────────────────────────────────────
// These only run if our backend's /api/v1/markets route isn't available.
async function fetchCoingeckoDirect(geckoIds) {
  const ids = geckoIds.join(",");
  const r = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
    { cache: "no-store" }
  );
  if (!r.ok) throw new Error("coingecko");
  const data = await r.json();
  return geckoIds.map((id) => ({
    geckoId: id,
    price:  data[id]?.usd ?? null,
    change: data[id]?.usd_24h_change ?? null,
  }));
}

// Yahoo serves the same chart data from two independent hosts; either can be
// rate-limited on its own, so we fall back host-to-host with retries before
// giving up — this alone fixes most "always unavailable" stock rows.
const YAHOO_HOSTS = ["query1.finance.yahoo.com", "query2.finance.yahoo.com"];

async function fetchYahooOnce(ticker, host) {
  const r = await fetch(
    `https://${host}/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=2d`,
    { cache: "no-store" }
  );
  if (!r.ok) throw new Error(`yahoo-${r.status}`);
  const data = await r.json();
  const meta = data?.chart?.result?.[0]?.meta;
  if (!meta || meta.regularMarketPrice == null) throw new Error("yahoo-parse");
  const price  = meta.regularMarketPrice;
  const prev   = meta.chartPreviousClose;
  const change = prev ? ((price - prev) / prev) * 100 : null;
  return { price, change };
}

async function fetchYahooDirect(ticker, attempts = 2) {
  let lastErr;
  for (let pass = 0; pass < attempts; pass++) {
    for (const host of YAHOO_HOSTS) {
      try { return await fetchYahooOnce(ticker, host); }
      catch (e) { lastErr = e; }
    }
    if (pass < attempts - 1) await new Promise(res => setTimeout(res, 350 * (pass + 1)));
  }
  throw lastErr ?? new Error("yahoo");
}

async function fetchFrankfurterDirect(from, to) {
  const r = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`, { cache: "no-store" });
  if (!r.ok) throw new Error("frankfurter");
  const data  = await r.json();
  const price = data?.rates?.[to] ?? null;
  const yest  = new Date(); yest.setDate(yest.getDate() - 1);
  try {
    const r2   = await fetch(`https://api.frankfurter.app/${yest.toISOString().slice(0,10)}?from=${from}&to=${to}`);
    const d2   = await r2.json();
    const prev = d2?.rates?.[to];
    return { price, change: prev ? ((price - prev) / prev) * 100 : null };
  } catch { return { price, change: null }; }
}

async function fetchOneDirect(asset) {
  if (asset.source === "yahoo")       return fetchYahooDirect(asset.yahooTicker ?? asset.symbol);
  if (asset.source === "frankfurter") return fetchFrankfurterDirect(asset.from, asset.to);
  throw new Error("no-single-fetch");
}

// Backend-first batch fetch, with automatic per-asset fallback to direct
// client fetchers if the backend route errors, 404s, or isn't reachable.
async function fetchAllQuotes(assets) {
  const stamp = Date.now();
  const out = {};
  const failed = {};

  try {
    const data = await apiFetch(`/api/v1/markets/quotes?ids=${assets.map(a => a.id).join(",")}`);
    assets.forEach(a => {
      const q = data?.[a.id];
      if (q && q.price != null) out[a.id] = { price: q.price, change: q.change ?? null, updatedAt: stamp };
      else failed[a.id] = true;
    });
    return { out, failed };
  } catch {
    // Backend route unavailable — fall through to direct client fetches below.
  }

  const cryptoAssets = assets.filter(a => a.source === "coingecko");
  if (cryptoAssets.length) {
    try {
      const results = await fetchCoingeckoDirect(cryptoAssets.map(a => a.geckoId));
      results.forEach((r, i) => {
        const id = cryptoAssets[i].id;
        if (r.price != null) out[id] = { price: r.price, change: r.change, updatedAt: stamp };
        else failed[id] = true;
      });
    } catch { cryptoAssets.forEach(a => { failed[a.id] = true; }); }
  }

  await Promise.allSettled(
    assets.filter(a => a.source === "yahoo" || a.source === "frankfurter").map(async a => {
      try { out[a.id] = { ...(await fetchOneDirect(a)), updatedAt: stamp }; }
      catch { failed[a.id] = true; }
    })
  );

  return { out, failed };
}

async function fetchOneQuote(asset) {
  try {
    const q = await apiFetch(`/api/v1/markets/quote?id=${asset.id}`);
    if (q?.price != null) return { price: q.price, change: q.change ?? null };
  } catch { /* fall through */ }
  if (asset.source === "coingecko") {
    const [r] = await fetchCoingeckoDirect([asset.geckoId]);
    if (r?.price != null) return { price: r.price, change: r.change };
    throw new Error("no-price");
  }
  return fetchOneDirect(asset);
}

// ── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ change, color }) {
  const pts    = 7;
  const rand   = (n) => (Math.random() - 0.5) * n;
  const points = Array.from({ length: pts }, (_, i) => {
    const base = 50 + (change ?? 0) * (i / (pts - 1)) * 1.5 + rand(8);
    return Math.max(5, Math.min(95, base));
  });
  const w = 56, h = 26, xStep = w / (pts - 1);
  const d = points.map((y, i) => `${i === 0 ? "M" : "L"} ${i * xStep} ${h - (y / 100) * h}`).join(" ");
  return (
    <svg width={w} height={h} style={{ overflow: "visible", opacity: 0.7 }} aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Formatting helpers ────────────────────────────────────────────────────────
const fmtPrice = (n) => {
  if (n == null) return "—";
  if (n >= 1000) return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 1)    return n.toFixed(2);
  return n.toFixed(4);
};
const fmtAge = (ms) => {
  const s = Math.floor(ms / 1000);
  if (s < 60) return "moments ago";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
};

// ── Asset row ──────────────────────────────────────────────────────────────────
// A real <button> — reachable by Tab, activates on Enter/Space — with one full
// accessible name a screen reader announces at once, mirroring the pattern used
// throughout Resume Studio's guest flow.
function AssetRow({ asset, data, loading, failing, retrying, now, selected, onClick, onRetry }) {
  const style   = CAT_STYLE[asset.cat];
  const up      = data?.change >= 0;
  const hasData = data && data.price != null;
  const isStale = hasData && failing;
  const showDead = !hasData && !loading && !retrying;

  const changeText = data?.change == null ? "change unavailable"
    : `${up ? "up" : "down"} ${Math.abs(data.change).toFixed(2)} percent today`;
  const label = showDead
    ? `${asset.label}, ${asset.symbol}. Price unavailable. Activate to retry.`
    : (loading || retrying) && !hasData
      ? `${asset.label}, ${asset.symbol}. Loading price.`
      : `${asset.label}, ${asset.symbol}. $${fmtPrice(data?.price)}. ${changeText}.${isStale ? ` Last confirmed ${fmtAge(now - data.updatedAt)}; currently unable to refresh.` : ""}`;

  return (
    <motion.button
      type="button" layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      onClick={showDead ? onRetry : onClick}
      aria-pressed={!showDead && selected}
      aria-label={label}
      title={showDead ? "Unavailable — activate to retry" : undefined}
      className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 14, textAlign: "left",
        padding: "11px 13px", borderRadius: 10, cursor: "pointer",
        background: selected && !showDead ? C.raised : C.surface,
        border: `1px solid ${selected && !showDead ? C.border : "rgba(255,255,255,0.06)"}`,
        borderLeft: `3px solid ${style.fg}66`,
      }}>
      <div style={{ width: 96, flexShrink: 0 }} aria-hidden="true">
        <div style={{ color: C.text, fontWeight: 700, fontSize: 13.5, lineHeight: 1, fontFamily: C.mono }}>{asset.symbol}</div>
        <div style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>{asset.label}</div>
      </div>

      <div className="hidden sm:flex" style={{ flexShrink: 0 }} aria-hidden="true">
        {hasData ? <Sparkline change={data.change} color={up ? C.green : C.red} /> : <div style={{ width: 56, height: 26 }} />}
      </div>

      <div style={{ flex: 1, textAlign: "right" }} aria-hidden="true">
        {(loading || retrying) && !hasData ? (
          <Spinner size={14} color={C.faint} />
        ) : showDead ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.red, fontSize: 11.5, fontWeight: 700, fontFamily: C.mono }}>
            unavailable <Ic d={PATHS.Refresh} size={11} color={C.red} />
          </span>
        ) : (
          <span style={{ fontFamily: C.mono, fontWeight: 700, fontSize: 14, color: isStale ? C.faint : C.text }}>
            ${fmtPrice(data?.price)}
          </span>
        )}
      </div>

      <div style={{ width: 74, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 5 }} aria-hidden="true">
        {(loading || retrying) && !hasData ? (
          <span style={{ color: C.faint, fontSize: 11 }}>—</span>
        ) : showDead || data?.change == null ? (
          <span style={{ color: C.faint, fontSize: 11 }}>—</span>
        ) : (
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: C.mono, fontWeight: 700, fontSize: 11.5,
            color: up ? C.green : C.red, opacity: isStale ? 0.6 : 1 }}>
            <Triangle up={up} color={up ? C.green : C.red} />
            {Math.abs(data.change).toFixed(2)}%
          </span>
        )}
      </div>
    </motion.button>
  );
}

// ── Inline markdown renderer (AI panel) ───────────────────────────────────────
function renderMd(text) {
  if (!text) return null;
  const lines = text.split("\n");
  const out   = []; let inCode = false; let codeLines = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("```")) {
      if (!inCode) { inCode = true; codeLines = []; }
      else {
        inCode = false;
        out.push(<pre key={i} style={{ background: "rgba(0,0,0,0.4)", borderRadius: 8, padding: "10px 12px", overflowX: "auto", fontSize: 11, fontFamily: C.mono, margin: "6px 0", color: "#c9d1d9" }}><code>{codeLines.join("\n")}</code></pre>);
        codeLines = [];
      }
      continue;
    }
    if (inCode) { codeLines.push(line); continue; }
    if (line.startsWith("## ")) { out.push(<div key={i} style={{ fontWeight: 700, fontSize: 13, color: C.text, margin: "10px 0 4px" }}>{line.slice(3)}</div>); continue; }
    if (/^[-*] /.test(line))    { out.push(<div key={i} style={{ paddingLeft: 12, color: C.text, opacity: 0.85, fontSize: 12, lineHeight: 1.6 }}>• {inlineMd(line.slice(2))}</div>); continue; }
    if (line.trim() === "")     { out.push(<div key={i} style={{ height: 6 }} />); continue; }
    out.push(<p key={i} style={{ color: C.text, opacity: 0.88, fontSize: 12, lineHeight: 1.7, margin: "2px 0" }}>{inlineMd(line)}</p>);
  }
  return out;
}
function inlineMd(text) {
  const parts = []; const re = /(`[^`]+`|\*\*[^*]+\*\*)/g; let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[0].startsWith("`")) parts.push(<code key={m.index} style={{ fontFamily: C.mono, fontSize: "0.88em", background: "rgba(255,255,255,0.1)", padding: "1px 4px", borderRadius: 3 }}>{m[0].slice(1,-1)}</code>);
    else parts.push(<strong key={m.index} style={{ color: C.text }}>{m[0].slice(2,-2)}</strong>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 ? parts[0] : parts;
}

// ── AI market analyst panel ───────────────────────────────────────────────────
const QUICK_PROMPTS = [
  "What's the overall market sentiment right now?",
  "Which asset has the best momentum today?",
  "Should I be worried about crypto volatility?",
  "Compare gold vs Bitcoin as a safe haven",
  "What's driving NVDA's movement?",
  "Give me a risk assessment of my watchlist",
];

function AIPanel({ prices, selectedAsset }) {
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef  = useRef(null);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const buildSystem = useCallback(() => {
    const priceLines = ASSETS.map(a => {
      const d = prices[a.id];
      if (!d) return `${a.symbol}: unavailable`;
      const chg = d.change != null ? `${d.change >= 0 ? "+" : ""}${d.change.toFixed(2)}%` : "change N/A";
      return `${a.symbol} (${a.label}): $${d.price?.toLocaleString("en-US", { maximumFractionDigits: 4 })} | 24h ${chg}`;
    }).join("\n");

    return `You are an elite AI financial analyst embedded in a real-time market intelligence terminal. You have live access to the following market data as of right now:

LIVE MARKET DATA:
${priceLines}

${selectedAsset ? `USER IS CURRENTLY VIEWING: ${selectedAsset.symbol} (${selectedAsset.label})` : ""}

Your role: Provide sharp, concise, actionable market analysis. Be direct — no disclaimers, no "I'm just an AI". Speak like a seasoned quant analyst. Use the actual live numbers above in your analysis. Keep responses focused and scannable. Use **bold** for key figures and bullet points for lists.`;
  }, [prices, selectedAsset]);

  const send = useCallback(async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || streaming) return;
    setInput("");

    setMessages(prev => [...prev, { role: "user", content: msg, id: Date.now() }]);
    const aiId = Date.now() + 1;
    setMessages(prev => [...prev, { role: "assistant", content: "", id: aiId }]);
    setStreaming(true);

    try {
      abortRef.current = new AbortController();
      const history = messages.filter(m => m.role !== "system").map(m => ({ role: m.role, content: m.content }));

      const res = await fetch(`${API}/api/v1/ai/chat`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        signal:  abortRef.current.signal,
        body: JSON.stringify({
          model:      "claude-sonnet-4-6",
          max_tokens: 800,
          system:     buildSystem(),
          stream:     true,
          messages:   [...history, { role: "user", content: msg }],
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let   full    = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const evt = JSON.parse(data);
            if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
              full += evt.delta.text;
              setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: full } : m));
            }
            if (evt.type === "error") throw new Error(evt.message);
          } catch {}
        }
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: `**Error:** ${err.message}` } : m));
    } finally {
      setStreaming(false);
    }
  }, [input, streaming, messages, buildSystem]);

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }} animate={{ height: 380, opacity: 1 }} exit={{ height: 0, opacity: 0 }}
      transition={{ type: "spring", damping: 26, stiffness: 280 }}
      style={{ overflow: "hidden", borderTop: `1px solid ${C.border}`, display: "flex", flexDirection: "column" }}
      role="region" aria-label="AI market analyst chat">
      <div style={{ padding: "10px 16px 8px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: `linear-gradient(135deg, ${C.violet}, #38bdf8)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Ic d={PATHS.Sparkle} size={12} color="#fff" />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.violet, letterSpacing: "0.1em" }}>AI MARKET ANALYST</span>
          {streaming && (
            <motion.div animate={{ opacity: [0.4,1,0.4] }} transition={{ duration: 1, repeat: Infinity }}
              style={{ fontSize: 9, color: C.violet, background: C.vBg, padding: "2px 8px", borderRadius: 8, border: `1px solid ${C.vBr}` }}>
              ● STREAMING
            </motion.div>
          )}
        </div>
        {messages.length > 0 && (
          <button onClick={() => setMessages([])} aria-label="Clear conversation"
            style={{ fontSize: 10, color: C.faint, background: "none", border: "none", cursor: "pointer", letterSpacing: "0.06em", fontWeight: 700 }}>
            CLEAR
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 8px", scrollbarWidth: "none" }} aria-live="polite">
        {messages.length === 0 ? (
          <div style={{ paddingTop: 4 }}>
            <p style={{ fontSize: 11.5, color: C.muted, marginBottom: 10 }}>
              Ask about any asset, market trend, or portfolio strategy:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {QUICK_PROMPTS.map(p => (
                <motion.button key={p} whileTap={{ scale: 0.98 }} onClick={() => send(p)}
                  className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                  style={{ textAlign: "left", padding: "8px 12px", borderRadius: 10, background: C.vBg,
                    border: `1px solid ${C.vBr}`, color: C.text, opacity: 0.85,
                    fontSize: 11.5, cursor: "pointer", lineHeight: 1.4 }}>
                  {p}
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 4 }}>
            {messages.map((m, i) => (
              <div key={m.id} style={{ display: "flex", flexDirection: m.role === "user" ? "row-reverse" : "row", gap: 8, alignItems: "flex-start" }}>
                {m.role === "assistant" && (
                  <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg, ${C.violet}, #38bdf8)`, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2 }}>
                    <Ic d={PATHS.Sparkle} size={10} color="#fff" />
                  </div>
                )}
                <div style={{ maxWidth: "85%", padding: "9px 12px", borderRadius: m.role === "user" ? "14px 4px 14px 14px" : "4px 14px 14px 14px",
                  background: m.role === "user" ? C.vBg : C.surface,
                  border: `1px solid ${m.role === "user" ? C.vBr : C.border}` }}>
                  {m.role === "user"
                    ? <p style={{ color: C.text, opacity: 0.92, fontSize: 12, margin: 0 }}>{m.content}</p>
                    : m.content === "" && i === messages.length - 1 && streaming
                      ? <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "4px 0" }}>
                          {[0,1,2].map(j => (
                            <motion.div key={j} animate={{ y: [0,-4,0] }} transition={{ duration: 0.7, repeat: Infinity, delay: j*0.15 }}
                              style={{ width: 5, height: 5, borderRadius: "50%", background: C.violet }} />
                          ))}
                        </div>
                      : <div>{renderMd(m.content)}{i === messages.length - 1 && streaming && (
                          <motion.span animate={{ opacity: [1,0,1] }} transition={{ duration: 0.8, repeat: Infinity }}
                            style={{ display: "inline-block", width: 6, height: 12, background: C.violet, borderRadius: 1, verticalAlign: "text-bottom", marginLeft: 2 }} />
                        )}</div>
                  }
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div style={{ padding: "8px 12px 12px", flexShrink: 0, borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "8px 10px" }}>
          <label htmlFor="ai-market-input" className="sr-only">Ask the AI analyst</label>
          <input
            id="ai-market-input"
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask the AI analyst…"
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: C.text, fontSize: 12.5, fontFamily: C.sans }}
          />
          <motion.button whileTap={{ scale: 0.9 }}
            onClick={() => send()} disabled={!input.trim() || streaming}
            aria-label="Send message"
            className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
            style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
              background: input.trim() && !streaming ? C.violet : C.raised,
              border: "none", cursor: input.trim() && !streaming ? "pointer" : "default",
              color: input.trim() && !streaming ? "#fff" : C.faint }}>
            <Ic d={PATHS.Send} size={13} color={input.trim() && !streaming ? "#fff" : C.faint} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SHELL
// ═══════════════════════════════════════════════════════════════════════════════
const TABS = [
  { id: "all",       label: "All" },
  { id: "crypto",    label: "Crypto" },
  { id: "stock",     label: "Stocks" },
  { id: "forex",     label: "FX" },
  { id: "commodity", label: "Commodities" },
];

export default function AssetNews({ onClose }) {
  const [prices,     setPrices]     = useState({});  // last-known-GOOD data per asset — never cleared by a failed refresh
  const [failing,    setFailing]    = useState({});  // is this asset's most recent refresh currently failing?
  const [retrying,   setRetrying]   = useState({});
  const [loading,    setLoading]    = useState(true);
  const [lastAt,     setLastAt]     = useState(null);
  const [online,     setOnline]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter,     setFilter]     = useState("all");
  const [showAI,     setShowAI]     = useState(false);
  const [selected,   setSelected]   = useState(null);
  const [now,        setNow]        = useState(() => Date.now());
  const intervalRef = useRef(null);
  const clockRef    = useRef(null);

  const fetchAll = useCallback(async () => {
    setRefreshing(true);
    const { out, failed } = await fetchAllQuotes(ASSETS);
    setPrices(p => ({ ...p, ...out }));
    setFailing(failed);
    setLastAt(new Date());
    setLoading(false);
    setRefreshing(false);
  }, []);

  const retryAsset = useCallback(async (asset) => {
    setRetrying(r => ({ ...r, [asset.id]: true }));
    try {
      const result = await fetchOneQuote(asset);
      setPrices(p => ({ ...p, [asset.id]: { price: result.price, change: result.change, updatedAt: Date.now() } }));
      setFailing(f => ({ ...f, [asset.id]: false }));
    } catch {
      setFailing(f => ({ ...f, [asset.id]: true }));
    } finally {
      setRetrying(r => ({ ...r, [asset.id]: false }));
    }
  }, []);

  useEffect(() => {
    fetchAll();
    intervalRef.current = setInterval(fetchAll, 30_000);
    clockRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearInterval(intervalRef.current); clearInterval(clockRef.current); };
  }, [fetchAll]);

  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  const visible   = ASSETS.filter(a => filter === "all" || a.cat === filter);
  const agoSec    = lastAt ? Math.floor((now - lastAt) / 1000) : null;
  const ago       = agoSec == null ? null : agoSec < 5 ? "just now" : `${agoSec}s ago`;
  const deadCount = visible.filter(a => !prices[a.id] && !loading).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-x-0 z-50 flex items-center justify-center"
      role="dialog" aria-modal="true" aria-label="Markets"
      style={{
        top: 0, bottom: "var(--taskbar-height, 52px)",
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(18px)",
        padding: "max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom))",
      }}>
      <style>{`.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0}`}</style>

      <motion.div
        initial={{ scale: 0.96, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 16 }}
        transition={{ type: "spring", damping: 24, stiffness: 300 }}
        className="w-full max-w-lg"
        style={{ maxHeight: "100%", display: "flex", flexDirection: "column", overflow: "hidden",
          borderRadius: 16, background: C.bg, border: `1px solid ${C.border}`, boxShadow: "0 40px 80px rgba(0,0,0,0.7)", fontFamily: C.sans }}>

        {/* Header — mirrors Health.js's title/status/close layout */}
        <div style={{ flexShrink: 0, minHeight: 56, display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 14px", background: C.panel, borderBottom: `1px solid ${C.border}`, gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
            <Ic d={PATHS.Chart} size={17} color={C.yellow} />
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Markets</span>
                <span style={{ fontSize: 10, fontFamily: C.mono, color: C.muted, background: C.raised, border: `1px solid ${C.border}`, padding: "2px 7px", borderRadius: 5, flexShrink: 0 }}>
                  Live Terminal
                </span>
              </div>
              <div role="status" aria-live="polite" style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", background: online ? C.green : C.red, flexShrink: 0 }} />
                <span style={{ color: C.muted, fontSize: 11 }}>
                  {online ? (ago ? `updated ${ago}` : "connecting…") : "offline"}
                  {deadCount > 0 && ` · ${deadCount} unavailable`}
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <Btn small variant="ghost" active={showAI} onClick={() => setShowAI(v => !v)}
              ariaLabel={showAI ? "Hide AI market analyst" : "Show AI market analyst"} ariaPressed={showAI} title="AI market analyst">
              <Ic d={PATHS.Sparkle} size={13} color={showAI ? C.violet : C.muted} /> AI
            </Btn>
            <motion.button whileTap={{ scale: 0.9 }} onClick={fetchAll} disabled={refreshing}
              aria-label={refreshing ? "Refreshing prices" : "Refresh prices"} title="Refresh prices"
              className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
              style={{ width: 34, height: 34, borderRadius: 9, background: "transparent", border: "1px solid transparent",
                display: "flex", alignItems: "center", justifyContent: "center", cursor: refreshing ? "not-allowed" : "pointer", opacity: refreshing ? 0.5 : 1 }}>
              <motion.div animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
                transition={refreshing ? { duration: 0.8, repeat: Infinity, ease: "linear" } : {}}>
                <Ic d={PATHS.Refresh} size={15} color={C.muted} />
              </motion.div>
            </motion.button>
            <button onClick={onClose} aria-label="Close Markets" title="Close"
              className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
              style={{ width: 32, height: 32, borderRadius: "50%", background: C.raised, border: `1px solid ${C.border}`,
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Ic d={PATHS.X} size={14} color={C.muted} />
            </button>
          </div>
        </div>

        {/* Filter tab bar — same full-width segmented control as Health.js */}
        <div role="tablist" aria-label="Filter assets by category"
          style={{ display: "flex", background: C.surface, borderBottom: `1px solid ${C.border}`, padding: 5, gap: 5, flexShrink: 0 }}>
          {TABS.map(t => {
            const active = filter === t.id;
            return (
              <button key={t.id} role="tab" aria-selected={active} onClick={() => setFilter(t.id)}
                className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                style={{ flex: 1, minHeight: 36, display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: 7, border: "none", cursor: "pointer",
                  background: active ? C.blue : "transparent", color: active ? "#fff" : C.muted,
                  fontSize: 12, fontWeight: 700, fontFamily: C.sans, transition: "all 0.12s" }}>
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Asset list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px 8px", display: "flex", flexDirection: "column", gap: 6, minHeight: 0 }}
          role="list" aria-label="Asset prices">
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "0 13px 2px" }} aria-hidden="true">
            <span style={{ width: 96, color: C.faint, fontSize: 10, fontFamily: C.mono, letterSpacing: "0.08em" }}>ASSET</span>
            <span className="hidden sm:block" style={{ width: 56, flexShrink: 0 }} />
            <span style={{ flex: 1, textAlign: "right", color: C.faint, fontSize: 10, fontFamily: C.mono, letterSpacing: "0.08em" }}>PRICE</span>
            <span style={{ width: 74, textAlign: "right", color: C.faint, fontSize: 10, fontFamily: C.mono, letterSpacing: "0.08em" }}>24H</span>
          </div>
          <AnimatePresence initial={false}>
            {visible.map(asset => (
              <div role="listitem" key={asset.id}>
                <AssetRow asset={asset}
                  data={prices[asset.id]}
                  loading={loading && !prices[asset.id]}
                  retrying={!!retrying[asset.id]}
                  failing={!!failing[asset.id]}
                  now={now}
                  selected={selected?.id === asset.id}
                  onClick={() => { setSelected(s => s?.id === asset.id ? null : asset); if (!showAI) setShowAI(true); }}
                  onRetry={() => retryAsset(asset)}
                />
              </div>
            ))}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {showAI && <AIPanel prices={prices} selectedAsset={selected} />}
        </AnimatePresence>

        <div style={{ padding: "9px 16px", borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
          <p style={{ color: C.faint, fontSize: 10, textAlign: "center", margin: 0 }}>
            Crypto · CoinGecko · Stocks · Yahoo Finance · FX · Frankfurter · 30s refresh {showAI && "· AI powered by Groq"}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}