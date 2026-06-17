"use client";
/**
 * Health.js — "Vital Signal"
 * ─────────────────────────────────────────────────────────────────────────
 * A living telemetry organism, not a dashboard.
 *
 * One breathing silhouette built from light. Each vital sign is wired
 * directly into the body: heart rate sets the pulse speed of the chest,
 * sleep sets the brightness of the head aura, SpO2 sets the cyan flow
 * along the spine, steps animate a ground track beneath the feet,
 * glucose flows like current through the torso. Nothing is decorative —
 * every motion on screen is driven by a real number from /api/v1/health.
 *
 * Tap any node on the body to log that vital. Pull the black-box lever
 * at the bottom to have the AI narrate your real computed stats — never
 * inventing numbers, only reading the telemetry back to you.
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX, FiPlus, FiActivity, FiHeart, FiDroplet, FiMoon,
  FiTrendingUp, FiCpu, FiClock, FiAlertCircle, FiCheckCircle,
  FiRefreshCw, FiChevronUp, FiChevronDown, FiSend, FiRadio,
} from "react-icons/fi";
import { MdOutlineMedicalServices } from "react-icons/md";

// ── API base ──────────────────────────────────────────────────────────────
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

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

// ── Vital config — each tied to a body zone for the organism layout ────────
const VITALS = [
  { key: "heart_rate",     label: "Heart Rate",  unit: "bpm",   icon: FiHeart,      glyph: "#ff2d55", zone: "chest",  normal: [60, 100],        step: 1,   min: 30, max: 220 },
  { key: "spo2",           label: "Oxygen",       unit: "%",     icon: FiActivity,   glyph: "#34d3ff", zone: "spine",  normal: [95, 100],        step: 0.1, min: 70, max: 100 },
  { key: "blood_pressure", label: "Pressure",     unit: "mmHg",  icon: FiActivity,   glyph: "#ff7a59", zone: "arm",    normal: null,             step: 1,   min: 60, max: 200, note: "Systolic, e.g. 120" },
  { key: "glucose",        label: "Glucose",      unit: "mg/dL", icon: FiDroplet,    glyph: "#ffb020", zone: "torso",  normal: [70, 140],        step: 1,   min: 40, max: 600 },
  { key: "sleep",          label: "Sleep",        unit: "hrs",   icon: FiMoon,       glyph: "#a78bfa", zone: "head",   normal: [7, 9],           step: 0.5, min: 0,  max: 24  },
  { key: "steps",          label: "Steps",        unit: "steps", icon: FiTrendingUp, glyph: "#39ff88", zone: "feet",   normal: [8000, Infinity], step: 100, min: 0,  max: 100000 },
  { key: "weight",         label: "Weight",       unit: "kg",    icon: FiActivity,   glyph: "#8ea3c4", zone: "core",   normal: null,             step: 0.1, min: 20, max: 300 },
];

function vitalFor(key) { return VITALS.find(v => v.key === key) || VITALS[0]; }

function statusOf(key, value) {
  const v = vitalFor(key);
  if (!v.normal) return "neutral";
  const [lo, hi] = v.normal;
  if (value < lo) return "low";
  if (value > hi) return "high";
  return "ok";
}

function statusColor(status) {
  return status === "ok" ? "#39ff88" : status === "neutral" ? "#8ea3c4" : "#ffb020";
}

function fmt(key, value) {
  if (key === "steps") return Math.round(value).toLocaleString();
  if (key === "sleep") return parseFloat(value).toFixed(1);
  return parseFloat(value).toFixed(key === "weight" ? 1 : 0);
}

// ── Real stats engine — pure computation, zero AI ───────────────────────────
function computeStats(records) {
  const byType = {};
  records.forEach(r => {
    (byType[r.record_type] ||= []).push(r);
  });

  return VITALS.map(v => {
    const entries = (byType[v.key] || [])
      .slice()
      .sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));
    if (entries.length === 0) return { key: v.key, count: 0 };

    const values  = entries.map(e => e.value);
    const latest  = values[values.length - 1];
    const average = values.reduce((a, b) => a + b, 0) / values.length;

    let trend = "flat";
    if (values.length >= 2) {
      const priorAvg  = values.slice(0, -1).reduce((a, b) => a + b, 0) / (values.length - 1);
      const delta     = latest - priorAvg;
      const threshold = priorAvg * 0.03 || 0.5;
      trend = delta > threshold ? "up" : delta < -threshold ? "down" : "flat";
    }

    const outOfRange = v.normal
      ? values.filter(x => x < v.normal[0] || x > v.normal[1]).length
      : 0;

    return {
      key: v.key,
      count: entries.length,
      latest: Math.round(latest * 100) / 100,
      average: Math.round(average * 100) / 100,
      trend,
      outOfRange,
      status: statusOf(v.key, latest),
      lastRecordedAt: entries[entries.length - 1].recorded_at,
    };
  }).filter(s => s.count > 0);
}

function buildTelemetryPrompt(stats) {
  const lines = stats.map(s => {
    const v = vitalFor(s.key);
    const range = v.normal ? `normal ${v.normal[0]}–${v.normal[1] === Infinity ? "+" : v.normal[1]} ${v.unit}` : "no fixed range";
    return `- ${v.label}: latest ${s.latest} ${v.unit}, average ${s.average} ${v.unit} across ${s.count} reading(s), trend ${s.trend}, ${s.outOfRange} reading(s) outside ${range}.`;
  }).join("\n");

  return `Here is a user's real logged health telemetry, already computed — do not invent any numbers, only use what's given:

${lines}

Respond as a black-box flight recorder narrating telemetry, in exactly three short sections with these exact headers:
SIGNAL: one short paragraph (2-3 sentences), plain English, describing overall status.
ANOMALY: bullet list of any reading outside normal range or trending concerningly. If none, write "No anomalies detected."
ACTION: 3 concrete, specific recommendations tied to the data above.

Be concise and direct, like a system reading out status. Mention once at the end that this is not a medical diagnosis.`;
}

// ── Chat system prompt — grounds every reply in the same real stats ─────────
function buildCommsSystemPrompt(stats) {
  const dataBlock = stats.length === 0
    ? "No telemetry logged yet."
    : stats.map(s => {
        const v = vitalFor(s.key);
        return `${v.label}: latest ${s.latest} ${v.unit}, average ${s.average} ${v.unit} over ${s.count} reading(s), trend ${s.trend}.`;
      }).join(" ");

  return `You are COMMS, the voice of a health telemetry organism in a personal tracking app. You speak directly to the person wearing the sensors.

Their real logged data right now: ${dataBlock}

Rules: only reference numbers from the data above — never invent a reading they haven't logged. If they ask about a metric with no data, say it hasn't been logged yet and suggest they log it. Keep replies short (2-4 sentences), direct, plain language. You are not a doctor — for anything serious, say so plainly and suggest professional care. No filler greetings, answer like a system responding to a query.`;
}

// ── Streaming AI call ────────────────────────────────────────────────────────
async function streamChat(messages, onChunk, signal, system = "You are a precise telemetry narrator for a health tracking system.") {
  const res = await fetch(`${API}/api/v1/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, messages, max_tokens: 1024 }),
    signal,
  });
  if (!res.ok) throw new Error(`AI error: ${res.status}`);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop();
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") return;
      try {
        const ev = JSON.parse(data);
        if (ev.type === "content_block_delta") onChunk(ev.delta?.text || "");
        if (ev.type === "message_stop") return;
        if (ev.type === "error") throw new Error(ev.message);
      } catch {}
    }
  }
}

// ════════════════════════════════════════════════════════════════════════════
// THE ORGANISM — a constellation silhouette that breathes off real vitals.
// Pulse speed = heart rate. Head aura brightness = sleep. Spine flow = SpO2.
// Ground track = steps. Torso current = glucose. This is the signature.
// ════════════════════════════════════════════════════════════════════════════
const Organism = ({ latestByKey, onZoneTap, onCommsTap }) => {
  const hr     = latestByKey.heart_rate?.latest ?? 72;
  const sleep  = latestByKey.sleep?.latest ?? 7;
  const spo2   = latestByKey.spo2?.latest ?? 98;
  const steps  = latestByKey.steps?.latest ?? 0;
  const gluc   = latestByKey.glucose?.latest ?? 90;

  // Pulse duration in seconds derived from real BPM — capped to stay sane visually
  const pulseDuration = Math.max(0.45, Math.min(1.6, 60 / Math.max(hr, 30)));
  const auraOpacity   = Math.max(0.18, Math.min(0.85, sleep / 9));
  const spineOpacity  = Math.max(0.25, Math.min(1, spo2 / 100));
  const stepProgress  = Math.max(0.04, Math.min(1, steps / 10000));
  const glucoseSpeed  = Math.max(1.2, Math.min(4, 220 / Math.max(gluc, 40)));

  const zones = [
    { id: "head",  cx: 200, cy: 58,  r: 30, key: "sleep" },
    { id: "chest", cx: 200, cy: 138, r: 26, key: "heart_rate" },
    { id: "spine", cx: 200, cy: 200, r: 16, key: "spo2" },
    { id: "torso", cx: 200, cy: 200, r: 16, key: "glucose" },
    { id: "arm",   cx: 138, cy: 165, r: 14, key: "blood_pressure" },
    { id: "core",  cx: 200, cy: 250, r: 14, key: "weight" },
    { id: "feet",  cx: 200, cy: 372, r: 18, key: "steps" },
  ];

  return (
    <svg viewBox="0 0 400 420" className="w-full h-full" style={{ maxHeight: "100%" }}>
      <defs>
        <radialGradient id="auraGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity={auraOpacity} />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="heartGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff2d55" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ff2d55" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="spineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d3ff" stopOpacity={spineOpacity} />
          <stop offset="100%" stopColor="#34d3ff" stopOpacity="0" />
        </linearGradient>
        <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Head aura — breathes with sleep quality */}
      <motion.circle
        cx="200" cy="58" r="46" fill="url(#auraGrad)"
        animate={{ r: [44, 50, 44], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Skeleton constellation — thin lines forming the figure */}
      <g stroke="#2a3548" strokeWidth="1.5" fill="none" opacity="0.9">
        <line x1="200" y1="86"  x2="200" y2="260" />               {/* spine */}
        <line x1="200" y1="120" x2="138" y2="165" />                {/* L arm */}
        <line x1="200" y1="120" x2="262" y2="165" />                {/* R arm */}
        <line x1="138" y1="165" x2="124" y2="225" />                {/* L forearm */}
        <line x1="262" y1="165" x2="276" y2="225" />                {/* R forearm */}
        <line x1="200" y1="260" x2="168" y2="372" />                {/* L leg */}
        <line x1="200" y1="260" x2="232" y2="372" />                {/* R leg */}
      </g>

      {/* Head */}
      <circle cx="200" cy="58" r="30" fill="#0d1117" stroke="#3a4659" strokeWidth="1.5" />

      {/* Chest pulse — speed driven by real heart rate */}
      <motion.circle
        cx="200" cy="138" r="22" fill="url(#heartGrad)" filter="url(#glow)"
        animate={{ scale: [1, 1.22, 1], opacity: [0.55, 1, 0.55] }}
        transition={{ duration: pulseDuration, repeat: Infinity, ease: "easeInOut" }}
      />
      <circle cx="200" cy="138" r="9" fill="#ff2d55" />

      {/* Spine flow — SpO2 driven current running top to bottom */}
      <motion.rect
        x="196" y="86" width="8" height="40" fill="url(#spineGrad)" rx="4"
        animate={{ y: [86, 220, 86] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
      />

      {/* Torso glucose current — amber pulse travelling across the core */}
      <motion.circle
        cx="200" cy="200" r="5" fill="#ffb020" filter="url(#glow)"
        animate={{ cx: [178, 222, 178], opacity: [0.3, 1, 0.3] }}
        transition={{ duration: glucoseSpeed, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Joints */}
      {[
        [138, 165], [262, 165], [124, 225], [276, 225],
        [168, 372], [232, 372], [200, 260],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="4" fill="#3a4659" />
      ))}

      {/* Ground track — fills with real step progress */}
      <rect x="120" y="398" width="160" height="3" rx="1.5" fill="#1c2531" />
      <motion.rect
        x="120" y="398" height="3" rx="1.5" fill="#39ff88"
        initial={{ width: 0 }}
        animate={{ width: 160 * stepProgress }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />

      {/* Tappable zone overlays — invisible hit targets mapped to vitals */}
      {zones.map(z => (
        <circle
          key={z.id}
          cx={z.cx} cy={z.cy} r={z.r}
          fill="transparent"
          className="cursor-pointer"
          onClick={() => onZoneTap(z.key)}
        />
      ))}

      {/* Voice glyph — dedicated comms tap target, painted last so it wins
          over the head's sleep-log zone in this small central area */}
      <motion.g
        className="cursor-pointer"
        onClick={(e) => { e.stopPropagation(); onCommsTap?.(); }}
        animate={{ opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <circle cx="200" cy="58" r="13" fill="#0d1117" opacity="0.01" />
        <path d="M194 54 a6 6 0 0 1 12 0 v6 a6 6 0 0 1 -12 0 z" fill="#a78bfa" opacity="0.9" />
        <path d="M188 60 a12 12 0 0 0 24 0" stroke="#a78bfa" strokeWidth="1.5" fill="none" opacity="0.7" />
      </motion.g>
    </svg>
  );
};

// ── Satellite chip — a single vital's live readout, docked beside the organism ─
const Satellite = ({ vital, stat, onTap, side }) => {
  const Icon = vital.icon;
  const has  = !!stat;
  const status = has ? stat.status : "neutral";
  const color  = has ? statusColor(status) : "#3a4659";

  return (
    <motion.button
      onClick={() => onTap(vital.key)}
      whileTap={{ scale: 0.94 }}
      initial={{ opacity: 0, x: side === "left" ? -10 : 10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-left w-full"
      style={{
        background: "rgba(13,17,23,0.7)",
        border: `1px solid ${has ? color + "33" : "rgba(58,70,89,0.4)"}`,
      }}
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}1a`, border: `1px solid ${color}40` }}
      >
        <Icon size={12} style={{ color }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] uppercase tracking-wider text-gray-500 leading-none mb-0.5">{vital.label}</p>
        {has ? (
          <p className="text-white text-xs font-bold font-mono leading-none">
            {fmt(vital.key, stat.latest)} <span className="text-gray-500 text-[9px] font-normal">{vital.unit}</span>
          </p>
        ) : (
          <p className="text-gray-600 text-[10px] leading-none">tap to log</p>
        )}
      </div>
      {has && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />}
    </motion.button>
  );
};

// ── Log drawer — slides up from the bottom when a zone/satellite is tapped ───
const LogDrawer = ({ vitalKey, onClose, onSaved }) => {
  const vital = vitalFor(vitalKey);
  const Icon  = vital.icon;
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState(null);

  const handleSave = async () => {
    if (!value || isNaN(parseFloat(value))) { setError("Enter a valid number."); return; }
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/api/v1/health", {
        method: "POST",
        body: JSON.stringify({
          record_type: vital.key,
          value: parseFloat(value),
          unit: vital.unit,
          notes: notes || null,
        }),
      });
      setSaved(true);
      setTimeout(() => { onSaved(); onClose(); }, 700);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 320 }}
      className="absolute left-0 right-0 bottom-0 rounded-t-3xl p-5"
      style={{
        background: "rgba(8,11,17,0.97)",
        backdropFilter: "blur(20px)",
        borderTop: `1px solid ${vital.glyph}33`,
        boxShadow: `0 -20px 60px rgba(0,0,0,0.6), 0 -1px 0 ${vital.glyph}40`,
      }}
    >
      <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-4" />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: `${vital.glyph}1a`, border: `1px solid ${vital.glyph}40` }}>
            <Icon size={16} style={{ color: vital.glyph }} />
          </div>
          <div>
            <p className="text-white font-semibold text-sm font-mono">{vital.label.toUpperCase()}</p>
            <p className="text-gray-500 text-[10px]">{vital.note || `Log a reading in ${vital.unit}`}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/8 text-gray-500 hover:text-white transition-colors">
          <FiX size={15} />
        </button>
      </div>

      <input
        autoFocus
        type="number"
        inputMode="decimal"
        step={vital.step}
        min={vital.min}
        max={vital.max}
        value={value}
        onChange={e => { setValue(e.target.value); setError(null); }}
        onKeyDown={e => e.key === "Enter" && handleSave()}
        placeholder={`0 ${vital.unit}`}
        className="w-full px-4 py-3 rounded-xl text-2xl font-bold font-mono text-center mb-3"
        style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${vital.glyph}30`, color: "#e6edf3" }}
      />

      <input
        type="text"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Note (optional)"
        className="w-full px-4 py-2.5 rounded-xl text-sm mb-3"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#cbd5e1" }}
      />

      {error && (
        <div className="flex items-center gap-2 text-amber-300 text-xs mb-3">
          <FiAlertCircle size={12} /> {error}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving || saved}
        className="w-full py-3 rounded-xl font-bold text-sm font-mono transition-all flex items-center justify-center gap-2"
        style={{
          background: saved ? "#39ff8822" : `${vital.glyph}`,
          color: saved ? "#39ff88" : "#05070d",
          border: saved ? "1px solid #39ff8855" : "none",
        }}
      >
        {saved ? <><FiCheckCircle size={14} /> LOGGED</> : saving ? <><FiRefreshCw size={14} className="animate-spin" /> SAVING</> : <><FiPlus size={14} /> LOG READING</>}
      </button>

      {vital.normal && (
        <p className="text-gray-600 text-[10px] text-center mt-2 font-mono">
          NORMAL: {vital.normal[0]}–{vital.normal[1] === Infinity ? "+" : vital.normal[1]} {vital.unit}
        </p>
      )}
    </motion.div>
  );
};

// ── Telemetry readout — renders AI's SIGNAL/ANOMALY/ACTION as a black box ────
const TelemetryReadout = ({ text }) => {
  const sections = { SIGNAL: "", ANOMALY: "", ACTION: "" };
  let current = null;
  text.split("\n").forEach(line => {
    const m = line.trim().match(/^(SIGNAL|ANOMALY|ACTION):?\s*(.*)$/i);
    if (m) {
      current = m[1].toUpperCase();
      if (m[2]) sections[current] += m[2] + "\n";
    } else if (current) {
      sections[current] += line + "\n";
    }
  });
  const hasStructure = sections.SIGNAL || sections.ANOMALY || sections.ACTION;

  if (!hasStructure) {
    return <p className="text-[#39ff88] text-xs font-mono leading-relaxed whitespace-pre-wrap">{text}</p>;
  }

  const rows = [
    { key: "SIGNAL",  label: "SIGNAL",  color: "#34d3ff" },
    { key: "ANOMALY", label: "ANOMALY", color: "#ffb020" },
    { key: "ACTION",  label: "ACTION",  color: "#39ff88" },
  ];

  return (
    <div className="space-y-3 font-mono">
      {rows.map(r => sections[r.key] && (
        <div key={r.key} className="flex gap-3">
          <span className="text-[10px] font-bold flex-shrink-0 w-16" style={{ color: r.color }}>
            [{r.label}]
          </span>
          <p className="text-gray-300 text-xs leading-relaxed whitespace-pre-wrap flex-1">
            {sections[r.key].trim()}
          </p>
        </div>
      ))}
    </div>
  );
};

// ── Black box panel — the AI analysis drawer, slides up from bottom edge ─────
const BlackBox = ({ stats, expanded, onToggle }) => {
  const [report,    setReport]    = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [error,     setError]     = useState(null);
  const abortRef = useRef(null);

  const runAnalysis = async () => {
    if (analyzing || stats.length === 0) return;
    setAnalyzing(true);
    setError(null);
    setReport("");
    abortRef.current = new AbortController();
    try {
      await streamChat(
        [{ role: "user", content: buildTelemetryPrompt(stats) }],
        chunk => setReport(prev => prev + chunk),
        abortRef.current.signal
      );
    } catch (e) {
      if (e.name !== "AbortError") setError(e.message || "Telemetry link failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div
      className="flex-shrink-0 border-t"
      style={{ borderColor: "rgba(57,255,136,0.15)", background: "rgba(5,7,13,0.92)" }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2.5"
      >
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#39ff88] animate-pulse" />
          <span className="text-[#39ff88] text-[11px] font-mono font-bold tracking-wider">BLACK BOX</span>
          <span className="text-gray-600 text-[10px] font-mono">// AI telemetry reader</span>
        </div>
        {expanded ? <FiChevronDown className="text-gray-500" size={14} /> : <FiChevronUp className="text-gray-500" size={14} />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 max-h-52 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
              {stats.length === 0 ? (
                <p className="text-gray-600 text-xs font-mono py-3">// no telemetry logged yet — log a vital to begin</p>
              ) : !report && !analyzing ? (
                <button
                  onClick={runAnalysis}
                  className="w-full py-2.5 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 mt-1"
                  style={{ background: "rgba(57,255,136,0.1)", border: "1px solid rgba(57,255,136,0.3)", color: "#39ff88" }}
                >
                  <FiCpu size={12} /> READ TELEMETRY
                </button>
              ) : analyzing && !report ? (
                <div className="flex items-center gap-2 text-gray-500 text-xs font-mono py-3">
                  <FiRefreshCw className="animate-spin" size={12} /> decoding signal…
                </div>
              ) : (
                <>
                  <TelemetryReadout text={report} />
                  {!analyzing && (
                    <button
                      onClick={runAnalysis}
                      className="mt-3 text-[10px] font-mono text-gray-500 hover:text-[#39ff88] transition-colors"
                    >
                      ↻ re-read telemetry
                    </button>
                  )}
                </>
              )}
              {error && (
                <div className="flex items-center gap-2 text-amber-400 text-xs font-mono mt-2">
                  <FiAlertCircle size={12} /> {error}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── History tape — compact scrolling log of every reading ever taken ─────────
const HistoryTape = ({ records, onClose }) => (
  <motion.div
    initial={{ x: "100%" }}
    animate={{ x: 0 }}
    exit={{ x: "100%" }}
    transition={{ type: "spring", damping: 28, stiffness: 300 }}
    className="absolute top-0 right-0 bottom-0 w-full sm:w-80 z-10"
    style={{ background: "rgba(8,11,17,0.97)", backdropFilter: "blur(20px)", borderLeft: "1px solid rgba(255,255,255,0.08)" }}
  >
    <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
      <p className="text-white text-sm font-mono font-bold">LOG TAPE</p>
      <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/8 text-gray-500 hover:text-white transition-colors">
        <FiX size={15} />
      </button>
    </div>
    <div className="overflow-y-auto h-full px-3 py-3 space-y-1.5" style={{ scrollbarWidth: "none" }}>
      {records.length === 0 ? (
        <p className="text-gray-600 text-xs font-mono text-center py-10">// empty</p>
      ) : (
        records.map(rec => {
          const v = vitalFor(rec.record_type);
          const status = statusOf(rec.record_type, rec.value);
          const color  = statusColor(status);
          return (
            <div key={rec.id} className="flex items-center gap-2 px-2.5 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="w-1 h-6 rounded-full flex-shrink-0" style={{ background: color }} />
              <div className="flex-1 min-w-0">
                <p className="text-gray-300 text-[11px] font-mono truncate">{v.label}</p>
                <p className="text-gray-600 text-[9px] font-mono">
                  {new Date(rec.recorded_at).toLocaleDateString([], { month: "short", day: "numeric" })} {new Date(rec.recorded_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <p className="text-white text-xs font-mono font-bold flex-shrink-0">{fmt(rec.record_type, rec.value)}</p>
            </div>
          );
        })
      )}
    </div>
  </motion.div>
);

// ── COMMS — the organism's voice. Tap the head to open a live link. ──────────
// Not a generic chatbox: every reply is grounded in buildCommsSystemPrompt(),
// which injects the same real computed stats used by the black box. The AI
// can only talk about data that's actually been logged.
const Comms = ({ stats, onClose }) => {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Comms link open. Ask me about your vitals — trends, ranges, anything logged." },
  ]);
  const [input, setInput] = useState("");
  const [busy,  setBusy]  = useState(false);
  const bottomRef = useRef(null);
  const abortRef  = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const history = [...messages, { role: "user", content: text }];
    setMessages(history);
    setBusy(true);
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);
    abortRef.current = new AbortController();

    try {
      await streamChat(
        history.map(m => ({ role: m.role, content: m.content })),
        chunk => setMessages(prev => {
          const arr = [...prev];
          arr[arr.length - 1] = { role: "assistant", content: arr[arr.length - 1].content + chunk };
          return arr;
        }),
        abortRef.current.signal,
        buildCommsSystemPrompt(stats)
      );
    } catch (e) {
      if (e.name !== "AbortError") {
        setMessages(prev => {
          const arr = [...prev];
          arr[arr.length - 1] = { role: "assistant", content: "Signal lost. Check the connection and try again." };
          return arr;
        });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", damping: 26, stiffness: 320 }}
      className="absolute inset-3 sm:inset-8 rounded-2xl flex flex-col z-20 overflow-hidden"
      style={{
        background: "rgba(5,7,13,0.97)",
        backdropFilter: "blur(24px)",
        border: "1px solid rgba(167,139,250,0.25)",
        boxShadow: "0 24px 64px rgba(0,0,0,0.7), 0 0 40px rgba(167,139,250,0.08)",
      }}
    >
      {/* Header — radio link styling */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/8">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#a78bfa] animate-pulse" />
          <p className="text-[#a78bfa] text-[11px] font-mono font-bold tracking-widest">COMMS LINK</p>
          <span className="text-gray-600 text-[10px] font-mono">// live</span>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/8 text-gray-500 hover:text-white transition-colors">
          <FiX size={15} />
        </button>
      </div>

      {/* Transcript */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ scrollbarWidth: "none" }}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap font-mono ${
                m.role === "user" ? "rounded-tr-sm" : "rounded-tl-sm"
              }`}
              style={{
                background: m.role === "user" ? "rgba(167,139,250,0.18)" : "rgba(255,255,255,0.05)",
                border: m.role === "user" ? "1px solid rgba(167,139,250,0.3)" : "1px solid rgba(255,255,255,0.07)",
                color: m.role === "user" ? "#e6edf3" : "#cbd5e1",
              }}
            >
              {m.content || (busy && i === messages.length - 1 && (
                <span className="inline-flex gap-1">
                  {[0, 1, 2].map(j => (
                    <motion.span key={j} className="w-1.5 h-1.5 rounded-full bg-[#a78bfa] inline-block"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: j * 0.2 }} />
                  ))}
                </span>
              ))}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-3 py-3 border-t border-white/8">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Ask about your vitals…"
            disabled={busy}
            className="flex-1 px-3.5 py-2.5 rounded-xl text-sm font-mono disabled:opacity-50"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(167,139,250,0.25)", color: "#e6edf3" }}
          />
          <button
            onClick={send}
            disabled={busy || !input.trim()}
            className="px-4 py-2.5 rounded-xl disabled:opacity-30 transition-opacity"
            style={{ background: "#a78bfa", color: "#05070d" }}
          >
            <FiSend size={14} />
          </button>
        </div>
        <p className="text-gray-600 text-[9px] text-center mt-2 font-mono">grounded in your logged data only · not medical advice</p>
      </div>
    </motion.div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// Main shell
// ════════════════════════════════════════════════════════════════════════════
const Health = ({ onClose }) => {
  const [records,    setRecords]    = useState([]);
  const [loading,     setLoading]   = useState(true);
  const [error,       setError]     = useState(null);
  const [activeVital, setActiveVital] = useState(null);  // drawer
  const [showTape,    setShowTape]  = useState(false);
  const [showComms,   setShowComms] = useState(false);
  const [boxExpanded,  setBoxExpanded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/api/v1/health?per_page=200");
      const items = Array.isArray(data) ? data : data?.items ?? [];
      setRecords(items.sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at)));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const latestByKey = useMemo(() => {
    const map = {};
    [...records]
      .sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at))
      .forEach(r => {
        map[r.record_type] = {
          latest: r.value,
          status: statusOf(r.record_type, r.value),
        };
      });
    return map;
  }, [records]);

  const stats = useMemo(() => computeStats(records), [records]);
  const statFor = useCallback((key) => stats.find(s => s.key === key) || null, [stats]);

  const leftVitals  = [VITALS[4], VITALS[0], VITALS[2]]; // sleep, heart_rate, blood_pressure
  const rightVitals = [VITALS[1], VITALS[3], VITALS[5]]; // spo2, glucose, steps

  return (
    <AnimatePresence>
      <motion.div
        key="health-organism"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col overflow-hidden"
        style={{
          bottom: "var(--taskbar-height, 52px)",
          background: "radial-gradient(circle at 50% 30%, #0d1117 0%, #05070d 70%)",
        }}
      >
        {/* Top bar */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff2d55] animate-pulse" />
            <p className="text-gray-300 text-[11px] font-mono tracking-widest">VITAL SIGNAL</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={load} className="p-1.5 rounded-lg hover:bg-white/8 text-gray-500 hover:text-white transition-colors">
              <FiRefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={() => setShowComms(true)}
              className="p-1.5 rounded-lg hover:bg-white/8 text-[#a78bfa] transition-colors"
              aria-label="Open comms link"
            >
              <FiRadio size={13} />
            </button>
            <button onClick={() => setShowTape(true)} className="p-1.5 rounded-lg hover:bg-white/8 text-gray-500 hover:text-white transition-colors">
              <FiClock size={13} />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/8 text-gray-500 hover:text-white transition-colors">
              <FiX size={15} />
            </button>
          </div>
        </div>

        {error && (
          <div className="flex-shrink-0 mx-4 mb-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono flex items-center gap-2">
            <FiAlertCircle size={12} /> {error}
          </div>
        )}

        {/* Organism stage */}
        <div className="flex-1 min-h-0 relative flex items-center justify-center px-2">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-gray-600">
              <FiRefreshCw className="animate-spin" size={20} />
              <p className="text-xs font-mono">connecting to telemetry…</p>
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center gap-1">
              {/* Left satellites */}
              <div className="hidden sm:flex flex-col gap-2 w-32 flex-shrink-0">
                {leftVitals.map(v => (
                  <Satellite key={v.key} vital={v} stat={statFor(v.key)}
                    onTap={setActiveVital} side="left" />
                ))}
              </div>

              {/* The organism itself */}
              <div className="flex-1 h-full max-w-[340px] flex items-center justify-center">
                <Organism latestByKey={latestByKey} onZoneTap={setActiveVital} onCommsTap={() => setShowComms(true)} />
              </div>

              {/* Right satellites */}
              <div className="hidden sm:flex flex-col gap-2 w-32 flex-shrink-0">
                {rightVitals.map(v => (
                  <Satellite key={v.key} vital={v} stat={statFor(v.key)}
                    onTap={setActiveVital} side="right" />
                ))}
              </div>
            </div>
          )}

          {/* Mobile satellite strip — scrollable row beneath organism on small screens */}
          <div
            className="sm:hidden absolute bottom-0 left-0 right-0 flex gap-2 px-3 pb-2 overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
          >
            {VITALS.map(v => (
              <div key={v.key} className="flex-shrink-0 w-28">
                <Satellite vital={v} stat={statFor(v.key)} onTap={setActiveVital} side="left" />
              </div>
            ))}
          </div>

          {/* Log drawer */}
          <AnimatePresence>
            {activeVital && (
              <LogDrawer
                vitalKey={activeVital}
                onClose={() => setActiveVital(null)}
                onSaved={load}
              />
            )}
          </AnimatePresence>

          {/* History tape */}
          <AnimatePresence>
            {showTape && <HistoryTape records={records} onClose={() => setShowTape(false)} />}
          </AnimatePresence>

          {/* Comms link — the organism's voice */}
          <AnimatePresence>
            {showComms && <Comms stats={stats} onClose={() => setShowComms(false)} />}
          </AnimatePresence>
        </div>

        {/* Black box telemetry reader */}
        <BlackBox stats={stats} expanded={boxExpanded} onToggle={() => setBoxExpanded(v => !v)} />
      </motion.div>
    </AnimatePresence>
  );
};

export default Health;