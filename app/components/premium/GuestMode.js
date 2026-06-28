"use client";
/**
 * GuestMode.js  —  app/components/GuestMode.js
 *
 * Drop-in guest resume wizard for Resume.js.
 * Calls YOUR backend: POST /api/v1/resume/generate  (Groq under the hood).
 *
 * Props:
 *   onResume(resumeObj)  — called when AI returns; parent updates the preview
 *   style                — { font, fontSize, lineHeight, accent } from Resume.js
 *   isMobile             — boolean
 */

import React, { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

// ── Tokens (match Resume.js) ──────────────────────────────────────────────────
const T = {
  bg:      "#0B0D14",
  panel:   "#0F1219",
  surface: "#141820",
  raised:  "#1A2030",
  border:  "rgba(255,255,255,0.07)",
  text:    "#E8E4DC",
  sub:     "#6B7A90",
  faint:   "rgba(107,122,144,0.45)",
  gold:    "#C9A84C",
  goldBg:  "rgba(201,168,76,0.1)",
  goldBr:  "rgba(201,168,76,0.22)",
  green:   "#2BB56A",
  greenBg: "rgba(43,181,106,0.08)",
  greenBr: "rgba(43,181,106,0.2)",
  blue:    "#3B82F6",
  blueBg:  "rgba(59,130,246,0.1)",
  blueBr:  "rgba(59,130,246,0.22)",
  red:     "#ef4444",
  redBg:   "rgba(239,68,68,0.08)",
  redBr:   "rgba(239,68,68,0.2)",
  mono:    "'SF Mono','JetBrains Mono',monospace",
  sans:    "-apple-system,'SF Pro Display',Inter,system-ui,sans-serif",
};

// ── Tiny SVG icons ─────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16, color = "currentColor", sw = 1.7 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }}>
    {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
  </svg>
);
const I = {
  arrow:   "M5 12h14M12 5l7 7-7 7",
  back:    "M19 12H5M12 19l-7-7 7-7",
  spark:   "M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z",
  check:   "M20 6 9 17l-5-5",
  refresh: "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15",
  tag:     "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z",
  user:    ["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2", "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"],
  doc:     ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6"],
  pin:     ["M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z", "M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"],
};

// ── Shared input styles ────────────────────────────────────────────────────────
const inputStyle = (focused) => ({
  width: "100%",
  background: T.surface,
  border: `1px solid ${focused ? T.blueBr : T.border}`,
  borderRadius: 10,
  padding: "10px 12px",
  color: T.text,
  fontSize: 13,
  fontFamily: T.sans,
  boxSizing: "border-box",
  outline: "none",
  transition: "border-color 0.15s",
});

// ── Field component — auto-focus tracking ──────────────────────────────────────
function Field({ label, hint, value, onChange, placeholder, multiline, rows = 3, required }) {
  const [focused, setFocused] = useState(false);
  const props = {
    value,
    onChange: e => onChange(e.target.value),
    placeholder,
    onFocus: () => setFocused(true),
    onBlur:  () => setFocused(false),
    style: inputStyle(focused),
  };
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <label style={{ fontFamily: T.mono, fontSize: 9, color: T.faint, letterSpacing: "0.1em" }}>
          {label}{required && <span style={{ color: T.red, marginLeft: 2 }}>*</span>}
        </label>
        {hint && <span style={{ fontFamily: T.mono, fontSize: 9, color: T.faint }}>{hint}</span>}
      </div>
      {multiline
        ? <textarea {...props} rows={rows} style={{ ...props.style, resize: "vertical" }} />
        : <input    {...props} type="text" />
      }
    </div>
  );
}

// ── Progress bar ───────────────────────────────────────────────────────────────
function Progress({ step, total = 2 }) {
  return (
    <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ flex: 1, height: 3, borderRadius: 2,
          background: i < step ? T.blue : T.border,
          transition: "background 0.3s" }} />
      ))}
    </div>
  );
}

// ── Spinner ────────────────────────────────────────────────────────────────────
function Spinner({ size = 20, color = T.blue }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
      style={{ width: size, height: size, borderRadius: "50%",
        border: `2.5px solid ${T.border}`, borderTopColor: color }} />
  );
}

// ── Keyword pill ───────────────────────────────────────────────────────────────
function Kw({ word }) {
  return (
    <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 20,
      background: T.blueBg, border: `1px solid ${T.blueBr}`, color: T.blue,
      fontFamily: T.mono, letterSpacing: "0.02em" }}>
      {word}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GuestMode
// ═══════════════════════════════════════════════════════════════════════════════
export default function GuestMode({ onResume, isMobile }) {
  const [step, setStep] = useState(1);  // 1 = info, 2 = job desc
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null); // { keywords, contact, sections, saved_id }

  // ── Step 1: User Info ──────────────────────────────────────────────────────
  const [info, setInfo] = useState({
    name:       "",
    title:      "",
    location:   "",
    email:      "",
    phone:      "",
    background: "",
    experience: "",
    education:  "",
    skills:     "",
  });

  // ── Step 2: Job Description ────────────────────────────────────────────────
  const [jobDesc, setJobDesc] = useState("");
  const [jdFocused, setJdFocused] = useState(false);

  const set = useCallback((key) => (val) => setInfo(p => ({ ...p, [key]: val })), []);

  const ready1 = info.name.trim() && info.title.trim() && info.location.trim();
  const ready2 = jobDesc.trim().length >= 80;

  // ── Generate ───────────────────────────────────────────────────────────────
  const generate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE}/api/v1/resume/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_info: info, job_description: jobDesc }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Error ${res.status}`);

      const resume = data.data ?? data;

      // Build the resume object Resume.js preview expects
      const resumeObj = {
        label:    "AI Generated",
        title:    resume.contact?.title || info.title,
        contact:  resume.contact || { name: info.name, title: info.title, email: info.email, phone: info.phone, location: info.location },
        sections: resume.sections || [],
        keywords: resume.keywords || [],
        saved_id: resume.saved_id || null,
      };

      setResult({ keywords: resume.keywords || [], saved_id: resume.saved_id, location: resume.job_location });
      onResume(resumeObj);
    } catch (e) {
      setError(e.message || "Generation failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(1); setResult(null); setError("");
    setInfo({ name:"", title:"", location:"", email:"", phone:"", background:"", experience:"", education:"", skills:"" });
    setJobDesc("");
  };

  // ── Shared button ──────────────────────────────────────────────────────────
  const Btn = ({ children, onClick, disabled, variant = "primary", small }) => {
    const styles = {
      primary:   { background: T.blue, color: "#fff",  border: `1px solid ${T.blueBr}` },
      gold:      { background: T.goldBg, color: T.gold, border: `1px solid ${T.goldBr}` },
      ghost:     { background: "transparent", color: T.sub, border: `1px solid ${T.border}` },
      danger:    { background: T.redBg, color: T.red, border: `1px solid ${T.redBr}` },
    };
    return (
      <motion.button whileTap={{ scale: 0.96 }} onClick={onClick} disabled={disabled}
        style={{ ...styles[variant], display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
          padding: small ? "7px 14px" : "11px 16px", borderRadius: 11, cursor: disabled ? "not-allowed" : "pointer",
          fontSize: 13, fontWeight: 600, fontFamily: T.sans, opacity: disabled ? 0.45 : 1,
          width: small ? "auto" : "100%", transition: "opacity 0.15s" }}>
        {children}
      </motion.button>
    );
  };

  // ── RESULT VIEW ────────────────────────────────────────────────────────────
  if (result) return (
    <div style={{ padding: "24px 18px" }}>
      <div style={{ width: 44, height: 44, borderRadius: "50%", background: T.greenBg, border: `1px solid ${T.greenBr}`,
        display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
        <Icon d={I.check} size={20} color={T.green} sw={2.5} />
      </div>

      <p style={{ color: T.text, fontSize: 15, fontWeight: 700, margin: "0 0 4px" }}>Resume ready</p>
      <p style={{ color: T.sub, fontSize: 12, margin: "0 0 20px", lineHeight: 1.6 }}>
        {isMobile ? "Scroll down to preview." : "Preview updated on the right."} Click any text to edit before downloading.
      </p>

      {result.location && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px",
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, marginBottom: 14 }}>
          <Icon d={I.pin} size={13} color={T.sub} />
          <span style={{ fontSize: 12, color: T.sub }}>Location matched to job posting: <strong style={{ color: T.text }}>{result.location}</strong></span>
        </div>
      )}

      {result.saved_id && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px",
          background: T.greenBg, border: `1px solid ${T.greenBr}`, borderRadius: 10, marginBottom: 14 }}>
          <Icon d={I.doc} size={13} color={T.green} />
          <span style={{ fontSize: 12, color: T.green }}>Saved to your portfolio database</span>
        </div>
      )}

      {result.keywords.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontFamily: T.mono, fontSize: 9, color: T.faint, letterSpacing: "0.1em", margin: "0 0 9px" }}>
            ATS KEYWORDS EMBEDDED
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {result.keywords.map(k => <Kw key={k} word={k} />)}
          </div>
        </div>
      )}

      <Btn onClick={reset} variant="ghost">
        <Icon d={I.refresh} size={14} color={T.sub} /> Generate another
      </Btn>
    </div>
  );

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ padding: "60px 18px", textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
        <Spinner size={36} color={T.blue} />
      </div>
      <p style={{ color: T.text, fontSize: 14, fontWeight: 600, margin: "0 0 6px" }}>Tailoring your resume…</p>
      <p style={{ color: T.sub, fontSize: 12, margin: 0 }}>Groq is matching your background to the job description</p>
    </div>
  );

  // ── STEP 1: Info ───────────────────────────────────────────────────────────
  if (step === 1) return (
    <div style={{ padding: "20px 18px" }}>
      <Progress step={1} />

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
        <Icon d={I.user} size={15} color={T.blue} />
        <div>
          <p style={{ color: T.text, fontSize: 14, fontWeight: 700, margin: 0 }}>Your Information</p>
          <p style={{ color: T.sub, fontSize: 11, margin: 0 }}>Fill in what you know — AI fills the gaps</p>
        </div>
      </div>

      {/* Row: Name + Target Title */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
        <Field label="FULL NAME" value={info.name} onChange={set("name")} placeholder="Jane Smith" required />
        <Field label="TARGET JOB TITLE" value={info.title} onChange={set("title")} placeholder="Sales Associate" required />
      </div>

      {/* Location */}
      <Field label="YOUR LOCATION" hint="City, Province/State" value={info.location} onChange={set("location")} placeholder="Toronto, ON" required />

      {/* Row: Email + Phone */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
        <Field label="EMAIL" value={info.email} onChange={set("email")} placeholder="jane@email.com" />
        <Field label="PHONE" value={info.phone} onChange={set("phone")} placeholder="(416) 555-0100" />
      </div>

      {/* Background */}
      <Field
        label="YOUR BACKGROUND"
        hint="in your own words"
        value={info.background}
        onChange={set("background")}
        placeholder="e.g. I worked at Farm Boy for 4 years helping customers, stocking shelves, and training new staff. I'm bilingual (EN/FR) and known for being reliable and fast."
        multiline rows={4}
      />

      {/* Past Jobs */}
      <Field
        label="PAST JOBS"
        hint="Role | Company | Years (one per line)"
        value={info.experience}
        onChange={set("experience")}
        placeholder={"Grocery Clerk | Farm Boy | 2021–2025\nCashier | Loblaws | 2019–2021"}
        multiline rows={3}
      />

      {/* Education */}
      <Field
        label="EDUCATION"
        hint="Degree | School | Year"
        value={info.education}
        onChange={set("education")}
        placeholder="Business Admin | Algonquin College | 2023"
        multiline rows={2}
      />

      {/* Skills */}
      <Field
        label="KEY SKILLS"
        hint="comma separated"
        value={info.skills}
        onChange={set("skills")}
        placeholder="Customer service, bilingual EN/FR, inventory management, MS Office, cash handling"
        multiline rows={2}
      />

      <Btn onClick={() => setStep(2)} disabled={!ready1} variant="primary">
        Next — Paste Job Description <Icon d={I.arrow} size={14} color="#fff" />
      </Btn>
    </div>
  );

  // ── STEP 2: Job Description ────────────────────────────────────────────────
  if (step === 2) return (
    <div style={{ padding: "20px 18px" }}>
      <Progress step={2} />

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <button onClick={() => setStep(1)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: T.sub, lineHeight: 1 }}>
          <Icon d={I.back} size={15} color={T.sub} />
        </button>
        <div>
          <p style={{ color: T.text, fontSize: 14, fontWeight: 700, margin: 0 }}>Paste Job Posting</p>
          <p style={{ color: T.sub, fontSize: 11, margin: 0 }}>Copy the full posting from LinkedIn, Indeed, or anywhere</p>
        </div>
      </div>

      {error && (
        <div style={{ padding: "10px 13px", borderRadius: 10, background: T.redBg,
          border: `1px solid ${T.redBr}`, color: T.red, fontSize: 12, marginBottom: 14, lineHeight: 1.5 }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <label style={{ fontFamily: T.mono, fontSize: 9, color: T.faint, letterSpacing: "0.1em" }}>
            JOB DESCRIPTION <span style={{ color: T.red }}>*</span>
          </label>
          <span style={{ fontFamily: T.mono, fontSize: 9,
            color: jobDesc.length >= 80 ? T.green : T.faint }}>
            {jobDesc.length} chars {jobDesc.length >= 80 ? "✓" : "— need more"}
          </span>
        </div>
        <textarea
          value={jobDesc}
          onChange={e => setJobDesc(e.target.value)}
          onFocus={() => setJdFocused(true)}
          onBlur={() => setJdFocused(false)}
          rows={16}
          placeholder={"Paste the complete job posting here.\n\nMore text = better keyword matching and ATS score.\n\nTip: include the requirements, responsibilities, and company overview sections."}
          style={{ ...inputStyle(jdFocused), resize: "vertical" }}
        />
      </div>

      <Btn onClick={generate} disabled={!ready2} variant="primary">
        <Icon d={I.spark} size={14} color="#fff" />
        Generate Tailored Resume
      </Btn>
    </div>
  );

  return null;
}