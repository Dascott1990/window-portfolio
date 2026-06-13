"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiRefreshCw, FiWifi, FiWifiOff, FiSend, FiCpu } from "react-icons/fi";
import { TbTriangleFilled, TbTriangleInvertedFilled } from "react-icons/tb";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

// ─── Asset config ─────────────────────────────────────────────────────────────
const ASSETS = [
  { id: "bitcoin",  symbol: "BTC",     label: "Bitcoin",  source: "coingecko", geckoId: "bitcoin" },
  { id: "ethereum", symbol: "ETH",     label: "Ethereum", source: "coingecko", geckoId: "ethereum" },
  { id: "solana",   symbol: "SOL",     label: "Solana",   source: "coingecko", geckoId: "solana" },
  { id: "AAPL",     symbol: "AAPL",    label: "Apple",    source: "yahoo" },
  { id: "TSLA",     symbol: "TSLA",    label: "Tesla",    source: "yahoo" },
  { id: "NVDA",     symbol: "NVDA",    label: "NVIDIA",   source: "yahoo" },
  { id: "eur",      symbol: "EUR/USD", label: "Euro",     source: "frankfurter", from: "EUR", to: "USD" },
  { id: "gbp",      symbol: "GBP/USD", label: "Pound",    source: "frankfurter", from: "GBP", to: "USD" },
  { id: "XAUUSD",   symbol: "XAU/USD", label: "Gold",     source: "yahoo", yahooTicker: "GC=F" },
];

const CATEGORY = {
  bitcoin: "crypto", ethereum: "crypto", solana: "crypto",
  AAPL: "stock", TSLA: "stock", NVDA: "stock",
  eur: "forex", gbp: "forex", XAUUSD: "commodity",
};

const CAT_BG = {
  crypto:    "bg-orange-400/8 border-orange-400/15",
  stock:     "bg-sky-400/8 border-sky-400/15",
  forex:     "bg-violet-400/8 border-violet-400/15",
  commodity: "bg-yellow-400/8 border-yellow-400/15",
};

// ─── Fetchers ─────────────────────────────────────────────────────────────────
async function fetchCoingecko(geckoIds) {
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

async function fetchYahoo(ticker) {
  const r = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=2d`,
    { cache: "no-store" }
  );
  if (!r.ok) throw new Error("yahoo");
  const data = await r.json();
  const meta = data?.chart?.result?.[0]?.meta;
  if (!meta) throw new Error("yahoo-parse");
  const price  = meta.regularMarketPrice;
  const prev   = meta.chartPreviousClose;
  const change = prev ? ((price - prev) / prev) * 100 : null;
  return { price, change };
}

async function fetchFrankfurter(from, to) {
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

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ change, color }) {
  const pts    = 7;
  const rand   = (n) => (Math.random() - 0.5) * n;
  const points = Array.from({ length: pts }, (_, i) => {
    const base = 50 + (change ?? 0) * (i / (pts - 1)) * 1.5 + rand(8);
    return Math.max(5, Math.min(95, base));
  });
  const w = 60, h = 28, xStep = w / (pts - 1);
  const d = points.map((y, i) => `${i === 0 ? "M" : "L"} ${i * xStep} ${h - (y / 100) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible opacity-60">
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Asset row ────────────────────────────────────────────────────────────────
const AssetRow = ({ asset, data, loading, error, onClick, selected }) => {
  const cat = CATEGORY[asset.id];
  const up  = data?.change >= 0;
  const fmt = (n) => {
    if (n == null) return "—";
    if (n >= 1000) return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (n >= 1)    return n.toFixed(2);
    return n.toFixed(4);
  };
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-colors cursor-pointer
        ${selected ? "ring-1 ring-white/20 bg-white/[0.05]" : "hover:bg-white/[0.03]"}
        ${CAT_BG[cat]}`}>
      <div className="w-28 flex-shrink-0">
        <div className="text-white font-bold text-sm tracking-tight leading-none">{asset.symbol}</div>
        <div className="text-white/30 text-xs mt-0.5">{asset.label}</div>
      </div>
      <div className="hidden sm:flex flex-shrink-0">
        {data && !error ? <Sparkline change={data.change} color={up ? "#34d399" : "#f87171"} /> : <div className="w-[60px] h-[28px]" />}
      </div>
      <div className="flex-1 text-right">
        {loading && !data ? (
          <div className="h-4 w-20 ml-auto rounded bg-white/8 animate-pulse" />
        ) : error ? (
          <span className="text-white/20 text-xs">unavailable</span>
        ) : (
          <span className="text-white font-mono font-semibold text-sm tabular-nums">${fmt(data?.price)}</span>
        )}
      </div>
      <div className="w-20 flex-shrink-0 flex items-center justify-end gap-1">
        {loading && !data ? (
          <div className="h-4 w-16 rounded bg-white/8 animate-pulse" />
        ) : error || data?.change == null ? (
          <span className="text-white/20 text-xs">—</span>
        ) : (
          <motion.div key={data.change} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }}
            className={`flex items-center gap-0.5 text-xs font-bold tabular-nums ${up ? "text-emerald-400" : "text-red-400"}`}>
            {up ? <TbTriangleFilled size={8} /> : <TbTriangleInvertedFilled size={8} />}
            {Math.abs(data.change).toFixed(2)}%
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// ─── Inline markdown renderer ─────────────────────────────────────────────────
function renderMd(text) {
  if (!text) return null;
  const lines = text.split("\n");
  const out   = []; let inCode = false; let codeLines = []; let codeLang = "";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("```")) {
      if (!inCode) { inCode = true; codeLang = line.slice(3).trim() || "text"; codeLines = []; }
      else {
        inCode = false;
        out.push(<pre key={i} style={{ background: "rgba(0,0,0,0.4)", borderRadius: 8, padding: "10px 12px", overflowX: "auto", fontSize: 11, fontFamily: "monospace", margin: "6px 0", color: "#c9d1d9" }}><code>{codeLines.join("\n")}</code></pre>);
        codeLines = [];
      }
      continue;
    }
    if (inCode) { codeLines.push(line); continue; }
    if (line.startsWith("## ")) { out.push(<div key={i} style={{ fontWeight: 700, fontSize: 13, color: "#fff", margin: "10px 0 4px" }}>{line.slice(3)}</div>); continue; }
    if (/^[-*] /.test(line))    { out.push(<div key={i} style={{ paddingLeft: 12, color: "rgba(255,255,255,0.8)", fontSize: 12, lineHeight: 1.6 }}>• {inlineMd(line.slice(2))}</div>); continue; }
    if (line.trim() === "")     { out.push(<div key={i} style={{ height: 6 }} />); continue; }
    out.push(<p key={i} style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, lineHeight: 1.7, margin: "2px 0" }}>{inlineMd(line)}</p>);
  }
  return out;
}
function inlineMd(text) {
  const parts = []; const re = /(`[^`]+`|\*\*[^*]+\*\*)/g; let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[0].startsWith("`")) parts.push(<code key={m.index} style={{ fontFamily: "monospace", fontSize: "0.88em", background: "rgba(255,255,255,0.1)", padding: "1px 4px", borderRadius: 3 }}>{m[0].slice(1,-1)}</code>);
    else parts.push(<strong key={m.index} style={{ color: "#fff" }}>{m[0].slice(2,-2)}</strong>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 ? parts[0] : parts;
}

// ─── AI analyst panel ─────────────────────────────────────────────────────────
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

  // Build system prompt with live prices baked in
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

    const userMsg = { role: "user", content: msg, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);

    const aiMsg = { role: "assistant", content: "", id: Date.now() + 1 };
    setMessages(prev => [...prev, aiMsg]);
    setStreaming(true);

    try {
      abortRef.current = new AbortController();
      const history = messages
        .filter(m => m.role !== "system")
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch(`${BASE_URL}/api/v1/ai/chat`, {
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
              setMessages(prev => prev.map((m, i) =>
                i === prev.length - 1 ? { ...m, content: full } : m
              ));
            }
            if (evt.type === "error") throw new Error(evt.message);
          } catch {}
        }
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      setMessages(prev => prev.map((m, i) =>
        i === prev.length - 1 ? { ...m, content: `**Error:** ${err.message}` } : m
      ));
    } finally {
      setStreaming(false);
    }
  }, [input, streaming, messages, buildSystem]);

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 380, opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ type: "spring", damping: 26, stiffness: 280 }}
      style={{ overflow: "hidden", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column" }}
    >
      {/* AI header */}
      <div style={{ padding: "10px 16px 8px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg, #7c6df7, #38bdf8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FiCpu size={12} color="#fff" />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#7c6df7", letterSpacing: "0.1em" }}>AI MARKET ANALYST</span>
          {streaming && (
            <motion.div animate={{ opacity: [0.4,1,0.4] }} transition={{ duration: 1, repeat: Infinity }}
              style={{ fontSize: 9, color: "#7c6df7", background: "rgba(124,109,247,0.15)", padding: "2px 8px", borderRadius: 8, border: "1px solid rgba(124,109,247,0.3)" }}>
              ● STREAMING
            </motion.div>
          )}
        </div>
        {messages.length > 0 && (
          <button onClick={() => setMessages([])}
            style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", background: "none", border: "none", cursor: "pointer", letterSpacing: "0.08em" }}>
            CLEAR
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 8px", scrollbarWidth: "none" }}>
        {messages.length === 0 ? (
          <div style={{ paddingTop: 4 }}>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 10 }}>
              Ask about any asset, market trend, or portfolio strategy:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {QUICK_PROMPTS.map(p => (
                <motion.button key={p} whileTap={{ scale: 0.98 }} onClick={() => send(p)}
                  style={{ textAlign: "left", padding: "7px 11px", borderRadius: 10, background: "rgba(124,109,247,0.08)",
                    border: "1px solid rgba(124,109,247,0.18)", color: "rgba(255,255,255,0.65)",
                    fontSize: 11, cursor: "pointer", lineHeight: 1.4 }}>
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
                  <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg, #7c6df7, #38bdf8)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2 }}>
                    <FiCpu size={10} color="#fff" />
                  </div>
                )}
                <div style={{ maxWidth: "85%", padding: "9px 12px", borderRadius: m.role === "user" ? "14px 4px 14px 14px" : "4px 14px 14px 14px",
                  background: m.role === "user" ? "rgba(124,109,247,0.15)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${m.role === "user" ? "rgba(124,109,247,0.3)" : "rgba(255,255,255,0.07)"}` }}>
                  {m.role === "user"
                    ? <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 12, margin: 0 }}>{m.content}</p>
                    : m.content === "" && i === messages.length - 1 && streaming
                      ? <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "4px 0" }}>
                          {[0,1,2].map(j => (
                            <motion.div key={j} animate={{ y: [0,-4,0] }} transition={{ duration: 0.7, repeat: Infinity, delay: j*0.15 }}
                              style={{ width: 5, height: 5, borderRadius: "50%", background: "#7c6df7" }} />
                          ))}
                        </div>
                      : <div>{renderMd(m.content)}{i === messages.length - 1 && streaming && (
                          <motion.span animate={{ opacity: [1,0,1] }} transition={{ duration: 0.8, repeat: Infinity }}
                            style={{ display: "inline-block", width: 6, height: 12, background: "#7c6df7", borderRadius: 1, verticalAlign: "text-bottom", marginLeft: 2 }} />
                        )}</div>
                  }
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: "8px 12px 12px", flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "8px 10px" }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask the AI analyst…"
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#fff", fontSize: 12, fontFamily: "inherit" }}
          />
          <motion.button whileTap={{ scale: 0.9 }}
            onClick={() => send()}
            disabled={!input.trim() || streaming}
            style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
              background: input.trim() && !streaming ? "rgba(124,109,247,0.8)" : "rgba(255,255,255,0.06)",
              border: "none", cursor: input.trim() && !streaming ? "pointer" : "default",
              color: input.trim() && !streaming ? "#fff" : "rgba(255,255,255,0.2)" }}>
            <FiSend size={13} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
const AssetNews = ({ onClose }) => {
  const [prices,     setPrices]     = useState({});
  const [errors,     setErrors]     = useState({});
  const [loading,    setLoading]    = useState(true);
  const [lastAt,     setLastAt]     = useState(null);
  const [online,     setOnline]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter,     setFilter]     = useState("all");
  const [showAI,     setShowAI]     = useState(false);
  const [selected,   setSelected]   = useState(null);
  const intervalRef  = useRef(null);

  const fetchAll = useCallback(async () => {
    setRefreshing(true);
    const newPrices = { ...prices };
    const newErrors = {};

    const cryptoAssets = ASSETS.filter(a => a.source === "coingecko");
    try {
      const results = await fetchCoingecko(cryptoAssets.map(a => a.geckoId));
      results.forEach((r, i) => {
        if (r.price != null) newPrices[cryptoAssets[i].id] = { price: r.price, change: r.change };
        else newErrors[cryptoAssets[i].id] = true;
      });
    } catch { cryptoAssets.forEach(a => { newErrors[a.id] = true; }); }

    await Promise.allSettled(
      ASSETS.filter(a => a.source === "yahoo").map(async a => {
        try { newPrices[a.id] = await fetchYahoo(a.yahooTicker ?? a.symbol); }
        catch { newErrors[a.id] = true; }
      })
    );

    await Promise.allSettled(
      ASSETS.filter(a => a.source === "frankfurter").map(async a => {
        try { newPrices[a.id] = await fetchFrankfurter(a.from, a.to); }
        catch { newErrors[a.id] = true; }
      })
    );

    setPrices(newPrices);
    setErrors(newErrors);
    setLastAt(new Date());
    setLoading(false);
    setRefreshing(false);
  }, []); // eslint-disable-line

  useEffect(() => {
    fetchAll();
    intervalRef.current = setInterval(fetchAll, 30_000);
    return () => clearInterval(intervalRef.current);
  }, []); // eslint-disable-line

  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  const TABS    = ["all", "crypto", "stock", "forex", "commodity"];
  const visible = ASSETS.filter(a => filter === "all" || CATEGORY[a.id] === filter);
  const ago     = lastAt
    ? Math.floor((Date.now() - lastAt) / 1000) < 5 ? "just now" : `${Math.floor((Date.now() - lastAt) / 1000)}s ago`
    : null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ bottom: "var(--taskbar-height, 52px)", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(18px)" }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 16 }}
        transition={{ type: "spring", damping: 24, stiffness: 300 }}
        className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: "92vh", background: "linear-gradient(160deg, #0e1520 0%, #080e18 100%)", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 40px 80px rgba(0,0,0,0.7)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-white font-bold text-base tracking-tight leading-none">Markets</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                {online ? <FiWifi size={10} className="text-emerald-400" /> : <FiWifiOff size={10} className="text-red-400" />}
                <span className="text-white/25 text-[10px]">
                  {online ? (ago ? `updated ${ago}` : "connecting…") : "offline"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* AI toggle */}
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowAI(v => !v)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all
                ${showAI ? "bg-violet-500/20 text-violet-400 border border-violet-500/30" : "text-white/30 hover:text-white/70 hover:bg-white/5"}`}>
              <FiCpu size={12} />
              AI
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={fetchAll} disabled={refreshing}
              className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-colors disabled:opacity-30">
              <motion.div animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
                transition={refreshing ? { duration: 0.8, repeat: Infinity, ease: "linear" } : {}}>
                <FiRefreshCw size={14} />
              </motion.div>
            </motion.button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-colors">
              <FiX size={16} />
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 px-5 py-3 border-b border-white/5 flex-shrink-0 overflow-x-auto scrollbar-none">
          {TABS.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all
                ${filter === t ? "bg-white/12 text-white" : "text-white/30 hover:text-white/60 hover:bg-white/5"}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Asset list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5 min-h-0">
          <div className="flex items-center gap-4 px-4 pb-1">
            <span className="w-28 text-white/20 text-[10px] uppercase tracking-widest flex-shrink-0">Asset</span>
            <span className="hidden sm:block flex-shrink-0 w-[60px]" />
            <span className="flex-1 text-right text-white/20 text-[10px] uppercase tracking-widest">Price</span>
            <span className="w-20 text-right text-white/20 text-[10px] uppercase tracking-widest flex-shrink-0">24h</span>
          </div>
          <AnimatePresence initial={false}>
            {visible.map(asset => (
              <AssetRow key={asset.id} asset={asset}
                data={prices[asset.id]} loading={loading} error={!!errors[asset.id]}
                selected={selected?.id === asset.id}
                onClick={() => {
                  setSelected(s => s?.id === asset.id ? null : asset);
                  if (!showAI) setShowAI(true);
                }}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* AI Panel */}
        <AnimatePresence>
          {showAI && <AIPanel prices={prices} selectedAsset={selected} />}
        </AnimatePresence>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-white/5 flex-shrink-0">
          <p className="text-white/15 text-[10px] text-center">
            Crypto · CoinGecko · Stocks · Yahoo Finance · FX · Frankfurter · 30s refresh {showAI && "· AI powered by Groq"}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AssetNews;