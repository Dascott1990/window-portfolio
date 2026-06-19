"use client";
/**
 * Fintech.js — NovaPay, real wallet
 * ─────────────────────────────────────────────────────────────────────────
 * Every number on this screen comes from the backend. There is no
 * client-side balance math, no Math.random() deciding if a payment
 * succeeds, and no hardcoded card data. Balance and cards are fetched
 * from /api/v1/wallet; sending money calls /api/v1/wallet/send, which
 * the backend either approves (debits the real persisted balance) or
 * declines (insufficient funds — a real check, not a coin flip).
 *
 * This is not a real bank — it's a real ledger. Funds only exist because
 * you top up the wallet yourself; nothing is pre-loaded as a demo prop.
 */
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { walletAPI, transactionsAPI } from "../../lib/api";

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
  refresh: "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  lock:    "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zm-7 4v3M7 11V7a5 5 0 0 1 10 0v4",
};

const QUICK = [10, 25, 50, 100, 250];

const MERCHANTS = [
  { name: "Tim Hortons",  emoji: "☕", category: "Food" },
  { name: "Shopify",      emoji: "🛍", category: "Shopping" },
  { name: "TTC Transit",  emoji: "🚇", category: "Transport" },
  { name: "Costco",       emoji: "🏪", category: "Retail" },
  { name: "Netflix",      emoji: "🎬", category: "Entertainment" },
  { name: "Custom",       emoji: "✏️", category: "" },
];

const TABS = [
  { id: "send",    label: "Send",    icon: ICONS.send },
  { id: "request", label: "Request", icon: ICONS.receive },
  { id: "history", label: "History", icon: ICONS.history },
  { id: "cards",   label: "Cards",   icon: ICONS.card },
];

const DECLINE_MESSAGES = {
  insufficient_funds:  "Your wallet balance is too low for this payment. Top up to continue.",
  insufficient_credit: "This card's available credit is too low for this payment.",
};

const fmt = (n) => Number(n || 0).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function GoldDivider() {
  return <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}44, transparent)`, margin: "0 -24px" }} />;
}

function StatusBadge({ status }) {
  const map = {
    success: { color: C.green, label: "Completed" },
    failed:  { color: C.red,   label: "Failed" },
    pending: { color: C.gold,  label: "Pending" },
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

// ─── Animated balance counter — animates between two REAL fetched values ──────
function BalanceCounter({ value }) {
  const [displayed, setDisplayed] = useState(value);
  useEffect(() => {
    const start = displayed;
    const end   = value;
    const diff  = end - start;
    if (Math.abs(diff) < 0.01) { setDisplayed(end); return; }
    let frame = 0;
    const total = 30;
    const id = setInterval(() => {
      frame++;
      const progress = frame / total;
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayed(start + diff * ease);
      if (frame >= total) { setDisplayed(end); clearInterval(id); }
    }, 16);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <span>{fmt(displayed)}</span>;
}

// ─── Virtual credit card — renders REAL card data from backend, masked ────────
function CreditCard({ card, flipped, onFlip }) {
  const accent = card.is_primary ? C.gold : "#60a5fa";
  const expStr = `${String(card.expiry_month).padStart(2, "0")}/${String(card.expiry_year).slice(-2)}`;

  return (
    <div style={{ perspective: 1000, width: "100%", maxWidth: 340, cursor: "pointer" }} onClick={onFlip}>
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 180 }}
        style={{ transformStyle: "preserve-3d", position: "relative", height: 200 }}
      >
        {/* Front */}
        <div style={{
          position: "absolute", inset: 0, backfaceVisibility: "hidden",
          borderRadius: 20, background: "linear-gradient(135deg, #1a2744 0%, #0d1c3d 50%, #162035 100%)",
          border: `1px solid ${accent}33`,
          boxShadow: `0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px ${accent}22, inset 0 1px 0 ${accent}22`,
          padding: "22px 24px", display: "flex", flexDirection: "column", justifyContent: "space-between",
          overflow: "hidden",
        }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: 20, pointerEvents: "none",
            background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%, rgba(255,255,255,0.03) 100%)" }} />
          <div style={{ position: "absolute", top: 40, right: 30, width: 80, height: 80,
            borderRadius: "50%", background: `radial-gradient(circle, ${accent}18, transparent 70%)`,
            pointerEvents: "none" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", color: accent, marginBottom: 4 }}>
                {card.label.toUpperCase()}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: "0.05em" }}>NovaPay</div>
            </div>
            <Ico d={ICONS.wifi} size={22} color={accent} sw={1.4} />
          </div>
          <div style={{ width: 36, height: 28, borderRadius: 5,
            background: `linear-gradient(135deg, ${accent}cc, ${accent}66)`,
            border: `1px solid ${accent}88`, position: "relative" }}>
            <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1,
              background: `${accent}66`, transform: "translateY(-50%)" }} />
            <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1,
              background: `${accent}66`, transform: "translateX(-50%)" }} />
          </div>
          <div>
            <div style={{ fontFamily: "'Courier New', monospace", fontSize: 15,
              color: "#fff", letterSpacing: "0.18em", marginBottom: 10 }}>
              •••• •••• •••• {card.last4}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <div style={{ fontSize: 8, color: accent, letterSpacing: "0.12em", marginBottom: 2 }}>NETWORK</div>
                <div style={{ fontSize: 11, color: "#fff", fontWeight: 600, letterSpacing: "0.08em" }}>{card.network.toUpperCase()}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 8, color: accent, letterSpacing: "0.12em", marginBottom: 2 }}>EXPIRES</div>
                <div style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>{expStr}</div>
              </div>
            </div>
          </div>
        </div>
        {/* Back */}
        <div style={{
          position: "absolute", inset: 0, backfaceVisibility: "hidden",
          transform: "rotateY(180deg)", borderRadius: 20,
          background: "linear-gradient(135deg, #1a2744 0%, #0d1c3d 50%, #162035 100%)",
          border: `1px solid ${accent}33`, boxShadow: `0 24px 60px rgba(0,0,0,0.6)`, overflow: "hidden",
        }}>
          <div style={{ height: 44, background: "#000", margin: "24px 0 20px" }} />
          <div style={{ padding: "0 24px" }}>
            <div style={{ fontSize: 9, color: C.muted, lineHeight: 1.6 }}>
              This is a NovaPay wallet card — a real, persisted record in your account's
              ledger. No full card number is ever stored; only the last 4 digits shown
              on the front are kept.
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Send tab — calls walletAPI.send, shows the REAL backend outcome ──────────
function SendTab({ wallet, cards, onWalletChanged }) {
  const [step,           setStep]           = useState("amount");
  const [amount,         setAmount]         = useState("");
  const [merchant,       setMerchant]       = useState(null);
  const [customMerchant, setCustomMerchant] = useState("");
  const [note,           setNote]           = useState("");
  const [useCard,        setUseCard]        = useState(null); // null = pay from wallet balance
  const [result,         setResult]         = useState(null); // the real transaction record
  const [error,          setError]          = useState(null);

  const finalMerchant = merchant?.name === "Custom" ? customMerchant : merchant?.name;
  const finalAmount   = parseFloat(amount) || 0;

  const handleProcess = async () => {
    setStep("processing");
    setError(null);
    try {
      const txn = await walletAPI.send({
        merchant: finalMerchant || "Unknown",
        amount: finalAmount,
        currency: wallet?.currency || "CAD",
        method: useCard ? "card" : "wallet",
        card_id: useCard?.id,
        notes: note || undefined,
      });
      setResult(txn);
      setStep(txn.status === "success" ? "success" : "failed");
      if (txn.status === "success") onWalletChanged();
    } catch (e) {
      setError(e.message || "Could not reach the wallet service.");
      setStep("failed");
      setResult(null);
    }
  };

  const reset = () => {
    setStep("amount"); setAmount(""); setMerchant(null);
    setCustomMerchant(""); setNote(""); setUseCard(null); setResult(null); setError(null);
  };

  const availableBalance = wallet ? Number(wallet.balance) : 0;
  const exceedsBalance = !useCard && finalAmount > availableBalance;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
      <AnimatePresence mode="wait">

        {step === "amount" && (
          <motion.div key="amount"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.22 }}
            style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: C.gold, marginBottom: 16 }}>
                ENTER AMOUNT
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                <span style={{ fontSize: 28, color: C.muted, fontWeight: 300 }}>{wallet?.currency || "CAD"}</span>
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
              <p style={{ fontSize: 11, color: exceedsBalance ? C.red : C.muted, marginTop: 6 }}>
                {useCard
                  ? `Available credit: ${wallet?.currency || "CAD"} ${fmt(Number(useCard.credit_limit) - Number(useCard.spent))}`
                  : `Wallet balance: ${wallet?.currency || "CAD"} ${fmt(availableBalance)}`}
              </p>
            </div>

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

            {/* Pay-from selector — wallet balance or a real card */}
            {cards.length > 0 && (
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
                <PayFromChip active={!useCard} label="Wallet" onClick={() => setUseCard(null)} />
                {cards.map(c => (
                  <PayFromChip key={c.id} active={useCard?.id === c.id} label={`···· ${c.last4}`} onClick={() => setUseCard(c)} />
                ))}
              </div>
            )}

            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => finalAmount > 0 && setStep("merchant")}
              disabled={finalAmount <= 0}
              style={{ padding: "15px 0", borderRadius: 14,
                background: finalAmount > 0 ? `linear-gradient(135deg, ${C.gold}, #a07830)` : "rgba(255,255,255,0.06)",
                border: finalAmount > 0 ? "none" : `1px solid ${C.border}`,
                color: finalAmount > 0 ? "#000" : C.sub,
                fontSize: 14, fontWeight: 700, letterSpacing: "0.06em",
                cursor: finalAmount > 0 ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              CONTINUE <Ico d={ICONS.arrow} size={16} color={finalAmount > 0 ? "#000" : C.sub} />
            </motion.button>
          </motion.div>
        )}

        {step === "merchant" && (
          <motion.div key="merchant"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.22 }}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <BackButton onClick={() => setStep("amount")} />
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
                  ? `linear-gradient(135deg, ${C.gold}, #a07830)` : "rgba(255,255,255,0.06)",
                border: "none", color: "#000", fontSize: 14, fontWeight: 700,
                letterSpacing: "0.06em", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              REVIEW <Ico d={ICONS.arrow} size={16} color="#000" />
            </motion.button>
          </motion.div>
        )}

        {step === "confirm" && (
          <motion.div key="confirm"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.22 }}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <BackButton onClick={() => setStep("merchant")} />
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: C.gold }}>
                CONFIRM PAYMENT
              </div>
            </div>
            <div style={{ borderRadius: 16, background: "rgba(255,255,255,0.03)",
              border: `1px solid ${C.border}`, overflow: "hidden" }}>
              <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.1em", marginBottom: 6 }}>PAYMENT AMOUNT</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: "#fff", fontFamily: "'SF Mono', monospace" }}>
                  <span style={{ fontSize: 16, color: C.gold, marginRight: 4 }}>{wallet?.currency || "CAD"}</span>
                  {fmt(finalAmount)}
                </div>
              </div>
              {[
                { label: "TO",     value: finalMerchant },
                { label: "FROM",   value: useCard ? `NovaPay Card ···· ${useCard.last4}` : "NovaPay Wallet Balance" },
                { label: "METHOD", value: useCard ? "Card" : "Wallet" },
                ...(note ? [{ label: "NOTE", value: note }] : []),
              ].map(r => (
                <div key={r.label} style={{ padding: "10px 20px", display: "flex",
                  justifyContent: "space-between", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 10, color: C.muted, letterSpacing: "0.1em" }}>{r.label}</span>
                  <span style={{ fontSize: 12, color: "#fff", fontWeight: 500 }}>{r.value}</span>
                </div>
              ))}
            </div>
            {exceedsBalance && (
              <div style={{ display: "flex", alignItems: "center", gap: 6,
                padding: "10px 14px", borderRadius: 10, background: C.red + "12",
                border: `1px solid ${C.red}33` }}>
                <Ico d={ICONS.error} size={13} color={C.red} />
                <span style={{ fontSize: 11, color: C.red }}>
                  This exceeds your available {useCard ? "credit" : "balance"} — the bank will decline it.
                </span>
              </div>
            )}
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

        {step === "processing" && (
          <motion.div key="processing"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 24, padding: "40px 0" }}>
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
                Contacting wallet service
              </div>
              <div style={{ fontSize: 12, color: C.muted }}>
                {wallet?.currency || "CAD"} {fmt(finalAmount)} → {finalMerchant}
              </div>
            </div>
          </motion.div>
        )}

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
              <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Payment Sent!</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: C.green, fontFamily: "monospace", marginBottom: 6 }}>
                {wallet?.currency || "CAD"} {fmt(finalAmount)}
              </div>
              <div style={{ fontSize: 13, color: C.muted }}>to {finalMerchant}</div>
            </div>
            {result?.id && (
              <div style={{ padding: "12px 20px", borderRadius: 10, background: "rgba(255,255,255,0.04)",
                border: `1px solid ${C.border}`, textAlign: "center" }}>
                <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.1em", marginBottom: 4 }}>TRANSACTION ID</div>
                <div style={{ fontFamily: "monospace", fontSize: 11, color: C.gold }}>{result.id}</div>
              </div>
            )}
            <motion.button whileTap={{ scale: 0.97 }} onClick={reset}
              style={{ padding: "13px 32px", borderRadius: 14,
                background: `linear-gradient(135deg, ${C.gold}, #a07830)`,
                border: "none", color: "#000", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              New Payment
            </motion.button>
          </motion.div>
        )}

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
              <div style={{ fontSize: 13, color: C.muted, maxWidth: 280 }}>
                {error || DECLINE_MESSAGES[result?.decline_reason] || "The payment could not be completed."}
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

function PayFromChip({ active, label, onClick }) {
  return (
    <motion.button whileTap={{ scale: 0.95 }} onClick={onClick}
      style={{ flexShrink: 0, padding: "6px 14px", borderRadius: 20,
        background: active ? C.gold + "22" : "rgba(255,255,255,0.05)",
        border: `1px solid ${active ? C.gold + "66" : C.border}`,
        color: active ? C.gold : C.muted, fontSize: 11, fontWeight: 600,
        whiteSpace: "nowrap", cursor: "pointer" }}>
      {label}
    </motion.button>
  );
}

function BackButton({ onClick }) {
  return (
    <motion.button whileTap={{ scale: 0.93 }} onClick={onClick}
      style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.06)",
        border: `1px solid ${C.border}`, color: "#fff", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Ico d="M15 18l-6-6 6-6" size={16} />
    </motion.button>
  );
}

// ─── Request tab — real persisted "pending" transaction, no money moves ───────
function RequestTab({ wallet, onWalletChanged }) {
  const [amount, setAmount] = useState("");
  const [from,   setFrom]   = useState("");
  const [sent,   setSent]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);

  const handleSend = async () => {
    setSaving(true);
    setError(null);
    try {
      await walletAPI.request({ from, amount: parseFloat(amount) || 0, currency: wallet?.currency || "CAD" });
      setSent(true);
      onWalletChanged();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

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
        <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 6 }}>Request Recorded</div>
        <div style={{ fontSize: 13, color: C.muted }}>
          {wallet?.currency || "CAD"} {fmt(parseFloat(amount) || 0)} requested from {from} — logged as pending in your ledger.
        </div>
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
        <span style={{ fontSize: 24, color: C.muted, marginRight: 6, fontWeight: 300 }}>{wallet?.currency || "CAD"}</span>
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
      {error && <p style={{ color: C.red, fontSize: 12 }}>{error}</p>}
      <motion.button whileTap={{ scale: 0.97 }}
        onClick={() => parseFloat(amount) > 0 && from && handleSend()}
        disabled={saving}
        style={{ padding: "15px 0", borderRadius: 14,
          background: parseFloat(amount) > 0 && from
            ? `linear-gradient(135deg, ${C.blue}, #2556cc)` : "rgba(255,255,255,0.06)",
          border: "none", color: "#fff", fontWeight: 700, fontSize: 14,
          letterSpacing: "0.06em", cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
        {saving ? "SENDING…" : "SEND REQUEST"}
      </motion.button>
    </div>
  );
}

// ─── History tab — real transaction ledger from the backend ───────────────────
function HistoryTab({ wallet }) {
  const [txns,    setTxns]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [total,   setTotal]   = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await transactionsAPI.list();
      const list = Array.isArray(data) ? data : data?.items ?? [];
      setTxns(list);
      setTotal(list.filter(t => t.status === "success" && t.direction === "debit").reduce((s, t) => s + Number(t.amount), 0));
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: C.gold }}>TRANSACTIONS</div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={load}
          style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.05)",
            border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: C.muted }}>
          <Ico d={ICONS.refresh} size={13} />
        </motion.button>
      </div>
      <div style={{ borderRadius: 14, padding: "16px 18px",
        background: `linear-gradient(135deg, ${C.gold}18, ${C.gold}08)`,
        border: `1px solid ${C.gold}33`,
        display: "flex", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 10, color: C.gold, letterSpacing: "0.1em", marginBottom: 4 }}>TOTAL SPENT</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", fontFamily: "monospace" }}>
            {wallet?.currency || "CAD"} <BalanceCounter value={total} />
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
              background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}` }} />
          ))}
        </div>
      ) : txns.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: C.muted, fontSize: 13 }}>
          No transactions yet — send a payment or top up your wallet to get started.
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
                  background: t.status === "success" ? C.green + "18" : t.status === "pending" ? C.gold + "18" : C.red + "18",
                  border: `1px solid ${t.status === "success" ? C.green + "33" : t.status === "pending" ? C.gold + "33" : C.red + "33"}`,
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Ico d={t.status === "success" ? (t.direction === "credit" ? ICONS.receive : ICONS.arrow) : ICONS.error}
                    size={16} color={t.status === "success" ? C.green : t.status === "pending" ? C.gold : C.red} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{t.merchant}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>
                    {t.created_at?.slice(0, 10)} · {(t.method || "wallet").toUpperCase()}
                    {t.decline_reason ? ` · ${t.decline_reason.replace(/_/g, " ")}` : ""}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 14, fontWeight: 700,
                  color: t.status === "success" ? (t.direction === "credit" ? C.green : "#fff") : C.red,
                  fontFamily: "monospace" }}>
                  {t.direction === "credit" ? "+" : t.status === "failed" ? "–" : ""}{t.currency} {fmt(t.amount)}
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

// ─── Cards tab — real cards from backend, add new with a real form ────────────
function CardsTab({ wallet, cards, onCardsChanged }) {
  const [activeCard, setActiveCard] = useState(0);
  const [flipped,    setFlipped]    = useState(false);
  const [showAdd,    setShowAdd]    = useState(false);
  const [form,       setForm]       = useState({ label: "", last4: "", expiry_month: "", expiry_year: "", credit_limit: "" });
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState(null);

  const card = cards[activeCard];
  const usePct = card ? ((Number(card.spent) / Number(card.credit_limit)) * 100 || 0).toFixed(0) : 0;

  const handleAdd = async () => {
    if (!form.label || form.last4.length !== 4 || !form.expiry_month || !form.expiry_year || !form.credit_limit) {
      setError("Fill in all fields — last 4 digits must be exactly 4 numbers.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await walletAPI.addCard({
        ...form,
        last4: form.last4,
        expiry_month: parseInt(form.expiry_month, 10),
        expiry_year: parseInt(form.expiry_year, 10),
        credit_limit: parseFloat(form.credit_limit),
        currency: wallet?.currency || "CAD",
        is_primary: cards.length === 0,
      });
      setShowAdd(false);
      setForm({ label: "", last4: "", expiry_month: "", expiry_year: "", credit_limit: "" });
      onCardsChanged();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (cards.length === 0 && !showAdd) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "40px 0" }}>
        <Ico d={ICONS.card} size={36} color={C.muted} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 4 }}>No cards yet</div>
          <div style={{ fontSize: 12, color: C.muted }}>Add a card to track spend separately from your wallet balance.</div>
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowAdd(true)}
          style={{ padding: "12px 24px", borderRadius: 14, background: `linear-gradient(135deg, ${C.gold}, #a07830)`,
            border: "none", color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6 }}>
          <Ico d={ICONS.plus} size={14} color="#000" /> Add Card
        </motion.button>
      </div>
    );
  }

  if (showAdd) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <BackButton onClick={() => setShowAdd(false)} />
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: C.gold }}>ADD CARD</div>
        </div>
        {[
          { key: "label",        placeholder: "Card label, e.g. NovaPay Platinum" },
          { key: "last4",        placeholder: "Last 4 digits", maxLength: 4 },
          { key: "expiry_month", placeholder: "Expiry month (1-12)" },
          { key: "expiry_year",  placeholder: "Expiry year, e.g. 2030" },
          { key: "credit_limit", placeholder: "Credit limit" },
        ].map(f => (
          <input key={f.key}
            value={form[f.key]}
            maxLength={f.maxLength}
            onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
            placeholder={f.placeholder}
            style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)",
              border: `1px solid ${C.border}`, color: "#fff", fontSize: 13, outline: "none" }} />
        ))}
        {error && <p style={{ color: C.red, fontSize: 12 }}>{error}</p>}
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleAdd} disabled={saving}
          style={{ padding: "15px 0", borderRadius: 14, background: `linear-gradient(135deg, ${C.gold}, #a07830)`,
            border: "none", color: "#000", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
          {saving ? "SAVING…" : "SAVE CARD"}
        </motion.button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: C.gold }}>MY CARDS</div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowAdd(true)}
          style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.05)",
            border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: C.gold }}>
          <Ico d={ICONS.plus} size={13} />
        </motion.button>
      </div>
      <CreditCard card={card} flipped={flipped} onFlip={() => setFlipped(f => !f)} />
      <div style={{ fontSize: 10, color: C.sub, textAlign: "center", marginTop: -8 }}>Tap card to flip</div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        {cards.map((_, i) => (
          <motion.button key={i} whileTap={{ scale: 0.9 }}
            onClick={() => { setActiveCard(i); setFlipped(false); }}
            style={{ width: i === activeCard ? 24 : 8, height: 8, borderRadius: 4,
              background: i === activeCard ? C.gold : "rgba(255,255,255,0.2)",
              border: "none", cursor: "pointer", transition: "all 0.2s" }} />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { label: "AVAILABLE",     value: `${wallet?.currency || "CAD"} ${fmt(Number(card.credit_limit) - Number(card.spent))}`, color: C.green },
          { label: "CREDIT LIMIT",  value: `${wallet?.currency || "CAD"} ${fmt(card.credit_limit)}`,  color: C.gold },
          { label: "SPENT",         value: `${wallet?.currency || "CAD"} ${fmt(card.spent)}`,          color: "#fff" },
          { label: "UTILIZATION",   value: `${usePct}%`,                                                color: usePct > 70 ? C.red : C.gold },
        ].map(s => (
          <div key={s.label} style={{ padding: "14px", borderRadius: 12,
            background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.1em", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: s.color, fontFamily: "monospace" }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: "14px 16px", borderRadius: 12,
        background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 10, color: C.muted, letterSpacing: "0.1em" }}>CREDIT USAGE</span>
          <span style={{ fontSize: 10, color: usePct > 70 ? C.red : C.gold, fontWeight: 700 }}>{usePct}%</span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.08)" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${usePct}%` }}
            transition={{ duration: 1, ease: [0.16,1,0.3,1] }}
            style={{ height: "100%", borderRadius: 3,
              background: usePct > 70 ? `linear-gradient(90deg, ${C.red}, #ff6b6b)` : `linear-gradient(90deg, ${C.gold}, ${C.goldLight})` }} />
        </div>
      </div>
    </div>
  );
}

// ─── Top-up modal — the only legitimate way balance increases ─────────────────
function TopUpModal({ wallet, onClose, onDone }) {
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);

  const handleTopUp = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setError("Enter a valid amount."); return; }
    setSaving(true);
    setError(null);
    try {
      await walletAPI.topUp({ amount: amt, currency: wallet?.currency || "CAD", method: "manual" });
      onDone();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "absolute", inset: 0, zIndex: 10, background: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 16 }}
        onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 320, borderRadius: 18, background: C.surface,
          border: `1px solid ${C.border}`, padding: 22 }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: C.gold, marginBottom: 16 }}>
          TOP UP WALLET
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 20, color: C.muted, marginRight: 4 }}>{wallet?.currency || "CAD"}</span>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="0.00" autoFocus
            style={{ background: "none", border: "none", outline: "none",
              fontSize: 40, fontWeight: 800, color: "#fff", width: 140, textAlign: "center",
              fontFamily: "monospace" }} />
        </div>
        {error && <p style={{ color: C.red, fontSize: 12, marginBottom: 10 }}>{error}</p>}
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleTopUp} disabled={saving}
          style={{ width: "100%", padding: "14px 0", borderRadius: 12,
            background: `linear-gradient(135deg, ${C.gold}, #a07830)`,
            border: "none", color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
          {saving ? "PROCESSING…" : "ADD FUNDS"}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
const Fintech = ({ onClose }) => {
  const [tab,        setTab]        = useState("send");
  const [wallet,     setWallet]     = useState(null);
  const [cards,      setCards]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [showTopUp,  setShowTopUp]  = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadWallet = useCallback(async () => {
    try {
      const w = await walletAPI.get();
      setWallet(w);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  const loadCards = useCallback(async () => {
    try {
      const c = await walletAPI.cards();
      setCards(Array.isArray(c) ? c : []);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadWallet(), loadCards()]);
      setLoading(false);
    })();
  }, [loadWallet, loadCards]);

  const handleWalletChanged = useCallback(() => {
    loadWallet();
    setRefreshKey(k => k + 1);
  }, [loadWallet]);

  const handleCardsChanged = useCallback(() => {
    loadCards();
  }, [loadCards]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, bottom: "var(--taskbar-height, 52px)",
        zIndex: 50, background: C.bg,
        display: "flex", flexDirection: "column",
        fontFamily: "'SF Pro Display', '-apple-system', system-ui, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{
        padding: "16px 20px 14px", background: C.surface, borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
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
            <div style={{ fontSize: 10, color: C.gold, letterSpacing: "0.1em" }}>YOUR REAL WALLET</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setShowTopUp(true)}
            style={{ background: "none", border: `1px solid ${C.gold}44`, borderRadius: 8,
              padding: "4px 10px", color: C.gold, fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
            + TOP UP
          </button>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.1em" }}>BALANCE</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", fontFamily: "monospace" }}>
              <span style={{ fontSize: 10, color: C.gold, marginRight: 2 }}>{wallet?.currency || "CAD"}</span>
              {loading ? "···" : <BalanceCounter value={Number(wallet?.balance || 0)} />}
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

      {error && (
        <div style={{ padding: "10px 20px", background: C.red + "12", borderBottom: `1px solid ${C.red}33`,
          color: C.red, fontSize: 12, flexShrink: 0 }}>
          {error}
        </div>
      )}

      {/* Tab bar */}
      <div style={{ display: "flex", background: C.surface, borderBottom: `1px solid ${C.border}`, flexShrink: 0, padding: "0 8px" }}>
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <motion.button key={t.id} whileTap={{ scale: 0.95 }}
              onClick={() => setTab(t.id)}
              style={{ flex: 1, padding: "12px 8px 10px", display: "flex", flexDirection: "column",
                alignItems: "center", gap: 4, background: "none", border: "none",
                cursor: "pointer", position: "relative" }}>
              <Ico d={t.icon} size={17} color={active ? C.gold : C.sub} sw={active ? 2 : 1.5} />
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: active ? C.gold : C.sub }}>
                {t.label.toUpperCase()}
              </span>
              {active && (
                <motion.div layoutId="tabIndicator"
                  style={{ position: "absolute", bottom: 0, left: "20%", right: "20%",
                    height: 2, borderRadius: 1, background: `linear-gradient(90deg, ${C.gold}, ${C.goldLight})` }} />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px", scrollbarWidth: "none", position: "relative" }}>
        <AnimatePresence mode="wait">
          <motion.div key={tab}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.18 }}>
            {tab === "send"    && <SendTab wallet={wallet} cards={cards} onWalletChanged={handleWalletChanged} />}
            {tab === "request" && <RequestTab wallet={wallet} onWalletChanged={handleWalletChanged} />}
            {tab === "history" && <HistoryTab key={refreshKey} wallet={wallet} />}
            {tab === "cards"   && <CardsTab wallet={wallet} cards={cards} onCardsChanged={handleCardsChanged} />}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {showTopUp && (
            <TopUpModal
              wallet={wallet}
              onClose={() => setShowTopUp(false)}
              onDone={() => { setShowTopUp(false); handleWalletChanged(); }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div style={{
        padding: "10px 20px", borderTop: `1px solid ${C.border}`, background: C.surface,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6, flexShrink: 0,
      }}>
        <Ico d={ICONS.lock} size={11} color={C.muted} />
        <span style={{ fontSize: 10, color: C.sub, letterSpacing: "0.08em" }}>
          REAL LEDGER · NOT A BANK · YOUR DATA, YOUR DATABASE
        </span>
      </div>
    </motion.div>
  );
};

export default Fintech;