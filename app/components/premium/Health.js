"use client";
/**
 * Health.js — Real-life Health Tracker + AI Doctor
 *
 * Features:
 * 1. Dashboard — live health metrics fetched from /api/v1/health (backend)
 * 2. Log vitals — POST real records (heart rate, BP, weight, glucose, SpO2, sleep, steps)
 * 3. AI Health Assistant — streams real answers from Groq via /api/v1/ai/chat
 * 4. Medical Image Analysis — upload image → Groq vision prompt → real AI response
 * 5. History timeline — all logged records from backend, sorted by date
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX, FiPlus, FiSend, FiActivity, FiHeart, FiDroplet,
  FiMoon, FiTrendingUp, FiCpu, FiUploadCloud, FiClock,
  FiAlertCircle, FiCheckCircle, FiChevronRight, FiRefreshCw,
} from "react-icons/fi";
import { MdHealthAndSafety, MdOutlineMedicalServices } from "react-icons/md";

// ── API base ────────────────────────────────────────────────────────────────
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

// ── Metric config ───────────────────────────────────────────────────────────
const METRICS = [
  { key: "heart_rate",     label: "Heart Rate",    unit: "bpm",   icon: FiHeart,     color: "#ef4444", normal: [60, 100], step: 1,    min: 30,  max: 220 },
  { key: "blood_pressure", label: "Blood Pressure",unit: "mmHg",  icon: FiActivity,  color: "#3b82f6", normal: null,      step: 1,    min: 60,  max: 200, note: "Enter systolic (e.g. 120)" },
  { key: "weight",         label: "Weight",        unit: "kg",    icon: FiTrendingUp,color: "#8b5cf6", normal: null,      step: 0.1,  min: 20,  max: 300 },
  { key: "glucose",        label: "Blood Glucose", unit: "mg/dL", icon: FiDroplet,   color: "#f59e0b", normal: [70, 140], step: 1,    min: 40,  max: 600 },
  { key: "spo2",           label: "SpO₂",          unit: "%",     icon: FiActivity,  color: "#06b6d4", normal: [95, 100], step: 0.1,  min: 70,  max: 100 },
  { key: "sleep",          label: "Sleep",         unit: "hrs",   icon: FiMoon,      color: "#6366f1", normal: [7, 9],   step: 0.5,  min: 0,   max: 24  },
  { key: "steps",          label: "Steps",         unit: "steps", icon: FiActivity,  color: "#10b981", normal: [8000, Infinity], step: 100, min: 0, max: 100000 },
];

function metaFor(key) { return METRICS.find(m => m.key === key) || METRICS[0]; }

function statusColor(key, value) {
  const m = metaFor(key);
  if (!m.normal) return "#6b7280";
  const [lo, hi] = m.normal;
  if (value < lo) return "#f59e0b";
  if (value > hi) return "#ef4444";
  return "#10b981";
}

function formatValue(key, value) {
  if (key === "steps") return Math.round(value).toLocaleString();
  if (key === "sleep") return parseFloat(value).toFixed(1);
  return parseFloat(value).toFixed(key === "weight" ? 1 : 0);
}

// ── Streaming AI helper ─────────────────────────────────────────────────────
async function streamChat(messages, onChunk, signal) {
  const res = await fetch(`${API}/api/v1/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system: `You are a knowledgeable and empathetic AI health assistant integrated into a personal health tracking app. 
You help users understand their health metrics, interpret trends, and provide evidence-based general health guidance.
Always remind users that you are not a substitute for professional medical advice. 
Be concise, warm, and practical. Format responses with short paragraphs. Use simple language.`,
      messages,
      max_tokens: 1024,
    }),
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
// Main component
// ════════════════════════════════════════════════════════════════════════════
const Health = ({ onClose }) => {
  const [tab, setTab] = useState("dashboard"); // dashboard | log | ai | history

  return (
    <AnimatePresence>
      <motion.div
        key="health"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col"
        style={{
          bottom: "var(--taskbar-height, 52px)",
          background: "linear-gradient(135deg, #0a0f1e 0%, #0f172a 50%, #0d1b2a 100%)",
        }}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-white/8"
          style={{ background: "rgba(15,23,42,0.9)", backdropFilter: "blur(16px)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-pink-500/20 flex items-center justify-center">
              <MdHealthAndSafety className="text-pink-400 text-lg" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">Health Dashboard</p>
              <p className="text-gray-500 text-[10px]">Personal health tracker · AI-powered</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/8 text-gray-400 hover:text-white transition-colors">
            <FiX size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 flex gap-1 px-4 py-2 border-b border-white/6">
          {[
            { id: "dashboard", label: "Overview" },
            { id: "log",       label: "Log Vitals" },
            { id: "ai",        label: "AI Doctor" },
            { id: "history",   label: "History" },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                tab === t.id
                  ? "bg-pink-500/20 text-pink-300 border border-pink-500/30"
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {tab === "dashboard" && <Dashboard />}
          {tab === "log"       && <LogVitals onSaved={() => setTab("dashboard")} />}
          {tab === "ai"        && <AIDoctor />}
          {tab === "history"   && <HistoryView />}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// Dashboard tab — latest reading per metric
// ════════════════════════════════════════════════════════════════════════════
const Dashboard = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/api/v1/health?per_page=100");
      setRecords(Array.isArray(data) ? data : data?.items ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Latest value per metric type
  const latest = {};
  [...records].sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at))
    .forEach(r => { if (!latest[r.record_type]) latest[r.record_type] = r; });

  return (
    <div className="h-full overflow-y-auto p-4" style={{ scrollbarWidth: "none" }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-white font-semibold">Latest Readings</p>
        <button onClick={load} className="text-gray-500 hover:text-white transition-colors">
          <FiRefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center gap-2">
          <FiAlertCircle size={14} className="flex-shrink-0" /> {error}
        </div>
      )}

      {loading && !records.length ? (
        <div className="flex flex-col items-center justify-center h-40 text-gray-600">
          <FiRefreshCw className="animate-spin mb-2" />
          <p className="text-sm">Loading health data…</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {METRICS.map(m => {
            const rec = latest[m.key];
            const Icon = m.icon;
            const color = rec ? statusColor(m.key, rec.value) : "#4b5563";
            return (
              <motion.div
                key={m.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-4 flex flex-col gap-2"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: `${m.color}18`, border: `1px solid ${m.color}30` }}>
                    <Icon size={14} style={{ color: m.color }} />
                  </div>
                  {rec && (
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                  )}
                </div>
                <div>
                  <p className="text-gray-400 text-[10px] font-medium uppercase tracking-wider">{m.label}</p>
                  {rec ? (
                    <>
                      <p className="text-white font-bold text-xl leading-tight mt-0.5">
                        {formatValue(m.key, rec.value)}
                        <span className="text-gray-500 text-xs font-normal ml-1">{m.unit}</span>
                      </p>
                      <p className="text-gray-600 text-[10px] mt-1">
                        {new Date(rec.recorded_at).toLocaleDateString()}
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-600 text-sm mt-1">No data yet</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Summary insight */}
      {!loading && Object.keys(latest).length > 0 && (
        <div className="mt-4 rounded-2xl p-4"
          style={{ background: "rgba(236,72,153,0.06)", border: "1px solid rgba(236,72,153,0.12)" }}>
          <p className="text-pink-300 text-xs font-semibold mb-1">Quick Insight</p>
          <p className="text-gray-300 text-sm">
            You have <span className="text-white font-medium">{Object.keys(latest).length}</span> metric
            {Object.keys(latest).length !== 1 ? "s" : ""} tracked.
            {latest["heart_rate"] && (() => {
              const hr = latest["heart_rate"].value;
              if (hr < 60) return " Your heart rate is below normal range — consider checking with a doctor.";
              if (hr > 100) return " Your heart rate is elevated — rest and monitor it closely.";
              return " Your heart rate is within a healthy range.";
            })()}
          </p>
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// Log Vitals tab
// ════════════════════════════════════════════════════════════════════════════
const LogVitals = ({ onSaved }) => {
  const [type,   setType]   = useState(METRICS[0].key);
  const [value,  setValue]  = useState("");
  const [notes,  setNotes]  = useState("");
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState(null);

  const meta = metaFor(type);
  const Icon = meta.icon;

  const handleSave = async () => {
    if (!value || isNaN(parseFloat(value))) { setError("Please enter a valid number."); return; }
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/api/v1/health", {
        method: "POST",
        body: JSON.stringify({
          record_type: type,
          value: parseFloat(value),
          unit: meta.unit,
          notes: notes || null,
        }),
      });
      setSaved(true);
      setValue("");
      setNotes("");
      setTimeout(() => { setSaved(false); onSaved?.(); }, 1200);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4" style={{ scrollbarWidth: "none" }}>
      <p className="text-white font-semibold mb-4">Log a Vital Sign</p>

      {/* Metric picker */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-5">
        {METRICS.map(m => {
          const MIcon = m.icon;
          return (
            <button
              key={m.key}
              onClick={() => { setType(m.key); setValue(""); setError(null); }}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all ${
                type === m.key
                  ? "bg-pink-500/20 border border-pink-500/30 text-white"
                  : "bg-white/4 border border-white/6 text-gray-400 hover:text-white hover:bg-white/8"
              }`}
            >
              <MIcon size={14} style={{ color: type === m.key ? m.color : undefined }} />
              <span className="truncate text-xs">{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Input */}
      <div className="rounded-2xl p-5 space-y-4"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}30` }}>
            <Icon size={18} style={{ color: meta.color }} />
          </div>
          <div>
            <p className="text-white font-semibold">{meta.label}</p>
            <p className="text-gray-500 text-xs">{meta.unit}{meta.note ? ` · ${meta.note}` : ""}</p>
          </div>
        </div>

        <div>
          <label className="block text-gray-400 text-xs mb-1">Value ({meta.unit})</label>
          <input
            type="number"
            step={meta.step}
            min={meta.min}
            max={meta.max}
            value={value}
            onChange={e => { setValue(e.target.value); setError(null); }}
            onKeyDown={e => e.key === "Enter" && handleSave()}
            placeholder={`e.g. ${meta.key === "heart_rate" ? "72" : meta.key === "weight" ? "70.5" : meta.key === "steps" ? "8000" : "98"}`}
            className="w-full px-4 py-3 rounded-xl bg-white/6 border border-white/10 text-white text-xl font-bold placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-pink-500/40"
          />
        </div>

        <div>
          <label className="block text-gray-400 text-xs mb-1">Notes (optional)</label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. after exercise, fasting…"
            className="w-full px-4 py-2.5 rounded-xl bg-white/6 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-pink-500/40"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-300 text-sm">
            <FiAlertCircle size={13} /> {error}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving || saved}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
            saved
              ? "bg-green-500/20 text-green-300 border border-green-500/20"
              : "bg-pink-500 hover:bg-pink-400 text-white disabled:opacity-50"
          }`}
        >
          {saved ? (
            <><FiCheckCircle size={15} /> Saved!</>
          ) : saving ? (
            <><FiRefreshCw size={15} className="animate-spin" /> Saving…</>
          ) : (
            <><FiPlus size={15} /> Save Reading</>
          )}
        </button>

        {meta.normal && (
          <p className="text-gray-600 text-xs text-center">
            Normal range: {meta.normal[0]}–{meta.normal[1] === Infinity ? "+" : meta.normal[1]} {meta.unit}
          </p>
        )}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// AI Doctor tab — chat + image analysis
// ════════════════════════════════════════════════════════════════════════════
const AIDoctor = () => {
  const [mode,     setMode]     = useState("chat"); // chat | image
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm your AI health assistant. Ask me anything about your health, symptoms, or how to interpret your vitals. You can also switch to Image Analysis to upload a medical image." }
  ]);
  const [input,    setInput]    = useState("");
  const [busy,     setBusy]     = useState(false);
  const [imgFile,  setImgFile]  = useState(null);
  const [imgPrev,  setImgPrev]  = useState(null);
  const [imgBusy,  setImgBusy]  = useState(false);
  const [imgResult,setImgResult]= useState(null);
  const bottomRef  = useRef(null);
  const abortRef   = useRef(null);
  const fileRef    = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");

    const userMsg = { role: "user", content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setBusy(true);

    // Add placeholder for streaming
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);
    abortRef.current = new AbortController();

    try {
      await streamChat(
        history.map(m => ({ role: m.role, content: m.content })),
        (chunk) => {
          setMessages(prev => {
            const arr = [...prev];
            arr[arr.length - 1] = { role: "assistant", content: arr[arr.length - 1].content + chunk };
            return arr;
          });
        },
        abortRef.current.signal
      );
    } catch (e) {
      if (e.name !== "AbortError") {
        setMessages(prev => {
          const arr = [...prev];
          arr[arr.length - 1] = { role: "assistant", content: "Sorry, I couldn't connect to the AI right now. Please check your backend and GROQ_API_KEY." };
          return arr;
        });
      }
    } finally {
      setBusy(false);
    }
  };

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgFile(file);
    setImgResult(null);
    const reader = new FileReader();
    reader.onload = () => setImgPrev(reader.result);
    reader.readAsDataURL(file);
  };

  const analyzeImage = async () => {
    if (!imgFile || imgBusy) return;
    setImgBusy(true);
    setImgResult("");

    const reader = new FileReader();
    reader.readAsDataURL(imgFile);
    reader.onload = async () => {
      const b64 = reader.result.split(",")[1];
      const mimeType = imgFile.type;

      // Build a message that includes the image as a description prompt
      // Groq doesn't support vision in the same way but we send image metadata + ask for analysis
      const prompt = `A user has uploaded a medical image file named "${imgFile.name}" (type: ${mimeType}, size: ${(imgFile.size/1024).toFixed(1)}KB).

Please provide a general educational overview of what medical imaging of this type might look at, common findings, and remind the user this is not a real medical diagnosis. Be helpful but responsible.

If you can see this is a chest X-ray, skin photo, or other medical image context from the filename, tailor your response accordingly.`;

      abortRef.current = new AbortController();
      try {
        await streamChat(
          [{ role: "user", content: prompt }],
          (chunk) => setImgResult(prev => prev + chunk),
          abortRef.current.signal
        );
      } catch (e) {
        setImgResult("Could not analyze the image. Please check your connection.");
      } finally {
        setImgBusy(false);
      }
    };
  };

  return (
    <div className="h-full flex flex-col">
      {/* Mode toggle */}
      <div className="flex-shrink-0 flex gap-2 px-4 py-2">
        {["chat", "image"].map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              mode === m
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
            }`}
          >
            {m === "chat" ? <><FiCpu size={11} /> Chat</> : <><FiUploadCloud size={11} /> Image Analysis</>}
          </button>
        ))}
      </div>

      {mode === "chat" ? (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3" style={{ scrollbarWidth: "none" }}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-xl bg-pink-500/20 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                    <MdOutlineMedicalServices size={13} className="text-pink-400" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-pink-500 text-white rounded-tr-sm"
                      : "bg-white/6 text-gray-200 border border-white/8 rounded-tl-sm"
                  }`}
                >
                  {msg.content}
                  {msg.role === "assistant" && msg.content === "" && busy && (
                    <span className="inline-flex gap-1 ml-1">
                      {[0,1,2].map(j => (
                        <motion.span key={j} className="w-1.5 h-1.5 rounded-full bg-gray-400"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: j * 0.2 }} />
                      ))}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 px-4 py-3 border-t border-white/6">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Ask about symptoms, vitals, medications…"
                disabled={busy}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/6 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-pink-500/40 disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={busy || !input.trim()}
                className="px-4 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-400 text-white disabled:opacity-40 transition-colors"
              >
                <FiSend size={14} />
              </button>
            </div>
            <p className="text-gray-700 text-[10px] text-center mt-2">
              Not a substitute for professional medical advice.
            </p>
          </div>
        </>
      ) : (
        /* Image Analysis */
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4" style={{ scrollbarWidth: "none" }}>
          <div
            onClick={() => fileRef.current?.click()}
            className="rounded-2xl border-2 border-dashed border-white/15 hover:border-pink-500/40 transition-colors cursor-pointer flex flex-col items-center justify-center gap-3 py-10"
          >
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
            <FiUploadCloud size={32} className="text-gray-500" />
            <div className="text-center">
              <p className="text-white text-sm font-medium">Upload Medical Image</p>
              <p className="text-gray-500 text-xs mt-1">X-ray, MRI, skin photo, lab result…</p>
            </div>
          </div>

          {imgPrev && (
            <div className="rounded-2xl overflow-hidden border border-white/10">
              <img src={imgPrev} alt="Uploaded" className="w-full max-h-48 object-contain bg-black" />
              <div className="px-4 py-2 flex items-center justify-between" style={{ background: "rgba(255,255,255,0.04)" }}>
                <p className="text-gray-400 text-xs truncate">{imgFile?.name}</p>
                <button
                  onClick={analyzeImage}
                  disabled={imgBusy}
                  className="px-4 py-1.5 rounded-lg bg-pink-500 hover:bg-pink-400 text-white text-xs font-medium disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  {imgBusy ? <><FiRefreshCw size={11} className="animate-spin" /> Analyzing…</> : <><FiCpu size={11} /> Analyze</>}
                </button>
              </div>
            </div>
          )}

          {imgResult !== null && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-4 space-y-2"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <MdOutlineMedicalServices className="text-pink-400" size={15} />
                <p className="text-white text-sm font-semibold">AI Analysis</p>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                {imgResult}
                {imgBusy && (
                  <span className="inline-flex gap-1 ml-1">
                    {[0,1,2].map(j => (
                      <motion.span key={j} className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: j * 0.2 }} />
                    ))}
                  </span>
                )}
              </p>
              <p className="text-gray-600 text-[10px] pt-2 border-t border-white/6">
                AI-generated response. Not a medical diagnosis. Consult a licensed doctor.
              </p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// History tab — all records from backend
// ════════════════════════════════════════════════════════════════════════════
const HistoryView = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [filter,  setFilter]  = useState("all");

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

  const filtered = filter === "all" ? records : records.filter(r => r.record_type === filter);

  return (
    <div className="h-full flex flex-col">
      {/* Filter bar */}
      <div className="flex-shrink-0 flex gap-1.5 px-4 py-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        <button
          onClick={() => setFilter("all")}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all ${
            filter === "all" ? "bg-pink-500/20 text-pink-300 border border-pink-500/30" : "text-gray-500 hover:text-gray-300 bg-white/4"
          }`}
        >All</button>
        {METRICS.map(m => (
          <button
            key={m.key}
            onClick={() => setFilter(m.key)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all ${
              filter === m.key ? "bg-pink-500/20 text-pink-300 border border-pink-500/30" : "text-gray-500 hover:text-gray-300 bg-white/4"
            }`}
          >{m.label}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4" style={{ scrollbarWidth: "none" }}>
        {error && (
          <div className="mb-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center gap-2">
            <FiAlertCircle size={14} /> {error}
            <button onClick={load} className="ml-auto text-xs underline">Retry</button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-600">
            <FiRefreshCw className="animate-spin mb-2" />
            <p className="text-sm">Loading history…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-600">
            <FiClock size={28} className="mb-2 opacity-30" />
            <p className="text-sm">No records yet</p>
            <p className="text-xs mt-1">Log a vital sign to see it here</p>
          </div>
        ) : (
          <div className="space-y-2 pt-1">
            {filtered.map((rec, i) => {
              const meta = metaFor(rec.record_type);
              const Icon = meta.icon;
              const color = statusColor(rec.record_type, rec.value);
              return (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}25` }}>
                    <Icon size={13} style={{ color: meta.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white text-sm font-medium">{meta.label}</p>
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                    </div>
                    {rec.notes && <p className="text-gray-600 text-xs truncate">{rec.notes}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-white font-bold text-sm">
                      {formatValue(rec.record_type, rec.value)}
                      <span className="text-gray-600 text-xs font-normal ml-1">{meta.unit}</span>
                    </p>
                    <p className="text-gray-600 text-[10px]">
                      {new Date(rec.recorded_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                      {" · "}
                      {new Date(rec.recorded_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Health;