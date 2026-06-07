"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useSpring, useMotionValue } from "framer-motion";
import { transactionsAPI } from "../../lib/api";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:       "#070A12",
  surface:  "#0D1220",
  card:     "#111827",
  border:   "rgba(255,255,255,0.07)",
  gold:     "#C9A84C",
  goldLight:"#E8C97A",
  blue:     "#3B7CFF",
  green:    "#22C55E",
  red:      "#EF4444",
  muted:    "rgba(255,255,255,0.35)",
  sub:      "rgba(255,255,255,0.18)",
};

// ─── Icons (inline SVG — no extra deps) ──────────────────────────────────────
const Ico = ({ d, size = 18, color = "currentColor", fill = "none", sw = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p,i)=><path key={i} d={p}/>) : <path d={d}/>}
  </svg>
);

const ICONS = {
  close:   "M18 6 6 18M6 6l12 12",
  send:    "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
  receive: "M12 2v20M2 12h20",
  history: "M3 12a9 9 0 1 0 18 0A9 9 0 0 0 3 12zm9-4v4l3 3",
  card:    "M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7zm0 4h20",
  nfc:     ["M6 8.5A6.5 6.5 0 0 1 12 2","M6 12a6 6 0 0 1 6-6","M6 15.5A9.5 9.5 0 0 1 12 6","M6 19A13 13 0 0 1 12 6"],
  check:   "M20 6 9 17l-5-5",
  error:   "M12 2a10 10 0 1 1 0 20A10 10 0 0 1 12 2zm0 6v4m0 4h.01",
  wifi:    ["M5 12.55a11 11 0 0 1 14.08 0","M1.42 9a16 16 0 0 1 21.16 0","M8.53 16.11a6 6 0 0 1 6.95 0","M12 20h.01"],
  arrow:   "M5 12h14M12 5l7 7-7 7",
  plus:    "M12 5v14M5 12h14",
  trash:   "M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6",
  eye:     "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zm11-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  refresh: "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  lock:    "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zm-7 4v3M7 11V7a5 5 0 0 1 10 0v4",
};

// ─── Quick-amount chips ────────────────────────────────────────────────────────
const QUICK = [10, 25, 50, 100, 250];

// ─── Merchants ────────────────────────────────────────────────────────────────
const MERCHANTS = [
  { name: "Tim Hortons",  emoji: "☕", category: "Food" },
  { name: "Shopify",      emoji: "🛍", category: "Shopping" },
  { name: "TTC Transit",  emoji: "🚇", category: "Transport" },
  { name: "Costco",       emoji: "🏪", category: "Retail" },
  { name: "Netflix",      emoji: "🎬", category: "Entertainment" },
  { name: "Custom",       emoji: "✏️", category: "" },
];

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "send",    label: "Send",    icon: ICONS.send },
  { id: "request", label: "Request", icon: ICONS.receive },
  { id: "history", label: "History", icon: ICONS.history },
  { id: "cards",   label: "Cards",   icon: ICONS.card },
];

// ─── Utility ──────────────────────────────────────────────────────────────────
const fmt = (n) => Number(n).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Sub-components ───────────────────────────────────────────────────────────

function GoldDivider() {
  return (
    <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}44, transparent)`, margin: "0 -24px" }} />
  );
}

function StatusBadge({ status }) {
  const map = {
    success: { color: C.green,  label: "Completed" },
    failed:  { color: C.red,    label: "Failed" },
    pending: { color: C.gold,   label: "Pending" },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em",
      color: s.color, background: s.color + "18", border: `1px solid ${s.color}33`,
      borderRadius: 20, padding: "2px 8px" }}>
      {s.label.toUpperCase()}
    </span>
  );
}

// ─── Animated balance counter ─────────────────────────────────────────────────
function BalanceCounter({ value }) {
  const [displayed, setDisplayed] = useState(value);
  useEffect(() => {
    const start = displayed;
    const end   = value;
    const diff  = end - start;
    if (Math.abs(diff) < 0.01) return;
    let frame = 0;
    const total = 40;
    const id = setInterval(() => {
      frame++;
      const progress = frame / total;
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayed(start + diff * ease);
      if (frame >= total) { setDisplayed(end); clearInterval(id); }
    }, 16);
    return () => clearInterval(id);
  }, [value]); // eslint-disable-line
  return <span>{fmt(displayed)}</span>;
}

// ─── Virtual credit card ──────────────────────────────────────────────────────
function CreditCard({ variant = "primary", flipped = false, onFlip }) {
  const configs = {
    primary: {
      bg:   "linear-gradient(135deg, #1a2744 0%, #0d1c3d 50%, #162035 100%)",
      accent: C.gold,
      name: "RASHEED DASCOTT",
      number: "4716 2891 3047 4242",
      exp: "09/28",
      cvv: "***",
      label: "NOVA PLATINUM",
    },
    secondary: {
      bg:   "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
      accent: "#60a5fa",
      name: "RASHEED DASCOTT",
      number: "5412 7563 9021 8834",
      exp: "03/27",
      cvv: "***",
      label: "NOVA INFINITE",
    },
  };
  const cfg = configs[variant];

  return (
    <div style={{ perspective: 1000, width: "100%", maxWidth: 340, cursor: "pointer" }}
      onClick={onFlip}>
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 180 }}
        style={{ transformStyle: "preserve-3d", position: "relative", height: 200 }}
      >
        {/* Front */}
        <div style={{
          position: "absolute", inset: 0, backfaceVisibility: "hidden",
          borderRadius: 20, background: cfg.bg,
          border: `1px solid ${cfg.accent}33`,
          boxShadow: `0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px ${cfg.accent}22, inset 0 1px 0 ${cfg.accent}22`,
          padding: "22px 24px", display: "flex", flexDirection: "column", justifyContent: "space-between",
          overflow: "hidden",
        }}>
          {/* Holographic shimmer */}
          <div style={{ position: "absolute", inset: 0, borderRadius: 20, pointerEvents: "none",
            background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%, rgba(255,255,255,0.03) 100%)" }} />
          {/* Chip glare */}
          <div style={{ position: "absolute", top: 40, right: 30, width: 80, height: 80,
            borderRadius: "50%", background: `radial-gradient(circle, ${cfg.accent}18, transparent 70%)`,
            pointerEvents: "none" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em",
                color: cfg.accent, marginBottom: 4 }}>{cfg.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: "0.05em" }}>NovaPay</div>
            </div>
            <Ico d={ICONS.wifi} size={22} color={cfg.accent} sw={1.4} />
          </div>
          {/* Chip */}
          <div style={{ width: 36, height: 28, borderRadius: 5,
            background: `linear-gradient(135deg, ${cfg.accent}cc, ${cfg.accent}66)`,
            border: `1px solid ${cfg.accent}88`, position: "relative" }}>
            <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1,
              background: `${cfg.accent}66`, transform: "translateY(-50%)" }} />
            <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1,
              background: `${cfg.accent}66`, transform: "translateX(-50%)" }} />
          </div>
          <div>
            <div style={{ fontFamily: "'Courier New', monospace", fontSize: 15,
              color: "#fff", letterSpacing: "0.18em", marginBottom: 10 }}>
              {cfg.number}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <div style={{ fontSize: 8, color: cfg.accent, letterSpacing: "0.12em", marginBottom: 2 }}>CARD HOLDER</div>
                <div style={{ fontSize: 11, color: "#fff", fontWeight: 600, letterSpacing: "0.08em" }}>{cfg.name}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 8, color: cfg.accent, letterSpacing: "0.12em", marginBottom: 2 }}>EXPIRES</div>
                <div style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>{cfg.exp}</div>
              </div>
            </div>
          </div>
        </div>
        {/* Back */}
        <div style={{
          position: "absolute", inset: 0, backfaceVisibility: "hidden",
          transform: "rotateY(180deg)", borderRadius: 20, background: cfg.bg,
          border: `1px solid ${cfg.accent}33`,
          boxShadow: `0 24px 60px rgba(0,0,0,0.6)`,
          overflow: "hidden",
        }}>
          {/* Magnetic stripe */}
          <div style={{ height: 44, background: "#000", margin: "24px 0 20px" }} />
          <div style={{ padding: "0 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 36, background: "rgba(255,255,255,0.08)",
                borderRadius: 4, border: "1px solid rgba(255,255,255,0.1)" }} />
              <div style={{ background: `linear-gradient(135deg, ${cfg.accent}cc, ${cfg.accent}66)`,
                borderRadius: 4, padding: "6px 14px", fontFamily: "monospace", fontSize: 13,
                color: "#000", fontWeight: 700 }}>
                {cfg.cvv}
              </div>
            </div>
            <div style={{ fontSize: 9, color: C.muted, lineHeight: 1.6 }}>
              This card is property of NovaPay Financial. Use subject to cardholder agreement.
              Report lost/stolen: 1-800-NOVAPAY
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Send tab ─────────────────────────────────────────────────────────────────
function SendTab({ onTransactionComplete }) {
  const [step,          setStep]          = useState("amount"); // amount | merchant | confirm | processing | success | failed
  const [amount,        setAmount]        = useState("");
  const [merchant,      setMerchant]      = useState(null);
  const [customMerchant,setCustomMerchant]= useState("");
  const [note,          setNote]          = useState("");

  const finalMerchant = merchant?.name === "Custom" ? customMerchant : merchant?.name;
  const finalAmount   = parseFloat(amount) || 0;

  const handleProcess = async () => {
    setStep("processing");
    const success = Math.random() > 0.15;
    await new Promise(r => setTimeout(r, 2200));
    if (success) {
      try {
        await transactionsAPI.create({
          merchant: finalMerchant || "Unknown",
          amount:   finalAmount,
          currency: "CAD",
          status:   "success",
          method:   "nfc",
        });
      } catch {}
      setStep("success");
      onTransactionComplete?.();
    } else {
      setStep("failed");
    }
  };

  const reset = () => {
    setStep("amount"); setAmount(""); setMerchant(null);
    setCustomMerchant(""); setNote("");
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
      <AnimatePresence mode="wait">

        {/* ── Step 1: Amount ── */}
        {step === "amount" && (
          <motion.div key="amount"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.22 }}
            style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
                color: C.gold, marginBottom: 16 }}>ENTER AMOUNT</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                <span style={{ fontSize: 28, color: C.muted, fontWeight: 300 }}>CAD</span>
                <input
                  type="number" min="0.01" step="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  style={{ background: "none", border: "none", outline: "none",
                    fontSize: 56, fontWeight: 700, color: "#fff",
                    width: 200, textAlign: "center",
                    fontFamily: "'SF Mono', 'Fira Code', monospace" }}
                />
              </div>
              <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}66, transparent)`,
                margin: "8px auto", maxWidth: 240 }} />
            </div>
            {/* Quick amounts */}
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              {QUICK.map(q => (
                <motion.button key={q} whileTap={{ scale: 0.93 }}
                  onClick={() => setAmount(String(q))}
                  style={{ padding: "6px 16px", borderRadius: 20,
                    background: amount === String(q) ? C.gold + "22" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${amount === String(q) ? C.gold + "66" : C.border}`,
                    color: amount === String(q) ? C.gold : C.muted,
                    fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  ${q}
                </motion.button>
              ))}
            </div>
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => finalAmount > 0 && setStep("merchant")}
              style={{ padding: "15px 0", borderRadius: 14,
                background: finalAmount > 0
                  ? `linear-gradient(135deg, ${C.gold}, #a07830)`
                  : "rgba(255,255,255,0.06)",
                border: finalAmount > 0 ? "none" : `1px solid ${C.border}`,
                color: finalAmount > 0 ? "#000" : C.sub,
                fontSize: 14, fontWeight: 700, letterSpacing: "0.06em",
                cursor: finalAmount > 0 ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              CONTINUE <Ico d={ICONS.arrow} size={16} color={finalAmount > 0 ? "#000" : C.sub} />
            </motion.button>
          </motion.div>
        )}

        {/* ── Step 2: Merchant ── */}
        {step === "merchant" && (
          <motion.div key="merchant"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.22 }}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <motion.button whileTap={{ scale: 0.93 }} onClick={() => setStep("amount")}
                style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.06)",
                  border: `1px solid ${C.border}`, color: "#fff", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Ico d="M15 18l-6-6 6-6" size={16} />
              </motion.button>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: C.gold }}>
                SELECT MERCHANT
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {MERCHANTS.map(m => (
                <motion.button key={m.name} whileTap={{ scale: 0.96 }}
                  onClick={() => setMerchant(m)}
                  style={{ padding: "12px 14px", borderRadius: 12, textAlign: "left",
                    background: merchant?.name === m.name ? C.gold + "18" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${merchant?.name === m.name ? C.gold + "55" : C.border}`,
                    cursor: "pointer" }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{m.emoji}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{m.name}</div>
                  {m.category && <div style={{ fontSize: 10, color: C.muted }}>{m.category}</div>}
                </motion.button>
              ))}
            </div>
            {merchant?.name === "Custom" && (
              <input value={customMerchant} onChange={e => setCustomMerchant(e.target.value)}
                placeholder="Enter merchant name…"
                style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.06)",
                  border: `1px solid ${C.border}`, color: "#fff", fontSize: 13, outline: "none" }} />
            )}
            <input value={note} onChange={e => setNote(e.target.value)}
              placeholder="Add a note (optional)…"
              style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.06)",
                border: `1px solid ${C.border}`, color: "#fff", fontSize: 13, outline: "none" }} />
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => (merchant && (merchant.name !== "Custom" || customMerchant)) && setStep("confirm")}
              style={{ padding: "15px 0", borderRadius: 14,
                background: (merchant && (merchant.name !== "Custom" || customMerchant))
                  ? `linear-gradient(135deg, ${C.gold}, #a07830)`
                  : "rgba(255,255,255,0.06)",
                border: "none", color: "#000", fontSize: 14, fontWeight: 700,
                letterSpacing: "0.06em", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              REVIEW <Ico d={ICONS.arrow} size={16} color="#000" />
            </motion.button>
          </motion.div>
        )}

        {/* ── Step 3: Confirm ── */}
        {step === "confirm" && (
          <motion.div key="confirm"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.22 }}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <motion.button whileTap={{ scale: 0.93 }} onClick={() => setStep("merchant")}
                style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.06)",
                  border: `1px solid ${C.border}`, color: "#fff", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Ico d="M15 18l-6-6 6-6" size={16} />
              </motion.button>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: C.gold }}>
                CONFIRM PAYMENT
              </div>
            </div>
            {/* Summary card */}
            <div style={{ borderRadius: 16, background: "rgba(255,255,255,0.03)",
              border: `1px solid ${C.border}`, overflow: "hidden" }}>
              <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.1em", marginBottom: 6 }}>PAYMENT AMOUNT</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: "#fff",
                  fontFamily: "'SF Mono', monospace" }}>
                  <span style={{ fontSize: 16, color: C.gold, marginRight: 4 }}>CAD</span>
                  {fmt(finalAmount)}
                </div>
              </div>
              {[
                { label: "TO",     value: finalMerchant },
                { label: "FROM",   value: "NovaPay Platinum ···· 4242" },
                { label: "METHOD", value: "NFC Contactless" },
                ...(note ? [{ label: "NOTE", value: note }] : []),
              ].map(r => (
                <div key={r.label} style={{ padding: "10px 20px", display: "flex",
                  justifyContent: "space-between", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 10, color: C.muted, letterSpacing: "0.1em" }}>{r.label}</span>
                  <span style={{ fontSize: 12, color: "#fff", fontWeight: 500 }}>{r.value}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6,
              padding: "10px 14px", borderRadius: 10, background: C.green + "12",
              border: `1px solid ${C.green}33` }}>
              <Ico d={ICONS.lock} size={13} color={C.green} />
              <span style={{ fontSize: 11, color: C.green }}>256-bit encrypted · PCI DSS compliant</span>
            </div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleProcess}
              style={{ padding: "16px 0", borderRadius: 14,
                background: `linear-gradient(135deg, ${C.gold}, #a07830)`,
                border: "none", color: "#000", fontSize: 14, fontWeight: 800,
                letterSpacing: "0.08em", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Ico d={ICONS.nfc[0]} size={16} color="#000" />
              CONFIRM & PAY
            </motion.button>
          </motion.div>
        )}

        {/* ── Processing ── */}
        {step === "processing" && (
          <motion.div key="processing"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 24, padding: "40px 0" }}>
            {/* NFC rings */}
            <div style={{ position: "relative", width: 120, height: 120,
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              {[0,1,2].map(i => (
                <motion.div key={i}
                  animate={{ scale: [1, 2.2], opacity: [0.5, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.5, ease: "easeOut" }}
                  style={{ position: "absolute", width: 40, height: 40, borderRadius: "50%",
                    border: `2px solid ${C.gold}` }} />
              ))}
              <div style={{ width: 56, height: 56, borderRadius: "50%",
                background: `linear-gradient(135deg, ${C.gold}33, ${C.gold}11)`,
                border: `2px solid ${C.gold}66`,
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Ico d={ICONS.wifi[0]} size={22} color={C.gold} />
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 6 }}>
                Processing Payment
              </div>
              <div style={{ fontSize: 12, color: C.muted }}>
                CAD {fmt(finalAmount)} → {finalMerchant}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {["Encrypting","Authorising","Confirming"].map((label, i) => (
                <motion.div key={label}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }}
                  style={{ fontSize: 10, color: C.gold, letterSpacing: "0.08em" }}>
                  {label}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Success ── */}
        {step === "success" && (
          <motion.div key="success"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            style={{ flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 20, padding: "40px 0" }}>
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
              style={{ width: 72, height: 72, borderRadius: "50%",
                background: C.green + "22", border: `2px solid ${C.green}55`,
                display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Ico d={ICONS.check} size={30} color={C.green} sw={2.5} />
            </motion.div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 4 }}>
                Payment Sent!
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: C.green,
                fontFamily: "monospace", marginBottom: 6 }}>
                CAD {fmt(finalAmount)}
              </div>
              <div style={{ fontSize: 13, color: C.muted }}>
                to {finalMerchant}
              </div>
            </div>
            <div style={{ padding: "12px 20px", borderRadius: 10, background: "rgba(255,255,255,0.04)",
              border: `1px solid ${C.border}`, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.1em", marginBottom: 4 }}>REFERENCE</div>
              <div style={{ fontFamily: "monospace", fontSize: 12, color: C.gold }}>
                NP{Date.now().toString(36).toUpperCase()}
              </div>
            </div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={reset}
              style={{ padding: "13px 32px", borderRadius: 14,
                background: `linear-gradient(135deg, ${C.gold}, #a07830)`,
                border: "none", color: "#000", fontSize: 13, fontWeight: 700,
                cursor: "pointer" }}>
              New Payment
            </motion.button>
          </motion.div>
        )}

        {/* ── Failed ── */}
        {step === "failed" && (
          <motion.div key="failed"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            style={{ flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 20, padding: "40px 0" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%",
              background: C.red + "22", border: `2px solid ${C.red}55`,
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Ico d={ICONS.error} size={30} color={C.red} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 6 }}>Payment Declined</div>
              <div style={{ fontSize: 13, color: C.muted }}>
                Your bank declined the transaction. Please try again or use another card.
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, width: "100%" }}>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep("confirm")}
                style={{ flex: 1, padding: "13px 0", borderRadius: 14,
                  background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`,
                  color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Try Again
              </motion.button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={reset}
                style={{ flex: 1, padding: "13px 0", borderRadius: 14,
                  background: `linear-gradient(135deg, ${C.gold}, #a07830)`,
                  border: "none", color: "#000", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                New Payment
              </motion.button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

// ─── Request tab ──────────────────────────────────────────────────────────────
function RequestTab() {
  const [amount, setAmount]   = useState("");
  const [from,   setFrom]     = useState("");
  const [sent,   setSent]     = useState(false);

  if (sent) return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      style={{ flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 20 }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%",
        background: C.blue + "22", border: `2px solid ${C.blue}55`,
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Ico d={ICONS.check} size={26} color={C.blue} sw={2.5} />
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 6 }}>Request Sent!</div>
        <div style={{ fontSize: 13, color: C.muted }}>CAD {fmt(parseFloat(amount)||0)} requested from {from}</div>
      </div>
      <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setSent(false); setAmount(""); setFrom(""); }}
        style={{ padding: "12px 28px", borderRadius: 14, background: `linear-gradient(135deg, ${C.gold}, #a07830)`,
          border: "none", color: "#000", fontWeight: 700, cursor: "pointer" }}>
        New Request
      </motion.button>
    </motion.div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: C.gold }}>REQUEST PAYMENT</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 0" }}>
        <span style={{ fontSize: 24, color: C.muted, marginRight: 6, fontWeight: 300 }}>CAD</span>
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
          placeholder="0.00"
          style={{ background: "none", border: "none", outline: "none",
            fontSize: 48, fontWeight: 800, color: "#fff", width: 160, textAlign: "center",
            fontFamily: "monospace" }} />
      </div>
      <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}55, transparent)` }} />
      <input value={from} onChange={e => setFrom(e.target.value)}
        placeholder="Request from (name or email)…"
        style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)",
          border: `1px solid ${C.border}`, color: "#fff", fontSize: 13, outline: "none" }} />
      <motion.button whileTap={{ scale: 0.97 }}
        onClick={() => parseFloat(amount) > 0 && from && setSent(true)}
        style={{ padding: "15px 0", borderRadius: 14,
          background: parseFloat(amount) > 0 && from
            ? `linear-gradient(135deg, ${C.blue}, #2556cc)`
            : "rgba(255,255,255,0.06)",
          border: "none", color: "#fff", fontWeight: 700, fontSize: 14,
          letterSpacing: "0.06em", cursor: "pointer" }}>
        SEND REQUEST
      </motion.button>
    </div>
  );
}

// ─── History tab ──────────────────────────────────────────────────────────────
function HistoryTab() {
  const [txns,    setTxns]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [total,   setTotal]   = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const data = await transactionsAPI.list();
        const list = Array.isArray(data) ? data : data?.items ?? [];
        setTxns(list);
        setTotal(list.filter(t => t.status === "success").reduce((s, t) => s + Number(t.amount), 0));
      } catch {}
      setLoading(false);
    })();
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await transactionsAPI.list();
      const list = Array.isArray(data) ? data : data?.items ?? [];
      setTxns(list);
      setTotal(list.filter(t => t.status === "success").reduce((s, t) => s + Number(t.amount), 0));
    } catch {}
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: C.gold }}>TRANSACTIONS</div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={refresh}
          style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.05)",
            border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: C.muted }}>
          <Ico d={ICONS.refresh} size={13} />
        </motion.button>
      </div>
      {/* Summary */}
      <div style={{ borderRadius: 14, padding: "16px 18px",
        background: `linear-gradient(135deg, ${C.gold}18, ${C.gold}08)`,
        border: `1px solid ${C.gold}33`,
        display: "flex", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 10, color: C.gold, letterSpacing: "0.1em", marginBottom: 4 }}>TOTAL SPENT</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", fontFamily: "monospace" }}>
            CAD <BalanceCounter value={total} />
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.1em", marginBottom: 4 }}>TRANSACTIONS</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{txns.length}</div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ height: 60, borderRadius: 12,
              background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`,
              animation: "pulse 1.4s infinite" }} />
          ))}
        </div>
      ) : txns.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: C.muted, fontSize: 13 }}>
          No transactions yet
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {txns.map((t, i) => (
            <motion.div key={t.id || i}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              style={{ padding: "12px 16px", borderRadius: 12,
                background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`,
                display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 38, height: 38, borderRadius: 10,
                  background: t.status === "success" ? C.green + "18" : C.red + "18",
                  border: `1px solid ${t.status === "success" ? C.green + "33" : C.red + "33"}`,
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Ico d={t.status === "success" ? ICONS.arrow : ICONS.error}
                    size={16} color={t.status === "success" ? C.green : C.red} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{t.merchant}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>
                    {t.created_at?.slice(0, 10)} · {(t.method || "nfc").toUpperCase()}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 14, fontWeight: 700,
                  color: t.status === "success" ? "#fff" : C.red,
                  fontFamily: "monospace" }}>
                  {t.status === "failed" ? "–" : ""}{t.currency} {fmt(t.amount)}
                </div>
                <StatusBadge status={t.status} />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Cards tab ────────────────────────────────────────────────────────────────
function CardsTab() {
  const [activeCard, setActiveCard] = useState(0);
  const [flipped,    setFlipped]    = useState(false);

  const CARD_DATA = [
    { variant: "primary",   balance: 12847.50, limit: 25000, spent: 8420.30 },
    { variant: "secondary", balance: 4320.00,  limit: 10000, spent: 2140.80 },
  ];
  const cd = CARD_DATA[activeCard];
  const usePct = ((cd.spent / cd.limit) * 100).toFixed(0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: C.gold }}>MY CARDS</div>
      <CreditCard variant={cd.variant} flipped={flipped} onFlip={() => setFlipped(f => !f)} />
      <div style={{ fontSize: 10, color: C.sub, textAlign: "center", marginTop: -8 }}>
        Tap card to flip
      </div>
      {/* Card selector */}
      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        {CARD_DATA.map((_, i) => (
          <motion.button key={i} whileTap={{ scale: 0.9 }}
            onClick={() => { setActiveCard(i); setFlipped(false); }}
            style={{ width: i === activeCard ? 24 : 8, height: 8, borderRadius: 4,
              background: i === activeCard ? C.gold : "rgba(255,255,255,0.2)",
              border: "none", cursor: "pointer", transition: "all 0.2s" }} />
        ))}
      </div>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { label: "AVAILABLE",  value: `CAD ${fmt(cd.balance)}`,  color: C.green },
          { label: "CREDIT LIMIT", value: `CAD ${fmt(cd.limit)}`,  color: C.gold },
          { label: "SPENT",      value: `CAD ${fmt(cd.spent)}`,    color: "#fff" },
          { label: "UTILIZATION", value: `${usePct}%`,             color: usePct > 70 ? C.red : C.gold },
        ].map(s => (
          <div key={s.label} style={{ padding: "14px", borderRadius: 12,
            background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.1em", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: s.color, fontFamily: "monospace" }}>{s.value}</div>
          </div>
        ))}
      </div>
      {/* Spend bar */}
      <div style={{ padding: "14px 16px", borderRadius: 12,
        background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 10, color: C.muted, letterSpacing: "0.1em" }}>CREDIT USAGE</span>
          <span style={{ fontSize: 10, color: parseFloat(usePct) > 70 ? C.red : C.gold, fontWeight: 700 }}>{usePct}%</span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.08)" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${usePct}%` }}
            transition={{ duration: 1, ease: [0.16,1,0.3,1] }}
            style={{ height: "100%", borderRadius: 3,
              background: parseFloat(usePct) > 70
                ? `linear-gradient(90deg, ${C.red}, #ff6b6b)`
                : `linear-gradient(90deg, ${C.gold}, ${C.goldLight})` }} />
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
const Fintech = ({ onClose }) => {
  const [tab,          setTab]          = useState("send");
  const [balance,      setBalance]      = useState(12847.50);
  const [refreshCount, setRefreshCount] = useState(0);

  const refreshBalance = () => setRefreshCount(c => c + 1);

  const handleTransactionComplete = useCallback(() => {
    setBalance(b => parseFloat((b - (Math.random() * 50 + 4)).toFixed(2)));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, bottom: "var(--taskbar-height, 52px)",
        zIndex: 50, background: C.bg,
        display: "flex", flexDirection: "column",
        fontFamily: "'SF Pro Display', '-apple-system', system-ui, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* ── Header ── */}
      <div style={{
        padding: "16px 20px 14px",
        background: C.surface,
        borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10,
            background: `linear-gradient(135deg, ${C.gold}33, ${C.gold}11)`,
            border: `1px solid ${C.gold}44`,
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Ico d={ICONS.card} size={16} color={C.gold} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: "0.02em" }}>NovaPay</div>
            <div style={{ fontSize: 10, color: C.gold, letterSpacing: "0.1em" }}>PREMIUM WALLET</div>
          </div>
        </div>
        {/* Balance pill */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.1em" }}>BALANCE</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", fontFamily: "monospace" }}>
              <span style={{ fontSize: 10, color: C.gold, marginRight: 2 }}>CAD</span>
              <BalanceCounter value={balance} />
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.88 }} onClick={onClose}
            style={{ width: 34, height: 34, borderRadius: "50%",
              background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: C.muted }}>
            <Ico d={ICONS.close} size={15} />
          </motion.button>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div style={{
        display: "flex", background: C.surface,
        borderBottom: `1px solid ${C.border}`,
        flexShrink: 0, padding: "0 8px",
      }}>
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <motion.button key={t.id} whileTap={{ scale: 0.95 }}
              onClick={() => setTab(t.id)}
              style={{ flex: 1, padding: "12px 8px 10px", display: "flex", flexDirection: "column",
                alignItems: "center", gap: 4, background: "none", border: "none",
                cursor: "pointer", position: "relative" }}>
              <Ico d={t.icon} size={17} color={active ? C.gold : C.sub} sw={active ? 2 : 1.5} />
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
                color: active ? C.gold : C.sub }}>
                {t.label.toUpperCase()}
              </span>
              {active && (
                <motion.div layoutId="tabIndicator"
                  style={{ position: "absolute", bottom: 0, left: "20%", right: "20%",
                    height: 2, borderRadius: 1,
                    background: `linear-gradient(90deg, ${C.gold}, ${C.goldLight})` }} />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* ── Tab content ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px",
        scrollbarWidth: "none" }}>
        <AnimatePresence mode="wait">
          <motion.div key={tab}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.18 }}>
            {tab === "send"    && <SendTab onTransactionComplete={handleTransactionComplete} />}
            {tab === "request" && <RequestTab />}
            {tab === "history" && <HistoryTab key={refreshCount} />}
            {tab === "cards"   && <CardsTab />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Footer ── */}
      <div style={{
        padding: "10px 20px",
        borderTop: `1px solid ${C.border}`,
        background: C.surface,
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 6, flexShrink: 0,
      }}>
        <Ico d={ICONS.lock} size={11} color={C.muted} />
        <span style={{ fontSize: 10, color: C.sub, letterSpacing: "0.08em" }}>
          256-BIT SSL · PCI DSS LEVEL 1 · CDIC INSURED
        </span>
      </div>
    </motion.div>
  );
};

export default Fintech;