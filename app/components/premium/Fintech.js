"use client";
/**
 * Fintech.js — NovaPay Finance OS
 * Mobile-first. Every touch target >= 44px. Thumb-zone navigation at bottom.
 * Responsive from 320px phones to 1280px desktop. Real-life finance app feel.
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:       "#07090F",
  surface:  "#0E1118",
  card:     "#131720",
  raised:   "#1A2030",
  border:   "rgba(255,255,255,0.06)",
  borderHi: "rgba(255,255,255,0.12)",
  paper:    "#F0EDE8",
  sub:      "#8A9BB0",
  muted:    "rgba(138,155,176,0.5)",
  gold:     "#D4A843",
  goldLt:   "#F0C96A",
  goldBg:   "rgba(212,168,67,0.1)",
  goldBdr:  "rgba(212,168,67,0.25)",
  green:    "#2DD87A",
  greenBg:  "rgba(45,216,122,0.1)",
  greenBdr: "rgba(45,216,122,0.25)",
  red:      "#F05454",
  redBg:    "rgba(240,84,84,0.08)",
  redBdr:   "rgba(240,84,84,0.2)",
  violet:   "#9B8CFF",
  violetBg: "rgba(155,140,255,0.1)",
  violetBdr:"rgba(155,140,255,0.25)",
  blue:     "#5BA4F5",
  sans:     "-apple-system, 'SF Pro Display', 'Inter', system-ui, sans-serif",
  mono:     "'SF Mono', 'JetBrains Mono', monospace",
};

// ── Responsive hook ───────────────────────────────────────────────────────────
function useWidth() {
  const [w, setW] = useState(375);
  useEffect(() => {
    const update = () => setW(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return w;
}

const bp = (w) => ({
  xs:  w < 380,
  sm:  w < 480,
  md:  w < 768,
  lg:  w >= 768,
});

// ── API helpers ───────────────────────────────────────────────────────────────
async function api(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || `Error ${res.status}`);
  return json.data ?? json;
}
const get  = (p)    => api(p);
const post = (p, b) => api(p, { method: "POST",   body: JSON.stringify(b) });
const del  = (p)    => api(p, { method: "DELETE" });

const fmt = (n, cur = "CAD") =>
  `$${Number(n || 0).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtK = (n) => {
  const v = Number(n || 0);
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
  return `$${v.toFixed(0)}`;
};

// ── Spinner ───────────────────────────────────────────────────────────────────
const Spin = ({ size = 18, color = C.gold }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", border: `2px solid ${color}40`, borderTopColor: color, animation: "nova-spin 0.75s linear infinite", flexShrink: 0 }} />
);

// ── Input — styled, visible, accessible ──────────────────────────────────────
const Input = ({ value, onChange, placeholder, type = "text", onKeyDown, autoFocus }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    onKeyDown={onKeyDown}
    autoFocus={autoFocus}
    style={{
      width: "100%", boxSizing: "border-box",
      padding: "14px 16px", borderRadius: 14,
      background: C.raised, border: `1.5px solid ${C.border}`,
      color: C.paper, fontSize: 16, fontFamily: C.sans,
      outline: "none", WebkitAppearance: "none",
      caretColor: C.gold,
      transition: "border-color 0.15s",
    }}
    onFocus={e => { e.target.style.borderColor = C.goldBdr; }}
    onBlur={e => { e.target.style.borderColor = C.border; }}
  />
);

const Select = ({ value, onChange, children }) => (
  <select value={value} onChange={onChange}
    style={{ width: "100%", boxSizing: "border-box", padding: "14px 16px", borderRadius: 14, background: C.raised, border: `1.5px solid ${C.border}`, color: C.paper, fontSize: 16, fontFamily: C.sans, outline: "none", WebkitAppearance: "none" }}>
    {children}
  </select>
);

// ── Primary button ─────────────────────────────────────────────────────────────
const PrimaryBtn = ({ onClick, children, color = C.gold, disabled, loading }) => (
  <motion.button whileTap={disabled ? {} : { scale: 0.97 }} onClick={onClick} disabled={disabled || loading}
    style={{
      width: "100%", padding: "16px", borderRadius: 16, border: "none",
      background: disabled || loading ? C.raised : `linear-gradient(135deg, ${color}, ${color}cc)`,
      color: disabled || loading ? C.muted : "#000",
      fontSize: 16, fontWeight: 700, fontFamily: C.sans,
      cursor: disabled || loading ? "not-allowed" : "pointer",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      minHeight: 52,
    }}>
    {loading ? <Spin size={18} color="#000" /> : children}
  </motion.button>
);

// ── Ghost button ───────────────────────────────────────────────────────────────
const GhostBtn = ({ onClick, children, color = C.gold, small }) => (
  <motion.button whileTap={{ scale: 0.95 }} onClick={onClick}
    style={{
      padding: small ? "8px 14px" : "12px 18px", borderRadius: 12, border: `1.5px solid ${color}40`,
      background: color + "10", color: color, fontSize: small ? 13 : 14,
      fontWeight: 600, fontFamily: C.sans, cursor: "pointer",
      display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
      minHeight: small ? 36 : 44,
    }}>
    {children}
  </motion.button>
);

// ── Pill / Tag ─────────────────────────────────────────────────────────────────
const Tag = ({ label, color }) => (
  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", color, background: color + "18", border: `1px solid ${color}33`, borderRadius: 20, padding: "3px 8px", fontFamily: C.mono, whiteSpace: "nowrap" }}>
    {label}
  </span>
);

// ── Progress bar ──────────────────────────────────────────────────────────────
const ProgressBar = ({ pct, color }) => (
  <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, pct)}%` }}
      transition={{ duration: 0.8, ease: [0.16,1,0.3,1] }}
      style={{ height: "100%", borderRadius: 3, background: color }} />
  </div>
);

// ── Section header row ─────────────────────────────────────────────────────────
const SectionHead = ({ label, action }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
    <p style={{ fontFamily: C.mono, fontSize: 10, color: C.muted, letterSpacing: "0.1em", margin: 0 }}>{label}</p>
    {action}
  </div>
);

// ── Divider ───────────────────────────────────────────────────────────────────
const Divider = () => <div style={{ height: 1, background: C.border, margin: "4px 0" }} />;

// ── Empty state ───────────────────────────────────────────────────────────────
const Empty = ({ icon, title, sub }) => (
  <div style={{ textAlign: "center", padding: "32px 20px" }}>
    <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
    <p style={{ color: C.paper, fontSize: 15, fontWeight: 600, margin: "0 0 6px" }}>{title}</p>
    <p style={{ color: C.sub, fontSize: 13, margin: 0, lineHeight: 1.6 }}>{sub}</p>
  </div>
);

// ── Skeleton loader ───────────────────────────────────────────────────────────
const Skeleton = ({ h = 72, r = 16 }) => (
  <div style={{ height: h, borderRadius: r, background: C.raised, animation: "nova-pulse 1.4s ease-in-out infinite" }} />
);

// ── Animated free balance ─────────────────────────────────────────────────────
function FreeBalance({ value }) {
  const [d, setD] = useState(value);
  useEffect(() => {
    const diff = value - d;
    if (Math.abs(diff) < 0.01) { setD(value); return; }
    let f = 0, total = 36;
    const id = setInterval(() => {
      f++;
      setD(d + diff * (1 - Math.pow(1 - f / total, 3)));
      if (f >= total) { setD(value); clearInterval(id); }
    }, 16);
    return () => clearInterval(id);
  }, [value]);
  const dollars = Math.floor(Math.abs(d)).toLocaleString("en-CA");
  const cents   = (Math.abs(d) % 1).toFixed(2).slice(1);
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 4, lineHeight: 1 }}>
      <span style={{ fontSize: 22, color: C.green, marginTop: 8, fontWeight: 300 }}>$</span>
      <span style={{ fontSize: 56, fontWeight: 800, color: C.green, fontVariantNumeric: "tabular-nums", letterSpacing: "-2px" }}>{dollars}</span>
      <span style={{ fontSize: 24, color: C.green, marginTop: 10, opacity: 0.7 }}>{cents}</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// OVERVIEW TAB
// ══════════════════════════════════════════════════════════════════════════════
function OverviewTab({ summary, envelopes, w }) {
  const b = bp(w);
  if (!summary) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {[120, 80, 80, 80].map((h, i) => <Skeleton key={i} h={h} />)}
    </div>
  );

  const free     = summary.free_balance ?? 0;
  const wallet   = summary.wallet_balance ?? 0;
  const bills    = summary.committed_before_pay ?? 0;
  const saving   = summary.envelope_per_cycle ?? 0;
  const days     = summary.days_to_pay;
  const nextAmt  = summary.next_pay_amount ?? 0;
  const nextDate = summary.next_pay_date;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Free balance hero card */}
      <div style={{ borderRadius: 24, padding: "28px 24px", background: `linear-gradient(160deg, #0D1A1A 0%, #071210 100%)`, border: `1px solid ${C.greenBdr}`, textAlign: "center" }}>
        <p style={{ fontFamily: C.mono, fontSize: 10, color: C.green, letterSpacing: "0.14em", marginBottom: 16, opacity: 0.7 }}>YOURS TO SPEND FREELY</p>
        <FreeBalance value={free} />
        <p style={{ color: C.sub, fontSize: 13, marginTop: 10 }}>after all bills & savings are set aside</p>
        <div style={{ height: 1, background: C.border, margin: "20px 0" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[
            { label: "In wallet", val: fmt(wallet), color: C.paper },
            { label: "Bills due", val: fmt(bills),  color: C.red   },
            { label: "Saving",    val: fmt(saving), color: C.violet},
          ].map(s => (
            <div key={s.label}>
              <p style={{ fontFamily: C.mono, fontSize: 9, color: C.muted, letterSpacing: "0.08em", marginBottom: 4 }}>{s.label.toUpperCase()}</p>
              <p style={{ fontFamily: C.mono, fontSize: b.xs ? 12 : 14, fontWeight: 700, color: s.color, margin: 0 }}>{s.val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Next paycheck */}
      {nextDate && (
        <div style={{ borderRadius: 20, padding: "18px 20px", background: C.greenBg, border: `1px solid ${C.greenBdr}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontFamily: C.mono, fontSize: 10, color: C.green, letterSpacing: "0.1em", marginBottom: 6, opacity: 0.8 }}>NEXT PAYCHECK</p>
            <p style={{ fontSize: b.xs ? 20 : 24, fontWeight: 800, color: C.paper, margin: 0, fontVariantNumeric: "tabular-nums" }}>{fmt(nextAmt)}</p>
            <p style={{ color: C.sub, fontSize: 12, marginTop: 4 }}>{nextDate}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: b.xs ? 40 : 52, fontWeight: 900, color: C.green, margin: 0, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{days}</p>
            <p style={{ color: C.sub, fontSize: 11, marginTop: 2 }}>day{days !== 1 ? "s" : ""} away</p>
          </div>
        </div>
      )}

      {/* Bills due before payday */}
      {summary.bills_before_pay?.length > 0 && (
        <div style={{ borderRadius: 20, overflow: "hidden", border: `1px solid ${C.border}`, background: C.surface }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}` }}>
            <p style={{ fontFamily: C.mono, fontSize: 10, color: C.red, letterSpacing: "0.1em", margin: 0, opacity: 0.9 }}>DUE BEFORE PAYDAY</p>
          </div>
          {summary.bills_before_pay.map((b, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: i < summary.bills_before_pay.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: C.redBg, border: `1px solid ${C.redBdr}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                  💸
                </div>
                <div>
                  <p style={{ color: C.paper, fontSize: 15, fontWeight: 500, margin: 0 }}>{b.name}</p>
                  <p style={{ color: C.sub, fontSize: 12, margin: "2px 0 0", fontFamily: C.mono }}>{b.due}</p>
                </div>
              </div>
              <p style={{ fontFamily: C.mono, fontSize: 16, fontWeight: 700, color: C.red, margin: 0 }}>{fmt(b.amount)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Envelope rings */}
      {envelopes?.length > 0 && (
        <div style={{ borderRadius: 20, overflow: "hidden", border: `1px solid ${C.border}`, background: C.surface }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}` }}>
            <p style={{ fontFamily: C.mono, fontSize: 10, color: C.muted, letterSpacing: "0.1em", margin: 0 }}>SAVINGS GOALS</p>
          </div>
          {envelopes.map((e, i) => {
            const pct = Math.min(100, (e.saved / e.target_total) * 100);
            return (
              <div key={e.id} style={{ padding: "14px 18px", borderBottom: i < envelopes.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 22 }}>{e.emoji}</span>
                    <p style={{ color: C.paper, fontSize: 15, fontWeight: 500, margin: 0 }}>{e.name}</p>
                  </div>
                  <p style={{ fontFamily: C.mono, fontSize: 13, color: e.color || C.violet, margin: 0 }}>{Math.round(pct)}%</p>
                </div>
                <ProgressBar pct={pct} color={e.color || C.violet} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  <p style={{ color: C.sub, fontSize: 12, margin: 0, fontFamily: C.mono }}>{fmt(e.saved)} saved</p>
                  <p style={{ color: C.sub, fontSize: 12, margin: 0, fontFamily: C.mono }}>goal {fmt(e.target_total)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!nextDate && !summary.bills_before_pay?.length && (
        <Empty icon="💡" title="Set up your finances" sub="Go to Bills to add your pay schedule and recurring bills — then come back to see your real free balance." />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TIMELINE TAB
// ══════════════════════════════════════════════════════════════════════════════
function TimelineTab({ timeline }) {
  if (!timeline) return <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{[1,2,3,4].map(i => <Skeleton key={i} h={80} />)}</div>;
  if (!timeline.length) return <Empty icon="📅" title="No upcoming events" sub="Add a pay schedule and bills to see your 6-week financial forecast." />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ padding: "12px 16px", borderRadius: 16, background: C.surface, border: `1px solid ${C.border}` }}>
        <p style={{ color: C.sub, fontSize: 13, margin: 0, lineHeight: 1.5 }}>
          Your next 6 weeks — income, bills, and your running balance after each event.
        </p>
      </div>
      {timeline.map((day, i) => (
        <div key={i} style={{ borderRadius: 18, background: C.surface, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: C.card, borderBottom: `1px solid ${C.border}` }}>
            <p style={{ fontFamily: C.mono, fontSize: 12, color: C.sub, margin: 0 }}>{day.date}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <p style={{ fontFamily: C.mono, fontSize: 12, color: C.paper, margin: 0 }}>balance</p>
              <p style={{ fontFamily: C.mono, fontSize: 14, fontWeight: 700, color: day.balance > 0 ? C.green : C.red, margin: 0 }}>{fmt(day.balance)}</p>
            </div>
          </div>
          {day.events.map((ev, j) => (
            <div key={j} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderBottom: j < day.events.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: ev.type === "income" ? C.greenBg : C.redBg, border: `1px solid ${ev.type === "income" ? C.greenBdr : C.redBdr}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                {ev.type === "income" ? "💵" : "📋"}
              </div>
              <p style={{ flex: 1, color: C.paper, fontSize: 15, margin: 0, fontWeight: 500 }}>{ev.label}</p>
              <p style={{ fontFamily: C.mono, fontSize: 15, fontWeight: 700, color: ev.type === "income" ? C.green : C.red, margin: 0 }}>
                {ev.type === "income" ? "+" : "−"}{fmt(ev.amount)}
              </p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// BILLS TAB
// ══════════════════════════════════════════════════════════════════════════════
function BillsTab({ bills, schedules, onRefresh }) {
  const [addingBill,    setAddingBill]    = useState(false);
  const [addingPay,     setAddingPay]     = useState(false);
  const [billForm,      setBillForm]      = useState({ name: "", amount: "", due_day: "", category: "other" });
  const [payForm,       setPayForm]       = useState({ label: "Main Job", amount: "", frequency: "biweekly", next_pay_date: "" });
  const [busy,          setBusy]          = useState(false);
  const [err,           setErr]           = useState("");

  const CATS = [
    { id: "rent",         label: "Rent / Mortgage", emoji: "🏠" },
    { id: "utilities",    label: "Utilities",        emoji: "⚡" },
    { id: "phone",        label: "Phone",            emoji: "📱" },
    { id: "subscription", label: "Subscription",     emoji: "🔄" },
    { id: "insurance",    label: "Insurance",        emoji: "🛡️" },
    { id: "transport",    label: "Transport",        emoji: "🚌" },
    { id: "groceries",    label: "Groceries",        emoji: "🛒" },
    { id: "other",        label: "Other",            emoji: "💸" },
  ];

  const addBill = async () => {
    if (!billForm.name || !billForm.amount || !billForm.due_day) { setErr("Fill in all fields."); return; }
    setBusy(true); setErr("");
    try {
      const cat = CATS.find(c => c.id === billForm.category);
      await post("/api/v1/finance/bills", { ...billForm, amount: parseFloat(billForm.amount), due_day: parseInt(billForm.due_day), emoji: cat?.emoji || "💸" });
      setBillForm({ name: "", amount: "", due_day: "", category: "other" });
      setAddingBill(false); onRefresh();
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const addSchedule = async () => {
    if (!payForm.amount || !payForm.next_pay_date) { setErr("Fill in all fields."); return; }
    setBusy(true); setErr("");
    try {
      await post("/api/v1/finance/schedules", { ...payForm, amount: parseFloat(payForm.amount) });
      setPayForm({ label: "Main Job", amount: "", frequency: "biweekly", next_pay_date: "" });
      setAddingPay(false); onRefresh();
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const FormSheet = ({ title, onSave, onCancel, children }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      style={{ borderRadius: 24, background: C.card, border: `1px solid ${C.borderHi}`, padding: 20, marginBottom: 12 }}>
      <p style={{ fontFamily: C.mono, fontSize: 11, color: C.gold, letterSpacing: "0.1em", marginBottom: 16 }}>{title}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {children}
        {err && <p style={{ color: C.red, fontSize: 13, margin: 0 }}>{err}</p>}
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <PrimaryBtn onClick={onSave} loading={busy}>Save</PrimaryBtn>
          <GhostBtn onClick={onCancel}>Cancel</GhostBtn>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>

      {/* Income schedules */}
      <SectionHead label="INCOME SCHEDULE" action={
        <GhostBtn small onClick={() => { setAddingPay(v => !v); setAddingBill(false); setErr(""); }}>+ Add income</GhostBtn>
      } />
      <AnimatePresence>
        {addingPay && (
          <FormSheet title="ADD INCOME SOURCE" onSave={addSchedule} onCancel={() => setAddingPay(false)}>
            <Input value={payForm.label} onChange={e => setPayForm(p => ({...p, label: e.target.value}))} placeholder="Label e.g. Main Job" />
            <Input value={payForm.amount} onChange={e => setPayForm(p => ({...p, amount: e.target.value}))} placeholder="Net pay amount" type="number" />
            <Input value={payForm.next_pay_date} onChange={e => setPayForm(p => ({...p, next_pay_date: e.target.value}))} placeholder="Next pay date" type="date" />
            <Select value={payForm.frequency} onChange={e => setPayForm(p => ({...p, frequency: e.target.value}))}>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Every 2 weeks</option>
              <option value="semimonthly">Twice a month</option>
              <option value="monthly">Monthly</option>
            </Select>
          </FormSheet>
        )}
      </AnimatePresence>

      {schedules?.length === 0 && !addingPay ? (
        <div style={{ borderRadius: 18, background: C.surface, border: `1.5px dashed ${C.border}`, padding: "24px 20px", textAlign: "center", marginBottom: 8 }}>
          <p style={{ color: C.sub, fontSize: 14, margin: 0 }}>No income added yet — tap + to set up your pay schedule</p>
        </div>
      ) : (
        schedules?.map(s => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderRadius: 18, background: C.surface, border: `1px solid ${C.border}`, marginBottom: 4 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: C.greenBg, border: `1px solid ${C.greenBdr}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>💵</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: C.paper, fontSize: 15, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.label}</p>
              <p style={{ color: C.sub, fontSize: 12, margin: "2px 0 0", fontFamily: C.mono }}>{s.frequency} · next {s.next_pay_date}</p>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <p style={{ fontFamily: C.mono, fontSize: 16, fontWeight: 700, color: C.green, margin: 0 }}>{fmt(s.amount)}</p>
              <button onClick={() => { del(`/api/v1/finance/schedules/${s.id}`).then(onRefresh); }}
                style={{ background: "none", border: "none", color: C.muted, fontSize: 11, cursor: "pointer", padding: "4px 0", fontFamily: C.sans }}>
                Remove
              </button>
            </div>
          </div>
        ))
      )}

      <div style={{ height: 12 }} />

      {/* Bills */}
      <SectionHead label="RECURRING BILLS" action={
        <GhostBtn small onClick={() => { setAddingBill(v => !v); setAddingPay(false); setErr(""); }}>+ Add bill</GhostBtn>
      } />
      <AnimatePresence>
        {addingBill && (
          <FormSheet title="ADD RECURRING BILL" onSave={addBill} onCancel={() => setAddingBill(false)}>
            <Input value={billForm.name} onChange={e => setBillForm(p => ({...p, name: e.target.value}))} placeholder="Bill name e.g. Rent" />
            <Input value={billForm.amount} onChange={e => setBillForm(p => ({...p, amount: e.target.value}))} placeholder="Amount" type="number" />
            <Input value={billForm.due_day} onChange={e => setBillForm(p => ({...p, due_day: e.target.value}))} placeholder="Day of month it's due (1–31)" type="number" />
            <Select value={billForm.category} onChange={e => setBillForm(p => ({...p, category: e.target.value}))}>
              {CATS.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
            </Select>
          </FormSheet>
        )}
      </AnimatePresence>

      {bills?.length === 0 && !addingBill ? (
        <div style={{ borderRadius: 18, background: C.surface, border: `1.5px dashed ${C.border}`, padding: "24px 20px", textAlign: "center" }}>
          <p style={{ color: C.sub, fontSize: 14, margin: 0 }}>No bills yet — add rent, phone, subscriptions and more</p>
        </div>
      ) : (
        bills?.map((b, i) => {
          const suffix = ["st","nd","rd"][b.due_day-1] || "th";
          return (
            <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderRadius: 18, background: C.surface, border: `1px solid ${C.border}`, marginBottom: 4 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: C.redBg, border: `1px solid ${C.redBdr}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                {b.emoji}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: C.paper, fontSize: 15, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</p>
                <p style={{ color: C.sub, fontSize: 12, margin: "2px 0 0" }}>Due {b.due_day}{suffix} · {b.category}</p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ fontFamily: C.mono, fontSize: 16, fontWeight: 700, color: C.red, margin: 0 }}>{fmt(b.amount)}</p>
                <button onClick={() => { del(`/api/v1/finance/bills/${b.id}`).then(onRefresh); }}
                  style={{ background: "none", border: "none", color: C.muted, fontSize: 11, cursor: "pointer", padding: "4px 0", fontFamily: C.sans }}>
                  Remove
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ENVELOPES TAB
// ══════════════════════════════════════════════════════════════════════════════
function EnvelopesTab({ envelopes, onRefresh }) {
  const [showAdd,      setShowAdd]      = useState(false);
  const [contributing, setContributing] = useState(null);
  const [contribAmt,   setContribAmt]   = useState("");
  const [form,         setForm]         = useState({ name: "", target_total: "", per_cycle: "", emoji: "🎯", color: "#a78bfa" });
  const [busy,         setBusy]         = useState(false);
  const [err,          setErr]          = useState("");

  const PRESETS = [
    { emoji: "✈️", label: "Travel",    color: "#60a5fa" },
    { emoji: "🏠", label: "Housing",   color: "#34d399" },
    { emoji: "🚨", label: "Emergency", color: "#f87171" },
    { emoji: "💻", label: "Tech",      color: "#fbbf24" },
    { emoji: "🎓", label: "Education", color: "#e879f9" },
    { emoji: "🎯", label: "Goal",      color: "#a78bfa" },
  ];

  const addEnvelope = async () => {
    if (!form.name || !form.target_total || !form.per_cycle) { setErr("Fill in all fields."); return; }
    setBusy(true); setErr("");
    try {
      await post("/api/v1/finance/envelopes", { ...form, target_total: parseFloat(form.target_total), per_cycle: parseFloat(form.per_cycle) });
      setForm({ name: "", target_total: "", per_cycle: "", emoji: "🎯", color: "#a78bfa" });
      setShowAdd(false); onRefresh();
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const contribute = async (id) => {
    if (!contribAmt || parseFloat(contribAmt) <= 0) return;
    await post(`/api/v1/finance/envelopes/${id}/contribute`, { amount: parseFloat(contribAmt) });
    setContributing(null); setContribAmt(""); onRefresh();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <SectionHead label="SAVINGS ENVELOPES" action={
        <GhostBtn small onClick={() => setShowAdd(v => !v)}>+ New goal</GhostBtn>
      } />

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            style={{ borderRadius: 24, background: C.card, border: `1px solid ${C.borderHi}`, padding: 20 }}>
            <p style={{ fontFamily: C.mono, fontSize: 11, color: C.gold, letterSpacing: "0.1em", marginBottom: 16 }}>NEW SAVINGS GOAL</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              {PRESETS.map(p => (
                <motion.button key={p.emoji} whileTap={{ scale: 0.92 }}
                  onClick={() => setForm(f => ({ ...f, emoji: p.emoji, color: p.color, name: f.name || p.label }))}
                  style={{ padding: "8px 14px", borderRadius: 12, minHeight: 44, background: form.emoji === p.emoji ? p.color + "20" : C.raised, border: `1.5px solid ${form.emoji === p.emoji ? p.color + "50" : C.border}`, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: C.paper }}>
                  {p.emoji} <span style={{ fontSize: 12, color: C.sub }}>{p.label}</span>
                </motion.button>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="Goal name" />
              <Input value={form.target_total} onChange={e => setForm(p => ({...p, target_total: e.target.value}))} placeholder="Target amount" type="number" />
              <Input value={form.per_cycle} onChange={e => setForm(p => ({...p, per_cycle: e.target.value}))} placeholder="Save per pay cycle" type="number" />
              {err && <p style={{ color: C.red, fontSize: 13, margin: 0 }}>{err}</p>}
              <div style={{ display: "flex", gap: 10 }}>
                <PrimaryBtn onClick={addEnvelope} loading={busy} color={form.color}>Create</PrimaryBtn>
                <GhostBtn onClick={() => setShowAdd(false)}>Cancel</GhostBtn>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {envelopes?.length === 0 && !showAdd && (
        <Empty icon="🫙" title="No savings goals yet" sub="Create an envelope for each thing you're saving toward — travel, emergency fund, new laptop, anything." />
      )}

      {envelopes?.map(e => {
        const pct = Math.min(100, (e.saved / e.target_total) * 100);
        const isContributing = contributing === e.id;
        return (
          <div key={e.id} style={{ borderRadius: 22, background: C.surface, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: (e.color || C.violet) + "18", border: `1.5px solid ${(e.color || C.violet) + "40"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
                  {e.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: C.paper, fontSize: 16, fontWeight: 600, margin: 0 }}>{e.name}</p>
                  <p style={{ color: e.color || C.violet, fontSize: 12, margin: "2px 0 0", fontFamily: C.mono }}>{fmt(e.per_cycle)} / cycle</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontFamily: C.mono, fontSize: 16, fontWeight: 700, color: e.color || C.violet, margin: 0 }}>{Math.round(pct)}%</p>
                  <button onClick={() => { del(`/api/v1/finance/envelopes/${e.id}`).then(onRefresh); }}
                    style={{ background: "none", border: "none", color: C.muted, fontSize: 11, cursor: "pointer", padding: "2px 0", fontFamily: C.sans }}>
                    Remove
                  </button>
                </div>
              </div>
              <ProgressBar pct={pct} color={e.color || C.violet} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, marginBottom: 14 }}>
                <p style={{ fontFamily: C.mono, fontSize: 13, color: C.sub, margin: 0 }}>{fmt(e.saved)} saved</p>
                <p style={{ fontFamily: C.mono, fontSize: 13, color: C.sub, margin: 0 }}>goal {fmt(e.target_total)}</p>
              </div>
              {isContributing ? (
                <div style={{ display: "flex", gap: 10 }}>
                  <Input value={contribAmt} onChange={ev => setContribAmt(ev.target.value)} placeholder="Amount to add" type="number" autoFocus />
                  <GhostBtn onClick={() => contribute(e.id)} color={e.color || C.violet}>Add</GhostBtn>
                  <GhostBtn onClick={() => { setContributing(null); setContribAmt(""); }}>✕</GhostBtn>
                </div>
              ) : (
                <GhostBtn onClick={() => setContributing(e.id)} color={e.color || C.violet}>+ Contribute</GhostBtn>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CARD TAB
// ══════════════════════════════════════════════════════════════════════════════
function CardTab({ card, summary, onRefresh, w }) {
  const b = bp(w);
  const [flipped,    setFlipped]    = useState(false);
  const [showSpend,  setShowSpend]  = useState(false);
  const [merchant,   setMerchant]   = useState("");
  const [amount,     setAmount]     = useState("");
  const [busy,       setBusy]       = useState(false);
  const [toast,      setToast]      = useState(null);
  const [err,        setErr]        = useState("");

  if (!card) return <div style={{ display: "flex", flexDirection: "column", gap: 12 }}><Skeleton h={220} /><Skeleton h={56} /><Skeleton h={56} /></div>;

  const expStr = `${String(card.expiry_month).padStart(2,"0")}/${String(card.expiry_year).slice(-2)}`;
  const numStr = card.number
    ? `${card.number.slice(0,4)} ${card.number.slice(4,8)} ${card.number.slice(8,12)} ${card.number.slice(12)}`
    : "**** **** **** ****";

  const freeze = async () => {
    await post(`/api/v1/finance/card/${card.id}/freeze`, {});
    onRefresh();
  };

  const spend = async () => {
    if (!merchant.trim() || !parseFloat(amount)) { setErr("Fill in both fields."); return; }
    setBusy(true); setErr("");
    try {
      await post(`/api/v1/finance/card/${card.id}/spend`, { merchant, amount: parseFloat(amount) });
      setToast(`${fmt(parseFloat(amount))} logged at ${merchant}`);
      setMerchant(""); setAmount(""); setShowSpend(false); onRefresh();
      setTimeout(() => setToast(null), 3000);
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const cardW = Math.min(420, w - 40);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            style={{ position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)", zIndex: 200, background: C.greenBg, border: `1px solid ${C.greenBdr}`, borderRadius: 16, padding: "12px 20px", color: C.green, fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
            ✓ {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Virtual card — 3D flip */}
      <div style={{ width: cardW, perspective: 1000, cursor: "pointer" }} onClick={() => setFlipped(f => !f)}>
        <motion.div animate={{ rotateY: flipped ? 180 : 0 }} transition={{ type: "spring", damping: 22, stiffness: 180 }}
          style={{ transformStyle: "preserve-3d", position: "relative", height: Math.round(cardW * 0.6) }}>

          {/* Front */}
          <div style={{
            position: "absolute", inset: 0, backfaceVisibility: "hidden", borderRadius: 24,
            background: card.is_frozen
              ? "linear-gradient(145deg, #111520, #0a0e18)"
              : "linear-gradient(145deg, #1C2D50 0%, #0E1A38 40%, #17233A 100%)",
            border: `1.5px solid ${card.is_frozen ? "rgba(255,255,255,0.06)" : C.goldBdr}`,
            boxShadow: card.is_frozen ? "0 12px 40px rgba(0,0,0,0.5)" : `0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px ${C.gold}15, inset 0 1px 0 ${C.gold}20`,
            padding: "22px 26px", display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden",
          }}>
            {card.is_frozen && (
              <div style={{ position: "absolute", inset: 0, borderRadius: 24, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>❄️</div>
                  <p style={{ fontFamily: C.mono, fontSize: 14, color: C.sub, letterSpacing: "0.2em", margin: 0 }}>FROZEN</p>
                </div>
              </div>
            )}
            {/* Shimmer */}
            <div style={{ position: "absolute", inset: 0, borderRadius: 24, background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%, rgba(255,255,255,0.02) 100%)", pointerEvents: "none" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ fontFamily: C.mono, fontSize: 9, color: C.gold, letterSpacing: "0.22em", margin: 0, opacity: 0.9 }}>NOVAPAY</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.paper, margin: "3px 0 0", letterSpacing: "0.04em" }}>Finance OS</p>
              </div>
              <div style={{ width: 40, height: 30, borderRadius: 6, background: `linear-gradient(135deg, ${C.gold}dd, ${C.gold}88)`, border: `1px solid ${C.gold}90` }} />
            </div>
            <div>
              <p style={{ fontFamily: C.mono, fontSize: b.xs ? 13 : 15, color: C.paper, letterSpacing: "0.18em", margin: "0 0 14px" }}>{numStr}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <p style={{ fontFamily: C.mono, fontSize: 8, color: C.gold, letterSpacing: "0.12em", margin: "0 0 3px", opacity: 0.8 }}>FREE BALANCE</p>
                  <p style={{ fontFamily: C.mono, fontSize: b.xs ? 13 : 15, fontWeight: 700, color: C.paper, margin: 0 }}>{fmt(summary?.free_balance || 0)}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontFamily: C.mono, fontSize: 8, color: C.gold, letterSpacing: "0.12em", margin: "0 0 3px", opacity: 0.8 }}>EXPIRES</p>
                  <p style={{ fontFamily: C.mono, fontSize: b.xs ? 13 : 15, fontWeight: 600, color: C.paper, margin: 0 }}>{expStr}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Back */}
          <div style={{
            position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)",
            borderRadius: 24, background: "linear-gradient(145deg, #1C2D50, #0E1A38)",
            border: `1.5px solid ${C.goldBdr}`, overflow: "hidden",
          }}>
            <div style={{ height: 50, background: "#000", marginTop: "22%" }} />
            <div style={{ padding: "16px 26px" }}>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                <div style={{ background: "rgba(255,255,255,0.08)", padding: "6px 14px", borderRadius: 6 }}>
                  <p style={{ fontFamily: C.mono, fontSize: 16, color: C.paper, margin: 0, letterSpacing: "0.1em" }}>{card.cvv}</p>
                </div>
              </div>
              <p style={{ color: C.sub, fontSize: 11, lineHeight: 1.6, margin: 0 }}>
                Virtual spending tracker. Not a real card network. Logs your real-world spending against your free balance.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
      <p style={{ fontFamily: C.mono, fontSize: 10, color: C.muted, textAlign: "center" }}>Tap to flip · CVV on back</p>

      {/* Card actions */}
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
        <PrimaryBtn onClick={() => { setShowSpend(v => !v); setErr(""); }}>
          💳 Log a spend
        </PrimaryBtn>
        <PrimaryBtn onClick={freeze} color={card.is_frozen ? C.green : C.red}>
          {card.is_frozen ? "❄️ Unfreeze card" : "🔒 Freeze card"}
        </PrimaryBtn>
      </div>

      {/* Spend form */}
      <AnimatePresence>
        {showSpend && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ width: "100%", overflow: "hidden" }}>
            <div style={{ borderRadius: 22, background: C.card, border: `1px solid ${C.borderHi}`, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ fontFamily: C.mono, fontSize: 10, color: C.gold, letterSpacing: "0.1em", margin: 0 }}>LOG SPEND · DEDUCTS FROM FREE BALANCE</p>
              <Input value={merchant} onChange={e => setMerchant(e.target.value)} placeholder="Where? (merchant name)" />
              <Input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" type="number" />
              {err && <p style={{ color: C.red, fontSize: 13, margin: 0 }}>{err}</p>}
              <PrimaryBtn onClick={spend} loading={busy}>Confirm spend</PrimaryBtn>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card stats */}
      <div style={{ width: "100%", borderRadius: 20, background: C.surface, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        {[
          { label: "Card number", value: `···· ${card.last4}`, color: C.paper },
          { label: "Spent today",  value: fmt(card.spent_today), color: card.spent_today > 0 ? C.red : C.sub },
          { label: "Status",       value: card.is_frozen ? "FROZEN" : "ACTIVE", color: card.is_frozen ? C.sub : C.green },
        ].map((r, i) => (
          <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: i < 2 ? `1px solid ${C.border}` : "none" }}>
            <p style={{ color: C.sub, fontSize: 14, margin: 0 }}>{r.label}</p>
            <p style={{ fontFamily: C.mono, fontSize: 14, fontWeight: 600, color: r.color, margin: 0 }}>{r.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
const Fintech = ({ onClose }) => {
  const [tab,       setTab]       = useState("overview");
  const [summary,   setSummary]   = useState(null);
  const [timeline,  setTimeline]  = useState(null);
  const [bills,     setBills]     = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [envelopes, setEnvelopes] = useState([]);
  const [card,      setCard]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const w = useWidth();
  const b = bp(w);

  const load = useCallback(async () => {
    try {
      const [sum, tl, bl, sc, env, cd] = await Promise.all([
        get("/api/v1/finance/summary"),
        get("/api/v1/finance/timeline"),
        get("/api/v1/finance/bills"),
        get("/api/v1/finance/schedules"),
        get("/api/v1/finance/envelopes"),
        get("/api/v1/finance/card"),
      ]);
      setSummary(sum); setTimeline(tl); setBills(bl);
      setSchedules(sc); setEnvelopes(env); setCard(cd);
      setError(null);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const TABS = [
    { id: "overview",  icon: "◉", label: b.sm ? "" : "Overview"  },
    { id: "timeline",  icon: "⟿", label: b.sm ? "" : "Timeline"  },
    { id: "bills",     icon: "📋", label: b.sm ? "" : "Bills"     },
    { id: "envelopes", icon: "🫙", label: b.sm ? "" : "Save"      },
    { id: "card",      icon: "💳", label: b.sm ? "" : "Card"      },
  ];

  const free = summary?.free_balance ?? 0;
  const freeColor = free > 500 ? C.green : free > 100 ? C.gold : C.red;

  return (
    <>
      <style>{`
        @keyframes nova-spin  { to { transform: rotate(360deg); } }
        @keyframes nova-pulse { 0%,100% { opacity:.4; } 50% { opacity:.75; } }
        * { -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{
          position: "fixed", inset: 0, bottom: "var(--taskbar-height, 52px)",
          zIndex: 50, background: C.bg, fontFamily: C.sans,
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{
          flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: `14px ${b.sm ? 16 : 20}px`, background: C.surface,
          borderBottom: `1px solid ${C.border}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: C.goldBg, border: `1px solid ${C.goldBdr}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
              💳
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 800, color: C.paper, margin: 0, letterSpacing: "-0.01em" }}>NovaPay</p>
              <p style={{ fontSize: 10, color: C.gold, margin: 0, fontFamily: C.mono, letterSpacing: "0.1em", opacity: 0.8 }}>FINANCE OS</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {summary && (
              <div style={{ textAlign: "right" }}>
                <p style={{ fontFamily: C.mono, fontSize: 9, color: C.muted, letterSpacing: "0.08em", margin: 0 }}>FREE</p>
                <p style={{ fontFamily: C.mono, fontSize: 16, fontWeight: 800, color: freeColor, margin: 0, fontVariantNumeric: "tabular-nums" }}>
                  {fmt(free)}
                </p>
              </div>
            )}
            <motion.button whileTap={{ scale: 0.88 }} onClick={onClose}
              style={{ width: 36, height: 36, borderRadius: "50%", background: C.raised, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.sub, fontSize: 18, flexShrink: 0 }}>
              ×
            </motion.button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{ flexShrink: 0, padding: "10px 20px", background: C.redBg, borderBottom: `1px solid ${C.redBdr}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ color: C.red, fontSize: 13, margin: 0 }}>{error} — is the backend running?</p>
            <button onClick={load} style={{ background: "none", border: "none", color: C.red, fontSize: 12, cursor: "pointer", textDecoration: "underline", fontFamily: C.sans }}>Retry</button>
          </div>
        )}

        {/* ── Tab content ─────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", padding: `20px ${b.sm ? 14 : 20}px 24px`, WebkitOverflowScrolling: "touch" }}>
          <div style={{ maxWidth: 520, margin: "0 auto" }}>
            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
                {tab === "overview"  && <OverviewTab  summary={summary} envelopes={envelopes} w={w} />}
                {tab === "timeline"  && <TimelineTab  timeline={timeline} />}
                {tab === "bills"     && <BillsTab     bills={bills} schedules={schedules} onRefresh={load} />}
                {tab === "envelopes" && <EnvelopesTab envelopes={envelopes} onRefresh={load} />}
                {tab === "card"      && <CardTab      card={card} summary={summary} onRefresh={load} w={w} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── Bottom nav — thumb zone ──────────────────────────────────────── */}
        <div style={{
          flexShrink: 0, display: "flex", background: C.surface,
          borderTop: `1px solid ${C.border}`,
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}>
          {TABS.map(t => {
            const active = tab === t.id;
            return (
              <motion.button key={t.id} whileTap={{ scale: 0.88 }} onClick={() => setTab(t.id)}
                style={{
                  flex: 1, padding: "12px 4px 14px", minHeight: 56,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
                  background: "none", border: "none", cursor: "pointer", position: "relative",
                  WebkitTapHighlightColor: "transparent",
                }}>
                {active && (
                  <motion.div layoutId="tab-pill"
                    style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 2, borderRadius: 1, background: C.gold }} />
                )}
                <span style={{ fontSize: b.sm ? 22 : 18, lineHeight: 1 }}>{t.icon}</span>
                {!b.sm && <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? C.gold : C.muted, fontFamily: C.mono, letterSpacing: "0.04em" }}>{t.label.toUpperCase()}</span>}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </>
  );
};

export default Fintech;