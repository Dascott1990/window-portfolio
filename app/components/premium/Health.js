"use client";
/**
 * Health.js — Crew Safety
 * Injury prevention for warehouse, delivery, and supervisory roles.
 * Three views: Lift Logger · Fatigue Check-in · Supervisor Roster
 *
 * Backend: POST /api/v1/health/lift
 *          POST /api/v1/health/fatigue
 *          GET  /api/v1/health/lift/today
 *          GET  /api/v1/health/fatigue/today
 *          GET  /api/v1/health/roster
 *          GET  /api/v1/health/crew
 *          POST /api/v1/health/crew
 */
import React, { useState, useEffect, useCallback, useReducer } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

// ── API ────────────────────────────────────────────────────────────────────────
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

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  bg:      "#080B10",
  panel:   "#0D1017",
  surface: "#111520",
  raised:  "#161C28",
  border:  "rgba(255,255,255,0.07)",
  text:    "#E8E4DC",
  muted:   "#7A8899",
  faint:   "rgba(122,136,153,0.4)",
  yellow:  "#F5C542",
  yBg:     "rgba(245,197,66,0.1)",
  yBr:     "rgba(245,197,66,0.25)",
  red:     "#EF4444",
  rBg:     "rgba(239,68,68,0.1)",
  rBr:     "rgba(239,68,68,0.25)",
  green:   "#22C55E",
  gBg:     "rgba(34,197,94,0.08)",
  gBr:     "rgba(34,197,94,0.2)",
  blue:    "#3B82F6",
  bBg:     "rgba(59,130,246,0.1)",
  bBr:     "rgba(59,130,246,0.22)",
  sans:    "-apple-system,'SF Pro Display',Inter,system-ui,sans-serif",
  mono:    "'SF Mono','JetBrains Mono',monospace",
};

// ── Icons — Lucide paths ───────────────────────────────────────────────────────
const PATHS = {
  X:          "M18 6 6 18M6 6l12 12",
  Check:      "M20 6 9 17l-5-5",
  ChevronLeft:"M15 18l-6-6 6-6",
  Weight:     ["M6 18h12","M3 6h18","M8 6V4h8v2","M12 6v12"],
  Lift:       ["M12 2v20","M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"],
  Moon:       "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z",
  Users:      ["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2","M23 21v-2a4 4 0 0 0-3-3.87","M16 3.13a4 4 0 0 1 0 7.75","M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"],
  Alert:      ["M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z","M12 9v4","M12 17h.01"],
  Refresh:    ["M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8","M21 3v5h-5","M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16","M8 16H3v5"],
  Plus:       "M12 5v14M5 12h14",
  Trash:      ["M3 6h18","M8 6V4h8v2","M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"],
  ChevronDown:"M6 9l6 6 6-6",
};

function Ic({ d, size = 16, color = "currentColor", sw = 1.8 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}

// ── Shared primitives ──────────────────────────────────────────────────────────
function Spinner({ size = 18, color = C.blue }) {
  return (
    <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.85, ease: "linear" }}
      style={{ display:"inline-block", width:size, height:size, borderRadius:"50%",
        border:`2px solid rgba(255,255,255,0.08)`, borderTopColor: color }} />
  );
}

function Btn({ children, onClick, disabled, variant = "primary", small, icon, loading, full }) {
  const v = {
    primary: { bg: C.blue,   br: C.bBr,  fg: "#fff"    },
    yellow:  { bg: C.yBg,    br: C.yBr,  fg: C.yellow  },
    ghost:   { bg:"transparent", br:C.border, fg:C.muted },
    danger:  { bg: C.rBg,    br: C.rBr,  fg: C.red     },
    success: { bg: C.gBg,    br: C.gBr,  fg: C.green   },
  }[variant] || {};
  return (
    <motion.button whileTap={!disabled ? { scale: 0.96 } : undefined}
      onClick={disabled ? undefined : onClick}
      style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", gap:6,
        padding: small ? "7px 13px" : "11px 15px", minHeight: small ? 36 : 44,
        borderRadius:9, border:`1px solid ${v.br}`, background:v.bg, color:v.fg,
        fontSize: small ? 12.5 : 13.5, fontWeight:600, fontFamily:C.sans,
        cursor:disabled?"not-allowed":"pointer", opacity:disabled?0.4:1,
        width:full?"100%":"auto", transition:"opacity 0.12s", boxSizing:"border-box" }}>
      {loading ? <Spinner size={13} color={v.fg} /> : icon && <Ic d={PATHS[icon]} size={14} color={v.fg} />}
      {children}
    </motion.button>
  );
}

function Badge({ label, variant }) {
  const v = {
    clear:           { bg:C.gBg, br:C.gBr, fg:C.green  },
    high_risk:       { bg:C.yBg, br:C.yBr, fg:C.yellow },
    fatigue_flagged: { bg:C.rBg, br:C.rBr, fg:C.red    },
    moderate:        { bg:C.yBg, br:C.yBr, fg:C.yellow },
    high:            { bg:C.rBg, br:C.rBr, fg:C.red    },
    low:             { bg:C.gBg, br:C.gBr, fg:C.green  },
    rested:          { bg:C.gBg, br:C.gBr, fg:C.green  },
    tired:           { bg:C.yBg, br:C.yBr, fg:C.yellow },
    very_fatigued:   { bg:C.rBg, br:C.rBr, fg:C.red    },
  }[variant] || { bg:C.surface, br:C.border, fg:C.muted };
  return (
    <span style={{ fontSize:11, padding:"2px 9px", borderRadius:20,
      background:v.bg, border:`1px solid ${v.br}`, color:v.fg,
      fontWeight:600, whiteSpace:"nowrap", fontFamily:C.mono }}>
      {label.replace(/_/g," ")}
    </span>
  );
}

function StatCard({ label, value, sub, variant }) {
  const colors = { yellow:C.yellow, red:C.red, green:C.green, blue:C.blue };
  const fg = colors[variant] || C.text;
  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`,
      borderRadius:12, padding:"12px 14px", flex:1 }}>
      <p style={{ fontSize:11, color:C.muted, margin:"0 0 4px", fontFamily:C.mono,
        letterSpacing:"0.06em" }}>{label}</p>
      <p style={{ fontSize:26, fontWeight:700, margin:0, color:fg, lineHeight:1 }}>{value}</p>
      {sub && <p style={{ fontSize:11, color:C.muted, margin:"3px 0 0" }}>{sub}</p>}
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{ flex:1, minWidth:0 }}>
      <label style={{ display:"block", fontFamily:C.mono, fontSize:10,
        color:C.faint, letterSpacing:"0.07em", marginBottom:5 }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`,
          borderRadius:8, padding:"10px 11px", color:C.text, fontSize:13.5,
          fontFamily:C.sans, outline:"none", minHeight:42 }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ── Guidance alert ─────────────────────────────────────────────────────────────
function Guidance({ text }) {
  if (!text) return null;
  return (
    <div style={{ display:"flex", gap:10, padding:"11px 13px", borderRadius:9,
      background:C.yBg, border:`1px solid ${C.yBr}`, marginTop:12 }}>
      <Ic d={PATHS.Alert} size={15} color={C.yellow} />
      <p style={{ color:C.yellow, fontSize:12.5, margin:0, lineHeight:1.55 }}>{text}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1 — LIFT LOGGER
// ═══════════════════════════════════════════════════════════════════════════════
const WEIGHT_OPTS = [
  { value:"under_25", label:"Under 25 lb" },
  { value:"25_50",    label:"25 – 50 lb"  },
  { value:"50_75",    label:"50 – 75 lb"  },
  { value:"over_75",  label:"Over 75 lb"  },
];
const LIFT_OPTS = [
  { value:"floor_to_waist", label:"Floor to waist" },
  { value:"overhead",       label:"Overhead"       },
  { value:"repetitive",     label:"Repetitive (10+)"},
  { value:"awkward_angle",  label:"Awkward angle"  },
];
const REP_OPTS = [
  { value:"1", label:"1 – 3 reps" },
  { value:"5", label:"4 – 9 reps" },
  { value:"10",label:"10+ reps"   },
];

function LiftTab({ crewMembers }) {
  const [weight,    setWeight]    = useState("under_25");
  const [type,      setType]      = useState("floor_to_waist");
  const [reps,      setReps]      = useState("1");
  const [team,      setTeam]      = useState(false);
  const [memberId,  setMemberId]  = useState("");
  const [saving,    setSaving]    = useState(false);
  const [guidance,  setGuidance]  = useState(null);
  const [lastRisk,  setLastRisk]  = useState(null);
  const [summary,   setSummary]   = useState(null);
  const [error,     setError]     = useState(null);

  const loadSummary = useCallback(async () => {
    try {
      const d = await apiFetch("/api/v1/health/lift/today");
      setSummary(d);
    } catch {}
  }, []);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  const submit = async () => {
    setSaving(true); setError(null); setGuidance(null); setLastRisk(null);
    try {
      const member = crewMembers.find(m => m.id === memberId);
      const d = await apiFetch("/api/v1/health/lift", {
        method: "POST",
        body: JSON.stringify({
          weight_band:    weight,
          lift_type:      type,
          repetitions:    parseInt(reps),
          used_team_lift: team,
          crew_member_id: memberId || null,
          crew_member_name: member?.metadata_json?.name || null,
        }),
      });
      setGuidance(d.guidance);
      setLastRisk(d.metadata_json?.risk_level);
      await loadSummary();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding:"16px", overflowY:"auto", flex:1, scrollbarWidth:"none" }}>
      {/* Today summary */}
      {summary && (
        <div style={{ display:"flex", gap:8, marginBottom:16 }}>
          <StatCard label="LIFTS TODAY"   value={summary.total}     variant="blue"   />
          <StatCard label="HIGH RISK"     value={summary.high_risk} variant="red"    />
          <StatCard label="MODERATE"      value={summary.moderate}  variant="yellow" />
        </div>
      )}

      <p style={{ fontFamily:C.mono, fontSize:10, color:C.faint, letterSpacing:"0.07em",
        margin:"0 0 12px" }}>LOG A LIFT</p>

      {/* Who */}
      {crewMembers.length > 0 && (
        <div style={{ marginBottom:10 }}>
          <label style={{ display:"block", fontFamily:C.mono, fontSize:10, color:C.faint,
            letterSpacing:"0.07em", marginBottom:5 }}>CREW MEMBER</label>
          <select value={memberId} onChange={e => setMemberId(e.target.value)}
            style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`,
              borderRadius:8, padding:"10px 11px", color:C.text, fontSize:13.5,
              fontFamily:C.sans, outline:"none", minHeight:42 }}>
            <option value="">— Anonymous —</option>
            {crewMembers.map(m => (
              <option key={m.id} value={m.id}>{m.metadata_json?.name}</option>
            ))}
          </select>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 10px" }}>
        <Select label="WEIGHT HANDLED" value={weight} onChange={setWeight} options={WEIGHT_OPTS} />
        <Select label="LIFT TYPE"      value={type}   onChange={setType}   options={LIFT_OPTS}   />
      </div>
      <div style={{ marginTop:10 }}>
        <Select label="REPETITIONS" value={reps} onChange={setReps} options={REP_OPTS} />
      </div>

      {/* Team lift toggle */}
      <button onClick={() => setTeam(v => !v)}
        style={{ display:"flex", alignItems:"center", gap:10, marginTop:12,
          background:team ? C.gBg : C.surface, border:`1px solid ${team ? C.gBr : C.border}`,
          borderRadius:9, padding:"10px 13px", cursor:"pointer", width:"100%" }}>
        <div style={{ width:20, height:20, borderRadius:5, display:"flex",
          alignItems:"center", justifyContent:"center",
          background: team ? C.green : "transparent",
          border:`1.5px solid ${team ? C.green : C.border}` }}>
          {team && <Ic d={PATHS.Check} size={12} color="#fff" sw={2.5} />}
        </div>
        <span style={{ color:team ? C.green : C.muted, fontSize:13, fontWeight:500 }}>
          Team lift / mechanical aid used
        </span>
      </button>

      {error && (
        <div style={{ display:"flex", gap:8, padding:"10px 12px", borderRadius:8,
          background:C.rBg, border:`1px solid ${C.rBr}`, color:C.red,
          fontSize:12.5, marginTop:12 }}>
          <Ic d={PATHS.Alert} size={14} color={C.red} /> {error}
        </div>
      )}

      {/* Result */}
      {lastRisk && !guidance && (
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 13px",
          borderRadius:9, background:C.gBg, border:`1px solid ${C.gBr}`, marginTop:12 }}>
          <Ic d={PATHS.Check} size={14} color={C.green} />
          <span style={{ color:C.green, fontSize:13 }}>Logged · Risk: </span>
          <Badge label={lastRisk} variant={lastRisk} />
        </div>
      )}
      <Guidance text={guidance} />

      <div style={{ marginTop:14 }}>
        <Btn full icon="Lift" onClick={submit} disabled={saving} loading={saving}>
          {saving ? "Logging…" : "Log Lift"}
        </Btn>
      </div>

      {/* Today's log */}
      {summary?.logs?.length > 0 && (
        <div style={{ marginTop:18 }}>
          <p style={{ fontFamily:C.mono, fontSize:10, color:C.faint,
            letterSpacing:"0.07em", margin:"0 0 10px" }}>TODAY'S LIFTS</p>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {summary.logs.slice(0,10).map(log => {
              const m = log.metadata_json || {};
              return (
                <div key={log.id} style={{ display:"flex", alignItems:"center",
                  justifyContent:"space-between", padding:"9px 12px",
                  background:C.surface, border:`1px solid ${C.border}`,
                  borderRadius:9, gap:8 }}>
                  <div style={{ minWidth:0 }}>
                    <span style={{ color:C.text, fontSize:13, fontWeight:500 }}>
                      {LIFT_OPTS.find(o=>o.value===m.lift_type)?.label || m.lift_type}
                    </span>
                    <span style={{ color:C.muted, fontSize:11.5, marginLeft:8 }}>
                      {WEIGHT_OPTS.find(o=>o.value===m.weight_band)?.label}
                    </span>
                    {m.crew_member_name && (
                      <span style={{ color:C.faint, fontSize:11, marginLeft:8 }}>· {m.crew_member_name}</span>
                    )}
                  </div>
                  <Badge label={m.risk_level || "low"} variant={m.risk_level || "low"} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2 — FATIGUE CHECK-IN
// ═══════════════════════════════════════════════════════════════════════════════
const FATIGUE_OPTS = [
  { value:"rested",       label:"Well rested",   desc:"Ready for full shift",            variant:"success" },
  { value:"tired",        label:"Tired",          desc:"Managing — supervisor informed",  variant:"yellow"  },
  { value:"very_fatigued",label:"Very fatigued",  desc:"Supervisor will be notified",     variant:"danger"  },
];
const SHIFT_OPTS = [
  { value:"standard",  label:"Standard (day)"   },
  { value:"early",     label:"Early start"       },
  { value:"overnight", label:"Overnight / split" },
];

function FatigueTab({ crewMembers }) {
  const [level,     setLevel]     = useState(null);
  const [shift,     setShift]     = useState("standard");
  const [hours,     setHours]     = useState("");
  const [memberId,  setMemberId]  = useState("");
  const [saving,    setSaving]    = useState(false);
  const [done,      setDone]      = useState(null);
  const [summary,   setSummary]   = useState(null);
  const [error,     setError]     = useState(null);

  const loadSummary = useCallback(async () => {
    try {
      const d = await apiFetch("/api/v1/health/fatigue/today");
      setSummary(d);
    } catch {}
  }, []);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  const submit = async () => {
    if (!level) return;
    setSaving(true); setError(null); setDone(null);
    try {
      const member = crewMembers.find(m => m.id === memberId);
      const d = await apiFetch("/api/v1/health/fatigue", {
        method: "POST",
        body: JSON.stringify({
          fatigue_level:    level,
          shift_type:       shift,
          hours_slept:      hours ? parseFloat(hours) : null,
          crew_member_id:   memberId || null,
          crew_member_name: member?.metadata_json?.name || null,
        }),
      });
      setDone({ level, flagged: d.flagged_supervisor });
      await loadSummary();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding:"16px", overflowY:"auto", flex:1, scrollbarWidth:"none" }}>
      {summary && (
        <div style={{ display:"flex", gap:8, marginBottom:16 }}>
          <StatCard label="CHECKED IN"     value={summary.total}   variant="blue"  />
          <StatCard label="FATIGUE FLAGS"  value={summary.flagged} variant="red"   sub="supervisor notified" />
        </div>
      )}

      <p style={{ fontFamily:C.mono, fontSize:10, color:C.faint, letterSpacing:"0.07em",
        margin:"0 0 12px" }}>PRE-SHIFT CHECK-IN</p>

      {crewMembers.length > 0 && (
        <div style={{ marginBottom:12 }}>
          <label style={{ display:"block", fontFamily:C.mono, fontSize:10, color:C.faint,
            letterSpacing:"0.07em", marginBottom:5 }}>CREW MEMBER</label>
          <select value={memberId} onChange={e => setMemberId(e.target.value)}
            style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`,
              borderRadius:8, padding:"10px 11px", color:C.text, fontSize:13.5,
              fontFamily:C.sans, outline:"none", minHeight:42 }}>
            <option value="">— Anonymous —</option>
            {crewMembers.map(m => (
              <option key={m.id} value={m.id}>{m.metadata_json?.name}</option>
            ))}
          </select>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 10px", marginBottom:14 }}>
        <Select label="SHIFT TYPE" value={shift} onChange={setShift} options={SHIFT_OPTS} />
        <div style={{ flex:1 }}>
          <label style={{ display:"block", fontFamily:C.mono, fontSize:10, color:C.faint,
            letterSpacing:"0.07em", marginBottom:5 }}>HOURS SLEPT</label>
          <input type="number" min="0" max="24" step="0.5" value={hours}
            onChange={e => setHours(e.target.value)} placeholder="e.g. 7.5"
            style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`,
              borderRadius:8, padding:"10px 11px", color:C.text, fontSize:13.5,
              fontFamily:C.sans, outline:"none", minHeight:42, boxSizing:"border-box" }} />
        </div>
      </div>

      {/* Fatigue selector */}
      <p style={{ fontFamily:C.mono, fontSize:10, color:C.faint, letterSpacing:"0.07em",
        margin:"0 0 8px" }}>HOW ARE YOU FEELING?</p>
      <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
        {FATIGUE_OPTS.map(opt => {
          const active = level === opt.value;
          const bgs = { success:C.gBg, yellow:C.yBg, danger:C.rBg };
          const brs = { success:C.gBr, yellow:C.yBr, danger:C.rBr };
          const fgs = { success:C.green, yellow:C.yellow, danger:C.red };
          return (
            <button key={opt.value} onClick={() => setLevel(opt.value)}
              style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"12px 14px", borderRadius:10, cursor:"pointer", textAlign:"left",
                background: active ? bgs[opt.variant] : C.surface,
                border:`1.5px solid ${active ? brs[opt.variant] : C.border}`,
                transition:"all 0.12s" }}>
              <div>
                <p style={{ color: active ? fgs[opt.variant] : C.text, fontSize:13.5,
                  fontWeight:600, margin:0 }}>{opt.label}</p>
                {active && <p style={{ color:fgs[opt.variant], fontSize:11.5, margin:"2px 0 0",
                  opacity:0.75 }}>{opt.desc}</p>}
              </div>
              {active && <Ic d={PATHS.Check} size={16} color={fgs[opt.variant]} sw={2.5} />}
            </button>
          );
        })}
      </div>

      {error && (
        <div style={{ display:"flex", gap:8, padding:"10px 12px", borderRadius:8,
          background:C.rBg, border:`1px solid ${C.rBr}`, color:C.red,
          fontSize:12.5, marginTop:12 }}>
          <Ic d={PATHS.Alert} size={14} color={C.red} /> {error}
        </div>
      )}

      {done && (
        <div style={{ padding:"11px 13px", borderRadius:9, marginTop:12,
          background: done.level === "very_fatigued" ? C.rBg : C.gBg,
          border:`1px solid ${done.level === "very_fatigued" ? C.rBr : C.gBr}` }}>
          <p style={{ color: done.level === "very_fatigued" ? C.red : C.green,
            fontSize:13, margin:0, fontWeight:600 }}>
            {done.level === "very_fatigued"
              ? "⚠ Supervisor has been notified. Please speak to them before starting your shift."
              : "✓ Check-in recorded. Stay safe out there."}
          </p>
        </div>
      )}

      <div style={{ marginTop:14 }}>
        <Btn full icon="Check" onClick={submit} disabled={!level || saving} loading={saving}>
          {saving ? "Recording…" : "Submit Check-in"}
        </Btn>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3 — SUPERVISOR ROSTER
// ═══════════════════════════════════════════════════════════════════════════════
function RosterTab() {
  const [roster,       setRoster]       = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [showAddCrew,  setShowAddCrew]  = useState(false);
  const [newName,      setNewName]      = useState("");
  const [newRole,      setNewRole]      = useState("Warehouse Associate");
  const [newCrew,      setNewCrew]      = useState("Dock 3");
  const [isSup,        setIsSup]        = useState(false);
  const [addSaving,    setAddSaving]    = useState(false);
  const [error,        setError]        = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiFetch("/api/v1/health/roster");
      setRoster(d);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addMember = async () => {
    if (!newName.trim()) return;
    setAddSaving(true);
    try {
      await apiFetch("/api/v1/health/crew", {
        method: "POST",
        body: JSON.stringify({ name: newName, role_title: newRole,
          crew_name: newCrew, is_supervisor: isSup }),
      });
      setNewName(""); setShowAddCrew(false); await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setAddSaving(false);
    }
  };

  return (
    <div style={{ padding:"16px", overflowY:"auto", flex:1, scrollbarWidth:"none" }}>
      {loading ? (
        <div style={{ display:"flex", justifyContent:"center", padding:"40px 0" }}>
          <Spinner size={28} />
        </div>
      ) : error ? (
        <div style={{ display:"flex", gap:8, padding:"11px 13px", borderRadius:9,
          background:C.rBg, border:`1px solid ${C.rBr}`, color:C.red, fontSize:13 }}>
          <Ic d={PATHS.Alert} size={15} color={C.red} /> {error}
        </div>
      ) : (
        <>
          {roster?.summary && (
            <div style={{ display:"flex", gap:8, marginBottom:16 }}>
              <StatCard label="CLEAR"       value={roster.summary.clear}           variant="green"  />
              <StatCard label="HIGH RISK"   value={roster.summary.high_risk}       variant="yellow" />
              <StatCard label="FATIGUE"     value={roster.summary.fatigue_flagged} variant="red"    />
            </div>
          )}

          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            marginBottom:10 }}>
            <p style={{ fontFamily:C.mono, fontSize:10, color:C.faint,
              letterSpacing:"0.07em", margin:0 }}>CREW ROSTER</p>
            <Btn small icon="Plus" variant="ghost" onClick={() => setShowAddCrew(v=>!v)}>
              Add member
            </Btn>
          </div>

          {/* Add member form */}
          <AnimatePresence>
            {showAddCrew && (
              <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }}
                exit={{ height:0, opacity:0 }} style={{ overflow:"hidden", marginBottom:12 }}>
                <div style={{ padding:"13px 14px", background:C.surface,
                  border:`1px solid ${C.border}`, borderRadius:10 }}>
                  <p style={{ fontFamily:C.mono, fontSize:10, color:C.faint,
                    letterSpacing:"0.07em", margin:"0 0 10px" }}>NEW CREW MEMBER</p>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    <input value={newName} onChange={e=>setNewName(e.target.value)}
                      placeholder="Full name"
                      style={{ background:C.raised, border:`1px solid ${C.border}`, borderRadius:7,
                        padding:"9px 11px", color:C.text, fontSize:13.5, fontFamily:C.sans,
                        outline:"none", width:"100%", boxSizing:"border-box" }} />
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                      <input value={newRole} onChange={e=>setNewRole(e.target.value)}
                        placeholder="Role (e.g. Warehouse Assoc.)"
                        style={{ background:C.raised, border:`1px solid ${C.border}`, borderRadius:7,
                          padding:"9px 11px", color:C.text, fontSize:13.5, fontFamily:C.sans,
                          outline:"none", boxSizing:"border-box" }} />
                      <input value={newCrew} onChange={e=>setNewCrew(e.target.value)}
                        placeholder="Crew / Dock / Route"
                        style={{ background:C.raised, border:`1px solid ${C.border}`, borderRadius:7,
                          padding:"9px 11px", color:C.text, fontSize:13.5, fontFamily:C.sans,
                          outline:"none", boxSizing:"border-box" }} />
                    </div>
                    <button onClick={()=>setIsSup(v=>!v)}
                      style={{ display:"flex", alignItems:"center", gap:8, background:"none",
                        border:"none", cursor:"pointer", padding:0 }}>
                      <div style={{ width:18, height:18, borderRadius:4, display:"flex",
                        alignItems:"center", justifyContent:"center",
                        background:isSup?C.blue:"transparent",
                        border:`1.5px solid ${isSup?C.blue:C.border}` }}>
                        {isSup && <Ic d={PATHS.Check} size={11} color="#fff" sw={2.5} />}
                      </div>
                      <span style={{ color:C.muted, fontSize:13 }}>Mark as supervisor</span>
                    </button>
                    <div style={{ display:"flex", gap:7 }}>
                      <Btn small icon="Plus" onClick={addMember}
                        disabled={!newName.trim()||addSaving} loading={addSaving}>
                        Add
                      </Btn>
                      <Btn small variant="ghost" onClick={()=>setShowAddCrew(false)}>Cancel</Btn>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Crew list */}
          {roster?.crew?.length === 0 ? (
            <div style={{ textAlign:"center", padding:"30px 16px", color:C.muted }}>
              <Ic d={PATHS.Users} size={28} color={C.border} />
              <p style={{ fontSize:13, margin:"10px 0 4px" }}>No crew members yet</p>
              <p style={{ fontSize:11.5, color:C.faint, margin:0 }}>Add members above to start tracking</p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
              {roster.crew.map(member => (
                <div key={member.id} style={{ display:"flex", alignItems:"center",
                  justifyContent:"space-between", padding:"11px 13px",
                  background:C.surface, border:`1px solid ${C.border}`,
                  borderRadius:10, gap:8 }}>
                  <div style={{ minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                      <p style={{ color:C.text, fontSize:13.5, fontWeight:600, margin:0,
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {member.name}
                      </p>
                      {member.is_supervisor && (
                        <span style={{ fontSize:9.5, fontFamily:C.mono, padding:"1px 6px",
                          borderRadius:4, background:C.bBg, border:`1px solid ${C.bBr}`,
                          color:C.blue, flexShrink:0 }}>SUP</span>
                      )}
                    </div>
                    <p style={{ color:C.muted, fontSize:11.5, margin:"1px 0 0" }}>
                      {member.role_title}{member.crew_name ? ` · ${member.crew_name}` : ""}
                    </p>
                    {member.status === "high_risk" && (
                      <p style={{ color:C.yellow, fontSize:11, margin:"3px 0 0", fontFamily:C.mono }}>
                        {member.high_risk_lifts_7d} high-risk lift{member.high_risk_lifts_7d !== 1?"s":""} this week
                      </p>
                    )}
                    {member.status === "fatigue_flagged" && (
                      <p style={{ color:C.red, fontSize:11, margin:"3px 0 0", fontFamily:C.mono }}>
                        Fatigue flag today
                      </p>
                    )}
                  </div>
                  <Badge label={member.status} variant={member.status} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SHELL
// ═══════════════════════════════════════════════════════════════════════════════
const TABS = [
  { id:"lift",    label:"Lift Log",    icon:"Weight" },
  { id:"fatigue", label:"Check-in",    icon:"Moon"   },
  { id:"roster",  label:"Roster",      icon:"Users"  },
];

export default function Health({ onClose }) {
  const [tab,         setTab]         = useState("lift");
  const [crewMembers, setCrewMembers] = useState([]);
  const [loading,     setLoading]     = useState(true);

  const loadCrew = useCallback(async () => {
    try {
      const d = await apiFetch("/api/v1/health/crew");
      const items = Array.isArray(d) ? d : d?.items ?? [];
      setCrewMembers(items);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadCrew(); }, [loadCrew]);

  return (
    <AnimatePresence>
      <motion.div key="crew-safety" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        style={{ position:"fixed", inset:0, bottom:"var(--taskbar-height,52px)", zIndex:50,
          background:C.bg, display:"flex", flexDirection:"column",
          fontFamily:C.sans, overflow:"hidden" }}>

        {/* Header */}
        <div style={{ flexShrink:0, height:52, display:"flex", alignItems:"center",
          justifyContent:"space-between", padding:"0 14px",
          background:C.panel, borderBottom:`1px solid ${C.border}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <Ic d={PATHS.Weight} size={16} color={C.yellow} />
            <span style={{ fontSize:14, fontWeight:700, color:C.text }}>Crew Safety</span>
            <span style={{ fontSize:10.5, fontFamily:C.mono, color:C.muted,
              background:C.raised, border:`1px solid ${C.border}`,
              padding:"2px 7px", borderRadius:5 }}>Injury Prevention</span>
          </div>
          <button onClick={onClose} aria-label="Close"
            style={{ width:32, height:32, borderRadius:"50%", background:C.raised,
              border:`1px solid ${C.border}`, display:"flex", alignItems:"center",
              justifyContent:"center", cursor:"pointer" }}>
            <Ic d={PATHS.X} size={14} color={C.muted} />
          </button>
        </div>

        {/* Tab bar */}
        <div style={{ display:"flex", background:C.surface, borderBottom:`1px solid ${C.border}`,
          padding:5, gap:5, flexShrink:0 }}>
          {TABS.map(t => {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ flex:1, minHeight:40, display:"flex", alignItems:"center",
                  justifyContent:"center", gap:6, borderRadius:7, border:"none",
                  cursor:"pointer", background:active?C.blue:"transparent",
                  color:active?"#fff":C.muted, fontSize:13, fontWeight:700,
                  fontFamily:C.sans, transition:"all 0.12s" }}>
                <Ic d={PATHS[t.icon]} size={14} color={active?"#fff":C.muted} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          {tab === "lift"    && <LiftTab    crewMembers={crewMembers} />}
          {tab === "fatigue" && <FatigueTab crewMembers={crewMembers} />}
          {tab === "roster"  && <RosterTab  />}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}