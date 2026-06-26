"use client";
/**
 * MusicApp.js — Nova DJ
 * ─────────────────────────────────────────────────────────────────────────
 * An AI-driven music experience. Not a player with search bolted on.
 *
 * The AI is the DJ. Tell it your mood → it reads your location + time of
 * day → generates a real curated playlist with its reasoning → searches
 * Deezer for those exact tracks → plays them. The whole UI responds to
 * the mood: colors, ambient gradients, everything shifts.
 *
 * THREE modes:
 *   VIBE     — AI session. Pick mood → AI curates. Primary experience.
 *   SEARCH   — Find any artist/song instantly. Deezer + iTunes parallel.
 *   PLAYING  — Full player. Always accessible.
 *
 * Audio: Deezer 30s previews (labelled clearly) + local file support
 * (drag/drop — plays fully, no time limit).
 *
 * Responsive: single column on mobile (mood → player stacked),
 * split panel on tablet, three-column on desktop.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const Ic = ({ d, size = 20, c = "currentColor", sw = 1.6, fill = "none", style: s }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0, ...s }}>
    {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
  </svg>
);
const G = {
  play:    "M5 3l14 9-14 9V3z",
  pause:   ["M6 4h4v16H6z","M14 4h4v16h-4z"],
  next:    ["M5 4l10 8-10 8V4z","M19 4v16"],
  prev:    ["M19 4L9 12l10 8V4z","M5 4v16"],
  shuf:    ["M16 3h5v5","M4 20L21 3","M21 16v5h-5","M15 15l6 6","M4 4l5 5"],
  rep:     ["M17 2l4 4-4 4","M3 11V9a4 4 0 0 1 4-4h14","M7 22l-4-4 4-4","M21 13v2a4 4 0 0 1-4 4H3"],
  heart:   "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
  search:  ["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z","M21 21l-4.35-4.35"],
  close:   "M18 6L6 18M6 6l12 12",
  music:   ["M9 18V5l12-2v13","M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z","M18 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"],
  spark:   "M12 2 14.4 9.6 22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2Z",
  vol:     ["M11 5L6 9H2v6h4l5 4V5z","M19.07 4.93a10 10 0 0 1 0 14.14","M15.54 8.46a5 5 0 0 1 0 7.07"],
  volOff:  ["M11 5L6 9H2v6h4l5 4V5z","M23 9l-6 6","M17 9l6 6"],
  upload:  ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4","M17 8l-5-5-5 5","M12 3v12"],
  pin:     ["M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z","M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"],
  list:    ["M8 6h13","M8 12h13","M8 18h13","M3 6h.01","M3 12h.01","M3 18h.01"],
  back:    "M19 12H5m7-7-7 7 7 7",
};

// ─── Mood palette — each mood has its own complete visual identity ─────────────
const MOODS = [
  { id:"happy",     label:"Happy",       emoji:"☀️",  colors:["#FFB020","#FF6B35"], bg:"rgba(255,176,32,0.12)" },
  { id:"chill",     label:"Chill",       emoji:"🌊",  colors:["#4A8FE8","#2BB56A"], bg:"rgba(74,143,232,0.12)" },
  { id:"hype",      label:"Hype",        emoji:"⚡",  colors:["#F94777","#FF6B35"], bg:"rgba(249,71,119,0.12)" },
  { id:"sad",       label:"Melancholic", emoji:"🌧️",  colors:["#6B7A99","#4A5568"], bg:"rgba(107,122,153,0.12)" },
  { id:"focus",     label:"Focus",       emoji:"🎯",  colors:["#9B7FFF","#4A8FE8"], bg:"rgba(155,127,255,0.12)" },
  { id:"romantic",  label:"Romantic",    emoji:"🌹",  colors:["#E8447A","#9B7FFF"], bg:"rgba(232,68,122,0.12)" },
  { id:"workout",   label:"Workout",     emoji:"💪",  colors:["#FF6B35","#FFB020"], bg:"rgba(255,107,53,0.12)" },
  { id:"midnight",  label:"Midnight",    emoji:"🌙",  colors:["#1A1A3E","#9B7FFF"], bg:"rgba(155,127,255,0.08)" },
  { id:"party",     label:"Party",       emoji:"🎉",  colors:["#F94777","#FFB020"], bg:"rgba(249,71,119,0.12)" },
  { id:"nostalgic", label:"Nostalgic",   emoji:"📻",  colors:["#CFA94A","#E8447A"], bg:"rgba(207,169,74,0.12)" },
];

// ─── Design tokens ────────────────────────────────────────────────────────────
const D = {
  bg:   "#07080F",
  s1:   "#0C0D16",
  s2:   "#11131E",
  s3:   "#161926",
  b0:   "rgba(255,255,255,0.05)",
  b1:   "rgba(255,255,255,0.08)",
  b2:   "rgba(255,255,255,0.14)",
  text: "#EFECE7",
  sub:  "#7A8899",
  dim:  "rgba(122,136,153,0.45)",
  sans: "-apple-system,'SF Pro Display',Inter,system-ui,sans-serif",
  mono: "'SF Mono','JetBrains Mono',monospace",
};

const ACCENT_POOL = ["#9B7FFF","#F94777","#FFB020","#4A8FE8","#2BB56A","#FF6B35","#E8447A","#CFA94A"];
const uid = () => Math.random().toString(36).slice(2,9);
const fmt = (s) => { if (!s||isNaN(s)) return "0:00"; const m=Math.floor(s/60),sec=Math.floor(s%60); return `${m}:${sec.toString().padStart(2,"0")}`; };

// ─── Responsive hook ──────────────────────────────────────────────────────────
function useVP() {
  const [vp, setVp] = useState({ w: 1200, h: 800 });
  useEffect(() => {
    const fn = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    fn(); window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return vp;
}

// ─── Geolocation → country name ───────────────────────────────────────────────
async function getCountry() {
  try {
    const r = await fetch("https://ipapi.co/json/");
    const d = await r.json();
    return d.country_name || "Canada";
  } catch { return "Canada"; }
}

// ─── AI playlist generation ───────────────────────────────────────────────────
async function generatePlaylist(mood, country, timeOfDay, onChunk, signal) {
  const system = `You are Nova DJ, an AI music curator. Given a user's mood, location, and time of day, you generate a specific, real playlist of 8 songs that fit perfectly.

Rules:
- Return ONLY valid JSON, nothing else. No markdown, no explanation.
- Format: {"vibe": "2-3 sentence description of the session", "tracks": [{"title":"","artist":"","reason":"why this fits"},...]}
- Choose REAL, well-known songs that actually exist and are searchable on Deezer.
- The reason should be 8-12 words max, very specific to the mood.
- Vary genres but keep the emotional thread consistent.
- Include some local artists from the user's country when relevant.`;

  const content = `Mood: ${mood.label}. Country: ${country}. Time: ${timeOfDay}. Create a perfect 8-song playlist.`;

  const res = await fetch(`${API}/api/v1/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, messages: [{ role: "user", content }], max_tokens: 800 }),
    signal,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "", full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n"); buf = lines.pop();
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") break;
      try {
        const ev = JSON.parse(data);
        if (ev.type === "content_block_delta") {
          const chunk = ev.delta?.text || "";
          full += chunk;
          onChunk(full);
        }
      } catch {}
    }
  }
  return full;
}

// ─── Deezer search via JSONP ──────────────────────────────────────────────────
function deezerSearch(q, onResult) {
  const cb = "__dz_" + Date.now();
  window[cb] = (d) => {
    const tracks = (d?.data || []).filter(t => t.preview).slice(0, 8).map((t, i) => ({
      id: "dz_" + t.id, title: t.title_short || t.title,
      artist: t.artist?.name || "Unknown", album: t.album?.title || "",
      src: t.preview, cover: t.album?.cover_medium || "",
      duration: 30, color: ACCENT_POOL[i % ACCENT_POOL.length],
      isPreview: true,
    }));
    onResult(tracks);
    delete window[cb];
    document.getElementById("dz-s")?.remove();
  };
  const s = document.createElement("script");
  s.id = "dz-s";
  s.src = `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=8&output=jsonp&callback=${cb}`;
  s.onerror = () => { onResult([]); delete window[cb]; };
  document.getElementById("dz-s")?.remove();
  document.body.appendChild(s);
}

function deezerChart(onResult) {
  const cb = "__dz_chart_" + Date.now();
  window[cb] = (d) => {
    const tracks = (d?.data || []).filter(t => t.preview).slice(0, 12).map((t, i) => ({
      id: "dz_" + t.id, title: t.title_short || t.title,
      artist: t.artist?.name || "Unknown", album: t.album?.title || "",
      src: t.preview, cover: t.album?.cover_medium || "",
      duration: 30, color: ACCENT_POOL[i % ACCENT_POOL.length],
      isPreview: true,
    }));
    onResult(tracks);
    delete window[cb];
  };
  const s = document.createElement("script");
  s.src = `https://api.deezer.com/chart/0/tracks?limit=12&output=jsonp&callback=${cb}`;
  s.onerror = () => { onResult([]); delete window[cb]; };
  document.body.appendChild(s);
}

async function iTunesSearch(q) {
  try {
    const r = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&limit=8&entity=song`);
    const d = await r.json();
    return (d.results || []).filter(t => t.previewUrl).slice(0, 8).map((t, i) => ({
      id: "it_" + t.trackId, title: t.trackName || "",
      artist: t.artistName || "", album: t.collectionName || "",
      src: t.previewUrl, cover: (t.artworkUrl100 || "").replace("100x100","300x300"),
      duration: 30, color: ACCENT_POOL[i % ACCENT_POOL.length],
      isPreview: true,
    }));
  } catch { return []; }
}

// ─── Local file loader ────────────────────────────────────────────────────────
function loadLocalFile(file) {
  return new Promise(res => {
    const src = URL.createObjectURL(file);
    const a = new Audio(src);
    const finish = (dur) => res({
      id: uid(), title: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
      artist: "Local File", album: "", src, cover: null,
      duration: dur || 0, color: ACCENT_POOL[Math.floor(Math.random() * ACCENT_POOL.length)],
      isPreview: false, isLocal: true,
    });
    a.addEventListener("loadedmetadata", () => finish(a.duration), { once: true });
    a.addEventListener("error", () => finish(0), { once: true });
  });
}

// ─── Animated waveform ────────────────────────────────────────────────────────
const Wave = ({ playing, color, bars = 24, h = 28 }) => (
  <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: h, padding: "0 2px" }}>
    {Array.from({ length: bars }).map((_, i) => (
      <motion.div key={i} style={{ width: 3, borderRadius: 2, background: color,
        opacity: playing ? 0.85 : 0.2, flexShrink: 0 }}
        animate={playing ? { height: ["22%", `${28+(i*43+19)%68}%`, "22%"] } : { height: "20%" }}
        transition={playing ? { duration: 0.4+(i%5)*0.08, repeat:Infinity, repeatType:"mirror", ease:"easeInOut", delay:i*0.03 } : { duration:0.3 }} />
    ))}
  </div>
);

// ─── Album art ────────────────────────────────────────────────────────────────
const Art = ({ src, color, playing, size }) => (
  <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
    <div style={{ position:"absolute", inset:-16, borderRadius:"50%", background:color,
      filter:"blur(40px)", opacity:playing ? 0.28 : 0.1, transition:"opacity 0.8s" }} />
    <motion.div animate={{ scale: playing ? 1 : 0.95 }} transition={{ duration:0.5, ease:"easeOut" }}
      style={{ width:size, height:size, borderRadius:Math.round(size*0.1), overflow:"hidden",
        boxShadow:`0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px ${color}22`, position:"relative" }}>
      {src
        ? <img src={src} alt="cover" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> // eslint-disable-line
        : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center",
            justifyContent:"center", background:`linear-gradient(135deg,${color}33,${color}11)` }}>
            <Ic d={G.music} size={Math.round(size*0.3)} c={color} sw={1} />
          </div>}
    </motion.div>
  </div>
);

// ─── Progress bar ─────────────────────────────────────────────────────────────
const Seek = ({ cur, dur, color, onSeek }) => {
  const pct = dur > 0 ? (cur/dur)*100 : 0;
  return (
    <div style={{ width:"100%" }}>
      <div style={{ display:"flex", justifyContent:"space-between",
        fontFamily:D.mono, fontSize:11, color:D.dim, marginBottom:8 }}>
        <span>{fmt(cur)}</span><span>{fmt(dur)}</span>
      </div>
      <div style={{ position:"relative", height:5, cursor:"pointer", borderRadius:3 }}>
        <input type="range" min={0} max={dur||100} step={0.1} value={cur}
          onChange={e => onSeek(parseFloat(e.target.value))}
          style={{ position:"absolute", inset:0, width:"100%", height:"100%",
            opacity:0, cursor:"pointer", zIndex:2 }} />
        <div style={{ position:"absolute", inset:0, borderRadius:3, background:D.b1 }} />
        <div style={{ position:"absolute", left:0, top:0, bottom:0, borderRadius:3,
          background:`linear-gradient(90deg,${color},${color}99)`, width:`${pct}%`, transition:"width 0.1s linear" }} />
        <div style={{ position:"absolute", top:"50%", transform:"translateY(-50%)",
          width:14, height:14, borderRadius:"50%", background:"white", left:`calc(${pct}% - 7px)`,
          boxShadow:"0 2px 8px rgba(0,0,0,0.5)", transition:"left 0.1s linear" }} />
      </div>
    </div>
  );
};

// ─── Track row ────────────────────────────────────────────────────────────────
const Row = ({ track, active, playing, onPlay, liked, onLike, reason }) => {
  const c = track.color || D.sub;
  return (
    <motion.div whileHover={{ background: D.b0 }} whileTap={{ scale:0.99 }}
      onClick={onPlay}
      style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px",
        borderRadius:14, cursor:"pointer", background: active ? D.b1 : "transparent",
        transition:"background 0.12s" }}>
      <div style={{ width:44, height:44, borderRadius:12, overflow:"hidden", flexShrink:0,
        background:`linear-gradient(135deg,${c}33,${c}11)`, position:"relative" }}>
        {track.cover
          ? <img src={track.cover} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> // eslint-disable-line
          : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center",
              justifyContent:"center" }}><Ic d={G.music} size={18} c={c} /></div>}
        {active && playing && (
          <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.5)",
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Wave playing bars={4} h={18} color="white" />
          </div>
        )}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ color: active ? D.text : "rgba(239,236,231,0.85)", fontSize:13.5,
          fontWeight: active ? 600 : 400, margin:0, overflow:"hidden",
          textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{track.title}</p>
        <p style={{ color:D.dim, fontSize:12, margin:"2px 0 0",
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {track.artist}{track.album ? ` · ${track.album}` : ""}
        </p>
        {reason && <p style={{ color:c, fontSize:10, margin:"3px 0 0", fontStyle:"italic",
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{reason}</p>}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
        {(track.isPreview || !track.isLocal) && (
          <span style={{ fontSize:9, fontFamily:D.mono, color:D.dim,
            background:D.b1, borderRadius:4, padding:"2px 5px" }}>30s</span>
        )}
        {track.isLocal && (
          <span style={{ fontSize:9, fontFamily:D.mono, color:"#1DB954",
            background:"rgba(29,185,84,0.12)", borderRadius:4, padding:"2px 5px" }}>FULL</span>
        )}
        <button onClick={e => { e.stopPropagation(); onLike(); }}
          style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
          <Ic d={G.heart} size={14} c={liked ? "#F94777" : D.dim}
            fill={liked ? "#F94777" : "none"} sw={liked ? 0 : 1.5} />
        </button>
        <span style={{ fontFamily:D.mono, fontSize:11, color:D.dim, width:32, textAlign:"right" }}>
          {fmt(track.duration)}
        </span>
      </div>
    </motion.div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════
const MusicApp = ({ musicOpen, setMusicOpen }) => {
  // ── App state ────────────────────────────────────────────────────────────
  const [screen,      setScreen]     = useState("mood"); // mood | vibe | player | search
  const [mood,        setMood]       = useState(null);
  const [country,     setCountry]    = useState("Canada");
  const [vibeText,    setVibeText]   = useState("");
  const [aiStreaming, setAiStreaming] = useState(false);
  const [aiError,     setAiError]    = useState("");
  const [aiTracks,    setAiTracks]   = useState([]);   // [{title,artist,reason}] from AI
  const [queue,       setQueue]      = useState([]);   // resolved audio tracks
  const [qIdx,        setQIdx]       = useState(0);
  const [playing,     setPlaying]    = useState(false);
  const [cur,         setCur]        = useState(0);
  const [dur,         setDur]        = useState(0);
  const [vol,         setVol]        = useState(0.8);
  const [muted,       setMuted]      = useState(false);
  const [shuffle,     setShuffle]    = useState(false);
  const [repeat,      setRepeat]     = useState("none");
  const [liked,       setLiked]      = useState(new Set());
  const [searchQ,     setSearchQ]    = useState("");
  const [searchRes,   setSearchRes]  = useState([]);
  const [searching,   setSearching]  = useState(false);
  const [loading,     setLoading]    = useState(false);
  const [dragging,    setDragging]   = useState(false);
  const [localTracks, setLocalTracks]= useState([]);

  const audioRef   = useRef(null);
  const abortRef   = useRef(null);
  const fileRef    = useRef(null);
  const searchTRef = useRef(null);
  const { w, h } = useVP();

  // Breakpoints
  const isMobile = w < 640;
  const isTablet = w >= 640 && w < 1024;
  const isDesktop = w >= 1024;

  const track = queue[qIdx] ?? null;
  const moodObj = MOODS.find(m => m.id === mood?.id) || MOODS[0];
  const accent = moodObj.colors[0];

  // ── Geo + chart load ─────────────────────────────────────────────────────
  useEffect(() => {
    getCountry().then(setCountry);
    deezerChart(tracks => {
      if (tracks.length) { setQueue(tracks); }
    });
  }, []);

  // ── Audio wiring ──────────────────────────────────────────────────────────
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime  = () => setCur(a.currentTime);
    const onMeta  = () => setDur(isFinite(a.duration) ? a.duration : 0);
    const onCan   = () => setLoading(false);
    const onWait  = () => setLoading(true);
    const onPlay_ = () => setLoading(false);
    const onErr   = () => setLoading(false);
    const onEnd   = () => {
      if (repeat === "one") { a.currentTime = 0; a.play(); return; }
      goNext(true);
    };
    a.addEventListener("timeupdate",     onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("durationchange", onMeta);
    a.addEventListener("canplay",        onCan);
    a.addEventListener("waiting",        onWait);
    a.addEventListener("playing",        onPlay_);
    a.addEventListener("error",          onErr);
    a.addEventListener("ended",          onEnd);
    return () => {
      a.removeEventListener("timeupdate",     onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("durationchange", onMeta);
      a.removeEventListener("canplay",        onCan);
      a.removeEventListener("waiting",        onWait);
      a.removeEventListener("playing",        onPlay_);
      a.removeEventListener("error",          onErr);
      a.removeEventListener("ended",          onEnd);
    };
  }, [repeat]); // eslint-disable-line

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !track) return;
    a.src = track.src; a.load();
    setCur(0); setDur(0);
    if (playing) { setLoading(true); a.play().catch(()=>{}); }
  }, [qIdx, track?.id]); // eslint-disable-line

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !track) return;
    if (playing) { setLoading(true); a.play().catch(()=>{ setPlaying(false); }); }
    else a.pause();
  }, [playing]); // eslint-disable-line

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : vol;
  }, [vol, muted]);

  const goNext = useCallback((auto=false) => {
    setQIdx(i => {
      if (!queue.length) return i;
      if (shuffle) return Math.floor(Math.random() * queue.length);
      const n = (i+1) % queue.length;
      if (auto && n === 0 && repeat !== "all") { setPlaying(false); return i; }
      return n;
    });
    if (!playing && !auto) setPlaying(true);
  }, [queue.length, shuffle, repeat, playing]);

  const goPrev = useCallback(() => {
    if (cur > 3 && audioRef.current) { audioRef.current.currentTime = 0; return; }
    setQIdx(i => i === 0 ? queue.length-1 : i-1);
    setPlaying(true);
  }, [cur, queue.length]);

  const seek = useCallback(t => {
    const v = Math.max(0, Math.min(t, dur));
    if (audioRef.current) audioRef.current.currentTime = v;
    setCur(v);
  }, [dur]);

  const playTrack = useCallback(t => {
    const ei = queue.findIndex(q => q.id === t.id);
    if (ei !== -1) { setQIdx(ei); }
    else { const nq = [...queue, t]; setQueue(nq); setQIdx(nq.length-1); }
    setPlaying(true);
    if (isMobile) setScreen("player");
  }, [queue, isMobile]);

  const toggleLike = (id) => setLiked(s => { const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n; });

  // ── AI vibe generation ────────────────────────────────────────────────────
  const generateVibe = async (selectedMood) => {
    setMood(selectedMood);
    setScreen("vibe");
    setVibeText("");
    setAiTracks([]);
    setAiError("");
    setAiStreaming(true);
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    const hour = new Date().getHours();
    const timeOfDay = hour < 6 ? "late night" : hour < 12 ? "morning" : hour < 17 ? "afternoon" : hour < 21 ? "evening" : "night";

    try {
      let fullText = "";
      await generatePlaylist(
        selectedMood, country, timeOfDay,
        (partial) => { fullText = partial; setVibeText(partial); },
        abortRef.current.signal
      );
      setAiStreaming(false);

      // Parse AI response
      const clean = fullText.replace(/```json|```/g, "").trim();
      let parsed;
      try { parsed = JSON.parse(clean); }
      catch {
        const m = clean.match(/\{[\s\S]*\}/);
        if (m) parsed = JSON.parse(m[0]);
        else throw new Error("Invalid JSON");
      }

      const aiList = parsed.tracks || [];
      setVibeText(parsed.vibe || "");
      setAiTracks(aiList);

      // Search for each track and build queue
      const resolved = [];
      for (const t of aiList.slice(0, 8)) {
        await new Promise(r => {
          deezerSearch(`${t.title} ${t.artist}`, tracks => {
            if (tracks[0]) resolved.push({ ...tracks[0], aiReason: t.reason });
            r();
          });
        });
        await new Promise(r => setTimeout(r, 120)); // gentle rate limiting
      }

      if (resolved.length > 0) {
        setQueue(resolved);
        setQIdx(0);
        setPlaying(true);
      } else {
        setAiError("Couldn't find tracks on Deezer. Try a different mood.");
      }
    } catch (e) {
      if (e.name !== "AbortError") {
        setAiError("AI couldn't generate a playlist right now. Check the backend.");
        setAiStreaming(false);
      }
    }
  };

  // ── Search ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!searchQ.trim()) { setSearchRes([]); return; }
    setSearching(true);
    clearTimeout(searchTRef.current);
    searchTRef.current = setTimeout(async () => {
      const merged = new Map();
      await new Promise(r => {
        let done = 0;
        const fin = (res) => {
          res.forEach(t => { if (!merged.has(t.id)) merged.set(t.id, t); });
          if (++done === 2) { setSearchRes([...merged.values()]); setSearching(false); r(); }
        };
        deezerSearch(searchQ, fin);
        iTunesSearch(searchQ).then(fin);
      });
    }, 380);
  }, [searchQ]);

  // ── Local files ───────────────────────────────────────────────────────────
  const handleFiles = useCallback(async (files) => {
    const audio = Array.from(files).filter(f =>
      f.type.startsWith("audio/") || /\.(mp3|flac|wav|ogg|aac|m4a)$/i.test(f.name));
    if (!audio.length) return;
    const tracks = await Promise.all(audio.map(loadLocalFile));
    setLocalTracks(p => [...p, ...tracks]);
    const nq = [...queue, ...tracks];
    setQueue(nq);
    setQIdx(nq.length - tracks.length);
    setPlaying(true);
    setScreen("player");
  }, [queue]);

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!musicOpen) return;
    const h = (e) => {
      if (e.target.tagName === "INPUT") return;
      if (e.code === "Space")      { e.preventDefault(); setPlaying(p=>!p); }
      if (e.code === "ArrowRight") seek(cur + 10);
      if (e.code === "ArrowLeft")  seek(cur - 10);
      if (e.code === "ArrowUp")    setVol(v => Math.min(1, v+0.05));
      if (e.code === "ArrowDown")  setVol(v => Math.max(0, v-0.05));
      if (e.code === "KeyN")       goNext();
      if (e.code === "KeyM")       setMuted(m=>!m);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [musicOpen, cur, seek, goNext]);

  if (!musicOpen) return null;

  // ── Gradient from mood ────────────────────────────────────────────────────
  const grad = mood
    ? `radial-gradient(ellipse 70% 60% at 20% 80%, ${mood.colors[0]}20 0%, transparent 55%),
       radial-gradient(ellipse 50% 60% at 80% 20%, ${mood.colors[1]}15 0%, transparent 55%),
       linear-gradient(160deg, #07080F 0%, #0B0D18 100%)`
    : `radial-gradient(ellipse 60% 50% at 25% 75%, #9B7FFF18 0%, transparent 55%),
       linear-gradient(160deg, #07080F 0%, #0B0D18 100%)`;

  // ── Mini player bar (always visible when track exists) ────────────────────
  const MiniBar = () => track && (
    <div style={{ flexShrink:0, display:"flex", alignItems:"center", gap:12,
      padding:"10px 16px", background:"rgba(7,8,15,0.85)", backdropFilter:"blur(20px)",
      borderTop:`1px solid ${D.b0}`, cursor: isMobile ? "pointer" : "default" }}
      onClick={() => isMobile && setScreen("player")}>
      {track.cover
        ? <img src={track.cover} alt="" style={{ width:38, height:38, borderRadius:9, objectFit:"cover", flexShrink:0 }} /> // eslint-disable-line
        : <div style={{ width:38, height:38, borderRadius:9, background:`${accent}22`, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Ic d={G.music} size={16} c={accent} />
          </div>}
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ color:D.text, fontSize:13, fontWeight:600, margin:0,
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{track.title}</p>
        <p style={{ color:D.dim, fontSize:11, margin:"1px 0 0",
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{track.artist}</p>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:4, flexShrink:0 }}>
        <motion.button whileTap={{scale:0.85}} onClick={e=>{e.stopPropagation();goPrev();}}
          style={{ background:"none", border:"none", cursor:"pointer", padding:6 }}>
          <Ic d={G.prev} size={16} c={D.sub} />
        </motion.button>
        <motion.button whileTap={{scale:0.9}}
          onClick={e=>{e.stopPropagation();setPlaying(p=>!p);}}
          style={{ width:38, height:38, borderRadius:"50%", border:"none", cursor:"pointer",
            background:`linear-gradient(135deg,${accent},${accent}88)`,
            display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Ic d={playing ? G.pause : G.play} size={16} c="white" fill="white" sw={0} />
        </motion.button>
        <motion.button whileTap={{scale:0.85}} onClick={e=>{e.stopPropagation();goNext();}}
          style={{ background:"none", border:"none", cursor:"pointer", padding:6 }}>
          <Ic d={G.next} size={16} c={D.sub} />
        </motion.button>
      </div>
    </div>
  );

  // ── MOOD PICKER screen ────────────────────────────────────────────────────
  const MoodPicker = () => (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", flex:1, padding: isMobile ? "24px 16px" : "40px 32px",
      overflowY:"auto" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
        <Ic d={G.spark} size={22} c={accent} fill={accent} sw={0} />
        <h1 style={{ fontFamily:D.sans, fontSize: isMobile ? 22 : 28, fontWeight:800,
          color:D.text, margin:0 }}>How are you feeling?</h1>
      </div>
      <p style={{ color:D.sub, fontSize:14, margin:"0 0 32px", textAlign:"center" }}>
        Nova DJ reads your mood + location and builds your perfect session
      </p>

      <div style={{ display:"grid",
        gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : isTablet ? "repeat(3, 1fr)" : "repeat(5, 1fr)",
        gap:10, width:"100%", maxWidth:680, marginBottom:32 }}>
        {MOODS.map(m => (
          <motion.button key={m.id} whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
            onClick={() => generateVibe(m)}
            style={{ padding: isMobile ? "14px 10px" : "18px 14px", borderRadius:18,
              background: D.s2, border:`1.5px solid ${D.b1}`,
              cursor:"pointer", textAlign:"center", display:"flex",
              flexDirection:"column", alignItems:"center", gap:8,
              transition:"border-color 0.2s, background 0.2s" }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = m.colors[0]+"66";
              e.currentTarget.style.background = m.bg;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = D.b1;
              e.currentTarget.style.background = D.s2;
            }}>
            <span style={{ fontSize: isMobile ? 26 : 30 }}>{m.emoji}</span>
            <p style={{ color:D.text, fontSize: isMobile ? 12 : 13, fontWeight:600, margin:0 }}>{m.label}</p>
          </motion.button>
        ))}
      </div>

      {/* Local music option */}
      <input ref={fileRef} type="file" accept="audio/*" multiple
        style={{ display:"none" }} onChange={e => handleFiles(e.target.files)} />
      <div style={{ display:"flex", flexWrap:"wrap", gap:10, justifyContent:"center" }}>
        <motion.button whileTap={{scale:0.97}}
          onClick={() => fileRef.current?.click()}
          style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 20px",
            borderRadius:20, background:D.s2, border:`1px solid ${D.b1}`,
            color:D.sub, fontSize:13, cursor:"pointer" }}>
          <Ic d={G.upload} size={15} c={D.sub} />
          Add your music — plays fully
        </motion.button>
        <motion.button whileTap={{scale:0.97}}
          onClick={() => setScreen("search")}
          style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 20px",
            borderRadius:20, background:D.s2, border:`1px solid ${D.b1}`,
            color:D.sub, fontSize:13, cursor:"pointer" }}>
          <Ic d={G.search} size={15} c={D.sub} />
          Search any artist
        </motion.button>
      </div>

      <p style={{ color:D.dim, fontSize:11, fontFamily:D.mono, marginTop:16,
        display:"flex", alignItems:"center", gap:5 }}>
        <Ic d={G.pin} size={12} c={D.dim} /> {country}
      </p>
    </div>
  );

  // ── VIBE screen — AI generating + track list ──────────────────────────────

const VibeScreen = () => (
  <div style={{ display:"flex", flexDirection:"column", flex:1, overflowY:"auto",
    padding: isMobile ? "20px 14px" : "28px 28px" }}>



    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
      <motion.button whileTap={{scale:0.9}}
        onClick={() => { setScreen("mood"); abortRef.current?.abort(); }}
        style={{ background:"none", border:"none", cursor:"pointer", padding:6 }}>
        <Ic d={G.back} size={18} c={D.sub} />
      </motion.button>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontSize:24 }}>{mood?.emoji}</span>
        <div>
          <p style={{ color:D.text, fontSize:15, fontWeight:700, margin:0 }}>{mood?.label} Session</p>
          <p style={{ color:D.dim, fontSize:11, fontFamily:D.mono, margin:0,
            display:"flex", alignItems:"center", gap:4 }}>
            <Ic d={G.pin} size={10} c={D.dim} /> {country}
          </p>
        </div>
      </div>
    </div>

      {/* AI narration card */}
      <div style={{ borderRadius:18, padding:"16px 18px", background:D.s2,
        border:`1px solid ${accent}30`, marginBottom:20, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:`${accent}06`, pointerEvents:"none" }} />
        <div style={{ display:"flex", alignItems:"flex-start", gap:10, position:"relative" }}>
          <div style={{ width:32, height:32, borderRadius:10, background:`${accent}20`,
            border:`1px solid ${accent}40`, display:"flex", alignItems:"center",
            justifyContent:"center", flexShrink:0 }}>
            <Ic d={G.spark} size={15} c={accent} fill={accent} sw={0} />
          </div>
          <div style={{ flex:1 }}>
            <p style={{ fontFamily:D.mono, fontSize:9, color:accent, letterSpacing:"0.1em",
              margin:"0 0 6px", opacity:0.9 }}>NOVA DJ</p>
            {aiStreaming && !vibeText ? (
              <motion.p animate={{ opacity:[0.4,1,0.4] }} transition={{ duration:1.2, repeat:Infinity }}
                style={{ color:D.sub, fontSize:13, margin:0, fontStyle:"italic" }}>
                Tuning into your vibe…
              </motion.p>
            ) : (
              <p style={{ color:D.text, fontSize:14, lineHeight:1.65, margin:0 }}>
                {vibeText || aiError}
                {aiStreaming && <motion.span animate={{ opacity:[0,1] }} transition={{ duration:0.4, repeat:Infinity }}
                  style={{ color:accent }}>▍</motion.span>}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* AI track list loading */}
      {aiTracks.length === 0 && aiStreaming && (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ height:64, borderRadius:14, background:D.s2,
              animation:`music-pulse 1.4s ease-in-out ${i*0.15}s infinite` }} />
          ))}
        </div>
      )}

      {/* Resolved tracks */}
      {queue.length > 0 && !aiStreaming && (
        <>
          <p style={{ fontFamily:D.mono, fontSize:9, color:D.dim, letterSpacing:"0.1em",
            margin:"0 0 8px", padding:"0 4px" }}>
            {queue.length} TRACKS · 30s PREVIEWS
          </p>
          {queue.map((t, i) => (
            <Row key={t.id} track={t} active={i===qIdx} playing={playing}
              onPlay={() => { setQIdx(i); setPlaying(true); if(isMobile) setScreen("player"); }}
              liked={liked.has(t.id)} onLike={() => toggleLike(t.id)}
              reason={t.aiReason} />
          ))}
          <div style={{ marginTop:12, padding:"0 4px" }}>
            <motion.button whileTap={{scale:0.97}}
              onClick={() => generateVibe(mood)}
              style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 16px",
                borderRadius:12, background:D.s2, border:`1px solid ${accent}30`,
                color:accent, fontSize:13, cursor:"pointer" }}>
              <Ic d={G.spark} size={14} c={accent} fill={accent} sw={0} />
              Generate new session
            </motion.button>
          </div>
        </>
      )}
    </div>
  );

  // ── SEARCH screen ─────────────────────────────────────────────────────────
  const SearchScreen = () => (
    <div style={{ display:"flex", flexDirection:"column", flex:1, minHeight:0 }}>
      <div style={{ padding:"14px 14px 10px", borderBottom:`1px solid ${D.b0}`, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
          <motion.button whileTap={{scale:0.9}}
            onClick={() => setScreen(mood ? "vibe" : "mood")}
            style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
            <Ic d={G.back} size={18} c={D.sub} />
          </motion.button>
          <p style={{ color:D.text, fontSize:15, fontWeight:700, margin:0 }}>Search</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, background:D.s3,
          border:`1.5px solid ${D.b1}`, borderRadius:14, padding:"10px 14px" }}>
          {searching
            ? <div style={{ width:16, height:16, border:`2px solid ${accent}30`,
                borderTopColor:accent, borderRadius:"50%", animation:"music-spin 0.7s linear infinite", flexShrink:0 }} />
            : <Ic d={G.search} size={16} c={D.dim} />}
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
            placeholder="Artist, song, album…" autoFocus
            style={{ flex:1, background:"none", border:"none", outline:"none",
              color:D.text, fontSize:15, fontFamily:D.sans, caretColor:accent }} />
          {searchQ && (
            <button onClick={() => setSearchQ("")}
              style={{ background:"none", border:"none", color:D.dim, cursor:"pointer" }}>
              <Ic d={G.close} size={16} c={D.dim} />
            </button>
          )}
        </div>
        {searchQ && !searching && searchRes.length > 0 && (
          <p style={{ fontFamily:D.mono, fontSize:9, color:D.dim, margin:"8px 2px 0",
            letterSpacing:"0.08em" }}>
            {searchRes.length} RESULTS · DEEZER + ITUNES · 30s PREVIEWS
          </p>
        )}
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"6px 8px" }}>
        {!searchQ && (
          <div style={{ padding:"32px 16px", textAlign:"center" }}>
            <Ic d={G.search} size={40} c={D.dim} />
            <p style={{ color:D.sub, fontSize:14, margin:"12px 0 4px" }}>Search any artist or song</p>
            <p style={{ color:D.dim, fontSize:11, fontFamily:D.mono }}>Parallel search across Deezer + iTunes</p>
          </div>
        )}
        {searchRes.map(t => (
          <Row key={t.id} track={t} active={track?.id===t.id} playing={playing}
            onPlay={() => playTrack(t)} liked={liked.has(t.id)} onLike={() => toggleLike(t.id)} />
        ))}
        {!searching && searchQ && searchRes.length===0 && (
          <p style={{ color:D.sub, fontSize:13, textAlign:"center", padding:"32px 16px" }}>
            No results for "{searchQ}"
          </p>
        )}
      </div>
    </div>
  );

  // ── FULL PLAYER screen ────────────────────────────────────────────────────
  const FullPlayer = ({ compact }) => (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent: compact ? "flex-start" : "center",
      gap: compact ? 16 : 24,
      padding: compact ? "20px 20px 12px" : "32px 48px",
      flex:1, overflowY:"auto" }}>

      {compact && (
        <div style={{ width:"100%", display:"flex", alignItems:"center", gap:10 }}>
          <motion.button whileTap={{scale:0.9}}
            onClick={() => setScreen(mood ? "vibe" : "mood")}
            style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
            <Ic d={G.back} size={18} c={D.sub} />
          </motion.button>
          <p style={{ color:D.text, fontSize:15, fontWeight:700, margin:0 }}>Now Playing</p>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div key={track?.id || "empty"}
          initial={{ opacity:0, scale:0.9, y:12 }} animate={{ opacity:1, scale:1, y:0 }}
          exit={{ opacity:0, scale:0.93, y:-8 }} transition={{ duration:0.28, ease:[0.4,0,0.2,1] }}>
          <Art src={track?.cover} color={accent} playing={playing && !loading}
            size={compact ? Math.min(w-80, 220) : 260} />
        </motion.div>
      </AnimatePresence>

      <Wave playing={playing && !loading} color={accent} bars={compact?18:26} h={compact?22:28} />

      <div style={{ width:"100%", maxWidth:360, display:"flex", alignItems:"flex-start",
        justifyContent:"space-between", gap:12 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <AnimatePresence mode="wait">
            <motion.h2 key={track?.id} initial={{opacity:0,y:5}} animate={{opacity:1,y:0}}
              exit={{opacity:0,y:-5}} transition={{duration:0.18}}
              style={{ fontSize: compact ? 19 : 22, fontWeight:800, color:D.text,
                margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {loading ? "Loading…" : track?.title || "No track"}
            </motion.h2>
          </AnimatePresence>
          <p style={{ color:D.sub, fontSize:13, margin:"4px 0 0",
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {track?.artist || "—"}{track?.album ? ` · ${track.album}` : ""}
          </p>
          {track && (
            <div style={{ display:"flex", gap:6, marginTop:5, flexWrap:"wrap" }}>
              {!track.isLocal && <span style={{ fontSize:9, fontFamily:D.mono, color:D.sub,
                background:D.b1, borderRadius:4, padding:"2px 6px" }}>30s PREVIEW</span>}
              {track.isLocal && <span style={{ fontSize:9, fontFamily:D.mono, color:"#1DB954",
                background:"rgba(29,185,84,0.12)", borderRadius:4, padding:"2px 6px" }}>FULL SONG</span>}
              {track.aiReason && <span style={{ fontSize:10, color:accent, fontStyle:"italic" }}>{track.aiReason}</span>}
            </div>
          )}
        </div>
        <motion.button whileTap={{scale:1.3}} transition={{type:"spring",stiffness:400}}
          onClick={() => track && toggleLike(track.id)}
          style={{ background:"none", border:"none", cursor:"pointer", padding:6, flexShrink:0 }}>
          <Ic d={G.heart} size={20} c={liked.has(track?.id)?"#F94777":D.sub}
            fill={liked.has(track?.id)?"#F94777":"none"} sw={liked.has(track?.id)?0:1.6} />
        </motion.button>
      </div>

      <div style={{ width:"100%", maxWidth:360 }}>
        <Seek cur={cur} dur={dur} color={accent} onSeek={seek} />
      </div>

      {/* Transport */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        width:"100%", maxWidth:320 }}>
        <motion.button whileTap={{scale:0.85}} onClick={() => setShuffle(s=>!s)}
          style={{ background:"none", border:"none", cursor:"pointer", padding:8,
            color: shuffle ? accent : D.sub }}>
          <Ic d={G.shuf} size={18} c={shuffle ? accent : D.sub} />
        </motion.button>
        <motion.button whileTap={{scale:0.88}} onClick={goPrev}
          style={{ background:"none", border:"none", cursor:"pointer", padding:8 }}>
          <Ic d={G.prev} size={24} c={D.text} />
        </motion.button>

        {/* Big play button */}
        <motion.button whileHover={{scale:1.06}} whileTap={{scale:0.92}}
          onClick={() => setPlaying(p=>!p)}
          style={{ width:68, height:68, borderRadius:"50%", border:"none", cursor:"pointer",
            background:`linear-gradient(135deg,${accent},${accent}aa)`,
            boxShadow:`0 10px 36px ${accent}55`,
            display:"flex", alignItems:"center", justifyContent:"center" }}>
          {loading
            ? <div style={{ width:24, height:24, border:`2px solid rgba(255,255,255,0.3)`,
                borderTopColor:"white", borderRadius:"50%", animation:"music-spin 0.7s linear infinite" }} />
            : <AnimatePresence mode="wait">
                <motion.div key={playing?"pause":"play"}
                  initial={{scale:0.5,opacity:0}} animate={{scale:1,opacity:1}}
                  exit={{scale:0.5,opacity:0}} transition={{duration:0.12}}
                  style={{ marginLeft: playing ? 0 : 3, display:"flex" }}>
                  <Ic d={playing ? G.pause : G.play} size={26} c="white" fill="white" sw={0} />
                </motion.div>
              </AnimatePresence>}
        </motion.button>

        <motion.button whileTap={{scale:0.88}} onClick={() => goNext()}
          style={{ background:"none", border:"none", cursor:"pointer", padding:8 }}>
          <Ic d={G.next} size={24} c={D.text} />
        </motion.button>
        <motion.button whileTap={{scale:0.85}}
          onClick={() => setRepeat(r => r==="none"?"all":r==="all"?"one":"none")}
          style={{ background:"none", border:"none", cursor:"pointer", padding:8,
            color: repeat!=="none" ? accent : D.sub, position:"relative" }}>
          <Ic d={G.rep} size={18} c={repeat!=="none" ? accent : D.sub} />
          {repeat==="one" && <span style={{ position:"absolute", top:0, right:0, fontSize:8,
            fontWeight:800, color:accent }}>1</span>}
        </motion.button>
      </div>

      {/* Volume */}
      <div style={{ width:"100%", maxWidth:320, display:"flex", alignItems:"center", gap:8 }}>
        <button onClick={() => setMuted(m=>!m)}
          style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
          <Ic d={muted||vol===0 ? G.volOff : G.vol} size={16} c={D.sub} />
        </button>
        <div style={{ flex:1, position:"relative", height:3, cursor:"pointer" }}>
          <input type="range" min={0} max={1} step={0.01} value={muted ? 0 : vol}
            onChange={e => { setVol(parseFloat(e.target.value)); setMuted(false); }}
            style={{ position:"absolute", inset:0, width:"100%", height:"100%",
              opacity:0, cursor:"pointer", zIndex:2 }} />
          <div style={{ position:"absolute", inset:0, borderRadius:2, background:D.b1 }} />
          <div style={{ position:"absolute", left:0, top:0, bottom:0, borderRadius:2,
            background:D.b2, width:`${(muted?0:vol)*100}%` }} />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", justifyContent:"center" }}>
        <input ref={fileRef} type="file" accept="audio/*" multiple
          style={{ display:"none" }} onChange={e => handleFiles(e.target.files)} />
        <motion.button whileTap={{scale:0.97}} onClick={() => fileRef.current?.click()}
          style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px",
            borderRadius:20, background:D.s2, border:`1px solid ${D.b1}`,
            color:D.sub, fontSize:12, cursor:"pointer" }}>
          <Ic d={G.upload} size={13} c={D.sub} /> Add local music
        </motion.button>
        <motion.button whileTap={{scale:0.97}} onClick={() => setScreen("mood")}
          style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px",
            borderRadius:20, background:`${accent}15`, border:`1px solid ${accent}35`,
            color:accent, fontSize:12, cursor:"pointer" }}>
          <Ic d={G.spark} size={13} c={accent} fill={accent} sw={0} /> New vibe
        </motion.button>
      </div>

      {!compact && <p style={{ fontFamily:D.mono, fontSize:10, color:D.dim, textAlign:"center" }}>
        Space · ←→ seek · ↑↓ vol · N next · M mute
      </p>}
    </div>
  );

  // ── LAYOUT — responsive 3-column / 2-column / 1-column ───────────────────
  return (
    <AnimatePresence>
      <motion.div key="nova-dj"
        initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        style={{ position:"fixed", inset:0, bottom:"var(--taskbar-height,52px)",
          zIndex:50, display:"flex", flexDirection:"column", overflow:"hidden",
          fontFamily:D.sans, background:grad, transition:"background 1.5s ease" }}>

        <style>{`
          @keyframes music-spin  { to { transform: rotate(360deg); } }
          @keyframes music-pulse { 0%,100%{opacity:0.35} 50%{opacity:0.7} }
          * { -webkit-tap-highlight-color: transparent; }
          ::-webkit-scrollbar { width: 4px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: ${D.b1}; border-radius: 2px; }
        `}</style>

        {/* Top bar */}
        <div style={{ flexShrink:0, display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:`12px ${isMobile?14:20}px`, background:"rgba(7,8,15,0.7)",
          backdropFilter:"blur(24px)", borderBottom:`1px solid ${D.b0}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:10, background:`${accent}18`,
              border:`1px solid ${accent}30`, display:"flex", alignItems:"center",
              justifyContent:"center" }}>
              <Ic d={G.spark} size={16} c={accent} fill={accent} sw={0} />
            </div>
            <div>
              <p style={{ fontSize:14, fontWeight:800, color:D.text, margin:0 }}>Nova DJ</p>
              {mood && <p style={{ fontSize:10, color:accent, margin:0, fontFamily:D.mono,
                letterSpacing:"0.08em", opacity:0.9 }}>
                {mood.emoji} {mood.label.toUpperCase()} · {country.toUpperCase()}
              </p>}
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <motion.button whileTap={{scale:0.9}}
              onClick={() => setScreen("search")}
              style={{ width:36, height:36, borderRadius:11, background: screen==="search" ? `${accent}18` : D.s2,
                border:`1px solid ${screen==="search" ? accent+"33" : D.b0}`,
                display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
              <Ic d={G.search} size={15} c={screen==="search" ? accent : D.sub} />
            </motion.button>
            {!isMobile && (
              <motion.button whileTap={{scale:0.9}}
                onClick={() => setScreen(screen==="player" ? (mood?"vibe":"mood") : "player")}
                style={{ width:36, height:36, borderRadius:11, background: screen==="player" ? `${accent}18` : D.s2,
                  border:`1px solid ${screen==="player" ? accent+"33" : D.b0}`,
                  display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                <Ic d={G.music} size={15} c={screen==="player" ? accent : D.sub} />
              </motion.button>
            )}
            <motion.button whileTap={{scale:0.88}}
              onClick={() => { setPlaying(false); setMusicOpen(false); }}
              style={{ width:36, height:36, borderRadius:"50%", background:D.s2,
                border:`1px solid ${D.b0}`, display:"flex", alignItems:"center",
                justifyContent:"center", cursor:"pointer" }}>
              <Ic d={G.close} size={15} c={D.sub} />
            </motion.button>
          </div>
        </div>

        {/* Main content area */}
        <div style={{ flex:1, display:"flex", overflow:"hidden", minHeight:0 }}>

          {/* DESKTOP: 3-column */}
          {isDesktop && (
            <>
              {/* Left: mood/vibe/search */}
              <div style={{ flex:"0 0 380px", borderRight:`1px solid ${D.b0}`,
                display:"flex", flexDirection:"column", overflow:"hidden" }}>
                <AnimatePresence mode="wait">
                  <motion.div key={screen} initial={{opacity:0,x:-16}} animate={{opacity:1,x:0}}
                    exit={{opacity:0,x:16}} transition={{duration:0.18}}
                    style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
                    {screen === "mood"   && <MoodPicker />}
                    {screen === "vibe"   && <VibeScreen />}
                    {screen === "search" && <SearchScreen />}
                    {screen === "player" && <MoodPicker />}
                  </motion.div>
                </AnimatePresence>
              </div>
              {/* Right: full player */}
              <div style={{ flex:1, display:"flex", flexDirection:"column",
                background:"rgba(7,8,15,0.4)", backdropFilter:"blur(8px)" }}>
                <FullPlayer compact={false} />
              </div>
            </>
          )}

          {/* TABLET: 2-column */}
          {isTablet && (
            <>
              <div style={{ flex:"0 0 320px", borderRight:`1px solid ${D.b0}`,
                display:"flex", flexDirection:"column", overflow:"hidden" }}>
                <AnimatePresence mode="wait">
                  <motion.div key={screen} initial={{opacity:0,x:-12}} animate={{opacity:1,x:0}}
                    exit={{opacity:0,x:12}} transition={{duration:0.18}}
                    style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
                    {(screen==="mood" || screen==="player") && <MoodPicker />}
                    {screen === "vibe"   && <VibeScreen />}
                    {screen === "search" && <SearchScreen />}
                  </motion.div>
                </AnimatePresence>
              </div>
              <div style={{ flex:1, display:"flex", flexDirection:"column",
                background:"rgba(7,8,15,0.4)" }}>
                <FullPlayer compact={false} />
              </div>
            </>
          )}

          {/* MOBILE: single column, screen-based nav */}
          {isMobile && (
            <AnimatePresence mode="wait">
              <motion.div key={screen} initial={{opacity:0, x: screen==="player"?20:-20}}
                animate={{opacity:1,x:0}} exit={{opacity:0, x: screen==="player"?-20:20}}
                transition={{duration:0.2}}
                style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
                {screen === "mood"   && <MoodPicker />}
                {screen === "vibe"   && <VibeScreen />}
                {screen === "search" && <SearchScreen />}
                {screen === "player" && <FullPlayer compact={true} />}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Mini player bar — always visible on mobile when track is playing */}
        {isMobile && screen !== "player" && <MiniBar />}

        {/* Mobile bottom nav */}
        {isMobile && (
          <div style={{ flexShrink:0, display:"flex", background:"rgba(7,8,15,0.9)",
            backdropFilter:"blur(20px)", borderTop:`1px solid ${D.b0}`,
            paddingBottom:"env(safe-area-inset-bottom,0px)" }}>
            {[
              { id:"mood",   icon:G.spark,  label:"Vibe",   fill: accent, sw: 0 },
              { id:"search", icon:G.search, label:"Search" },
              { id:"player", icon:G.music,  label:"Player" },
            ].map(t => {
              const a = screen === t.id;
              return (
                <motion.button key={t.id} whileTap={{scale:0.85}} onClick={() => setScreen(t.id)}
                  style={{ flex:1, padding:"12px 4px 14px", display:"flex", flexDirection:"column",
                    alignItems:"center", gap:4, background:"none", border:"none",
                    cursor:"pointer", position:"relative" }}>
                  {a && <motion.div layoutId="mob-tab"
                    style={{ position:"absolute", top:0, left:"15%", right:"15%",
                      height:2, borderRadius:1, background:accent }} />}
                  <Ic d={t.id==="mood" ? G.spark : t.icon} size={18}
                    c={a ? accent : D.dim}
                    fill={a && t.id==="mood" ? accent : "none"}
                    sw={a && t.id==="mood" ? 0 : 1.6} />
                  <span style={{ fontSize:9, fontWeight: a?700:500, color: a?accent:D.dim,
                    fontFamily:D.mono, letterSpacing:"0.04em" }}>
                    {t.label.toUpperCase()}
                  </span>
                </motion.button>
              );
            })}
          </div>
        )}

        <audio ref={audioRef} preload="metadata" crossOrigin="anonymous" />
      </motion.div>
    </AnimatePresence>
  );
};

export default MusicApp;