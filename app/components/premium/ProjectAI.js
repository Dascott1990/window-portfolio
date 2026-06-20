"use client";
/**
 * ProjectAI.js — "Founder's Desk"
 * ─────────────────────────────────────────────────────────────────────────
 * An AI that builds real, persistent artifacts with you — not a chatbot.
 *
 * Two project types, same core mechanic: fixed sections, each drafted by
 * the AI, each followed by a blunt critical-insight pass, each revisable
 * by leaving a comment the AI rewrites against. Every revision is kept
 * in a visible history.
 *
 *   · Business Plan — Problem → Solution → Market → Model → Competition
 *     → Risks → Financials → Go-to-Market
 *   · Creative Writing — Short Story / Screenplay / Poem presets, each
 *     with its own section structure (the AI critiques craft, not numbers)
 *
 * Projects persist in localStorage so you can run several at once,
 * bookmark the ones that matter, and pick up exactly where you left off.
 * Each section shows a real computed reading time and can be read aloud
 * via the browser's native SpeechSynthesis API — no backend, no cost.
 *
 * Streams from /api/v1/ai/chat — same contract as the rest of this OS.
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Design tokens ────────────────────────────────────────────────────────────
const T = {
  void:      "#0B0D12",
  surface:   "#13161F",
  panel:     "#15181F",
  line:      "rgba(255,255,255,0.08)",
  lineBri:   "rgba(255,255,255,0.16)",
  paper:     "#E8E4DC",
  dim:       "#5B6478",
  faint:     "rgba(91,100,120,0.5)",
  ember:     "#FF6B35",
  emberDim:  "rgba(255,107,53,0.35)",
  insight:   "#FFB020",
  insightDim:"rgba(255,176,32,0.12)",
  done:      "#39D98A",
  violet:    "#9B8CFF",
  violetDim: "rgba(155,140,255,0.12)",
  serif:     "'Fraunces', Georgia, serif",
  sans:      "'Inter', -apple-system, sans-serif",
  mono:      "'JetBrains Mono', 'SF Mono', monospace",
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
const STORAGE_KEY = "founders_desk_projects_v1";

// ── Project type definitions — fixed section structures ───────────────────
const BUSINESS_SECTIONS = [
  { id: "problem",     label: "Problem",       prompt: "What real, specific problem does this business solve? Who feels this pain, how often, and how badly?" },
  { id: "solution",    label: "Solution",      prompt: "What is the actual product or service? How does it solve the problem from the previous section?" },
  { id: "market",      label: "Market",        prompt: "Who is the customer, how big is the realistic addressable market, and how do you know?" },
  { id: "model",       label: "Business Model",prompt: "How does this make money? Pricing, unit economics, revenue streams." },
  { id: "competition", label: "Competition",   prompt: "Who else solves this today (including non-obvious alternatives), and what's the actual edge here?" },
  { id: "risks",       label: "Risks",         prompt: "What could realistically kill this business? Be specific, not generic." },
  { id: "financials",  label: "Financials",    prompt: "Rough cost structure, runway needs, and what it takes to reach breakeven." },
  { id: "gtm",         label: "Go-to-Market",  prompt: "How do the first 100 customers actually get acquired? Be concrete." },
];

const CREATIVE_PRESETS = {
  story: {
    label: "Short Story",
    sections: [
      { id: "premise",   label: "Premise",        prompt: "The core idea in one or two sentences — what happens, and why does it matter?" },
      { id: "characters",label: "Characters",     prompt: "Who is this story about? Give them a specific want and a specific flaw." },
      { id: "setting",   label: "Setting",        prompt: "Where and when. Make the setting feel inhabited, not generic." },
      { id: "opening",   label: "Opening Scene",  prompt: "Write the actual opening — the first thing the reader experiences." },
      { id: "turn",      label: "The Turn",       prompt: "The moment things change or a truth surfaces. Write it as prose, not a summary." },
      { id: "ending",    label: "Ending",         prompt: "How it lands. Write the actual closing beat." },
    ],
  },
  screenplay: {
    label: "Screenplay",
    sections: [
      { id: "logline",   label: "Logline",        prompt: "One sentence: protagonist, goal, obstacle, stakes." },
      { id: "protagonist",label:"Protagonist",    prompt: "Who they are, what they want, what they're afraid of." },
      { id: "world",     label: "World & Tone",   prompt: "The setting and the tonal register — funny, bleak, tense, warm." },
      { id: "scene1",    label: "Opening Scene",  prompt: "Write it in proper scene format — slugline, action, dialogue." },
      { id: "midpoint",  label: "Midpoint Turn",  prompt: "The moment the story's direction shifts. Write the scene." },
      { id: "climax",    label: "Climax",         prompt: "The confrontation the whole story has been building toward. Write the scene." },
    ],
  },
  poem: {
    label: "Poem",
    sections: [
      { id: "theme",     label: "Theme & Image",  prompt: "The central feeling or image this poem orbits. Be specific and sensory." },
      { id: "voice",     label: "Voice",          prompt: "Who is speaking, and in what register — confessional, distant, playful?" },
      { id: "draft1",    label: "First Stanza",   prompt: "Write the opening stanza. Let the image do the work." },
      { id: "draft2",    label: "Middle",         prompt: "Develop or complicate the image from the first stanza." },
      { id: "close",     label: "Closing Lines",  prompt: "Land the poem — the line the reader keeps." },
    ],
  },
};

const PROJECT_TYPES = {
  business:  { label: "Business Plan",    icon: "spark",   accent: T.ember,  sections: BUSINESS_SECTIONS },
  creative:  { label: "Creative Writing", icon: "feather", accent: T.violet, presets: CREATIVE_PRESETS },
};

const uid = () => Math.random().toString(36).slice(2, 10);

// ── Persistence ──────────────────────────────────────────────────────────────
function loadProjects() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function saveProjects(projects) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(projects)); } catch {}
}

// ── Reading time + TTS ──────────────────────────────────────────────────────
function readingTime(text) {
  const words = (text || "").trim().split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} min read`;
}

function useSpeech() {
  const [speakingId, setSpeakingId] = useState(null);

  const speak = useCallback((id, text) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    if (speakingId === id) { setSpeakingId(null); return; }
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.0;
    utter.onend = () => setSpeakingId(null);
    utter.onerror = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(utter);
  }, [speakingId]);

  const stop = useCallback(() => {
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setSpeakingId(null);
  }, []);

  useEffect(() => () => { if (typeof window !== "undefined") window.speechSynthesis?.cancel(); }, []);

  return { speakingId, speak, stop };
}

// ── Icons ──────────────────────────────────────────────────────────────────
const Ic = ({ d, size = 16, sw = 1.6, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
  </svg>
);
const ICONS = {
  close:    "M18 6 6 18M6 6l12 12",
  send:     "M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z",
  spark:    "M12 2 14 9 21 11 14 13 12 20 10 13 3 11 10 9 12 2Z",
  feather:  ["M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z", "M16 8 2 22", "M17.5 15H9"],
  check:    "M20 6 9 17l-5-5",
  edit:     "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z",
  insight:  "M9.663 17h4.673M12 3a6 6 0 0 0-6 6c0 1.887.787 3.39 2.06 4.5C9.04 14.408 9.5 15.5 9.5 17h5c0-1.5.46-2.592 1.44-3.5C17.213 12.39 18 10.887 18 9a6 6 0 0 0-6-6Z",
  history:  "M3 12a9 9 0 1 0 18 0A9 9 0 0 0 3 12zm9-4v4l3 3",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
  arrow:    "M5 12h14M12 5l7 7-7 7",
  back:     "M19 12H5m0 0 7 7m-7-7 7-7",
  star:     "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  plus:     "M12 5v14M5 12h14",
  volume:   "M11 5 6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07",
  volumeOff:"M11 5 6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6",
  trash:    "M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z",
};

// ── Markdown — minimal, deliberate ─────────────────────────────────────────
function renderInline(text) {
  const parts = [];
  let key = 0;
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0, m;
  while ((m = regex.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const token = m[0];
    if (token.startsWith("**")) {
      parts.push(<strong key={key++} style={{ color: T.paper, fontWeight: 600 }}>{token.slice(2, -2)}</strong>);
    } else {
      parts.push(<code key={key++} style={{ background: "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: 4, fontFamily: T.mono, fontSize: "0.88em" }}>{token.slice(1, -1)}</code>);
    }
    last = m.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
function MarkdownBlock({ text, color }) {
  const lines = (text || "").split("\n");
  return (
    <>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} style={{ height: 9 }} />;
        if (/^[-•]\s/.test(trimmed)) {
          return (
            <div key={i} style={{ display: "flex", gap: 9, marginBottom: 5 }}>
              <span style={{ color: color || T.ember, flexShrink: 0, fontSize: 13, lineHeight: "1.7em" }}>—</span>
              <span style={{ flex: 1 }}>{renderInline(trimmed.replace(/^[-•]\s/, ""))}</span>
            </div>
          );
        }
        return <p key={i} style={{ margin: "0 0 9px", lineHeight: 1.7 }}>{renderInline(line)}</p>;
      })}
    </>
  );
}

// ── Streaming call ─────────────────────────────────────────────────────────
async function streamCompletion(system, messages, onChunk, signal) {
  const res = await fetch(`${API}/api/v1/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, messages, max_tokens: 700 }),
    signal,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
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

// ── Prompts — tuned per project type ───────────────────────────────────────
function draftSystemPrompt(type, idea, section) {
  if (type === "creative") {
    return `You are a sharp creative writing mentor helping draft a piece based on this premise: "${idea}"

Write the "${section.label}" section. Focus: ${section.prompt}

Rules: write the actual content — real prose/dialogue/lines, not a summary or outline. No headers, no meta-commentary, no "Here is the section" preamble. 100-180 words. Make specific, sensory, voiced choices — sound like a writer who has a point of view, not a generic AI completion.`;
  }
  return `You are a sharp startup advisor helping draft a real business plan for this idea: "${idea}"

Write the "${section.label}" section. Focus: ${section.prompt}

Rules: write the actual section content — direct, specific, concrete numbers and names where reasonable, no headers or meta-commentary, no "Here is the section" preamble. 120-200 words. Plain prose with occasional **bold** for key terms, bullet lists only if genuinely listing distinct items. Sound like a founder who has thought hard about this, not a template.`;
}

function insightSystemPrompt(type, idea, section, draftText) {
  if (type === "creative") {
    return `You are a blunt, experienced editor reviewing a piece of creative writing based on: "${idea}"

Section: "${section.label}"
Draft: """${draftText}"""

Write ONE critical insight — the single sharpest craft issue: a flat sentence, a missed sensory beat, a cliché, pacing that drags, dialogue that doesn't sound like a real person. Be specific to this draft, not generic writing advice. 2-3 sentences. No preamble — just the note, like a real editor's margin comment.`;
  }
  return `You are a blunt, experienced startup advisor reviewing a business plan section for: "${idea}"

Section: "${section.label}"
Draft: """${draftText}"""

Write ONE critical insight — the single sharpest gap, unrealistic assumption, or risk in this draft that a real investor or advisor would flag immediately. Be specific to this draft, not generic startup advice. 2-3 sentences. No preamble like "One concern is" — just say it directly, as if circling it in red pen.`;
}

function reviseSystemPrompt(type, idea, section, currentText, instruction) {
  const subject = type === "creative" ? "a piece of creative writing" : "a business plan";
  return `You are revising one section of ${subject} for: "${idea}"

Section: "${section.label}"
Current text: """${currentText}"""

The author's instruction: "${instruction}"

Rewrite the full section incorporating this instruction. Same rules as before: direct content, 100-200 words, no preamble, no meta-commentary about what changed — just the new section text.`;
}

// ── Section card ─────────────────────────────────────────────────────────────
function SectionCard({ section, data, idea, type, onUpdate, isOpen, onToggle, speech }) {
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const abortRef = useRef(null);

  const status = !data ? "empty" : data.drafting ? "drafting" : "ready";
  const accent = PROJECT_TYPES[type].accent;
  const isSpeaking = speech.speakingId === section.id;

  const runDraft = useCallback(async () => {
    setBusy(true);
    abortRef.current = new AbortController();
    const draftId = uid();
    onUpdate(section.id, prev => ({ ...prev, drafting: true, insight: "", insightLoading: false, text: "", history: prev?.history || [] }));
    try {
      let text = "";
      await streamCompletion(
        draftSystemPrompt(type, idea, section),
        [{ role: "user", content: "Draft this section now." }],
        chunk => { text += chunk; onUpdate(section.id, prev => ({ ...prev, text })); },
        abortRef.current.signal
      );
      onUpdate(section.id, prev => ({ ...prev, drafting: false, insightLoading: true }));

      let insight = "";
      await streamCompletion(
        insightSystemPrompt(type, idea, section, text),
        [{ role: "user", content: "Give the critical insight now." }],
        chunk => { insight += chunk; onUpdate(section.id, prev => ({ ...prev, insight })); },
        abortRef.current.signal
      );
      onUpdate(section.id, prev => ({
        ...prev, insightLoading: false,
        history: [...(prev.history || []), { id: draftId, text, insight, ts: Date.now(), note: "Initial draft" }],
      }));
    } catch (e) {
      if (e.name !== "AbortError") onUpdate(section.id, prev => ({ ...prev, drafting: false, insightLoading: false, error: "Couldn't reach the AI — check the backend." }));
    } finally { setBusy(false); }
  }, [idea, section, onUpdate, type]);

  const runRevision = useCallback(async () => {
    const instruction = comment.trim();
    if (!instruction || !data?.text) return;
    setBusy(true); setComment("");
    abortRef.current = new AbortController();
    const revisionId = uid();
    onUpdate(section.id, prev => ({ ...prev, drafting: true, instruction }));
    try {
      let text = "";
      await streamCompletion(
        reviseSystemPrompt(type, idea, section, data.text, instruction),
        [{ role: "user", content: "Revise now." }],
        chunk => { text += chunk; onUpdate(section.id, prev => ({ ...prev, text })); },
        abortRef.current.signal
      );
      onUpdate(section.id, prev => ({ ...prev, drafting: false, insightLoading: true }));

      let insight = "";
      await streamCompletion(
        insightSystemPrompt(type, idea, section, text),
        [{ role: "user", content: "Give the critical insight now." }],
        chunk => { insight += chunk; onUpdate(section.id, prev => ({ ...prev, insight })); },
        abortRef.current.signal
      );
      onUpdate(section.id, prev => ({
        ...prev, insightLoading: false,
        history: [...(prev.history || []), { id: revisionId, text, insight, ts: Date.now(), note: instruction }],
      }));
    } catch (e) {
      if (e.name !== "AbortError") onUpdate(section.id, prev => ({ ...prev, drafting: false, insightLoading: false, error: "Revision failed — check the backend." }));
    } finally { setBusy(false); }
  }, [comment, data, idea, section, onUpdate, type]);

  const restoreVersion = (version) => {
    onUpdate(section.id, prev => ({ ...prev, text: version.text, insight: version.insight }));
    setShowHistory(false);
  };

  return (
    <div style={{ borderRadius: 16, border: `1px solid ${isOpen ? T.lineBri : T.line}`, overflow: "hidden", background: T.surface, transition: "border-color 0.2s" }}>
      <button onClick={onToggle}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", background: "none", border: "none", cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <StatusDot status={status} accent={accent} />
          <span style={{ fontFamily: T.serif, fontSize: 16.5, fontWeight: 500, color: T.paper }}>{section.label}</span>
          {data?.text && <span style={{ fontFamily: T.mono, fontSize: 9, color: T.faint }}>{readingTime(data.text)}</span>}
          {data?.history?.length > 1 && <span style={{ fontFamily: T.mono, fontSize: 9, color: T.faint }}>v{data.history.length}</span>}
        </div>
        <Ic d={ICONS.arrow} size={13} color={T.faint} sw={2} style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} style={{ overflow: "hidden" }}>
            <div style={{ padding: "0 18px 18px" }}>
              {status === "empty" ? (
                <div style={{ padding: "20px 0" }}>
                  <p style={{ color: T.dim, fontSize: 13.5, lineHeight: 1.65, marginBottom: 14, fontFamily: T.sans }}>{section.prompt}</p>
                  <button onClick={runDraft} disabled={busy}
                    style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10, background: accent, border: "none", color: T.void, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
                    <Ic d={ICONS.spark} size={13} color={T.void} /> Draft this section
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
                    <div style={{ flex: 1, color: T.dim, fontSize: 14, fontFamily: T.sans }}>
                      {data.text ? <MarkdownBlock text={data.text} color={accent} /> : <span style={{ fontFamily: T.mono, fontSize: 12, color: T.faint }}>drafting…</span>}
                    </div>
                    {data.text && (
                      <button onClick={() => speech.speak(section.id, data.text)}
                        title={isSpeaking ? "Stop reading" : "Read aloud"}
                        style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 9, background: isSpeaking ? accent + "22" : "rgba(255,255,255,0.04)", border: `1px solid ${isSpeaking ? accent + "55" : T.line}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <Ic d={isSpeaking ? ICONS.volumeOff : ICONS.volume} size={13} color={isSpeaking ? accent : T.faint} />
                      </button>
                    )}
                  </div>

                  {(data.insight || data.insightLoading) && (
                    <div style={{ display: "flex", gap: 10, padding: "12px 14px", borderRadius: 11, background: T.insightDim, border: `1px solid rgba(255,176,32,0.22)`, marginBottom: 14 }}>
                      <Ic d={ICONS.insight} size={15} color={T.insight} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontFamily: T.mono, fontSize: 9, color: T.insight, letterSpacing: "0.08em", marginBottom: 4 }}>CRITICAL INSIGHT</p>
                        <p style={{ color: "rgba(255,176,32,0.92)", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                          {data.insightLoading && !data.insight ? "thinking…" : data.insight}
                        </p>
                      </div>
                    </div>
                  )}

                  {data.error && <p style={{ color: "#ff8a65", fontSize: 12.5, marginBottom: 12 }}>{data.error}</p>}

                  {data.history?.length > 0 && (
                    <button onClick={() => setShowHistory(v => !v)}
                      style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: T.faint, fontSize: 11, fontFamily: T.mono, cursor: "pointer", padding: "4px 0", marginBottom: 12 }}>
                      <Ic d={ICONS.history} size={11} /> {data.history.length} version{data.history.length !== 1 ? "s" : ""}
                    </button>
                  )}
                  <AnimatePresence>
                    {showHistory && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden", marginBottom: 12 }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {[...data.history].reverse().map((v, i) => (
                            <button key={v.id} onClick={() => restoreVersion(v)}
                              style={{ textAlign: "left", padding: "8px 12px", borderRadius: 9, background: "rgba(255,255,255,0.03)", border: `1px solid ${T.line}`, cursor: "pointer" }}>
                              <p style={{ fontFamily: T.mono, fontSize: 10, color: T.faint, margin: 0 }}>{data.history.length - i}. {v.note}</p>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!data.drafting && (
                    <div>
                      <p style={{ fontFamily: T.mono, fontSize: 9, color: T.faint, letterSpacing: "0.08em", marginBottom: 7 }}>REVISE WITH A COMMENT</p>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input value={comment} onChange={e => setComment(e.target.value)} onKeyDown={e => e.key === "Enter" && runRevision()}
                          placeholder={type === "creative" ? 'e.g. "make the dialogue less formal"' : 'e.g. "make the market size more conservative"'}
                          style={{ flex: 1, padding: "9px 12px", borderRadius: 9, fontSize: 13, background: "rgba(255,255,255,0.04)", border: `1px solid ${T.line}`, color: T.paper, outline: "none", fontFamily: T.sans }} />
                        <button onClick={runRevision} disabled={!comment.trim() || busy}
                          style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: comment.trim() ? accent : "rgba(255,255,255,0.04)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: comment.trim() ? "pointer" : "default" }}>
                          <Ic d={ICONS.edit} size={13} color={comment.trim() ? T.void : T.faint} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusDot({ status, accent }) {
  const color = status === "ready" ? T.done : status === "drafting" ? accent : T.faint;
  return <div style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0, boxShadow: status === "drafting" ? `0 0 8px ${accent}55` : "none" }} />;
}

// ── Library — the home screen, all saved projects ──────────────────────────
function Library({ projects, onOpen, onNew, onToggleBookmark, onDelete }) {
  const sorted = [...projects].sort((a, b) => (b.bookmarked - a.bookmarked) || (b.updatedAt - a.updatedAt));
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px 60px", scrollbarWidth: "none" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          {Object.entries(PROJECT_TYPES).map(([key, t]) => (
            <button key={key} onClick={() => onNew(key)}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "20px 14px", borderRadius: 16, background: T.surface, border: `1px solid ${T.line}`, cursor: "pointer" }}>
              <div style={{ width: 36, height: 36, borderRadius: 11, background: t.accent + "18", border: `1px solid ${t.accent}33`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Ic d={ICONS[t.icon]} size={16} color={t.accent} />
              </div>
              <span style={{ fontFamily: T.serif, fontSize: 14, color: T.paper, fontWeight: 500 }}>{t.label}</span>
              <span style={{ fontFamily: T.mono, fontSize: 9, color: T.faint, display: "flex", alignItems: "center", gap: 4 }}>
                <Ic d={ICONS.plus} size={9} color={T.faint} /> NEW
              </span>
            </button>
          ))}
        </div>

        {sorted.length > 0 && (
          <>
            <p style={{ fontFamily: T.mono, fontSize: 9, color: T.faint, letterSpacing: "0.1em", marginBottom: 10 }}>
              {sorted.length} PROJECT{sorted.length !== 1 ? "S" : ""}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sorted.map(p => {
                const typeInfo = PROJECT_TYPES[p.type];
                const draftedCount = Object.values(p.plan || {}).filter(s => s?.text).length;
                const totalSections = p.sections?.length || 0;
                return (
                  <div key={p.id}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", borderRadius: 13, background: T.surface, border: `1px solid ${T.line}` }}>
                    <button onClick={() => onOpen(p.id)} style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", cursor: "pointer", textAlign: "left", minWidth: 0 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, background: typeInfo.accent + "18", border: `1px solid ${typeInfo.accent}33`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Ic d={ICONS[typeInfo.icon]} size={13} color={typeInfo.accent} />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ color: T.paper, fontSize: 13.5, fontWeight: 500, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.idea}</p>
                        <p style={{ fontFamily: T.mono, fontSize: 9.5, color: T.faint, margin: "2px 0 0" }}>
                          {p.presetLabel ? `${p.presetLabel} · ` : ""}{draftedCount}/{totalSections} drafted
                        </p>
                      </div>
                    </button>
                    <button onClick={() => onToggleBookmark(p.id)}
                      style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                      <Ic d={ICONS.star} size={15} color={p.bookmarked ? T.insight : T.faint} sw={p.bookmarked ? 0 : 1.6}
                        style={p.bookmarked ? { fill: T.insight } : undefined} />
                    </button>
                    <button onClick={() => onDelete(p.id)}
                      style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                      <Ic d={ICONS.trash} size={14} color={T.faint} />
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {sorted.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: T.faint, fontSize: 13, fontFamily: T.sans }}>
            No projects yet — start a Business Plan or Creative Writing project above.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Creative preset picker ──────────────────────────────────────────────────
function PresetPicker({ onPick, onBack }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", position: "relative" }}>
      <button onClick={onBack} style={{ position: "absolute", top: 20, left: 20, display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: T.faint, fontSize: 12, cursor: "pointer" }}>
        <Ic d={ICONS.back} size={13} /> Back
      </button>
      <Ic d={ICONS.feather} size={26} color={T.violet} />
      <h1 style={{ fontFamily: T.serif, fontSize: 24, fontWeight: 500, color: T.paper, margin: "16px 0 24px", textAlign: "center" }}>What form?</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 380 }}>
        {Object.entries(CREATIVE_PRESETS).map(([key, preset]) => (
          <button key={key} onClick={() => onPick(key)}
            style={{ padding: "16px 18px", borderRadius: 14, background: T.surface, border: `1px solid ${T.line}`, color: T.paper, fontFamily: T.serif, fontSize: 16, textAlign: "left", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {preset.label}
            <Ic d={ICONS.arrow} size={14} color={T.faint} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Idea intake ──────────────────────────────────────────────────────────────
function IdeaIntake({ type, presetLabel, onStart, onBack }) {
  const [idea, setIdea] = useState("");
  const isCreative = type === "creative";
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", position: "relative" }}>
      <button onClick={onBack} style={{ position: "absolute", top: 20, left: 20, display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: T.faint, fontSize: 12, cursor: "pointer" }}>
        <Ic d={ICONS.back} size={13} /> Back
      </button>
      <Ic d={ICONS[PROJECT_TYPES[type].icon]} size={28} color={PROJECT_TYPES[type].accent} />
      <h1 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 500, color: T.paper, margin: "18px 0 8px", textAlign: "center" }}>
        {isCreative ? `What's the ${presetLabel?.toLowerCase()} about?` : "What are you building?"}
      </h1>
      <p style={{ color: T.dim, fontSize: 14, textAlign: "center", maxWidth: 380, lineHeight: 1.6, marginBottom: 28, fontFamily: T.sans }}>
        {isCreative
          ? `Describe the premise in a sentence or two. Every section gets drafted from this, with a craft critique on each.`
          : `Describe the business in a sentence or two. Every section — problem through go-to-market — gets drafted from this, with a critical insight on each one.`}
      </p>
      <div style={{ width: "100%", maxWidth: 480 }}>
        <textarea value={idea} onChange={e => setIdea(e.target.value)}
          placeholder={isCreative ? "e.g. a lighthouse keeper who starts receiving letters from the future…" : "e.g. a subscription box for rare houseplants, curated by climate zone…"}
          rows={3}
          style={{ width: "100%", padding: "14px 16px", borderRadius: 14, fontSize: 14.5, background: T.surface, border: `1px solid ${T.line}`, color: T.paper, outline: "none", fontFamily: T.sans, resize: "none", boxSizing: "border-box" }} />
        <button onClick={() => idea.trim() && onStart(idea.trim())} disabled={!idea.trim()}
          style={{ width: "100%", marginTop: 12, padding: "13px 0", borderRadius: 12, background: idea.trim() ? PROJECT_TYPES[type].accent : "rgba(255,255,255,0.04)", border: "none", color: idea.trim() ? T.void : T.faint, fontSize: 14, fontWeight: 700, cursor: idea.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          Start building <Ic d={ICONS.arrow} size={14} color={idea.trim() ? T.void : T.faint} />
        </button>
      </div>
    </div>
  );
}

// ── Export ─────────────────────────────────────────────────────────────────
function exportMarkdown(project) {
  const sections = project.sections;
  let md = `# ${PROJECT_TYPES[project.type].label}${project.presetLabel ? ` — ${project.presetLabel}` : ""}\n\n**Premise:** ${project.idea}\n\n`;
  sections.forEach(s => {
    const data = project.plan[s.id];
    if (!data?.text) return;
    md += `## ${s.label}\n\n${data.text}\n\n`;
    if (data.insight) md += `> **Insight:** ${data.insight}\n\n`;
  });
  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${project.type}-${project.id}.md`; a.click();
  URL.revokeObjectURL(url);
}

// ── Project workspace ────────────────────────────────────────────────────────
function Workspace({ project, onUpdatePlan, onBack, speech }) {
  const [openId, setOpenId] = useState(project.sections[0].id);
  const draftedCount = project.sections.filter(s => project.plan[s.id]?.text).length;
  const progress = draftedCount / project.sections.length;
  const accent = PROJECT_TYPES[project.type].accent;

  return (
    <>
      <div style={{ flexShrink: 0, height: 2, background: T.line }}>
        <motion.div animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.4 }} style={{ height: "100%", background: accent }} />
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 60px", scrollbarWidth: "none" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: T.faint, fontSize: 12, cursor: "pointer", marginBottom: 16 }}>
            <Ic d={ICONS.back} size={13} /> All projects
          </button>
          <div style={{ marginBottom: 20, padding: "14px 16px", borderRadius: 12, background: T.surface, border: `1px solid ${T.line}` }}>
            <p style={{ fontFamily: T.mono, fontSize: 9, color: T.faint, letterSpacing: "0.08em", marginBottom: 5 }}>
              {project.presetLabel ? project.presetLabel.toUpperCase() : "THE IDEA"}
            </p>
            <p style={{ color: T.paper, fontSize: 14, lineHeight: 1.55, margin: 0, fontFamily: T.sans }}>{project.idea}</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {project.sections.map(section => (
              <SectionCard key={section.id} section={section} data={project.plan[section.id]} idea={project.idea} type={project.type}
                onUpdate={onUpdatePlan} isOpen={openId === section.id} onToggle={() => setOpenId(prev => prev === section.id ? null : section.id)} speech={speech} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const ProjectAI = ({ onClose }) => {
  const [projects, setProjects] = useState([]);
  const [view, setView] = useState("library"); // library | picker | intake | workspace
  const [pendingType, setPendingType] = useState(null);
  const [pendingPreset, setPendingPreset] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const speech = useSpeech();

  useEffect(() => { setProjects(loadProjects()); }, []);
  useEffect(() => { saveProjects(projects); }, [projects]);

  const activeProject = projects.find(p => p.id === activeId);

  const handleNew = (type) => {
    setPendingType(type);
    if (type === "creative") setView("picker");
    else setView("intake");
  };

  const handlePickPreset = (presetKey) => {
    setPendingPreset(presetKey);
    setView("intake");
  };

  const handleStart = (idea) => {
    const id = uid();
    const sections = pendingType === "creative" ? CREATIVE_PRESETS[pendingPreset].sections : BUSINESS_SECTIONS;
    const presetLabel = pendingType === "creative" ? CREATIVE_PRESETS[pendingPreset].label : null;
    const project = { id, type: pendingType, presetLabel, idea, sections, plan: {}, bookmarked: false, createdAt: Date.now(), updatedAt: Date.now() };
    setProjects(prev => [...prev, project]);
    setActiveId(id);
    setView("workspace");
  };

  const handleOpen = (id) => { setActiveId(id); setView("workspace"); };

  const handleUpdatePlan = useCallback((sectionId, updater) => {
    setProjects(prev => prev.map(p => p.id !== activeId ? p : {
      ...p, updatedAt: Date.now(), plan: { ...p.plan, [sectionId]: updater(p.plan[sectionId] || {}) },
    }));
  }, [activeId]);

  const handleToggleBookmark = (id) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, bookmarked: !p.bookmarked } : p));
  };
  const handleDelete = (id) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeId === id) { setActiveId(null); setView("library"); }
  };
  const backToLibrary = () => { speech.stop(); setActiveId(null); setView("library"); };

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") { if (view !== "library") backToLibrary(); else onClose?.(); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, onClose]);

  const headerTitle = view === "library" ? "Founder's Desk"
    : view === "workspace" && activeProject ? (activeProject.presetLabel || PROJECT_TYPES[activeProject.type].label)
    : "New Project";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, bottom: "var(--taskbar-height, 52px)", zIndex: 50, background: T.void, fontFamily: T.sans, display: "flex", flexDirection: "column", overflow: "hidden" }}>

      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: `1px solid ${T.line}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <Ic d={ICONS.spark} size={15} color={T.ember} />
          <span style={{ fontFamily: T.serif, fontSize: 15, color: T.paper, fontWeight: 500 }}>{headerTitle}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {view === "workspace" && activeProject && Object.values(activeProject.plan).some(s => s?.text) && (
            <button onClick={() => exportMarkdown(activeProject)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 9, background: T.panel, border: `1px solid ${T.line}`, color: T.dim, fontSize: 12, cursor: "pointer" }}>
              <Ic d={ICONS.download} size={12} /> Export
            </button>
          )}
          <button onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 9, background: T.panel, border: `1px solid ${T.line}`, display: "flex", alignItems: "center", justifyContent: "center", color: T.dim, cursor: "pointer" }}>
            <Ic d={ICONS.close} size={14} />
          </button>
        </div>
      </div>

      {view === "library" && (
        <Library projects={projects} onOpen={handleOpen} onNew={handleNew} onToggleBookmark={handleToggleBookmark} onDelete={handleDelete} />
      )}
      {view === "picker" && (
        <PresetPicker onPick={handlePickPreset} onBack={() => setView("library")} />
      )}
      {view === "intake" && (
        <IdeaIntake
          type={pendingType}
          presetLabel={pendingType === "creative" ? CREATIVE_PRESETS[pendingPreset]?.label : null}
          onStart={handleStart}
          onBack={() => setView(pendingType === "creative" ? "picker" : "library")}
        />
      )}
      {view === "workspace" && activeProject && (
        <Workspace project={activeProject} onUpdatePlan={handleUpdatePlan} onBack={backToLibrary} speech={speech} />
      )}
    </motion.div>
  );
};

export default ProjectAI;