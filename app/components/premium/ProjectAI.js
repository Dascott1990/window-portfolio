"use client";
/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║  PROJECT AI  —  Cognitive Portfolio Intelligence System  v4.0        ║
 * ║  The autonomous AI engineer embedded inside the portfolio OS.         ║
 * ║  Powered by Anthropic Claude · Real streaming · System-aware          ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 */

import React, {
  useState, useEffect, useRef, useCallback, useReducer, useMemo,
} from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";

// ─── Inline SVG icon primitive ────────────────────────────────────────────────
const Ic = ({ d, size = 16, className = "", sw = 1.5, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke="currentColor" strokeWidth={sw} strokeLinecap="round"
    strokeLinejoin="round" className={className}>
    {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
  </svg>
);

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg:         "#06070d",
  surface:    "rgba(255,255,255,0.04)",
  surfaceHov: "rgba(255,255,255,0.07)",
  border:     "rgba(255,255,255,0.08)",
  borderBri:  "rgba(255,255,255,0.14)",
  accent:     "#7c6df7",       // violet
  accentB:    "#38bdf8",       // sky
  accentG:    "#34d399",       // emerald
  accentP:    "#f472b6",       // pink
  accentO:    "#fb923c",       // orange
  text:       "#e8e8f0",
  textDim:    "rgba(232,232,240,0.45)",
  textMuted:  "rgba(232,232,240,0.22)",
  mono:       "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
  sans:       "'Inter', '-apple-system', 'Helvetica Neue', sans-serif",
};

// ─── System prompt — deep portfolio context ───────────────────────────────────
const SYSTEM_PROMPT = `You are ARIA (Adaptive Reasoning & Intelligence Architecture), the autonomous cognitive AI embedded inside Rasheed Tajudeen's portfolio operating system. You are not a generic assistant — you are a specialized intelligence with deep knowledge of this specific system.

PORTFOLIO OWNER: Rasheed Tajudeen
- Full-Stack Developer & Cybersecurity Engineer
- Founder @ Dascott Global Ventures (Toronto, ON, Canada)
- Experience: React, Next.js, Node.js, TypeScript, PostgreSQL, Python, Docker, AWS, Swift, Flutter
- Cybersecurity: Penetration testing, secure API design, vulnerability assessment, network security
- Email: dascottblog@gmail.com | Phone: +1 416 505 6927 | GitHub: github.com/dascott1990

PORTFOLIO OS ARCHITECTURE — Apps you are embedded within:
1. Neural Camera Pro — Real camera with 8 modes (Portrait, Photo, Video, Night, Pro, AI, Burst, Cinematic), canvas AI overlays, tap-to-focus, pinch zoom, burst mode, dev diagnostics panel
2. Music App — Real-time Deezer API search, 30s previews, animated waveform visualizer, queue management, shuffle/repeat, keyboard shortcuts
3. Calendar — Full month view, event creation, real-time reminders, animated day view
4. Asset Intelligence — Live market data (BTC, ETH, SOL, AAPL, TSLA, NVDA, EUR/USD, GBP/USD, Gold) via CoinGecko, Yahoo Finance, Frankfurter APIs with 30s refresh
5. Health / DoctorAI — Medical image analysis simulation, AI diagnosis, PDF export
6. Fintech / NovaPay — NFC contactless payment simulation, transaction history
7. MapApp — Leaflet.js interactive map, geolocation, dark/light modes, search
8. Resume — Full interactive resume with skills, experience, education, contact copy
9. Contact — Searchable contacts, favorites, detail pane
10. Projects — FusionPay (React Native), Hyperswitch, DBOS Transact, Dask Blog, States API, Heart Disease Expert System, QR Attendance
11. Game — Memory card matching game with difficulty levels, scoring, timer
12. Desktop OS — Draggable icons, dark mode, taskbar, start menu, notifications, mobile/desktop responsive

TECHNOLOGY STACK: Next.js 14, React 18, Framer Motion, TailwindCSS, Canvas API, MediaDevices API, Web APIs, Deezer API, CoinGecko API, Yahoo Finance, Frankfurter API, Leaflet.js, MediaRecorder API

YOUR ROLE: You are the intelligence layer of this OS. You understand every module, can explain technical decisions, discuss architecture, help recruiters understand the system, answer questions about Rasheed's background, conduct technical deep-dives, generate code, analyze systems, and operate as a real-time AI assistant embedded in a production portfolio.

PERSONALITY: Precise, technically confident, occasionally witty. Think like the intersection of a principal engineer and a thoughtful product lead. Never sycophantic. Direct, substantive, insightful. You surface non-obvious connections and insights.

FORMATTING RULES:
- Use markdown naturally: **bold**, \`code\`, headers (##), bullet lists, numbered steps
- For code blocks, always specify language: \`\`\`tsx, \`\`\`bash, etc.
- Keep responses focused and scannable — avoid walls of prose
- Surface your reasoning when it adds value
- When discussing the portfolio, speak from first-person perspective of the system ("this OS...", "the camera module...")`;

// ─── Suggested prompts organized by category ─────────────────────────────────
const PROMPT_GROUPS = [
  {
    label: "System Architecture",
    color: T.accent,
    prompts: [
      "Explain the full technical architecture of this portfolio OS",
      "How does the Neural Camera's canvas overlay pipeline work?",
      "Walk me through the Asset Intelligence data flow and APIs",
      "What makes the Music App's search different from a typical implementation?",
    ],
  },
  {
    label: "About Rasheed",
    color: T.accentB,
    prompts: [
      "What are Rasheed's strongest technical skills?",
      "Tell me about Dascott Global Ventures",
      "What cybersecurity projects has Rasheed built?",
      "Why should I hire Rasheed for a senior engineering role?",
    ],
  },
  {
    label: "Code & Engineering",
    color: T.accentG,
    prompts: [
      "Generate a TypeScript API route for real-time market data",
      "Write a React hook for the camera stream with cleanup",
      "How would you implement WebSocket real-time updates in this OS?",
      "Show me a production-ready auth middleware in Next.js",
    ],
  },
  {
    label: "Innovation & Vision",
    color: T.accentO,
    prompts: [
      "What 3 features would make this portfolio unforgettable to recruiters?",
      "How would you evolve this OS into an AI-native product?",
      "Design a system for real-time collaborative portfolio viewing",
      "What's the most technically impressive thing in this entire codebase?",
    ],
  },
];

// ─── Message types ────────────────────────────────────────────────────────────
// role: "user" | "assistant" | "system"
// content: string
// id: string
// timestamp: Date
// tokens?: number
// model?: string

// ─── Reducer ─────────────────────────────────────────────────────────────────
const initialState = {
  messages:      [],
  isStreaming:   false,
  inputValue:    "",
  showSuggested: true,
  activeGroup:   0,
  totalTokens:   0,
  sessionId:     null,
  error:         null,
  sidebarOpen:   false,
  fontSize:      14,
  showThinking:  true,
};

function reducer(state, { type, payload }) {
  switch (type) {
    case "SET":       return { ...state, ...payload };
    case "ADD_MSG":   return { ...state, messages: [...state.messages, payload] };
    case "UPD_LAST":  return {
      ...state,
      messages: state.messages.map((m, i) =>
        i === state.messages.length - 1 ? { ...m, ...payload } : m
      ),
    };
    case "CLEAR":     return { ...state, messages: [], totalTokens: 0, showSuggested: true, error: null };
    default:          return state;
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────
const uid    = () => Math.random().toString(36).slice(2, 10);
const now    = () => new Date();
const fmtTs  = (d) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const fmtTok = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;

// ─── Markdown renderer (no external deps) ─────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return null;

  // Split into lines and process
  const lines   = text.split("\n");
  const output  = [];
  let inCode    = false;
  let codeLines = [];
  let codeLang  = "";
  let inList    = false;
  let listItems = [];

  const flushList = () => {
    if (listItems.length === 0) return;
    output.push(
      <ul key={`ul-${output.length}`} style={{ margin: "8px 0 8px 0", paddingLeft: 18 }}>
        {listItems.map((item, i) => (
          <li key={i} style={{ color: T.text, fontSize: "inherit", lineHeight: 1.65, marginBottom: 3 }}>
            {inlineMarkdown(item)}
          </li>
        ))}
      </ul>
    );
    listItems = [];
    inList = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block
    if (line.startsWith("```")) {
      if (!inCode) {
        flushList();
        inCode    = true;
        codeLang  = line.slice(3).trim() || "text";
        codeLines = [];
      } else {
        inCode = false;
        output.push(
          <div key={`code-${i}`} style={{ margin: "12px 0", borderRadius: 10, overflow: "hidden", border: `1px solid ${T.border}` }}>
            <div style={{ background: "rgba(255,255,255,0.05)", padding: "6px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: T.mono, fontSize: 10, color: T.accent, letterSpacing: "0.06em" }}>
                {codeLang.toUpperCase()}
              </span>
            </div>
            <pre style={{
              background: "rgba(0,0,0,0.35)", margin: 0, padding: "14px 16px",
              overflowX: "auto", fontFamily: T.mono, fontSize: 12.5,
              lineHeight: 1.65, color: "#c9d1d9",
            }}>
              <code>{codeLines.join("\n")}</code>
            </pre>
          </div>
        );
        codeLines = [];
      }
      continue;
    }
    if (inCode) { codeLines.push(line); continue; }

    // Headings
    if (line.startsWith("### ")) {
      flushList();
      output.push(<h3 key={i} style={{ color: T.text, fontSize: 14, fontWeight: 700, margin: "16px 0 6px", letterSpacing: "0.01em" }}>{line.slice(4)}</h3>);
      continue;
    }
    if (line.startsWith("## ")) {
      flushList();
      output.push(<h2 key={i} style={{ color: T.text, fontSize: 16, fontWeight: 700, margin: "18px 0 8px", borderBottom: `1px solid ${T.border}`, paddingBottom: 6 }}>{line.slice(3)}</h2>);
      continue;
    }
    if (line.startsWith("# ")) {
      flushList();
      output.push(<h1 key={i} style={{ color: T.text, fontSize: 18, fontWeight: 800, margin: "20px 0 10px" }}>{line.slice(2)}</h1>);
      continue;
    }

    // List items
    if (/^[-*] /.test(line) || /^\d+\. /.test(line)) {
      inList = true;
      listItems.push(/^[-*] /.test(line) ? line.slice(2) : line.replace(/^\d+\. /, ""));
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      flushList();
      output.push(<hr key={i} style={{ border: "none", borderTop: `1px solid ${T.border}`, margin: "16px 0" }} />);
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      flushList();
      output.push(<div key={i} style={{ height: 8 }} />);
      continue;
    }

    // Paragraph
    flushList();
    output.push(
      <p key={i} style={{ color: T.text, lineHeight: 1.72, margin: "4px 0", fontSize: "inherit" }}>
        {inlineMarkdown(line)}
      </p>
    );
  }

  flushList();
  return output;
}

// Inline markdown: bold, italic, inline code, links
function inlineMarkdown(text) {
  const parts = [];
  const re    = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[([^\]]+)\]\(([^)]+)\))/g;
  let last    = 0, match;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const m = match[0];
    if (m.startsWith("`"))   parts.push(<code key={match.index} style={{ fontFamily: T.mono, fontSize: "0.87em", background: "rgba(124,109,247,0.18)", color: T.accent, padding: "1px 5px", borderRadius: 4 }}>{m.slice(1, -1)}</code>);
    else if (m.startsWith("**")) parts.push(<strong key={match.index} style={{ fontWeight: 700, color: T.text }}>{m.slice(2, -2)}</strong>);
    else if (m.startsWith("*"))  parts.push(<em key={match.index} style={{ fontStyle: "italic", color: T.textDim }}>{m.slice(1, -1)}</em>);
    else if (m.startsWith("["))  parts.push(<a key={match.index} href={match[3]} target="_blank" rel="noopener noreferrer" style={{ color: T.accentB, textDecoration: "underline", textUnderlineOffset: 3 }}>{match[2]}</a>);
    last = match.index + m.length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 ? parts[0] : parts;
}

// ─── Animated cursor ──────────────────────────────────────────────────────────
const Cursor = () => (
  <motion.span
    animate={{ opacity: [1, 0, 1] }}
    transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
    style={{ display: "inline-block", width: 7, height: 14, background: T.accent, borderRadius: 1, verticalAlign: "text-bottom", marginLeft: 2 }}
  />
);

// ─── Typing animation ─────────────────────────────────────────────────────────
const ThinkingDots = () => (
  <div style={{ display: "flex", gap: 5, padding: "10px 2px", alignItems: "center" }}>
    {[0, 1, 2].map((i) => (
      <motion.div key={i}
        animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
        style={{ width: 6, height: 6, borderRadius: "50%", background: T.accent }}
      />
    ))}
    <span style={{ color: T.textMuted, fontSize: 11, marginLeft: 6, fontFamily: T.mono }}>ARIA is thinking…</span>
  </div>
);

// ─── ARIA avatar ──────────────────────────────────────────────────────────────
const ARIAAvatar = ({ size = 32, pulse = false }) => (
  <div style={{ position: "relative", flexShrink: 0 }}>
    {pulse && (
      <motion.div
        animate={{ scale: [1, 1.55, 1], opacity: [0.4, 0, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
        style={{ position: "absolute", inset: -4, borderRadius: "50%", background: T.accent, zIndex: 0 }}
      />
    )}
    <div style={{
      width: size, height: size, borderRadius: "50%", zIndex: 1, position: "relative",
      background: `linear-gradient(135deg, ${T.accent} 0%, #38bdf8 50%, #34d399 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: `0 0 ${size / 2}px ${T.accent}55`,
    }}>
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8}>
        <path d="M12 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0 14c-6 0-8 2-8 3v1h16v-1c0-1-2-3-8-3z" />
        <path d="M18 8l2-2M6 8 4 6M12 6v2" />
      </svg>
    </div>
  </div>
);

// ─── Message bubble ───────────────────────────────────────────────────────────
const MessageBubble = ({ msg, fontSize, isLast, isStreaming }) => {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);

  const copyText = () => {
    navigator.clipboard.writeText(msg.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: "flex",
        flexDirection: isUser ? "row-reverse" : "row",
        gap: 10,
        padding: "2px 0",
        alignItems: "flex-start",
      }}
    >
      {/* Avatar */}
      {!isUser ? (
        <ARIAAvatar size={30} pulse={isLast && isStreaming} />
      ) : (
        <div style={{
          width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, #334155, #1e293b)",
          border: `1px solid ${T.borderBri}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={T.textDim} strokeWidth={1.8}>
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 110 8 4 4 0 010-8z" />
          </svg>
        </div>
      )}

      {/* Bubble */}
      <div style={{ maxWidth: "80%", minWidth: 60 }}>
        {/* Meta */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6, marginBottom: 4,
          justifyContent: isUser ? "flex-end" : "flex-start",
        }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: isUser ? T.textMuted : T.accent, letterSpacing: "0.06em", fontFamily: T.mono }}>
            {isUser ? "YOU" : "ARIA"}
          </span>
          <span style={{ fontSize: 9, color: T.textMuted, fontFamily: T.mono }}>
            {fmtTs(msg.timestamp)}
          </span>
          {msg.tokens && (
            <span style={{ fontSize: 9, color: T.textMuted, fontFamily: T.mono }}>
              {fmtTok(msg.tokens)} tok
            </span>
          )}
        </div>

        {/* Content */}
        <div
          style={{
            padding: isUser ? "10px 14px" : "12px 16px",
            borderRadius: isUser ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
            background: isUser
              ? `linear-gradient(135deg, ${T.accent}22, ${T.accent}12)`
              : T.surface,
            border: `1px solid ${isUser ? T.accent + "44" : T.border}`,
            fontSize: fontSize,
            lineHeight: 1.65,
            color: T.text,
            position: "relative",
          }}
        >
          {isUser ? (
            <p style={{ margin: 0, color: T.text }}>{msg.content}</p>
          ) : msg.content === "" && isLast && isStreaming ? (
            <ThinkingDots />
          ) : (
            <>
              {renderMarkdown(msg.content)}
              {isLast && isStreaming && <Cursor />}
            </>
          )}

          {/* Copy button — assistant messages only */}
          {!isUser && msg.content && !isStreaming && (
            <button
              onClick={copyText}
              style={{
                position: "absolute", top: 8, right: 8,
                background: copied ? T.accentG + "33" : "transparent",
                border: "none", cursor: "pointer", padding: 4, borderRadius: 6,
                color: copied ? T.accentG : T.textMuted,
                transition: "all 0.15s",
              }}
              title="Copy response"
            >
              <Ic d={copied ? "M20 6L9 17l-5-5" : "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"} size={13} sw={2} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ─── Prompt chip ──────────────────────────────────────────────────────────────
const PromptChip = ({ label, color, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.02, backgroundColor: color + "18" }}
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    style={{
      padding: "7px 13px",
      borderRadius: 12,
      background: color + "0d",
      border: `1px solid ${color}2a`,
      cursor: "pointer",
      color: T.text,
      fontSize: 12,
      lineHeight: 1.4,
      textAlign: "left",
      transition: "all 0.15s",
      display: "flex", alignItems: "center", gap: 7,
    }}
  >
    <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, flexShrink: 0 }} />
    {label}
  </motion.button>
);

// ─── Status bar (top HUD) ─────────────────────────────────────────────────────
const StatusBar = ({ tokens, msgCount, isStreaming, onClear, onSidebar, sidebarOpen }) => (
  <div style={{
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "10px 16px",
    background: "rgba(0,0,0,0.4)",
    borderBottom: `1px solid ${T.border}`,
    flexShrink: 0,
  }}>
    {/* Left: ARIA identity */}
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <ARIAAvatar size={26} pulse={isStreaming} />
      <div>
        <div style={{ color: T.text, fontWeight: 700, fontSize: 13, letterSpacing: "0.03em" }}>
          ARIA
        </div>
        <div style={{ color: T.textMuted, fontSize: 10, fontFamily: T.mono, letterSpacing: "0.06em" }}>
          ADAPTIVE REASONING INTERFACE
        </div>
      </div>
      {isStreaming && (
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          style={{
            padding: "2px 8px", borderRadius: 8,
            background: T.accent + "22", border: `1px solid ${T.accent}44`,
            color: T.accent, fontSize: 10, fontWeight: 600, fontFamily: T.mono,
          }}
        >
          ● STREAMING
        </motion.div>
      )}
    </div>

    {/* Right: stats + controls */}
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {msgCount > 0 && (
        <div style={{ fontFamily: T.mono, fontSize: 10, color: T.textMuted }}>
          {msgCount} msg · {fmtTok(tokens)} tok
        </div>
      )}
      <button onClick={onClear} title="Clear conversation"
        style={{ background: "transparent", border: "none", cursor: "pointer", color: T.textMuted, padding: 5, borderRadius: 7, transition: "color 0.15s" }}
        onMouseEnter={(e) => e.currentTarget.style.color = T.text}
        onMouseLeave={(e) => e.currentTarget.style.color = T.textMuted}>
        <Ic d="M3 6h18M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m5-3h4M10 3a1 1 0 00-1 1v1h6V4a1 1 0 00-1-1h-4z" size={15} />
      </button>
      <button onClick={onSidebar} title="Prompt library"
        style={{ background: sidebarOpen ? T.accent + "22" : "transparent", border: sidebarOpen ? `1px solid ${T.accent}44` : "none", cursor: "pointer", color: sidebarOpen ? T.accent : T.textMuted, padding: 5, borderRadius: 7, transition: "all 0.15s" }}
        onMouseEnter={(e) => { if (!sidebarOpen) e.currentTarget.style.color = T.text; }}
        onMouseLeave={(e) => { if (!sidebarOpen) e.currentTarget.style.color = T.textMuted; }}>
        <Ic d="M4 6h16M4 10h16M4 14h10" size={15} />
      </button>
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const ProjectAI = ({ onClose }) => {
  const [st, dispatch]   = useReducer(reducer, initialState);
  const set              = useCallback((p) => dispatch({ type: "SET", payload: p }), []);
  const messagesEndRef   = useRef(null);
  const textareaRef      = useRef(null);
  const abortRef         = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [st.messages, st.isStreaming]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
  }, [st.inputValue]);

  // Focus textarea on mount
  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 200);
    set({ sessionId: uid() });
  }, []);

  // Keyboard: Escape closes; Ctrl+L clears
  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape" && !st.isStreaming) onClose?.();
      if ((e.ctrlKey || e.metaKey) && e.key === "l") { e.preventDefault(); dispatch({ type: "CLEAR" }); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [st.isStreaming, onClose]);

  // ── Core: send message with real streaming ──────────────────────
  const sendMessage = useCallback(async (userText) => {
    const text = (userText ?? st.inputValue).trim();
    if (!text || st.isStreaming) return;

    set({ inputValue: "", isStreaming: true, showSuggested: false, error: null });

    // Add user message
    const userMsg = { id: uid(), role: "user", content: text, timestamp: now() };
    dispatch({ type: "ADD_MSG", payload: userMsg });

    // Add empty assistant message (streaming target)
    const assistantId = uid();
    dispatch({
      type: "ADD_MSG",
      payload: { id: assistantId, role: "assistant", content: "", timestamp: now() },
    });

    // Build messages history for API
    const apiMessages = [
      ...st.messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: text },
    ];

    try {
      abortRef.current = new AbortController();

      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const response = await fetch(`${BASE_URL}/api/v1/ai/chat`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        signal:  abortRef.current.signal,
        body: JSON.stringify({
          model:      "claude-sonnet-4-6",
          max_tokens: 1000,
          system:     SYSTEM_PROMPT,
          stream:     true,
          messages:   apiMessages,
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody?.error?.message ?? `HTTP ${response.status}`);
      }

      // Stream SSE
      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let   full    = "";
      let   inputT  = 0;
      let   outputT = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;

          try {
            const evt = JSON.parse(data);

            if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
              full += evt.delta.text;
              dispatch({ type: "UPD_LAST", payload: { content: full } });
            }

            if (evt.type === "message_start" && evt.message?.usage) {
              inputT = evt.message.usage.input_tokens ?? 0;
            }
            if (evt.type === "message_delta" && evt.usage) {
              outputT = evt.usage.output_tokens ?? 0;
            }
          } catch {}
        }
      }

      const totalTok = inputT + outputT;
      dispatch({
        type: "UPD_LAST",
        payload: { content: full, tokens: outputT, model: "claude-sonnet-4" },
      });
      set({ isStreaming: false, totalTokens: (t) => t + totalTok });

    } catch (err) {
      if (err.name === "AbortError") {
        set({ isStreaming: false });
        return;
      }
      console.error("ARIA API error:", err);
      dispatch({
        type: "UPD_LAST",
        payload: {
          content: `**Connection error** — ${err.message}\n\nPlease check your network connection or try again.`,
        },
      });
      set({ isStreaming: false, error: err.message });
    }
  }, [st.inputValue, st.isStreaming, st.messages, set]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const stopStreaming = () => {
    abortRef.current?.abort();
    set({ isStreaming: false });
  };

  // Compute total tokens (avoid stale closure)
  const totalTokens = useMemo(() =>
    st.messages.filter(m => m.role === "assistant").reduce((s, m) => s + (m.tokens || 0), 0),
  [st.messages]);

  const canSend = st.inputValue.trim().length > 0 && !st.isStreaming;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        left: 0, right: 0,
        top: 0,
        bottom: "var(--taskbar-height, 52px)",
        zIndex: 50,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(24px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        paddingTop: "max(12px, env(safe-area-inset-top))",
        paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        paddingLeft: 12, paddingRight: 12,
        fontFamily: T.sans,
      }}
      onClick={(e) => { if (e.target === e.currentTarget && !st.isStreaming) onClose?.(); }}
    >
      <motion.div
        initial={{ scale: 0.94, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 20 }}
        transition={{ type: "spring", damping: 24, stiffness: 280 }}
        style={{
          width: "100%", maxWidth: 780,
          height: "100%", maxHeight: 780,
          borderRadius: 20,
          overflow: "hidden",
          display: "flex",
          flexDirection: "row",
          background: T.bg,
          border: `1px solid ${T.border}`,
          boxShadow: `0 48px 96px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04), 0 0 80px ${T.accent}18`,
          position: "relative",
        }}
      >
        {/* ── CLOSE BUTTON ───────────────────────────────────────── */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 12, right: 12, zIndex: 10,
            background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer",
            width: 30, height: 30, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: T.textDim, transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.14)"; e.currentTarget.style.color = T.text; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = T.textDim; }}
        >
          <Ic d="M18 6 6 18M6 6l12 12" size={14} sw={2} />
        </button>

        {/* ══ SIDEBAR — Prompt Library ════════════════════════════ */}
        <AnimatePresence>
          {st.sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              style={{
                background: "rgba(0,0,0,0.4)",
                borderRight: `1px solid ${T.border}`,
                overflowY: "auto",
                overflowX: "hidden",
                flexShrink: 0,
              }}
            >
              <div style={{ padding: 16, minWidth: 240 }}>
                <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", fontFamily: T.mono, marginBottom: 16 }}>
                  PROMPT LIBRARY
                </div>
                {PROMPT_GROUPS.map((group) => (
                  <div key={group.label} style={{ marginBottom: 20 }}>
                    <div style={{ color: group.color, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 8, fontFamily: T.mono }}>
                      {group.label.toUpperCase()}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {group.prompts.map((p) => (
                        <button
                          key={p}
                          onClick={() => { sendMessage(p); set({ sidebarOpen: false }); }}
                          style={{
                            background: "transparent", border: `1px solid ${T.border}`,
                            borderRadius: 8, padding: "7px 10px",
                            color: T.textDim, fontSize: 11, lineHeight: 1.45,
                            cursor: "pointer", textAlign: "left",
                            transition: "all 0.12s",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = group.color + "12"; e.currentTarget.style.color = T.text; e.currentTarget.style.borderColor = group.color + "44"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.textDim; e.currentTarget.style.borderColor = T.border; }}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ MAIN CHAT PANEL ════════════════════════════════════ */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

          {/* Status bar */}
          <StatusBar
            tokens={totalTokens}
            msgCount={st.messages.length}
            isStreaming={st.isStreaming}
            onClear={() => dispatch({ type: "CLEAR" })}
            onSidebar={() => set({ sidebarOpen: !st.sidebarOpen })}
            sidebarOpen={st.sidebarOpen}
          />

          {/* ── MESSAGE AREA ──────────────────────────────────── */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "20px 20px 8px",
            display: "flex", flexDirection: "column", gap: 16,
            scrollbarWidth: "thin",
            scrollbarColor: `${T.border} transparent`,
          }}>

            {/* Welcome / suggested prompts */}
            <AnimatePresence>
              {st.showSuggested && st.messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Hero */}
                  <div style={{ textAlign: "center", padding: "24px 0 20px" }}>
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                      style={{ display: "inline-flex", marginBottom: 16 }}
                    >
                      <ARIAAvatar size={56} />
                    </motion.div>
                    <motion.h2
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.18 }}
                      style={{ color: T.text, fontSize: 22, fontWeight: 800, margin: "0 0 6px", letterSpacing: "-0.02em" }}
                    >
                      Hello, I'm ARIA
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: 0.26 }}
                      style={{ color: T.textDim, fontSize: 13, maxWidth: 420, margin: "0 auto", lineHeight: 1.6 }}
                    >
                      The cognitive intelligence layer embedded in this portfolio OS. I understand every module, every API, every architectural decision — and I can explain, demonstrate, or generate anything you need.
                    </motion.p>
                  </div>

                  {/* Capability pills */}
                  <motion.div
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.34 }}
                    style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 24 }}
                  >
                    {[
                      { label: "System Architecture",  color: T.accent },
                      { label: "Live Code Generation", color: T.accentG },
                      { label: "Portfolio Insights",   color: T.accentB },
                      { label: "Technical Deep-Dives", color: T.accentO },
                      { label: "Real-time Streaming",  color: T.accentP },
                    ].map(({ label, color }) => (
                      <div key={label} style={{
                        padding: "4px 12px", borderRadius: 20,
                        background: color + "14", border: `1px solid ${color}2a`,
                        color: color, fontSize: 11, fontWeight: 600,
                      }}>
                        {label}
                      </div>
                    ))}
                  </motion.div>

                  {/* Group tabs */}
                  <div style={{ display: "flex", gap: 6, marginBottom: 12, overflowX: "auto", scrollbarWidth: "none" }}>
                    {PROMPT_GROUPS.map((g, i) => (
                      <button
                        key={g.label}
                        onClick={() => set({ activeGroup: i })}
                        style={{
                          padding: "5px 14px", borderRadius: 20, flexShrink: 0,
                          background: st.activeGroup === i ? g.color + "22" : "transparent",
                          border: `1px solid ${st.activeGroup === i ? g.color + "66" : T.border}`,
                          color: st.activeGroup === i ? g.color : T.textMuted,
                          fontSize: 11, fontWeight: 600, cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>

                  {/* Active group prompts */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {PROMPT_GROUPS[st.activeGroup].prompts.map((p) => (
                      <PromptChip
                        key={p}
                        label={p}
                        color={PROMPT_GROUPS[st.activeGroup].color}
                        onClick={() => sendMessage(p)}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            {st.messages.map((msg, i) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                fontSize={st.fontSize}
                isLast={i === st.messages.length - 1}
                isStreaming={st.isStreaming}
              />
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* ── INPUT AREA ────────────────────────────────────── */}
          <div style={{
            padding: "12px 16px 16px",
            borderTop: `1px solid ${T.border}`,
            background: "rgba(0,0,0,0.2)",
            flexShrink: 0,
          }}>
            <div style={{
              display: "flex", alignItems: "flex-end", gap: 10,
              background: T.surface,
              border: `1px solid ${st.inputValue ? T.accent + "55" : T.border}`,
              borderRadius: 16, padding: "10px 14px",
              transition: "border-color 0.2s",
            }}>
              <textarea
                ref={textareaRef}
                value={st.inputValue}
                onChange={(e) => set({ inputValue: e.target.value })}
                onKeyDown={handleKeyDown}
                placeholder="Ask ARIA anything about this portfolio OS…"
                rows={1}
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  resize: "none", color: T.text, fontSize: st.fontSize,
                  lineHeight: 1.55, fontFamily: T.sans,
                  placeholder: T.textMuted,
                  maxHeight: 140, overflowY: "auto",
                  scrollbarWidth: "none",
                }}
              />

              {/* Send / Stop */}
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={st.isStreaming ? stopStreaming : sendMessage}
                disabled={!st.isStreaming && !canSend}
                style={{
                  width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                  background: st.isStreaming
                    ? "#ef4444" + "22"
                    : canSend ? T.accent : "rgba(255,255,255,0.06)",
                  border: `1px solid ${st.isStreaming ? "#ef4444" + "55" : canSend ? T.accent + "66" : T.border}`,
                  cursor: st.isStreaming || canSend ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: st.isStreaming ? "#ef4444" : canSend ? "#fff" : T.textMuted,
                  transition: "all 0.18s",
                }}
              >
                {st.isStreaming ? (
                  <motion.div
                    animate={{ scale: [1, 0.85, 1] }} transition={{ duration: 0.8, repeat: Infinity }}
                    style={{ width: 10, height: 10, borderRadius: 2, background: "#ef4444" }}
                  />
                ) : (
                  <Ic d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" size={15} sw={2} />
                )}
              </motion.button>
            </div>

            {/* Footer hints */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, padding: "0 2px" }}>
              <span style={{ color: T.textMuted, fontSize: 10, fontFamily: T.mono }}>
                ↵ send · ⇧↵ newline · ⌘L clear · ESC close
              </span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {/* Font size */}
                {[12, 14, 16].map((s) => (
                  <button key={s}
                    onClick={() => set({ fontSize: s })}
                    style={{
                      background: "transparent", border: "none", cursor: "pointer",
                      color: st.fontSize === s ? T.accent : T.textMuted,
                      fontSize: 10, fontFamily: T.mono,
                      transition: "color 0.15s",
                    }}
                  >
                    {s}px
                  </button>
                ))}
                <span style={{ color: T.textMuted, fontSize: 10, fontFamily: T.mono }}>
                  Powered by Claude
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProjectAI;