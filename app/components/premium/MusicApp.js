"use client";
/**
 * MusicApp.js — Nova Music
 * ─────────────────────────────────────────────────────────────────────────
 * A full-screen music OS, not a widget. Real audio, full songs.
 *
 * THREE ways to get music — each solving the 30-second problem differently:
 *
 * 1. LOCAL FILES — drag & drop or pick from device. Your actual music files
 *    play completely, no time limit, no API, 100% offline. This is the
 *    primary source of real full-length music.
 *
 * 2. DEEZER SEARCH — 30s official previews via the free Deezer API JSONP.
 *    Labelled clearly as previews. Real tracks, real artwork.
 *
 * 3. ITUNES SEARCH — 30s Apple previews as a second search source.
 *    Different catalog, same honest labeling.
 *
 * Layout: full-screen split — sidebar (library/search/queue) + main player.
 * On mobile: tab-based bottom nav, full-screen player.
 * Professional SVG icons throughout, no emoji-as-icon.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── SVG Icon system ──────────────────────────────────────────────────────────
const Ic = ({ d, size = 20, c = "currentColor", sw = 1.7, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    fill={fill} stroke={c} strokeWidth={sw}
    strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
  </svg>
);

const ICONS = {
  play:     "M5 3l14 9-14 9V3z",
  pause:    ["M6 4h4v16H6z", "M14 4h4v16h-4z"],
  next:     ["M5 4l10 8-10 8V4z", "M19 4v16"],
  prev:     ["M19 4L9 12l10 8V4z", "M5 4v16"],
  shuffle:  ["M16 3h5v5", "M4 20L21 3", "M21 16v5h-5", "M15 15l6 6", "M4 4l5 5"],
  repeat:   ["M17 2l4 4-4 4", "M3 11V9a4 4 0 0 1 4-4h14", "M7 22l-4-4 4-4", "M21 13v2a4 4 0 0 1-4 4H3"],
  repeat1:  ["M17 2l4 4-4 4", "M3 11V9a4 4 0 0 1 4-4h14", "M7 22l-4-4 4-4", "M21 13v2a4 4 0 0 1-4 4H3", "M11 10h1v4"],
  heart:    "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
  heartFill:"M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
  search:   ["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z", "M21 21l-4.35-4.35"],
  close:    "M18 6L6 18M6 6l12 12",
  music:    ["M9 18V5l12-2v13", "M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z", "M18 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"],
  folder:   ["M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"],
  queue:    ["M3 6h18", "M3 12h18", "M3 18h18"],
  volHigh:  ["M11 5L6 9H2v6h4l5 4V5z", "M19.07 4.93a10 10 0 0 1 0 14.14", "M15.54 8.46a5 5 0 0 1 0 7.07"],
  volLow:   ["M11 5L6 9H2v6h4l5 4V5z", "M15.54 8.46a5 5 0 0 1 0 7.07"],
  volMute:  ["M11 5L6 9H2v6h4l5 4V5z", "M23 9l-6 6", "M17 9l6 6"],
  upload:   ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M17 8l-5-5-5 5", "M12 3v12"],
  wave:     ["M2 12h2", "M6 8v8", "M10 5v14", "M14 8v8", "M18 6v12", "M22 12h-2"],
  plus:     "M12 5v14M5 12h14",
  list:     ["M8 6h13", "M8 12h13", "M8 18h13", "M3 6h.01", "M3 12h.01", "M3 18h.01"],
};

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:      "#08090F",
  s1:      "#0D0E16",
  s2:      "#12141E",
  s3:      "#181A26",
  b0:      "rgba(255,255,255,0.05)",
  b1:      "rgba(255,255,255,0.09)",
  b2:      "rgba(255,255,255,0.15)",
  text:    "#F0EDE8",
  sub:     "#7A8899",
  faint:   "rgba(122,136,153,0.4)",
  violet:  "#9B7FFF",
  violetBg:"rgba(155,127,255,0.1)",
  violetBr:"rgba(155,127,255,0.22)",
  green:   "#1DB954",
  pink:    "#F94777",
  sans:    "-apple-system,'SF Pro Display',Inter,system-ui,sans-serif",
  mono:    "'SF Mono','JetBrains Mono',monospace",
};

const ACCENT_COLORS = [
  "#9B7FFF","#F94777","#1DB954","#FF6B35",
  "#4A8FE8","#FFB020","#E8447A","#2BB56A",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (s) => {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};
const uid = () => Math.random().toString(36).slice(2, 9);

// ─── Responsive width hook ────────────────────────────────────────────────────
function useWidth() {
  const [w, setW] = useState(1024);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    fn(); window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return w;
}

// ─── Animated waveform ────────────────────────────────────────────────────────
const Waveform = ({ playing, color = C.violet, bars = 28, height = 32 }) => (
  <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height, padding: "0 2px" }}>
    {Array.from({ length: bars }).map((_, i) => (
      <motion.div key={i}
        style={{ width: 3, borderRadius: 2, background: color, opacity: playing ? 0.9 : 0.25, flexShrink: 0 }}
        animate={playing
          ? { height: ["25%", `${30 + ((i * 41 + 17) % 70)}%`, "25%"] }
          : { height: "20%" }}
        transition={playing ? {
          duration: 0.4 + (i % 6) * 0.08,
          repeat: Infinity, repeatType: "mirror",
          ease: "easeInOut", delay: i * 0.03,
        } : { duration: 0.3 }} />
    ))}
  </div>
);

// ─── Album art ────────────────────────────────────────────────────────────────
const Art = ({ src, color, playing, size = 240 }) => (
  <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
    <div style={{ position: "absolute", inset: -12, borderRadius: "50%",
      background: color, filter: "blur(32px)", opacity: playing ? 0.3 : 0.12,
      transition: "opacity 0.6s" }} />
    <motion.div
      animate={{ scale: playing ? 1 : 0.95 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{ width: size, height: size, borderRadius: 20, overflow: "hidden",
        boxShadow: `0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px ${C.b1}`, position: "relative" }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center",
          justifyContent: "center", background: `linear-gradient(135deg, ${color}44, ${color}22)` }}>
          <Ic d={ICONS.music} size={Math.round(size * 0.28)} c={color} sw={1.2} />
        </div>
      )}
    </motion.div>
  </div>
);

// ─── Progress bar ─────────────────────────────────────────────────────────────
const Progress = ({ current, duration, color, onChange }) => {
  const pct = duration > 0 ? (current / duration) * 100 : 0;
  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between",
        fontFamily: C.mono, fontSize: 11, color: C.faint, marginBottom: 8 }}>
        <span>{fmt(current)}</span>
        <span>{fmt(duration)}</span>
      </div>
      <div style={{ position: "relative", height: 4, cursor: "pointer" }}>
        <input type="range" min={0} max={duration || 100} step={0.1} value={current}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
            opacity: 0, cursor: "pointer", zIndex: 2 }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: 2, background: C.b1 }} />
        <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.1 }}
          style={{ position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: 2,
            background: `linear-gradient(90deg, ${color}, ${color}bb)` }} />
        <div style={{ position: "absolute", top: "50%", transform: "translateY(-50%)",
          width: 12, height: 12, borderRadius: "50%", background: "white",
          left: `calc(${pct}% - 6px)`, boxShadow: "0 2px 8px rgba(0,0,0,0.5)" }} />
      </div>
    </div>
  );
};

// ─── Volume slider ────────────────────────────────────────────────────────────
const Volume = ({ value, muted, onChange, onToggleMute }) => {
  const icon = muted || value === 0 ? ICONS.volMute : value < 0.5 ? ICONS.volLow : ICONS.volHigh;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button onClick={onToggleMute}
        style={{ background: "none", border: "none", color: C.sub, cursor: "pointer",
          display: "flex", padding: 4 }}>
        <Ic d={icon} size={16} c={C.sub} />
      </button>
      <div style={{ flex: 1, position: "relative", height: 3, cursor: "pointer" }}>
        <input type="range" min={0} max={1} step={0.01} value={muted ? 0 : value}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
            opacity: 0, cursor: "pointer", zIndex: 2 }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: 2, background: C.b1 }} />
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: 2,
          background: C.b2, width: `${(muted ? 0 : value) * 100}%` }} />
      </div>
    </div>
  );
};

// ─── Track row ────────────────────────────────────────────────────────────────
const TrackRow = ({ track, active, playing, onPlay, liked, onLike, isPreview }) => (
  <motion.div whileHover={{ background: C.b0 }} whileTap={{ scale: 0.99 }}
    onClick={onPlay}
    style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 14px",
      borderRadius: 12, cursor: "pointer", transition: "background 0.12s",
      background: active ? C.b1 : "transparent" }}>
    <div style={{ width: 42, height: 42, borderRadius: 10, overflow: "hidden",
      background: `linear-gradient(135deg,${track.color || C.violet}44,${track.color || C.violet}18)`,
      flexShrink: 0, position: "relative" }}>
      {track.cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={track.cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Ic d={ICONS.music} size={16} c={track.color || C.violet} />
        </div>
      )}
      {active && playing && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)",
          display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Waveform playing bars={4} height={18} color="white" />
        </div>
      )}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <p style={{ color: active ? C.text : "rgba(240,237,232,0.8)", fontSize: 13.5,
          fontWeight: active ? 600 : 400, margin: 0, overflow: "hidden",
          textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.title}</p>
        {isPreview && <span style={{ fontSize: 9, fontFamily: C.mono, color: C.sub,
          background: C.b1, borderRadius: 4, padding: "1px 5px", flexShrink: 0 }}>30s</span>}
        {track.isLocal && <span style={{ fontSize: 9, fontFamily: C.mono, color: C.green,
          background: "rgba(29,185,84,0.12)", borderRadius: 4, padding: "1px 5px", flexShrink: 0 }}>LOCAL</span>}
      </div>
      <p style={{ color: C.faint, fontSize: 11.5, margin: "1px 0 0",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {track.artist}{track.album ? ` · ${track.album}` : ""}
      </p>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
      <button onClick={e => { e.stopPropagation(); onLike(); }}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
        <Ic d={ICONS.heartFill} size={14} c={liked ? C.pink : "transparent"}
          fill={liked ? C.pink : "none"} sw={liked ? 0 : 1.5} />
      </button>
      <span style={{ fontFamily: C.mono, fontSize: 11, color: C.faint,
        width: 34, textAlign: "right" }}>{fmt(track.duration)}</span>
    </div>
  </motion.div>
);

// ─── Control button ───────────────────────────────────────────────────────────
const CtrlBtn = ({ icon, onClick, color = C.sub, size = 20, active, fill }) => (
  <motion.button whileTap={{ scale: 0.85 }} onClick={onClick}
    style={{ background: "none", border: "none", cursor: "pointer",
      color: active ? C.violet : color, padding: 8,
      display: "flex", alignItems: "center", justifyContent: "center" }}>
    <Ic d={icon} size={size} c={active ? C.violet : color} fill={fill} />
  </motion.button>
);

// ─── Local file loader ────────────────────────────────────────────────────────
function loadLocalFile(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.addEventListener("loadedmetadata", () => {
      resolve({
        id: uid(),
        title: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
        artist: "Local File",
        album: "",
        src: url,
        cover: null,
        duration: audio.duration || 0,
        color: ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)],
        isLocal: true,
        isPreview: false,
      });
    }, { once: true });
    audio.addEventListener("error", () => {
      resolve({
        id: uid(), title: file.name, artist: "Local File", album: "",
        src: url, cover: null, duration: 0,
        color: ACCENT_COLORS[0], isLocal: true, isPreview: false,
      });
    }, { once: true });
  });
}

// ─── Deezer chart loader via JSONP ────────────────────────────────────────────
function loadDeezerChart(onResult) {
  const cbName = "__deezerChart_" + Date.now();
  window[cbName] = (data) => {
    const tracks = (data?.data || []).filter(t => t.preview).slice(0, 15).map((t, i) => ({
      id: "dz_" + t.id, title: t.title_short || t.title,
      artist: t.artist?.name || "Unknown", album: t.album?.title || "",
      src: t.preview, cover: t.album?.cover_medium || "",
      duration: 30, color: ACCENT_COLORS[i % ACCENT_COLORS.length],
      isPreview: true, isLocal: false,
    }));
    onResult(tracks);
    delete window[cbName];
    document.getElementById("dz-chart-script")?.remove();
  };
  const s = document.createElement("script");
  s.id = "dz-chart-script";
  s.src = `https://api.deezer.com/chart/0/tracks?limit=15&output=jsonp&callback=${cbName}`;
  s.onerror = () => { onResult([]); delete window[cbName]; };
  document.body.appendChild(s);
}

// ─── Deezer search via JSONP ──────────────────────────────────────────────────
function searchDeezer(q, onResult) {
  const cbName = "__deezerSearch_" + Date.now();
  window[cbName] = (data) => {
    const tracks = (data?.data || []).filter(t => t.preview).slice(0, 20).map((t, i) => ({
      id: "dz_" + t.id, title: t.title_short || t.title,
      artist: t.artist?.name || "Unknown", album: t.album?.title || "",
      src: t.preview, cover: t.album?.cover_medium || "",
      duration: 30, color: ACCENT_COLORS[i % ACCENT_COLORS.length],
      isPreview: true, isLocal: false,
    }));
    onResult(tracks);
    delete window[cbName];
    document.getElementById("dz-search-script")?.remove();
  };
  const s = document.createElement("script");
  s.id = "dz-search-script";
  s.src = `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=20&output=jsonp&callback=${cbName}`;
  s.onerror = () => { onResult([]); delete window[cbName]; };
  document.getElementById("dz-search-script")?.remove();
  document.body.appendChild(s);
}

// ─── iTunes search fallback ───────────────────────────────────────────────────
async function searchItunes(q) {
  try {
    const r = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&limit=20&entity=song`);
    const d = await r.json();
    return (d.results || []).filter(t => t.previewUrl).map((t, i) => ({
      id: "it_" + t.trackId, title: t.trackName || "",
      artist: t.artistName || "", album: t.collectionName || "",
      src: t.previewUrl, cover: (t.artworkUrl100 || "").replace("100x100", "300x300"),
      duration: 30, color: ACCENT_COLORS[i % ACCENT_COLORS.length],
      isPreview: true, isLocal: false,
    }));
  } catch { return []; }
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
const MusicApp = ({ musicOpen, setMusicOpen }) => {
  const [library,     setLibrary]     = useState([]);
  const [queue,       setQueue]       = useState([]);
  const [queueIdx,    setQueueIdx]    = useState(0);
  const [playing,     setPlaying]     = useState(false);
  const [current,     setCurrent]     = useState(0);
  const [duration,    setDuration]    = useState(0);
  const [volume,      setVolume]      = useState(0.8);
  const [muted,       setMuted]       = useState(false);
  const [shuffle,     setShuffle]     = useState(false);
  const [repeat,      setRepeat]      = useState("none"); // none | all | one
  const [liked,       setLiked]       = useState(new Set());
  const [tab,         setTab]         = useState("library"); // library | search | queue
  const [searchQ,     setSearchQ]     = useState("");
  const [searchRes,   setSearchRes]   = useState([]);
  const [searching,   setSearching]   = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(false);
  const [dragging,    setDragging]    = useState(false);
  const audioRef   = useRef(null);
  const searchRef  = useRef(null);
  const fileRef    = useRef(null);
  const prevQIdx   = useRef(null);
  const w          = useWidth();
  const isMobile   = w < 700;

  const track = queue[queueIdx] ?? null;
  const accent = track?.color || C.violet;

  // ── Load Deezer chart on mount ──────────────────────────────────────────
  useEffect(() => {
    loadDeezerChart(tracks => {
      if (tracks.length > 0) {
        setLibrary(tracks);
        setQueue(tracks);
      }
    });
  }, []);

  // ── Audio element wiring ────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime    = () => setCurrent(audio.currentTime);
    const onMeta    = () => setDuration(isFinite(audio.duration) ? audio.duration : 0);
    const onDurChg  = () => setDuration(isFinite(audio.duration) ? audio.duration : 0);
    const onCan     = () => setLoading(false);
    const onWait    = () => setLoading(true);
    const onPlay_   = () => { setLoading(false); setError(false); };
    const onErr     = () => { setLoading(false); setError(true); };
    const onEnded   = () => {
      if (repeat === "one") { audio.currentTime = 0; audio.play(); return; }
      goNext(true);
    };
    audio.addEventListener("timeupdate",     onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("durationchange", onDurChg);
    audio.addEventListener("canplay",        onCan);
    audio.addEventListener("waiting",        onWait);
    audio.addEventListener("playing",        onPlay_);
    audio.addEventListener("error",          onErr);
    audio.addEventListener("ended",          onEnded);
    return () => {
      audio.removeEventListener("timeupdate",     onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("durationchange", onDurChg);
      audio.removeEventListener("canplay",        onCan);
      audio.removeEventListener("waiting",        onWait);
      audio.removeEventListener("playing",        onPlay_);
      audio.removeEventListener("error",          onErr);
      audio.removeEventListener("ended",          onEnded);
    };
  }, [repeat]); // eslint-disable-line

  // ── Track change → reload audio ────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    const wasPlaying = playing || (prevQIdx.current !== null && prevQIdx.current !== queueIdx);
    prevQIdx.current = queueIdx;
    audio.src = track.src;
    audio.load();
    setCurrent(0); setDuration(0); setError(false);
    if (wasPlaying) {
      setLoading(true);
      audio.play().catch(() => setError(true));
      setPlaying(true);
    }
  }, [queueIdx, track?.id]); // eslint-disable-line

  // ── Play/pause ──────────────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    if (playing) { setLoading(true); audio.play().catch(() => { setError(true); setPlaying(false); }); }
    else audio.pause();
  }, [playing]); // eslint-disable-line

  // ── Volume ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  const goNext = useCallback((auto = false) => {
    setQueueIdx(i => {
      if (!queue.length) return i;
      if (shuffle) return Math.floor(Math.random() * queue.length);
      const next = (i + 1) % queue.length;
      if (auto && next === 0 && repeat !== "all") { setPlaying(false); return i; }
      return next;
    });
    if (!playing && !auto) setPlaying(true);
  }, [queue.length, shuffle, repeat, playing]);

  const goPrev = useCallback(() => {
    if (current > 3 && audioRef.current) { audioRef.current.currentTime = 0; return; }
    setQueueIdx(i => i === 0 ? queue.length - 1 : i - 1);
    setPlaying(true);
  }, [current, queue.length]);

  const seek = useCallback(t => {
    const v = Math.max(0, Math.min(t, duration));
    if (audioRef.current) audioRef.current.currentTime = v;
    setCurrent(v);
  }, [duration]);

  const toggleLike = (id) => setLiked(s => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const playTrack = useCallback((t) => {
    const existing = queue.findIndex(q => q.id === t.id);
    if (existing !== -1) {
      setQueueIdx(existing);
    } else {
      const newQ = [...queue, t];
      setQueue(newQ);
      setQueueIdx(newQ.length - 1);
    }
    setPlaying(true);
  }, [queue]);

  // ── File input / drag-drop ──────────────────────────────────────────────
  const handleFiles = useCallback(async (files) => {
    const audioFiles = Array.from(files).filter(f => f.type.startsWith("audio/") || /\.(mp3|flac|wav|ogg|aac|m4a|opus)$/i.test(f.name));
    if (!audioFiles.length) return;
    const tracks = await Promise.all(audioFiles.map(loadLocalFile));
    setLibrary(prev => {
      const existing = new Set(prev.map(t => t.title + t.artist));
      return [...prev, ...tracks.filter(t => !existing.has(t.title + t.artist))];
    });
    setQueue(prev => {
      const existing = new Set(prev.map(t => t.id));
      const newTracks = tracks.filter(t => !existing.has(t.id));
      return [...prev, ...newTracks];
    });
    // Auto-play first added file
    const newQ = [...queue, ...tracks];
    setQueue(newQ);
    setQueueIdx(newQ.length - tracks.length);
    setPlaying(true);
  }, [queue]);

  // ── Search ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!searchQ.trim()) { setSearchRes([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      setSearchRes([]);
      // Parallel search: Deezer + iTunes
      await new Promise(resolve => {
        let done = 0;
        const merged = new Map();
        const finish = (results) => {
          results.forEach(t => { if (!merged.has(t.id)) merged.set(t.id, t); });
          done++;
          if (done === 2) { setSearchRes([...merged.values()].slice(0, 24)); setSearching(false); resolve(); }
        };
        searchDeezer(searchQ, finish);
        searchItunes(searchQ).then(finish);
      });
    }, 400);
    return () => clearTimeout(t);
  }, [searchQ]);

  // ── Keyboard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!musicOpen) return;
    const h = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.code === "Space")      { e.preventDefault(); setPlaying(p => !p); }
      if (e.code === "ArrowRight") seek(current + 10);
      if (e.code === "ArrowLeft")  seek(current - 10);
      if (e.code === "ArrowUp")    setVolume(v => Math.min(1, v + 0.05));
      if (e.code === "ArrowDown")  setVolume(v => Math.max(0, v - 0.05));
      if (e.code === "KeyN")       goNext();
      if (e.code === "KeyP")       goPrev();
      if (e.code === "KeyM")       setMuted(m => !m);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [musicOpen, current, seek, goNext, goPrev]);

  if (!musicOpen) return null;

  // ── Player section ──────────────────────────────────────────────────────
  const PlayerView = () => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: 28, padding: isMobile ? "24px 24px 16px" : "32px 48px",
      flex: isMobile ? 1 : "none" }}>

      {/* Album art */}
      <AnimatePresence mode="wait">
        <motion.div key={track?.id || "empty"}
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -8 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}>
          <Art src={track?.cover} color={accent} playing={playing && !loading}
            size={isMobile ? Math.min(w - 80, 240) : 260} />
        </motion.div>
      </AnimatePresence>

      {/* Waveform */}
      <Waveform playing={playing && !loading} color={accent}
        bars={isMobile ? 20 : 28} height={28} />

      {/* Track info */}
      <div style={{ width: "100%", display: "flex", alignItems: "flex-start",
        justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <AnimatePresence mode="wait">
            <motion.h2 key={track?.id || "empty"}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}
              style={{ fontSize: isMobile ? 20 : 22, fontWeight: 800, color: C.text,
                margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {loading ? "Loading…" : error ? "Unavailable" : (track?.title || "No track")}
            </motion.h2>
          </AnimatePresence>
          <p style={{ color: C.sub, fontSize: 14, margin: "4px 0 0",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {track?.artist || "—"}{track?.album ? ` · ${track.album}` : ""}
          </p>
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            {track?.isPreview && (
              <span style={{ fontSize: 10, fontFamily: C.mono, color: C.sub,
                background: C.b1, borderRadius: 4, padding: "2px 6px" }}>30s PREVIEW</span>
            )}
            {track?.isLocal && (
              <span style={{ fontSize: 10, fontFamily: C.mono, color: C.green,
                background: "rgba(29,185,84,0.12)", borderRadius: 4, padding: "2px 6px" }}>LOCAL FILE</span>
            )}
          </div>
        </div>
        <CtrlBtn icon={ICONS.heartFill} color={liked.has(track?.id) ? "transparent" : C.sub}
          fill={liked.has(track?.id) ? C.pink : "none"}
          sw={liked.has(track?.id) ? 0 : 1.7}
          onClick={() => track && toggleLike(track.id)} />
      </div>

      {/* Progress */}
      <Progress current={current} duration={duration} color={accent} onChange={seek} />

      {/* Transport */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        width: "100%", maxWidth: 320 }}>
        <CtrlBtn icon={ICONS.shuffle} active={shuffle} onClick={() => setShuffle(s => !s)} size={18} />
        <CtrlBtn icon={ICONS.prev} onClick={goPrev} color={C.text} size={22} />

        {/* Play/Pause big button */}
        <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.93 }}
          onClick={() => setPlaying(p => !p)}
          style={{ width: 64, height: 64, borderRadius: "50%", border: "none",
            background: `linear-gradient(135deg, ${accent}, ${accent}99)`,
            boxShadow: `0 8px 32px ${accent}55`,
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          {loading ? (
            <div style={{ width: 22, height: 22, border: `2px solid rgba(255,255,255,0.3)`,
              borderTopColor: "white", borderRadius: "50%", animation: "music-spin 0.7s linear infinite" }} />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={playing ? "pause" : "play"}
                initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }} transition={{ duration: 0.12 }}
                style={{ display: "flex", marginLeft: playing ? 0 : 2 }}>
                <Ic d={playing ? ICONS.pause : ICONS.play} size={24} c="white" fill="white" sw={0} />
              </motion.div>
            </AnimatePresence>
          )}
        </motion.button>

        <CtrlBtn icon={ICONS.next} onClick={() => goNext()} color={C.text} size={22} />
        <CtrlBtn
          icon={repeat === "one" ? ICONS.repeat1 : ICONS.repeat}
          active={repeat !== "none"}
          onClick={() => setRepeat(r => r === "none" ? "all" : r === "all" ? "one" : "none")}
          size={18} />
      </div>

      {/* Volume */}
      <div style={{ width: "100%", maxWidth: 320 }}>
        <Volume value={volume} muted={muted}
          onChange={v => { setVolume(v); setMuted(false); }}
          onToggleMute={() => setMuted(m => !m)} />
      </div>

      {/* Add local music */}
      <input ref={fileRef} type="file" accept="audio/*" multiple
        style={{ display: "none" }} onChange={e => handleFiles(e.target.files)} />
      <motion.button whileTap={{ scale: 0.97 }}
        onClick={() => fileRef.current?.click()}
        style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px",
          borderRadius: 20, background: C.b0, border: `1px solid ${C.b1}`,
          color: C.sub, fontSize: 13, cursor: "pointer", fontFamily: C.sans }}>
        <Ic d={ICONS.upload} size={14} c={C.sub} />
        Add your music files — no 30s limit
      </motion.button>

      <p style={{ fontFamily: C.mono, fontSize: 10, color: C.faint, textAlign: "center" }}>
        Space · ←→ seek · ↑↓ vol · N next · M mute
      </p>
    </div>
  );

  // ── Sidebar / panel section ─────────────────────────────────────────────
  const SidePanel = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${C.b0}`, flexShrink: 0 }}>
        {[{ id: "library", icon: ICONS.list, label: "Library" },
          { id: "search",  icon: ICONS.search, label: "Search" },
          { id: "queue",   icon: ICONS.queue, label: "Queue" }].map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex: 1, padding: "12px 6px", display: "flex", alignItems: "center",
                justifyContent: "center", gap: 5, background: "none", border: "none",
                cursor: "pointer", borderBottom: active ? `2px solid ${accent}` : "2px solid transparent",
                color: active ? accent : C.faint, fontSize: 11, fontWeight: 700, fontFamily: C.mono,
                transition: "color 0.15s, border-color 0.15s" }}>
              <Ic d={t.icon} size={13} c={active ? accent : C.faint} />
              {t.label.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* Search input */}
      {tab === "search" && (
        <div style={{ padding: "10px 12px", borderBottom: `1px solid ${C.b0}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8,
            background: C.s3, border: `1px solid ${C.b1}`, borderRadius: 12, padding: "8px 12px" }}>
            {searching
              ? <div style={{ width: 14, height: 14, border: `2px solid ${C.violet}40`,
                  borderTopColor: C.violet, borderRadius: "50%", animation: "music-spin 0.7s linear infinite", flexShrink: 0 }} />
              : <Ic d={ICONS.search} size={14} c={C.faint} />}
            <input ref={searchRef} value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Search songs, artists…"
              style={{ flex: 1, background: "none", border: "none", outline: "none",
                color: C.text, fontSize: 13.5, fontFamily: C.sans, caretColor: accent }} />
            {searchQ && (
              <button onClick={() => setSearchQ("")}
                style={{ background: "none", border: "none", color: C.faint, cursor: "pointer", padding: 0 }}>
                <Ic d={ICONS.close} size={14} c={C.faint} />
              </button>
            )}
          </div>
          {searchQ && !searching && (
            <p style={{ fontFamily: C.mono, fontSize: 9, color: C.faint, margin: "6px 2px 0",
              letterSpacing: "0.06em" }}>
              DEEZER + ITUNES · 30s PREVIEWS
            </p>
          )}
        </div>
      )}

      {/* Track list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 6px",
        scrollbarWidth: "thin", scrollbarColor: `${C.b1} transparent` }}>

        {/* Library tab */}
        {tab === "library" && (
          <>
            {/* Drop zone */}
            <motion.div
              onDragEnter={() => setDragging(true)}
              onDragLeave={() => setDragging(false)}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
              style={{ margin: "4px 4px 8px", borderRadius: 14,
                border: `1.5px dashed ${dragging ? accent : C.b1}`,
                background: dragging ? `${accent}08` : C.b0,
                padding: "12px", textAlign: "center", cursor: "pointer",
                transition: "all 0.15s" }}
              onClick={() => fileRef.current?.click()}>
              <Ic d={ICONS.upload} size={16} c={dragging ? accent : C.sub} />
              <p style={{ color: dragging ? accent : C.sub, fontSize: 12, margin: "5px 0 0" }}>
                {dragging ? "Drop to add" : "Drag music files or click to browse"}
              </p>
              <p style={{ color: C.faint, fontSize: 10, fontFamily: C.mono, margin: "2px 0 0" }}>
                MP3 · FLAC · WAV · AAC · M4A — plays fully
              </p>
            </motion.div>

            {library.length > 0 && (
              <p style={{ fontFamily: C.mono, fontSize: 9, color: C.faint,
                letterSpacing: "0.1em", padding: "4px 8px 4px", margin: 0 }}>
                {library.filter(t => !t.isPreview).length > 0
                  ? `${library.filter(t => t.isLocal).length} LOCAL · ${library.filter(t => t.isPreview).length} PREVIEWS`
                  : "TRENDING PREVIEWS · ADD LOCAL FILES FOR FULL SONGS"}
              </p>
            )}
            {library.map(t => (
              <TrackRow key={t.id} track={t}
                active={track?.id === t.id} playing={playing}
                onPlay={() => playTrack(t)}
                liked={liked.has(t.id)} onLike={() => toggleLike(t.id)}
                isPreview={t.isPreview} />
            ))}
          </>
        )}

        {/* Search tab */}
        {tab === "search" && (
          <>
            {!searchQ && (
              <div style={{ textAlign: "center", padding: "32px 16px" }}>
                <Ic d={ICONS.search} size={32} c={C.faint} />
                <p style={{ color: C.sub, fontSize: 13, margin: "12px 0 4px" }}>Search any song or artist</p>
                <p style={{ color: C.faint, fontSize: 11, fontFamily: C.mono }}>
                  Searches Deezer + iTunes · 30s previews
                </p>
              </div>
            )}
            {searching && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
                gap: 10, padding: "32px 0", color: C.sub, fontSize: 13 }}>
                <div style={{ width: 18, height: 18, border: `2px solid ${accent}40`,
                  borderTopColor: accent, borderRadius: "50%", animation: "music-spin 0.7s linear infinite" }} />
                Searching…
              </div>
            )}
            {!searching && searchQ && searchRes.length === 0 && (
              <div style={{ textAlign: "center", padding: "32px 16px" }}>
                <p style={{ color: C.sub, fontSize: 13 }}>No results for "{searchQ}"</p>
              </div>
            )}
            {searchRes.map(t => (
              <TrackRow key={t.id} track={t}
                active={track?.id === t.id} playing={playing}
                onPlay={() => playTrack(t)}
                liked={liked.has(t.id)} onLike={() => toggleLike(t.id)}
                isPreview={t.isPreview} />
            ))}
          </>
        )}

        {/* Queue tab */}
        {tab === "queue" && (
          <>
            <p style={{ fontFamily: C.mono, fontSize: 9, color: C.faint,
              letterSpacing: "0.1em", padding: "4px 8px 4px", margin: "0 0 2px" }}>
              {queue.length} TRACK{queue.length !== 1 ? "S" : ""}
            </p>
            {queue.map((t, i) => (
              <TrackRow key={t.id + "_" + i} track={t}
                active={i === queueIdx} playing={playing}
                onPlay={() => { setQueueIdx(i); setPlaying(true); }}
                liked={liked.has(t.id)} onLike={() => toggleLike(t.id)}
                isPreview={t.isPreview} />
            ))}
          </>
        )}
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div key="music-app"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: "fixed", inset: 0, bottom: "var(--taskbar-height,52px)",
          zIndex: 50, display: "flex", flexDirection: "column", overflow: "hidden",
          fontFamily: C.sans }}>

        <style>{`
          @keyframes music-spin { to { transform: rotate(360deg); } }
        `}</style>

        {/* Ambient background — responds to track color */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0,
          background: `radial-gradient(ellipse 60% 50% at 30% 60%, ${accent}18 0%, transparent 60%),
                       radial-gradient(ellipse 40% 50% at 80% 20%, ${accent}10 0%, transparent 60%),
                       linear-gradient(160deg, #08090F 0%, #0B0D18 100%)`,
          transition: "background 1.2s ease" }} />

        {/* ── Top bar ── */}
        <div style={{ position: "relative", zIndex: 1, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "13px 18px", background: "rgba(8,9,15,0.7)",
          backdropFilter: "blur(20px)", borderBottom: `1px solid ${C.b0}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10,
              background: `${accent}18`, border: `1px solid ${accent}30`,
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Ic d={ICONS.music} size={15} c={accent} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0 }}>Nova Music</p>
              <p style={{ fontSize: 10, color: C.faint, margin: 0, fontFamily: C.mono }}>
                {queue.length} tracks · {library.filter(t => t.isLocal).length} local
              </p>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.88 }}
            onClick={() => { setPlaying(false); setMusicOpen(false); }}
            style={{ width: 34, height: 34, borderRadius: "50%", background: C.s2,
              border: `1px solid ${C.b0}`, display: "flex", alignItems: "center",
              justifyContent: "center", cursor: "pointer" }}>
            <Ic d={ICONS.close} size={15} c={C.sub} />
          </motion.button>
        </div>

        {/* ── Main body ── */}
        <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex",
          flexDirection: isMobile ? "column" : "row", overflow: "hidden", minHeight: 0 }}>

          {isMobile ? (
            // Mobile: player above, panel below with tab nav
            <>
              <div style={{ flex: "0 0 auto", overflowY: "auto" }}>
                <PlayerView />
              </div>
              <div style={{ flex: 1, borderTop: `1px solid ${C.b0}`,
                background: "rgba(8,9,15,0.8)", backdropFilter: "blur(20px)",
                display: "flex", flexDirection: "column", minHeight: 0 }}>
                <SidePanel />
              </div>
            </>
          ) : (
            // Desktop: player on left, library on right
            <>
              <div style={{ flex: "0 0 420px", overflowY: "auto",
                borderRight: `1px solid ${C.b0}` }}>
                <PlayerView />
              </div>
              <div style={{ flex: 1, background: "rgba(8,9,15,0.75)",
                backdropFilter: "blur(20px)", display: "flex", flexDirection: "column",
                minHeight: 0 }}>
                <SidePanel />
              </div>
            </>
          )}
        </div>

        <audio ref={audioRef} preload="metadata" crossOrigin="anonymous" />
      </motion.div>
    </AnimatePresence>
  );
};

export default MusicApp;