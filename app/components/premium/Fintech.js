"use client";
/**
 * Fintech.js — NovaPay Finance OS
 * Complete personal finance system. Real backend, no fake data, no Math.random().
 *
 * 7 tabs:
 *   HOME     — free balance hero, next paycheck, bills due, savings rings
 *   SEND     — real wallet send via /api/v1/wallet/send (3-step flow)
 *   REQUEST  — request money via /api/v1/wallet/request
 *   HISTORY  — real transaction ledger from /api/v1/transactions
 *   BILLS    — manage pay schedule + recurring bills via /api/v1/finance
 *   ENVELOPES — savings goals via /api/v1/finance/envelopes
 *   CARD     — virtual NovaPay card, freeze/spend via /api/v1/finance/card
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

// ─── Design system ────────────────────────────────────────────────────────────
const D = {
  bg:      "#07090F",
  s1:      "#0D1018",
  s2:      "#111520",
  s3:      "#171C28",
  b0:      "rgba(255,255,255,0.05)",
  b1:      "rgba(255,255,255,0.09)",
  b2:      "rgba(255,255,255,0.15)",
  text:    "#EEE9E0",
  sub:     "#7A8899",
  faint:   "rgba(122,136,153,0.45)",
  gold:    "#CFA94A",
  goldL:   "#EBC76A",
  goldBg:  "rgba(207,169,74,0.1)",
  goldBr:  "rgba(207,169,74,0.22)",
  green:   "#2BC76E",
  greenBg: "rgba(43,199,110,0.09)",
  greenBr: "rgba(43,199,110,0.22)",
  red:     "#E84545",
  redBg:   "rgba(232,69,69,0.08)",
  redBr:   "rgba(232,69,69,0.2)",
  blue:    "#4A8FE8",
  blueBg:  "rgba(74,143,232,0.1)",
  blueBr:  "rgba(74,143,232,0.22)",
  violet:  "#9B8CFF",
  violetBg:"rgba(155,140,255,0.09)",
  violetBr:"rgba(155,140,255,0.22)",
  sans:    "-apple-system,'SF Pro Display',Inter,system-ui,sans-serif",
  mono:    "'SF Mono','JetBrains Mono',monospace",
};

// ─── SVG Icon system — no emojis ─────────────────────────────────────────────
const I = ({ p, size = 20, c = "currentColor", sw = 1.7, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }}>
    {(Array.isArray(p) ? p : [p]).map((d, i) => <path key={i} d={d} />)}
  </svg>
);

const IC = {
  home:     "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  send:     "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
  request:  ["M12 2v20","M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"],
  history:  "M3 3h18v4H3zm0 7h18v4H3zm0 7h18v4H3",
  bills:    ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z","M14 2v6h6","M16 13H8","M16 17H8","M10 9H8"],
  envelope: ["M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z","M3 6l9 7 9-7"],
  card:     ["M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7z","M2 11h20"],
  close:    "M18 6L6 18M6 6l12 12",
  check:    "M20 6L9 17l-5-5",
  alert:    "M12 2a10 10 0 1 1 0 20A10 10 0 0 1 12 2zm0 6v4m0 4h.01",
  arrow:    "M5 12h14M12 5l7 7-7 7",
  back:     "M19 12H5m7-7-7 7 7 7",
  refresh:  "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  plus:     "M12 5v14M5 12h14",
  trash:    ["M3 6h18","M8 6V4h8v2","M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"],
  lock:     ["M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z","M7 11V7a5 5 0 0 1 10 0v4","M12 16v2"],
  eye:      ["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z","M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"],
  freeze:   ["M12 2v20","M2 7l10 5 10-5","M2 17l10-5 10 5"],
  coin:     ["M12 2a10 10 0 1 1 0 20A10 10 0 0 1 12 2z","M12 6v2m0 8v2M8 10h2a2 2 0 1 1 0 4H8m0 0h4a2 2 0 1 1 0 4H8"],
  nfc:      ["M6 8.5A6.5 6.5 0 0 1 12 2","M6 12a6 6 0 0 1 6-6","M6 15.5A9.5 9.5 0 0 1 12 6","M6 19A13 13 0 0 1 12 6"],
  income:   "M12 2v20M17 7H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  calendar: ["M3 4h18v18H3z","M16 2v4M8 2v4M3 10h18"],
  target:   ["M12 2a10 10 0 1 1 0 20A10 10 0 0 1 12 2z","M12 6a6 6 0 1 1 0 12A6 6 0 0 1 12 6z","M12 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"],
};

// ─── API layer ────────────────────────────────────────────────────────────────
async function call(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
  return json.data ?? json;
}
const GET    = p       => call(p);
const POST   = (p, b)  => call(p, { method: "POST",   body: JSON.stringify(b) });
const DELETE = p       => call(p, { method: "DELETE" });

// ─── Format helpers ───────────────────────────────────────────────────────────
const money = (n, cur = "CAD") =>
  `${cur} ${Number(n || 0).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const moneyShort = (n) =>
  `$${Number(n || 0).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ─── Responsive width hook ────────────────────────────────────────────────────
function useWidth() {
  const [w, setW] = useState(390);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    fn(); window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return w;
}

// ─── Base components ──────────────────────────────────────────────────────────
const Pill = ({ label, color }) => (
  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", color,
    background: color + "18", border: `1px solid ${color}30`,
    borderRadius: 20, padding: "2px 8px", fontFamily: D.mono, whiteSpace: "nowrap" }}>
    {label}
  </span>
);

const Spinner = ({ size = 16, color = D.gold }) => (
  <div style={{ width: size, height: size, borderRadius: "50%",
    border: `2px solid ${color}30`, borderTopColor: color,
    animation: "nova-spin 0.7s linear infinite", flexShrink: 0 }} />
);

const Row = ({ label, value, color = D.text, mono = true, border = true }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "12px 0", borderBottom: border ? `1px solid ${D.b0}` : "none" }}>
    <span style={{ color: D.sub, fontSize: 13 }}>{label}</span>
    <span style={{ color, fontSize: 13, fontWeight: 600,
      fontFamily: mono ? D.mono : D.sans }}>{value}</span>
  </div>
);

const Field = ({ value, onChange, placeholder, type = "text", autoFocus, onKeyDown }) => (
  <input type={type} value={value} onChange={onChange} placeholder={placeholder}
    autoFocus={autoFocus} onKeyDown={onKeyDown}
    style={{ width: "100%", boxSizing: "border-box", padding: "14px 16px",
      borderRadius: 14, background: D.s3, border: `1.5px solid ${D.b1}`,
      color: D.text, fontSize: 15, fontFamily: D.sans, outline: "none",
      caretColor: D.gold, WebkitAppearance: "none" }}
    onFocus={e => e.target.style.borderColor = D.goldBr}
    onBlur={e => e.target.style.borderColor = D.b1} />
);

const Sel = ({ value, onChange, children }) => (
  <select value={value} onChange={onChange}
    style={{ width: "100%", boxSizing: "border-box", padding: "14px 16px",
      borderRadius: 14, background: D.s3, border: `1.5px solid ${D.b1}`,
      color: D.text, fontSize: 15, fontFamily: D.sans, outline: "none",
      appearance: "none", WebkitAppearance: "none" }}>
    {children}
  </select>
);

const Btn = ({ onClick, children, color = D.gold, ghost, disabled, loading, fullWidth = true }) => (
  <motion.button whileTap={disabled ? {} : { scale: 0.97 }} onClick={onClick}
    disabled={disabled || loading}
    style={{ width: fullWidth ? "100%" : "auto", padding: "15px 20px",
      borderRadius: 14, border: ghost ? `1.5px solid ${color}35` : "none",
      background: ghost ? color + "10" : (disabled || loading ? D.s3 : `linear-gradient(135deg, ${color}, ${color}bb)`),
      color: disabled || loading ? D.sub : (ghost ? color : color === D.gold ? "#000" : "#fff"),
      fontSize: 14, fontWeight: 700, fontFamily: D.sans, cursor: disabled ? "not-allowed" : "pointer",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 50 }}>
    {loading ? <Spinner size={16} color={ghost ? color : (color === D.gold ? "#000" : "#fff")} /> : children}
  </motion.button>
);

const SmallBtn = ({ onClick, children, color = D.gold }) => (
  <motion.button whileTap={{ scale: 0.93 }} onClick={onClick}
    style={{ padding: "7px 14px", borderRadius: 10, border: `1.5px solid ${color}35`,
      background: color + "10", color, fontSize: 12, fontWeight: 700, fontFamily: D.sans,
      cursor: "pointer", display: "flex", alignItems: "center", gap: 5, minHeight: 36, whiteSpace: "nowrap" }}>
    {children}
  </motion.button>
);

const Card = ({ children, pad = "18px 18px", style = {} }) => (
  <div style={{ borderRadius: 20, background: D.s1, border: `1px solid ${D.b0}`,
    padding: pad, ...style }}>
    {children}
  </div>
);

const SectionTitle = ({ label, right }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
    <span style={{ fontFamily: D.mono, fontSize: 10, color: D.faint, letterSpacing: "0.12em" }}>
      {label}
    </span>
    {right}
  </div>
);

const Empty = ({ icon, title, sub }) => (
  <div style={{ textAlign: "center", padding: "36px 20px" }}>
    <div style={{ width: 52, height: 52, borderRadius: 16, background: D.s3,
      display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
      <I p={icon} size={22} c={D.sub} />
    </div>
    <p style={{ color: D.text, fontSize: 15, fontWeight: 600, margin: "0 0 6px" }}>{title}</p>
    <p style={{ color: D.sub, fontSize: 13, margin: 0, lineHeight: 1.6 }}>{sub}</p>
  </div>
);

const Skeleton = ({ h = 60 }) => (
  <div style={{ height: h, borderRadius: 16, background: D.s2,
    animation: "nova-pulse 1.5s ease-in-out infinite" }} />
);

function Bar({ pct, color }) {
  return (
    <div style={{ height: 5, borderRadius: 3, background: D.b0, overflow: "hidden" }}>
      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, pct)}%` }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        style={{ height: "100%", borderRadius: 3, background: color }} />
    </div>
  );
}

// ─── Animated balance ─────────────────────────────────────────────────────────
function LiveBalance({ value, size = 52, color = D.green }) {
  const [d, setD] = useState(value);
  useEffect(() => {
    const diff = value - d;
    if (Math.abs(diff) < 0.01) { setD(value); return; }
    let f = 0;
    const id = setInterval(() => {
      f++;
      setD(prev => prev + diff * (1 - Math.pow(1 - f / 40, 3)));
      if (f >= 40) { setD(value); clearInterval(id); }
    }, 16);
    return () => clearInterval(id);
  }, [value]);
  const whole  = Math.floor(Math.abs(d)).toLocaleString("en-CA");
  const dec    = (Math.abs(d) % 1).toFixed(2).slice(1);
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 2, lineHeight: 1 }}>
      <span style={{ fontSize: Math.round(size * 0.38), color, fontWeight: 300, marginTop: Math.round(size * 0.16) }}>$</span>
      <span style={{ fontSize: size, fontWeight: 800, color, letterSpacing: "-2px", fontVariantNumeric: "tabular-nums" }}>{whole}</span>
      <span style={{ fontSize: Math.round(size * 0.38), color, opacity: 0.65, marginTop: Math.round(size * 0.2) }}>{dec}</span>
    </div>
  );
}

// ─── NovaPay virtual card ─────────────────────────────────────────────────────
function NovaCardDisplay({ card, freeBalance, flipped, onFlip }) {
  if (!card) return <Skeleton h={200} />;
  const num = card.number
    ? `${card.number.slice(0,4)} ${card.number.slice(4,8)} ${card.number.slice(8,12)} ${card.number.slice(12)}`
    : "**** **** **** ****";
  const exp = `${String(card.expiry_month).padStart(2,"0")}/${String(card.expiry_year).slice(-2)}`;

  return (
    <div style={{ perspective: 1000, cursor: "pointer", userSelect: "none" }} onClick={onFlip}>
      <motion.div animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 180 }}
        style={{ transformStyle: "preserve-3d", position: "relative", height: 200 }}>

        {/* Front */}
        <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", borderRadius: 22,
          background: card.is_frozen
            ? "linear-gradient(140deg,#111520,#0a0d14)"
            : "linear-gradient(140deg,#1B2D52 0%,#0D1B3C 55%,#162235 100%)",
          border: `1.5px solid ${card.is_frozen ? D.b1 : D.goldBr}`,
          boxShadow: card.is_frozen ? "none"
            : `0 20px 56px rgba(0,0,0,0.55), 0 0 0 1px ${D.gold}12, inset 0 1px 0 ${D.gold}18`,
          padding: "22px 24px", display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden" }}>

          {card.is_frozen && (
            <div style={{ position: "absolute", inset: 0, borderRadius: 22,
              background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
              <div style={{ textAlign: "center" }}>
                <I p={IC.freeze} size={28} c={D.sub} />
                <p style={{ fontFamily: D.mono, fontSize: 12, color: D.sub, letterSpacing: "0.2em", margin: "8px 0 0" }}>FROZEN</p>
              </div>
            </div>
          )}

          {/* Shimmer overlay */}
          <div style={{ position: "absolute", inset: 0, borderRadius: 22, pointerEvents: "none",
            background: "linear-gradient(135deg,rgba(255,255,255,0.04) 0%,transparent 55%,rgba(255,255,255,0.02) 100%)" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontFamily: D.mono, fontSize: 9, color: D.gold, letterSpacing: "0.22em", margin: "0 0 3px", opacity: 0.9 }}>NOVAPAY</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: D.text, margin: 0, letterSpacing: "0.03em" }}>Finance OS</p>
            </div>
            <I p={IC.nfc} size={22} c={D.gold} sw={1.3} />
          </div>

          {/* Chip */}
          <div style={{ width: 38, height: 28, borderRadius: 6, marginTop: 4,
            background: `linear-gradient(135deg,${D.gold}cc,${D.gold}77)`,
            border: `1px solid ${D.gold}88`, position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: 6,
              background: "linear-gradient(135deg,rgba(255,255,255,0.15),transparent)" }} />
          </div>

          <div>
            <p style={{ fontFamily: D.mono, fontSize: 15, color: D.text, letterSpacing: "0.18em", margin: "0 0 12px" }}>{num}</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <p style={{ fontFamily: D.mono, fontSize: 8, color: D.gold, letterSpacing: "0.12em", margin: "0 0 3px", opacity: 0.8 }}>FREE BALANCE</p>
                <p style={{ fontFamily: D.mono, fontSize: 14, fontWeight: 700, color: D.text, margin: 0 }}>{moneyShort(freeBalance ?? 0)}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontFamily: D.mono, fontSize: 8, color: D.gold, letterSpacing: "0.12em", margin: "0 0 3px", opacity: 0.8 }}>VALID THRU</p>
                <p style={{ fontFamily: D.mono, fontSize: 13, fontWeight: 600, color: D.text, margin: 0 }}>{exp}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Back */}
        <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden",
          transform: "rotateY(180deg)", borderRadius: 22, overflow: "hidden",
          background: "linear-gradient(140deg,#1B2D52,#0D1B3C)",
          border: `1.5px solid ${D.goldBr}` }}>
          <div style={{ height: 48, background: "#000", margin: "20% 0 16px" }} />
          <div style={{ padding: "0 22px" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
              <div style={{ background: D.s3, borderRadius: 6, padding: "5px 12px",
                fontFamily: D.mono, fontSize: 14, color: D.text, border: `1px solid ${D.b1}` }}>
                {card.cvv}
              </div>
            </div>
            <p style={{ color: D.sub, fontSize: 11, lineHeight: 1.6, margin: 0 }}>
              This is a NovaPay virtual spending tracker. It is not connected to any real card network.
              It tracks your spending against your free balance in real time.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// HOME TAB — free balance, next paycheck, bills, envelope rings
// ══════════════════════════════════════════════════════════════════════════════
function HomeTab({ summary, envelopes, wallet }) {
  if (!summary) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {[160, 80, 80, 80, 80].map((h, i) => <Skeleton key={i} h={h} />)}
    </div>
  );

  const free  = summary.free_balance ?? 0;
  const bal   = summary.wallet_balance ?? 0;
  const bills = summary.committed_before_pay ?? 0;
  const save  = summary.envelope_per_cycle ?? 0;
  const days  = summary.days_to_pay;
  const nextA = summary.next_pay_amount ?? 0;
  const nextD = summary.next_pay_date;
  const cur   = summary.currency || "CAD";

  const freeColor = free > 500 ? D.green : free > 100 ? D.gold : D.red;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Free balance hero */}
      <div style={{ borderRadius: 22, padding: "28px 22px 24px",
        background: "linear-gradient(155deg,#0B1A15 0%,#060D0B 100%)",
        border: `1.5px solid ${freeColor}22`, textAlign: "center" }}>
        <p style={{ fontFamily: D.mono, fontSize: 10, color: D.sub, letterSpacing: "0.14em", margin: "0 0 16px", opacity: 0.8 }}>
          YOURS TO SPEND FREELY
        </p>
        <LiveBalance value={free} size={56} color={freeColor} />
        <p style={{ color: D.sub, fontSize: 12, margin: "10px 0 20px" }}>
          after committed bills and savings
        </p>
        <div style={{ height: 1, background: D.b0, margin: "0 -22px 20px" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          {[
            { l: "WALLET",     v: moneyShort(bal),   c: D.text  },
            { l: "BILLS DUE",  v: moneyShort(bills), c: D.red   },
            { l: "SAVING",     v: moneyShort(save),  c: D.violet},
          ].map(s => (
            <div key={s.l}>
              <p style={{ fontFamily: D.mono, fontSize: 9, color: D.faint, letterSpacing: "0.08em", margin: "0 0 4px" }}>{s.l}</p>
              <p style={{ fontFamily: D.mono, fontSize: 13, fontWeight: 700, color: s.c, margin: 0 }}>{s.v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Next paycheck */}
      {nextD && (
        <div style={{ borderRadius: 18, padding: "16px 18px",
          background: D.greenBg, border: `1px solid ${D.greenBr}`,
          display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: D.green + "18",
              border: `1px solid ${D.greenBr}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <I p={IC.income} size={20} c={D.green} />
            </div>
            <div>
              <p style={{ fontFamily: D.mono, fontSize: 10, color: D.green, letterSpacing: "0.1em", margin: "0 0 3px", opacity: 0.8 }}>NEXT PAYCHECK</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: D.text, margin: 0, fontVariantNumeric: "tabular-nums" }}>{money(nextA, cur)}</p>
              <p style={{ color: D.sub, fontSize: 11, margin: "2px 0 0" }}>{nextD}</p>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 44, fontWeight: 900, color: D.green, margin: 0, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{days}</p>
            <p style={{ color: D.sub, fontSize: 11, margin: "2px 0 0" }}>day{days !== 1 ? "s" : ""}</p>
          </div>
        </div>
      )}

      {/* Bills before payday */}
      {summary.bills_before_pay?.length > 0 && (
        <Card pad="0">
          <div style={{ padding: "13px 18px", borderBottom: `1px solid ${D.b0}` }}>
            <SectionTitle label="DUE BEFORE PAYDAY" />
          </div>
          {summary.bills_before_pay.map((b, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "14px 18px", borderBottom: i < summary.bills_before_pay.length - 1 ? `1px solid ${D.b0}` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: D.redBg,
                  border: `1px solid ${D.redBr}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <I p={IC.bills} size={18} c={D.red} />
                </div>
                <div>
                  <p style={{ color: D.text, fontSize: 14, fontWeight: 500, margin: 0 }}>{b.name}</p>
                  <p style={{ color: D.sub, fontSize: 11, margin: "1px 0 0", fontFamily: D.mono }}>{b.due}</p>
                </div>
              </div>
              <p style={{ fontFamily: D.mono, fontSize: 15, fontWeight: 700, color: D.red, margin: 0 }}>{moneyShort(b.amount)}</p>
            </div>
          ))}
        </Card>
      )}

      {/* Envelope progress */}
      {envelopes?.length > 0 && (
        <Card pad="0">
          <div style={{ padding: "13px 18px", borderBottom: `1px solid ${D.b0}` }}>
            <SectionTitle label="SAVINGS GOALS" />
          </div>
          {envelopes.map((e, i) => {
            const pct = Math.min(100, (e.saved / e.target_total) * 100);
            return (
              <div key={e.id} style={{ padding: "14px 18px", borderBottom: i < envelopes.length - 1 ? `1px solid ${D.b0}` : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 11, background: (e.color||D.violet)+"18",
                      border: `1px solid ${(e.color||D.violet)}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <I p={IC.target} size={16} c={e.color || D.violet} />
                    </div>
                    <p style={{ color: D.text, fontSize: 14, fontWeight: 500, margin: 0 }}>{e.name}</p>
                  </div>
                  <p style={{ fontFamily: D.mono, fontSize: 13, color: e.color || D.violet, margin: 0, fontWeight: 700 }}>{Math.round(pct)}%</p>
                </div>
                <Bar pct={pct} color={e.color || D.violet} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7 }}>
                  <p style={{ color: D.sub, fontSize: 11, margin: 0, fontFamily: D.mono }}>{moneyShort(e.saved)} saved</p>
                  <p style={{ color: D.sub, fontSize: 11, margin: 0, fontFamily: D.mono }}>goal {moneyShort(e.target_total)}</p>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {!nextD && !summary.bills_before_pay?.length && (
        <Empty icon={IC.home} title="Set up your finances"
          sub="Go to Bills to add your pay schedule and recurring expenses, then your free balance will calculate automatically." />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SEND TAB — real wallet send via /api/v1/wallet/send
// ══════════════════════════════════════════════════════════════════════════════
function SendTab({ wallet, onDone }) {
  const [step,     setStep]    = useState("amount");
  const [amount,   setAmount]  = useState("");
  const [merchant, setMerch]   = useState("");
  const [note,     setNote]    = useState("");
  const [sEmail,   setSEmail]  = useState("");
  const [rEmail,   setREmail]  = useState("");
  const [busy,     setBusy]    = useState(false);
  const [result,   setResult]  = useState(null);

  const QUICK = [10, 25, 50, 100, 250, 500];
  const amt   = parseFloat(amount) || 0;
  const bal   = Number(wallet?.balance || 0);

  const send = async () => {
    setBusy(true);
    try {
      const txn = await POST("/api/v1/wallet/send", {
        merchant: merchant || "Payment",
        amount: amt,
        currency: wallet?.currency || "CAD",
        method: "wallet",
        notes: note || undefined,
        sender_email:    sEmail || undefined,
        recipient_email: rEmail || undefined,
      });
      setResult({ ok: txn.status === "success", txn });
      setStep(txn.status === "success" ? "success" : "failed");
      if (txn.status === "success") onDone();
    } catch (e) {
      setResult({ ok: false, msg: e.message });
      setStep("failed");
    } finally { setBusy(false); }
  };

  const reset = () => {
    setStep("amount"); setAmount(""); setMerch(""); setNote("");
    setSEmail(""); setREmail(""); setResult(null);
  };

  return (
    <AnimatePresence mode="wait">
      {step === "amount" && (
        <motion.div key="a" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
          style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ textAlign: "center", paddingTop: 8 }}>
            <p style={{ fontFamily: D.mono, fontSize: 10, color: D.sub, letterSpacing: "0.12em", margin: "0 0 20px" }}>SEND MONEY</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <span style={{ fontSize: 24, color: D.sub, fontWeight: 300 }}>$</span>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                style={{ background: "none", border: "none", outline: "none", fontSize: 60,
                  fontWeight: 800, color: D.text, width: 220, textAlign: "center",
                  fontFamily: D.mono, letterSpacing: "-1px" }} />
            </div>
            <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${D.gold}55,transparent)`, margin: "10px auto", maxWidth: 240 }} />
            <p style={{ fontSize: 12, color: amt > bal ? D.red : D.sub, margin: "6px 0 0", fontFamily: D.mono }}>
              Wallet: {moneyShort(bal)} available
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {QUICK.map(q => (
              <motion.button key={q} whileTap={{ scale: 0.92 }} onClick={() => setAmount(String(q))}
                style={{ padding: "7px 14px", borderRadius: 20,
                  background: amount === String(q) ? D.gold + "18" : D.s2,
                  border: `1px solid ${amount === String(q) ? D.goldBr : D.b0}`,
                  color: amount === String(q) ? D.gold : D.sub,
                  fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                ${q}
              </motion.button>
            ))}
          </div>
          <Btn onClick={() => amt > 0 && setStep("details")} disabled={amt <= 0} color={D.gold}>
            Continue <I p={IC.arrow} size={16} c="#000" />
          </Btn>
        </motion.div>
      )}

      {step === "details" && (
        <motion.div key="d" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setStep("amount")}
              style={{ width: 36, height: 36, borderRadius: "50%", background: D.s2,
                border: `1px solid ${D.b0}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <I p={IC.back} size={16} c={D.sub} />
            </motion.button>
            <p style={{ fontFamily: D.mono, fontSize: 10, color: D.sub, letterSpacing: "0.12em", margin: 0 }}>PAYMENT DETAILS</p>
          </div>
          <Field value={merchant} onChange={e => setMerch(e.target.value)} placeholder="Who are you paying?" />
          <Field value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note (optional)" />
          <Field value={sEmail} onChange={e => setSEmail(e.target.value)} placeholder="Your email for receipt (optional)" type="email" />
          <Field value={rEmail} onChange={e => setREmail(e.target.value)} placeholder="Recipient email to notify (optional)" type="email" />
          <div style={{ borderRadius: 14, background: D.s2, border: `1px solid ${D.b0}`, padding: "14px 16px", marginTop: 4 }}>
            <Row label="Amount" value={moneyShort(amt)} color={D.gold} />
            <Row label="From" value="NovaPay Wallet" border={false} />
          </div>
          <Btn onClick={() => merchant.trim() && setStep("confirm")} disabled={!merchant.trim()} color={D.gold}>
            Review <I p={IC.arrow} size={16} c="#000" />
          </Btn>
        </motion.div>
      )}

      {step === "confirm" && (
        <motion.div key="c" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setStep("details")}
              style={{ width: 36, height: 36, borderRadius: "50%", background: D.s2,
                border: `1px solid ${D.b0}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <I p={IC.back} size={16} c={D.sub} />
            </motion.button>
            <p style={{ fontFamily: D.mono, fontSize: 10, color: D.sub, letterSpacing: "0.12em", margin: 0 }}>CONFIRM PAYMENT</p>
          </div>
          <Card>
            <div style={{ textAlign: "center", padding: "12px 0 16px", borderBottom: `1px solid ${D.b0}`, marginBottom: 4 }}>
              <p style={{ fontFamily: D.mono, fontSize: 9, color: D.sub, letterSpacing: "0.1em", margin: "0 0 6px" }}>SENDING</p>
              <p style={{ fontSize: 40, fontWeight: 900, color: D.gold, margin: 0, fontFamily: D.mono }}>{moneyShort(amt)}</p>
            </div>
            <Row label="To" value={merchant} />
            <Row label="Method" value="Wallet Balance" />
            {note && <Row label="Note" value={note} />}
            {sEmail && <Row label="Your email" value={sEmail} />}
            {rEmail && <Row label="Notify" value={rEmail} border={false} />}
          </Card>
          {amt > bal && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px",
              borderRadius: 12, background: D.redBg, border: `1px solid ${D.redBr}` }}>
              <I p={IC.alert} size={14} c={D.red} />
              <span style={{ fontSize: 12, color: D.red }}>This exceeds your wallet balance — payment will be declined.</span>
            </div>
          )}
          <Btn onClick={send} loading={busy} color={D.gold}>
            <I p={IC.send} size={16} c="#000" /> Confirm & Send
          </Btn>
        </motion.div>
      )}

      {step === "success" && (
        <motion.div key="s" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "28px 0" }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.08 }}
            style={{ width: 72, height: 72, borderRadius: "50%", background: D.greenBg,
              border: `2px solid ${D.greenBr}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <I p={IC.check} size={30} c={D.green} sw={2.5} />
          </motion.div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: D.text, margin: "0 0 6px" }}>Payment Sent</p>
            <p style={{ fontSize: 32, fontWeight: 900, color: D.green, fontFamily: D.mono, margin: "0 0 6px" }}>{moneyShort(amt)}</p>
            <p style={{ color: D.sub, fontSize: 13, margin: 0 }}>to {merchant}</p>
          </div>
          {result?.txn?.id && (
            <Card style={{ textAlign: "center", width: "100%" }}>
              <p style={{ fontFamily: D.mono, fontSize: 9, color: D.sub, letterSpacing: "0.1em", margin: "0 0 4px" }}>TRANSACTION ID</p>
              <p style={{ fontFamily: D.mono, fontSize: 11, color: D.gold, margin: 0 }}>{result.txn.id}</p>
            </Card>
          )}
          <Btn onClick={reset} color={D.gold}>New Payment</Btn>
        </motion.div>
      )}

      {step === "failed" && (
        <motion.div key="f" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "28px 0" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: D.redBg,
            border: `2px solid ${D.redBr}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <I p={IC.alert} size={30} c={D.red} />
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: D.text, margin: "0 0 8px" }}>Payment Declined</p>
            <p style={{ color: D.sub, fontSize: 13, margin: 0 }}>
              {result?.msg || (result?.txn?.decline_reason === "insufficient_funds"
                ? "Your wallet balance is too low. Top up and try again."
                : "The payment could not be completed.")}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, width: "100%" }}>
            <Btn onClick={() => setStep("confirm")} color={D.gold} ghost>Try Again</Btn>
            <Btn onClick={reset} color={D.gold}>New Payment</Btn>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// REQUEST TAB — real /api/v1/wallet/request
// ══════════════════════════════════════════════════════════════════════════════
function RequestTab({ wallet, onDone }) {
  const [amount,  setAmount]  = useState("");
  const [from,    setFrom]    = useState("");
  const [note,    setNote]    = useState("");
  const [nEmail,  setNEmail]  = useState("");
  const [rEmail,  setREmail]  = useState("");
  const [busy,    setBusy]    = useState(false);
  const [done,    setDone]    = useState(false);
  const [err,     setErr]     = useState("");

  const amt = parseFloat(amount) || 0;

  const send = async () => {
    if (!from.trim() || amt <= 0) { setErr("Enter an amount and who to request from."); return; }
    setBusy(true); setErr("");
    try {
      await POST("/api/v1/wallet/request", {
        from: from.trim(), amount: amt,
        currency: wallet?.currency || "CAD",
        notes: note || undefined,
        notify_email:    nEmail || undefined,
        requester_email: rEmail || undefined,
      });
      setDone(true); onDone();
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  if (done) return (
    <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "28px 0" }}>
      <div style={{ width: 72, height: 72, borderRadius: "50%", background: D.blueBg,
        border: `2px solid ${D.blueBr}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <I p={IC.check} size={30} c={D.blue} sw={2.5} />
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 22, fontWeight: 800, color: D.text, margin: "0 0 6px" }}>Request Sent</p>
        <p style={{ fontSize: 28, fontWeight: 800, color: D.blue, fontFamily: D.mono, margin: "0 0 6px" }}>{moneyShort(amt)}</p>
        <p style={{ color: D.sub, fontSize: 13, margin: 0 }}>from {from}</p>
      </div>
      <Btn onClick={() => { setDone(false); setAmount(""); setFrom(""); setNote(""); setNEmail(""); setREmail(""); }} color={D.blue}>
        New Request
      </Btn>
    </motion.div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
        <p style={{ fontFamily: D.mono, fontSize: 10, color: D.sub, letterSpacing: "0.12em", margin: "0 0 20px" }}>REQUEST MONEY</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <span style={{ fontSize: 24, color: D.sub, fontWeight: 300 }}>$</span>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
            style={{ background: "none", border: "none", outline: "none", fontSize: 56,
              fontWeight: 800, color: D.text, width: 200, textAlign: "center", fontFamily: D.mono }} />
        </div>
        <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${D.blue}55,transparent)`, margin: "10px auto", maxWidth: 240 }} />
      </div>
      <Field value={from} onChange={e => setFrom(e.target.value)} placeholder="Request from (name or @handle)" />
      <Field value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note (optional)" />
      <Field value={nEmail} onChange={e => setNEmail(e.target.value)} placeholder="Their email to notify (optional)" type="email" />
      <Field value={rEmail} onChange={e => setREmail(e.target.value)} placeholder="Your email to confirm (optional)" type="email" />
      {err && <p style={{ color: D.red, fontSize: 13, margin: 0 }}>{err}</p>}
      <Btn onClick={send} loading={busy} disabled={amt <= 0 || !from.trim()} color={D.blue}>
        <I p={IC.request} size={16} c="#fff" /> Send Request
      </Btn>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// HISTORY TAB — real ledger from /api/v1/transactions
// ══════════════════════════════════════════════════════════════════════════════
function HistoryTab({ refreshKey }) {
  const [txns,    setTxns]    = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await GET("/api/v1/transactions");
      setTxns(Array.isArray(d) ? d : d?.items ?? []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  const totalSpent = txns.filter(t => t.status === "success" && (t.direction === "debit" || !t.direction))
    .reduce((s, t) => s + Number(t.amount), 0);

  const totalIn = txns.filter(t => t.status === "success" && t.direction === "credit")
    .reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <SectionTitle label="TRANSACTION HISTORY" right={
        <motion.button whileTap={{ scale: 0.9 }} onClick={load}
          style={{ width: 32, height: 32, borderRadius: "50%", background: D.s2, border: `1px solid ${D.b0}`,
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <I p={IC.refresh} size={14} c={D.sub} />
        </motion.button>
      } />

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Card>
          <p style={{ fontFamily: D.mono, fontSize: 9, color: D.faint, letterSpacing: "0.1em", margin: "0 0 6px" }}>TOTAL OUT</p>
          <p style={{ fontFamily: D.mono, fontSize: 18, fontWeight: 800, color: D.red, margin: 0 }}>{moneyShort(totalSpent)}</p>
        </Card>
        <Card>
          <p style={{ fontFamily: D.mono, fontSize: 9, color: D.faint, letterSpacing: "0.1em", margin: "0 0 6px" }}>TOTAL IN</p>
          <p style={{ fontFamily: D.mono, fontSize: 18, fontWeight: 800, color: D.green, margin: 0 }}>{moneyShort(totalIn)}</p>
        </Card>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[1,2,3,4].map(i => <Skeleton key={i} h={68} />)}
        </div>
      ) : txns.length === 0 ? (
        <Empty icon={IC.history} title="No transactions yet"
          sub="Send money or top up your wallet to see transactions here." />
      ) : (
        <Card pad="0">
          {txns.map((t, i) => {
            const isIn  = t.direction === "credit";
            const ok    = t.status === "success";
            const fail  = t.status === "failed";
            const pend  = t.status === "pending";
            const color = fail ? D.red : pend ? D.gold : isIn ? D.green : D.text;
            const bgC   = fail ? D.redBg : pend ? D.goldBg : isIn ? D.greenBg : D.s3;
            const brC   = fail ? D.redBr : pend ? D.goldBr : isIn ? D.greenBr : D.b0;
            return (
              <motion.div key={t.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
                  borderBottom: i < txns.length - 1 ? `1px solid ${D.b0}` : "none" }}>
                <div style={{ width: 42, height: 42, borderRadius: 13, background: bgC,
                  border: `1px solid ${brC}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <I p={fail ? IC.alert : isIn ? IC.income : IC.send} size={18} c={color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: D.text, fontSize: 14, fontWeight: 500, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.merchant}</p>
                  <p style={{ color: D.sub, fontSize: 11, margin: "2px 0 0", fontFamily: D.mono }}>
                    {t.created_at?.slice(0,10)} · {(t.method||"wallet").toUpperCase()}
                    {t.decline_reason ? ` · ${t.decline_reason.replace(/_/g," ")}` : ""}
                  </p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontFamily: D.mono, fontSize: 14, fontWeight: 700, color, margin: "0 0 3px" }}>
                    {isIn && ok ? "+" : fail ? "–" : ""}{moneyShort(t.amount)}
                  </p>
                  <Pill label={fail ? "DECLINED" : pend ? "PENDING" : "DONE"}
                    color={fail ? D.red : pend ? D.gold : D.green} />
                </div>
              </motion.div>
            );
          })}
        </Card>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// BILLS TAB — pay schedule + recurring bills via /api/v1/finance
// ══════════════════════════════════════════════════════════════════════════════
function BillsTab({ bills, schedules, onRefresh }) {
  const [addBill,  setAddBill]  = useState(false);
  const [addPay,   setAddPay]   = useState(false);
  const [bf,       setBf]       = useState({ name:"", amount:"", due_day:"", category:"other" });
  const [pf,       setPf]       = useState({ label:"Main Job", amount:"", frequency:"biweekly", next_pay_date:"" });
  const [busy,     setBusy]     = useState(false);
  const [err,      setErr]      = useState("");

  const CATS = [
    { id:"rent",label:"Rent / Mortgage"},{ id:"utilities",label:"Utilities"},
    { id:"phone",label:"Phone"},{ id:"subscription",label:"Subscription"},
    { id:"insurance",label:"Insurance"},{ id:"transport",label:"Transport"},
    { id:"groceries",label:"Groceries"},{ id:"other",label:"Other"},
  ];

  const saveBill = async () => {
    if (!bf.name || !bf.amount || !bf.due_day) { setErr("Fill in all fields."); return; }
    setBusy(true); setErr("");
    try {
      await POST("/api/v1/finance/bills", { ...bf, amount: parseFloat(bf.amount), due_day: parseInt(bf.due_day) });
      setBf({ name:"", amount:"", due_day:"", category:"other" });
      setAddBill(false); onRefresh();
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const savePay = async () => {
    if (!pf.amount || !pf.next_pay_date) { setErr("Fill in all fields."); return; }
    setBusy(true); setErr("");
    try {
      await POST("/api/v1/finance/schedules", { ...pf, amount: parseFloat(pf.amount) });
      setPf({ label:"Main Job", amount:"", frequency:"biweekly", next_pay_date:"" });
      setAddPay(false); onRefresh();
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const FormBox = ({ title, onSave, onCancel, children }) => (
    <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:12 }}
      style={{ borderRadius:18, background:D.s2, border:`1.5px solid ${D.b1}`, padding:18, marginBottom:4 }}>
      <p style={{ fontFamily:D.mono, fontSize:10, color:D.gold, letterSpacing:"0.1em", margin:"0 0 14px" }}>{title}</p>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {children}
        {err && <p style={{ color:D.red, fontSize:12, margin:0 }}>{err}</p>}
        <div style={{ display:"flex", gap:10 }}>
          <Btn onClick={onSave} loading={busy} color={D.gold}>Save</Btn>
          <Btn onClick={onCancel} ghost color={D.gold}>Cancel</Btn>
        </div>
      </div>
    </motion.div>
  );

  const ListItem = ({ icon, title, sub, value, color, onRemove }) => (
    <div style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 18px",
      borderBottom:`1px solid ${D.b0}` }}>
      <div style={{ width:42, height:42, borderRadius:13, background:color+"14",
        border:`1px solid ${color}28`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <I p={icon} size={18} c={color} />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ color:D.text, fontSize:14, fontWeight:500, margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{title}</p>
        <p style={{ color:D.sub, fontSize:11, margin:"2px 0 0", fontFamily:D.mono }}>{sub}</p>
      </div>
      <div style={{ textAlign:"right", flexShrink:0 }}>
        <p style={{ fontFamily:D.mono, fontSize:14, fontWeight:700, color, margin:"0 0 4px" }}>{value}</p>
        <button onClick={onRemove} style={{ background:"none", border:"none", color:D.faint,
          fontSize:11, cursor:"pointer", padding:0, fontFamily:D.sans }}>Remove</button>
      </div>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>

      <SectionTitle label="INCOME SCHEDULE" right={
        <SmallBtn onClick={() => { setAddPay(v => !v); setAddBill(false); setErr(""); }}>
          <I p={IC.plus} size={12} c={D.gold} /> Add
        </SmallBtn>
      } />
      <AnimatePresence>
        {addPay && (
          <FormBox title="ADD INCOME SOURCE" onSave={savePay} onCancel={() => setAddPay(false)}>
            <Field value={pf.label} onChange={e => setPf(p=>({...p,label:e.target.value}))} placeholder="Label e.g. Main Job" />
            <Field value={pf.amount} onChange={e => setPf(p=>({...p,amount:e.target.value}))} placeholder="Net pay amount" type="number" />
            <Field value={pf.next_pay_date} onChange={e => setPf(p=>({...p,next_pay_date:e.target.value}))} placeholder="Next pay date" type="date" />
            <Sel value={pf.frequency} onChange={e => setPf(p=>({...p,frequency:e.target.value}))}>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Every 2 weeks</option>
              <option value="semimonthly">Twice a month</option>
              <option value="monthly">Monthly</option>
            </Sel>
          </FormBox>
        )}
      </AnimatePresence>

      <Card pad="0" style={{ marginBottom:16 }}>
        {schedules?.length === 0 && !addPay ? (
          <div style={{ padding:"20px 18px", textAlign:"center" }}>
            <p style={{ color:D.sub, fontSize:13, margin:0 }}>No income schedule — tap Add to set up your pay cycle</p>
          </div>
        ) : schedules?.map((s, i) => (
          <ListItem key={s.id} icon={IC.income} title={s.label}
            sub={`${s.frequency} · next ${s.next_pay_date}`}
            value={moneyShort(s.amount)} color={D.green}
            onRemove={() => DELETE(`/api/v1/finance/schedules/${s.id}`).then(onRefresh)} />
        ))}
      </Card>

      <SectionTitle label="RECURRING BILLS" right={
        <SmallBtn onClick={() => { setAddBill(v => !v); setAddPay(false); setErr(""); }}>
          <I p={IC.plus} size={12} c={D.red} /> Add
        </SmallBtn>
      } />
      <AnimatePresence>
        {addBill && (
          <FormBox title="ADD RECURRING BILL" onSave={saveBill} onCancel={() => setAddBill(false)}>
            <Field value={bf.name} onChange={e => setBf(p=>({...p,name:e.target.value}))} placeholder="Bill name e.g. Rent" />
            <Field value={bf.amount} onChange={e => setBf(p=>({...p,amount:e.target.value}))} placeholder="Amount" type="number" />
            <Field value={bf.due_day} onChange={e => setBf(p=>({...p,due_day:e.target.value}))} placeholder="Day of month due (1–31)" type="number" />
            <Sel value={bf.category} onChange={e => setBf(p=>({...p,category:e.target.value}))}>
              {CATS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </Sel>
          </FormBox>
        )}
      </AnimatePresence>

      <Card pad="0">
        {bills?.length === 0 && !addBill ? (
          <div style={{ padding:"20px 18px", textAlign:"center" }}>
            <p style={{ color:D.sub, fontSize:13, margin:0 }}>No bills yet — add rent, phone, subscriptions</p>
          </div>
        ) : bills?.map((b, i) => (
          <ListItem key={b.id} icon={IC.bills} title={b.name}
            sub={`Due ${b.due_day}${["st","nd","rd"][b.due_day-1]||"th"} · ${b.category}`}
            value={moneyShort(b.amount)} color={D.red}
            onRemove={() => DELETE(`/api/v1/finance/bills/${b.id}`).then(onRefresh)} />
        ))}
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ENVELOPES TAB — savings goals
// ══════════════════════════════════════════════════════════════════════════════
function EnvelopesTab({ envelopes, onRefresh }) {
  const [showAdd,  setShowAdd]  = useState(false);
  const [contrib,  setContrib]  = useState(null);
  const [cAmt,     setCAmt]     = useState("");
  const [form,     setForm]     = useState({ name:"", target_total:"", per_cycle:"", color:"#9B8CFF" });
  const [busy,     setBusy]     = useState(false);
  const [err,      setErr]      = useState("");

  const PALETTE = ["#9B8CFF","#4A8FE8","#2BC76E","#F59E0B","#E84545","#EC4899"];

  const save = async () => {
    if (!form.name || !form.target_total || !form.per_cycle) { setErr("Fill in all fields."); return; }
    setBusy(true); setErr("");
    try {
      await POST("/api/v1/finance/envelopes", { ...form, target_total:parseFloat(form.target_total), per_cycle:parseFloat(form.per_cycle) });
      setForm({ name:"", target_total:"", per_cycle:"", color:"#9B8CFF" });
      setShowAdd(false); onRefresh();
    } catch(e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const contribute = async (id) => {
    if (!cAmt || parseFloat(cAmt) <= 0) return;
    await POST(`/api/v1/finance/envelopes/${id}/contribute`, { amount:parseFloat(cAmt) });
    setContrib(null); setCAmt(""); onRefresh();
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <SectionTitle label="SAVINGS ENVELOPES" right={
        <SmallBtn onClick={() => setShowAdd(v=>!v)}>
          <I p={IC.plus} size={12} c={D.violet} /> New Goal
        </SmallBtn>
      } />

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:12 }}
            style={{ borderRadius:18, background:D.s2, border:`1.5px solid ${D.b1}`, padding:18 }}>
            <p style={{ fontFamily:D.mono, fontSize:10, color:D.violet, letterSpacing:"0.1em", margin:"0 0 14px" }}>NEW SAVINGS GOAL</p>
            <div style={{ display:"flex", gap:8, marginBottom:12 }}>
              {PALETTE.map(c => (
                <button key={c} onClick={() => setForm(f=>({...f,color:c}))}
                  style={{ width:28, height:28, borderRadius:"50%", background:c, border:`3px solid ${form.color===c?"#fff":"transparent"}`, cursor:"pointer" }} />
              ))}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <Field value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="Goal name" />
              <Field value={form.target_total} onChange={e => setForm(f=>({...f,target_total:e.target.value}))} placeholder="Target amount" type="number" />
              <Field value={form.per_cycle} onChange={e => setForm(f=>({...f,per_cycle:e.target.value}))} placeholder="Save per pay cycle" type="number" />
              {err && <p style={{ color:D.red, fontSize:12, margin:0 }}>{err}</p>}
              <div style={{ display:"flex", gap:10 }}>
                <Btn onClick={save} loading={busy} color={form.color}>Create Goal</Btn>
                <Btn onClick={() => setShowAdd(false)} ghost color={D.sub}>Cancel</Btn>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {envelopes?.length === 0 && !showAdd ? (
        <Empty icon={IC.envelope} title="No savings goals yet"
          sub="Create envelopes for rent savings, emergency fund, travel — anything you're working toward." />
      ) : envelopes?.map(e => {
        const pct = Math.min(100, (e.saved / e.target_total) * 100);
        const isC = contrib === e.id;
        const color = e.color || D.violet;
        return (
          <Card key={e.id} pad="0">
            <div style={{ padding:"16px 18px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:14 }}>
                <div style={{ width:48, height:48, borderRadius:15, background:color+"16",
                  border:`1.5px solid ${color}30`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <I p={IC.target} size={22} c={color} />
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ color:D.text, fontSize:15, fontWeight:600, margin:0 }}>{e.name}</p>
                  <p style={{ color, fontSize:11, margin:"2px 0 0", fontFamily:D.mono }}>{moneyShort(e.per_cycle)} / cycle</p>
                </div>
                <div style={{ textAlign:"right" }}>
                  <p style={{ fontFamily:D.mono, fontSize:15, fontWeight:800, color, margin:"0 0 3px" }}>{Math.round(pct)}%</p>
                  <button onClick={() => DELETE(`/api/v1/finance/envelopes/${e.id}`).then(onRefresh)}
                    style={{ background:"none", border:"none", color:D.faint, fontSize:11, cursor:"pointer", fontFamily:D.sans }}>Remove</button>
                </div>
              </div>
              <Bar pct={pct} color={color} />
              <div style={{ display:"flex", justifyContent:"space-between", margin:"8px 0 14px" }}>
                <p style={{ fontFamily:D.mono, fontSize:12, color:D.sub, margin:0 }}>{moneyShort(e.saved)} saved</p>
                <p style={{ fontFamily:D.mono, fontSize:12, color:D.sub, margin:0 }}>goal {moneyShort(e.target_total)}</p>
              </div>
              {isC ? (
                <div style={{ display:"flex", gap:10 }}>
                  <Field value={cAmt} onChange={ev => setCAmt(ev.target.value)} placeholder="Amount" type="number" autoFocus />
                  <SmallBtn onClick={() => contribute(e.id)} color={color}>Add</SmallBtn>
                  <SmallBtn onClick={() => { setContrib(null); setCAmt(""); }} color={D.sub}>✕</SmallBtn>
                </div>
              ) : (
                <SmallBtn onClick={() => setContrib(e.id)} color={color}>
                  <I p={IC.plus} size={12} c={color} /> Contribute
                </SmallBtn>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CARD TAB — virtual NovaPay card
// ══════════════════════════════════════════════════════════════════════════════
function CardTab({ card, summary, onRefresh }) {
  const [flipped,   setFlipped]  = useState(false);
  const [showSpend, setShowSpend]= useState(false);
  const [merchant,  setMerch]    = useState("");
  const [amount,    setAmt]      = useState("");
  const [busy,      setBusy]     = useState(false);
  const [toast,     setToast]    = useState(null);
  const [err,       setErr]      = useState("");

  const spend = async () => {
    if (!merchant.trim() || !parseFloat(amount)) { setErr("Fill in both fields."); return; }
    setBusy(true); setErr("");
    try {
      await POST(`/api/v1/finance/card/${card.id}/spend`, { merchant, amount: parseFloat(amount) });
      setToast(`${moneyShort(parseFloat(amount))} logged at ${merchant}`);
      setMerch(""); setAmt(""); setShowSpend(false); onRefresh();
      setTimeout(() => setToast(null), 3200);
    } catch(e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  if (!card) return <div style={{ display:"flex", flexDirection:"column", gap:12 }}><Skeleton h={200}/><Skeleton h={50}/><Skeleton h={50}/></div>;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
            style={{ position:"fixed", top:72, left:"50%", transform:"translateX(-50%)", zIndex:300,
              background:D.greenBg, border:`1px solid ${D.greenBr}`, borderRadius:14,
              padding:"12px 20px", color:D.green, fontWeight:700, fontSize:13,
              whiteSpace:"nowrap", boxShadow:"0 8px 32px rgba(0,0,0,0.4)" }}>
            <I p={IC.check} size={14} c={D.green} /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <NovaCardDisplay card={card} freeBalance={summary?.free_balance} flipped={flipped} onFlip={() => setFlipped(f=>!f)} />
      <p style={{ fontFamily:D.mono, fontSize:10, color:D.faint, textAlign:"center" }}>Tap to flip · CVV on back</p>

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        <Btn onClick={() => { setShowSpend(v=>!v); setErr(""); }} color={D.gold}>
          <I p={IC.card} size={16} c="#000" /> Log a Spend
        </Btn>
        <Btn onClick={() => POST(`/api/v1/finance/card/${card.id}/freeze`,{}).then(onRefresh)}
          color={card.is_frozen ? D.green : D.red} ghost>
          <I p={IC.freeze} size={16} c={card.is_frozen ? D.green : D.red} />
          {card.is_frozen ? "Unfreeze Card" : "Freeze Card"}
        </Btn>
      </div>

      <AnimatePresence>
        {showSpend && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }} style={{ overflow:"hidden" }}>
            <Card>
              <p style={{ fontFamily:D.mono, fontSize:10, color:D.gold, letterSpacing:"0.1em", margin:"0 0 14px" }}>LOG SPEND — DEDUCTS FROM FREE BALANCE</p>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <Field value={merchant} onChange={e => setMerch(e.target.value)} placeholder="Merchant / where you spent" />
                <Field value={amount} onChange={e => setAmt(e.target.value)} placeholder="Amount" type="number" />
                {err && <p style={{ color:D.red, fontSize:12, margin:0 }}>{err}</p>}
                <Btn onClick={spend} loading={busy} color={D.gold}>Confirm Spend</Btn>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card pad="0">
        <Row label="Card number" value={`···· ${card.last4 || card.number?.slice(-4) || "0000"}`} />
        <Row label="Spent today" value={moneyShort(card.spent_today)} color={Number(card.spent_today) > 0 ? D.red : D.sub} />
        <Row label="Free balance" value={moneyShort(summary?.free_balance || 0)} color={D.green} />
        <Row label="Status" value={card.is_frozen ? "FROZEN" : "ACTIVE"} color={card.is_frozen ? D.sub : D.green} border={false} />
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
const Fintech = ({ onClose }) => {
  const [tab,       setTab]      = useState("home");
  const [wallet,    setWallet]   = useState(null);
  const [summary,   setSummary]  = useState(null);
  const [timeline,  setTimeline] = useState(null);
  const [bills,     setBills]    = useState([]);
  const [schedules, setScheds]   = useState([]);
  const [envelopes, setEnvs]     = useState([]);
  const [card,      setCard]     = useState(null);
  const [loading,   setLoading]  = useState(true);
  const [error,     setError]    = useState(null);
  const [histKey,   setHistKey]  = useState(0);
  const w = useWidth();
  const compact = w < 480;

  const load = useCallback(async () => {
    try {
      const [wa, su, tl, bl, sc, en, cd] = await Promise.all([
        GET("/api/v1/wallet"),
        GET("/api/v1/finance/summary"),
        GET("/api/v1/finance/timeline"),
        GET("/api/v1/finance/bills"),
        GET("/api/v1/finance/schedules"),
        GET("/api/v1/finance/envelopes"),
        GET("/api/v1/finance/card"),
      ]);
      setWallet(wa); setSummary(su); setTimeline(tl);
      setBills(bl); setScheds(sc); setEnvs(en); setCard(cd);
      setError(null);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onDone = () => { load(); setHistKey(k => k + 1); };

  const TABS = [
    { id:"home",      icon:IC.home,     label:"Home"     },
    { id:"send",      icon:IC.send,     label:"Send"     },
    { id:"request",   icon:IC.request,  label:"Request"  },
    { id:"history",   icon:IC.history,  label:"History"  },
    { id:"bills",     icon:IC.bills,    label:"Bills"    },
    { id:"envelopes", icon:IC.envelope, label:"Goals"    },
    { id:"card",      icon:IC.card,     label:"Card"     },
  ];

  const free = summary?.free_balance ?? 0;
  const bal  = wallet?.balance ?? 0;

  return (
    <>
      <style>{`
        @keyframes nova-spin  { to { transform: rotate(360deg); } }
        @keyframes nova-pulse { 0%,100%{opacity:.35} 50%{opacity:.7} }
        * { -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        style={{ position:"fixed", inset:0, bottom:"var(--taskbar-height,52px)", zIndex:50,
          background:D.bg, fontFamily:D.sans, display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <div style={{ flexShrink:0, display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:`13px ${compact?14:20}px`, background:D.s1, borderBottom:`1px solid ${D.b0}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:11, background:D.goldBg,
              border:`1px solid ${D.goldBr}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <I p={IC.coin} size={18} c={D.gold} />
            </div>
            <div>
              <p style={{ fontSize:15, fontWeight:800, color:D.text, margin:0, letterSpacing:"-0.01em" }}>NovaPay</p>
              <p style={{ fontSize:9, color:D.gold, margin:0, fontFamily:D.mono, letterSpacing:"0.1em", opacity:0.85 }}>FINANCE OS</p>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            {summary && !loading && (
              <div style={{ textAlign:"right" }}>
                <p style={{ fontFamily:D.mono, fontSize:9, color:D.faint, letterSpacing:"0.08em", margin:"0 0 1px" }}>FREE BALANCE</p>
                <p style={{ fontFamily:D.mono, fontSize:16, fontWeight:800, margin:0,
                  color: free > 500 ? D.green : free > 100 ? D.gold : D.red }}>
                  {moneyShort(free)}
                </p>
              </div>
            )}
            <motion.button whileTap={{ scale:0.88 }} onClick={onClose}
              style={{ width:36, height:36, borderRadius:"50%", background:D.s3, border:`1px solid ${D.b0}`,
                display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
              <I p={IC.close} size={15} c={D.sub} />
            </motion.button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ flexShrink:0, padding:"9px 18px", background:D.redBg,
            borderBottom:`1px solid ${D.redBr}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <p style={{ color:D.red, fontSize:12, margin:0 }}>{error}</p>
            <button onClick={load} style={{ background:"none", border:"none", color:D.red,
              fontSize:12, cursor:"pointer", textDecoration:"underline" }}>Retry</button>
          </div>
        )}

        {/* ── CONTENT ────────────────────────────────────────────────────── */}
        <div style={{ flex:1, overflowY:"auto", padding:`18px ${compact?14:20}px 24px`,
          WebkitOverflowScrolling:"touch" }}>
          <div style={{ maxWidth:540, margin:"0 auto" }}>
            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                exit={{ opacity:0, y:-10 }} transition={{ duration:0.14 }}>
                {tab === "home"      && <HomeTab summary={summary} envelopes={envelopes} wallet={wallet} />}
                {tab === "send"      && <SendTab wallet={wallet} onDone={onDone} />}
                {tab === "request"   && <RequestTab wallet={wallet} onDone={onDone} />}
                {tab === "history"   && <HistoryTab refreshKey={histKey} />}
                {tab === "bills"     && <BillsTab bills={bills} schedules={schedules} onRefresh={load} />}
                {tab === "envelopes" && <EnvelopesTab envelopes={envelopes} onRefresh={load} />}
                {tab === "card"      && <CardTab card={card} summary={summary} onRefresh={load} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── BOTTOM NAV ─────────────────────────────────────────────────── */}
        <div style={{ flexShrink:0, display:"flex", background:D.s1,
          borderTop:`1px solid ${D.b0}`, paddingBottom:"env(safe-area-inset-bottom,0px)" }}>
          {TABS.map(t => {
            const active = tab === t.id;
            return (
              <motion.button key={t.id} whileTap={{ scale:0.85 }} onClick={() => setTab(t.id)}
                style={{ flex:1, padding:"11px 2px 13px", minHeight:54,
                  display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4,
                  background:"none", border:"none", cursor:"pointer", position:"relative" }}>
                {active && (
                  <motion.div layoutId="nav-line"
                    style={{ position:"absolute", top:0, left:"15%", right:"15%",
                      height:2, borderRadius:1, background:D.gold }} />
                )}
                <I p={t.icon} size={compact?18:17} c={active ? D.gold : D.faint} sw={active ? 2 : 1.5} />
                {!compact && (
                  <span style={{ fontSize:9, fontWeight:active?700:500, color:active?D.gold:D.faint,
                    fontFamily:D.mono, letterSpacing:"0.04em" }}>
                    {t.label.toUpperCase()}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </>
  );
};

export default Fintech;