"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiRefreshCw, FiWifi, FiWifiOff } from "react-icons/fi";
import { TbTriangleFilled, TbTriangleInvertedFilled } from "react-icons/tb";

// ─── Asset config ─────────────────────────────────────────────────────────────
// source: which API feeds this asset
const ASSETS = [
  { id: "bitcoin",   symbol: "BTC",     label: "Bitcoin",     source: "coingecko", geckoId: "bitcoin" },
  { id: "ethereum",  symbol: "ETH",     label: "Ethereum",    source: "coingecko", geckoId: "ethereum" },
  { id: "solana",    symbol: "SOL",     label: "Solana",      source: "coingecko", geckoId: "solana" },
  { id: "AAPL",      symbol: "AAPL",    label: "Apple",       source: "yahoo" },
  { id: "TSLA",      symbol: "TSLA",    label: "Tesla",       source: "yahoo" },
  { id: "NVDA",      symbol: "NVDA",    label: "NVIDIA",      source: "yahoo" },
  { id: "eur",       symbol: "EUR/USD", label: "Euro",        source: "frankfurter", from: "EUR", to: "USD" },
  { id: "gbp",       symbol: "GBP/USD", label: "Pound",       source: "frankfurter", from: "GBP", to: "USD" },
  { id: "XAUUSD",    symbol: "XAU/USD", label: "Gold",        source: "yahoo", yahooTicker: "GC=F" },
];

// Category tags
const CATEGORY = {
  bitcoin: "crypto", ethereum: "crypto", solana: "crypto",
  AAPL: "stock", TSLA: "stock", NVDA: "stock",
  eur: "forex", gbp: "forex",
  XAUUSD: "commodity",
};

const CAT_COLOR = {
  crypto:    "text-orange-400",
  stock:     "text-sky-400",
  forex:     "text-violet-400",
  commodity: "text-yellow-400",
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
    price: data[id]?.usd ?? null,
    change: data[id]?.usd_24h_change ?? null,
  }));
}

async function fetchYahoo(ticker) {
  // Yahoo Finance v8 — no API key, best-effort (may vary by network/CORS proxy)
  const r = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=2d`,
    { cache: "no-store" }
  );
  if (!r.ok) throw new Error("yahoo");
  const data = await r.json();
  const meta = data?.chart?.result?.[0]?.meta;
  if (!meta) throw new Error("yahoo-parse");
  const price = meta.regularMarketPrice;
  const prev  = meta.chartPreviousClose;
  const change = prev ? ((price - prev) / prev) * 100 : null;
  return { price, change };
}

async function fetchFrankfurter(from, to) {
  const r = await fetch(
    `https://api.frankfurter.app/latest?from=${from}&to=${to}`,
    { cache: "no-store" }
  );
  if (!r.ok) throw new Error("frankfurter");
  const data = await r.json();
  const price = data?.rates?.[to] ?? null;
  // Frankfurter doesn't give 24h change; fetch yesterday for delta
  const yest = new Date(); yest.setDate(yest.getDate() - 1);
  const yDate = yest.toISOString().slice(0, 10);
  try {
    const r2 = await fetch(`https://api.frankfurter.app/${yDate}?from=${from}&to=${to}`);
    const d2 = await r2.json();
    const prev = d2?.rates?.[to];
    const change = prev ? ((price - prev) / prev) * 100 : null;
    return { price, change };
  } catch {
    return { price, change: null };
  }
}

// ─── Sparkline (last 7 points simulated from current price — real sparkline
//     would need a paid API; we compute a plausible micro-history from change) ─
function Sparkline({ change, color }) {
  const pts = 7;
  // Build a smooth path trending toward the change direction
  const rand = (n) => (Math.random() - 0.5) * n;
  const points = Array.from({ length: pts }, (_, i) => {
    const base = 50 + (change ?? 0) * (i / (pts - 1)) * 1.5 + rand(8);
    return Math.max(5, Math.min(95, base));
  });
  const w = 60, h = 28;
  const xStep = w / (pts - 1);
  const d = points.map((y, i) => `${i === 0 ? "M" : "L"} ${i * xStep} ${h - (y / 100) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible opacity-60">
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Single asset row ─────────────────────────────────────────────────────────
const AssetRow = ({ asset, data, loading, error }) => {
  const cat = CATEGORY[asset.id];
  const up  = data?.change >= 0;

  const fmt = (n) => {
    if (n == null) return "—";
    if (n >= 1000) return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (n >= 1)    return n.toFixed(2);
    return n.toFixed(4);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-colors hover:bg-white/[0.03] ${CAT_BG[cat]}`}
    >
      {/* Symbol + label */}
      <div className="w-28 flex-shrink-0">
        <div className="text-white font-bold text-sm tracking-tight leading-none">{asset.symbol}</div>
        <div className="text-white/30 text-xs mt-0.5">{asset.label}</div>
      </div>

      {/* Sparkline */}
      <div className="hidden sm:flex flex-shrink-0">
        {data && !error
          ? <Sparkline change={data.change} color={up ? "#34d399" : "#f87171"} />
          : <div className="w-[60px] h-[28px]" />}
      </div>

      {/* Price */}
      <div className="flex-1 text-right">
        {loading && !data ? (
          <div className="h-4 w-20 ml-auto rounded bg-white/8 animate-pulse" />
        ) : error ? (
          <span className="text-white/20 text-xs">unavailable</span>
        ) : (
          <span className="text-white font-mono font-semibold text-sm tabular-nums">
            ${fmt(data?.price)}
          </span>
        )}
      </div>

      {/* Change */}
      <div className="w-20 flex-shrink-0 flex items-center justify-end gap-1">
        {loading && !data ? (
          <div className="h-4 w-16 rounded bg-white/8 animate-pulse" />
        ) : error || data?.change == null ? (
          <span className="text-white/20 text-xs">—</span>
        ) : (
          <motion.div
            key={data.change}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            className={`flex items-center gap-0.5 text-xs font-bold tabular-nums ${up ? "text-emerald-400" : "text-red-400"}`}
          >
            {up
              ? <TbTriangleFilled size={8} />
              : <TbTriangleInvertedFilled size={8} />}
            {Math.abs(data.change).toFixed(2)}%
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const AssetNews = ({ onClose }) => {
  const [prices, setPrices]     = useState({});   // id → { price, change }
  const [errors, setErrors]     = useState({});   // id → bool
  const [loading, setLoading]   = useState(true);
  const [lastAt, setLastAt]     = useState(null);
  const [online, setOnline]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter]     = useState("all");
  const intervalRef = useRef(null);

  const fetchAll = useCallback(async () => {
    setRefreshing(true);

    const newPrices = { ...prices };
    const newErrors = {};

    // ── Coingecko (batch) ──
    const cryptoAssets = ASSETS.filter((a) => a.source === "coingecko");
    try {
      const results = await fetchCoingecko(cryptoAssets.map((a) => a.geckoId));
      results.forEach((r, i) => {
        if (r.price != null) newPrices[cryptoAssets[i].id] = { price: r.price, change: r.change };
        else newErrors[cryptoAssets[i].id] = true;
      });
    } catch {
      cryptoAssets.forEach((a) => { newErrors[a.id] = true; });
    }

    // ── Yahoo (parallel) ──
    const yahooAssets = ASSETS.filter((a) => a.source === "yahoo");
    await Promise.allSettled(
      yahooAssets.map(async (a) => {
        const ticker = a.yahooTicker ?? a.symbol;
        try {
          const r = await fetchYahoo(ticker);
          newPrices[a.id] = r;
        } catch {
          newErrors[a.id] = true;
        }
      })
    );

    // ── Frankfurter (parallel) ──
    const fxAssets = ASSETS.filter((a) => a.source === "frankfurter");
    await Promise.allSettled(
      fxAssets.map(async (a) => {
        try {
          const r = await fetchFrankfurter(a.from, a.to);
          newPrices[a.id] = r;
        } catch {
          newErrors[a.id] = true;
        }
      })
    );

    setPrices(newPrices);
    setErrors(newErrors);
    setLastAt(new Date());
    setLoading(false);
    setRefreshing(false);
  }, []); // eslint-disable-line

  // Initial fetch + 30s polling
  useEffect(() => {
    fetchAll();
    intervalRef.current = setInterval(fetchAll, 30_000);
    return () => clearInterval(intervalRef.current);
  }, []); // eslint-disable-line

  // Online/offline indicator
  useEffect(() => {
    const on  = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online",  on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  const TABS = ["all", "crypto", "stock", "forex", "commodity"];
  const visible = ASSETS.filter((a) => filter === "all" || CATEGORY[a.id] === filter);

  const ago = lastAt
    ? Math.floor((Date.now() - lastAt) / 1000) < 5
      ? "just now"
      : `${Math.floor((Date.now() - lastAt) / 1000)}s ago`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(18px)" }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 16 }}
        transition={{ type: "spring", damping: 24, stiffness: 300 }}
        className="w-full max-w-lg max-h-[90vh] rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: "linear-gradient(160deg, #0e1520 0%, #080e18 100%)",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 40px 80px rgba(0,0,0,0.7)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-white font-bold text-base tracking-tight leading-none">Markets</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                {online
                  ? <FiWifi size={10} className="text-emerald-400" />
                  : <FiWifiOff size={10} className="text-red-400" />}
                <span className="text-white/25 text-[10px]">
                  {online ? (ago ? `updated ${ago}` : "connecting…") : "offline"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={fetchAll}
              disabled={refreshing}
              className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-colors disabled:opacity-30"
              aria-label="Refresh"
            >
              <motion.div
                animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
                transition={refreshing ? { duration: 0.8, repeat: Infinity, ease: "linear" } : {}}
              >
                <FiRefreshCw size={14} />
              </motion.div>
            </motion.button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-colors"
              aria-label="Close"
            >
              <FiX size={16} />
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 px-5 py-3 border-b border-white/5 flex-shrink-0 overflow-x-auto scrollbar-none">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all
                ${filter === t
                  ? "bg-white/12 text-white"
                  : "text-white/30 hover:text-white/60 hover:bg-white/5"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Asset list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
          {/* Column headers */}
          <div className="flex items-center gap-4 px-4 pb-1">
            <span className="w-28 text-white/20 text-[10px] uppercase tracking-widest flex-shrink-0">Asset</span>
            <span className="hidden sm:block flex-shrink-0 w-[60px]" />
            <span className="flex-1 text-right text-white/20 text-[10px] uppercase tracking-widest">Price</span>
            <span className="w-20 text-right text-white/20 text-[10px] uppercase tracking-widest flex-shrink-0">24h</span>
          </div>

          <AnimatePresence initial={false}>
            {visible.map((asset) => (
              <AssetRow
                key={asset.id}
                asset={asset}
                data={prices[asset.id]}
                loading={loading}
                error={!!errors[asset.id]}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/5 flex-shrink-0">
          <p className="text-white/15 text-[10px] text-center">
            Crypto · CoinGecko · Stocks · Yahoo Finance · FX · Frankfurter · 30s refresh
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AssetNews;