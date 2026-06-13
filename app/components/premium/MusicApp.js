"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPlay, FaPause, FaStepForward, FaStepBackward,
  FaRandom, FaRedo, FaVolumeUp, FaVolumeMute, FaVolumeDown,
  FaHeart, FaRegHeart, FaSearch,
} from "react-icons/fa";
import { MdClose, MdQueueMusic, MdOutlineQueueMusic } from "react-icons/md";
import { TbWaveSine, TbMusicSearch } from "react-icons/tb";
import { ImSpinner8 } from "react-icons/im";

// ─── Fallback tracks (Deezer 30s previews) ───────────────────────────────────
const FALLBACK_TRACKS = [
  { id: 1, title: "Blinding Lights",   artist: "The Weeknd",           album: "After Hours",       duration: 30, color: "#c0392b",
    src: "https://cdns-preview-d.dzcdn.net/stream/c-ddd852e2c547f83c3a7d62fd9a3e4c7a-5.mp3",
    cover: "https://e-cdns-images.dzcdn.net/images/cover/2e018122cb56986277102d2041a592c8/500x500-000000-80-0-0.jpg" },
  { id: 2, title: "Levitating",        artist: "Dua Lipa",             album: "Future Nostalgia",  duration: 30, color: "#8e44ad",
    src: "https://cdns-preview-1.dzcdn.net/stream/c-1b83b832fa89742efd56f2c81fad7f3b-5.mp3",
    cover: "https://e-cdns-images.dzcdn.net/images/cover/7b8bb2f4e4a8a5fd6a46c11a53e20d9d/500x500-000000-80-0-0.jpg" },
  { id: 3, title: "As It Was",         artist: "Harry Styles",         album: "Harry's House",     duration: 30, color: "#16a085",
    src: "https://cdns-preview-a.dzcdn.net/stream/c-a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1-5.mp3",
    cover: "https://e-cdns-images.dzcdn.net/images/cover/3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e/500x500-000000-80-0-0.jpg" },
  { id: 4, title: "Heat Waves",        artist: "Glass Animals",        album: "Dreamland",         duration: 30, color: "#e67e22",
    src: "https://cdns-preview-5.dzcdn.net/stream/c-5b5b5b5b5b5b5b5b5b5b5b5b5b5b5b5b-5.mp3",
    cover: "https://e-cdns-images.dzcdn.net/images/cover/4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a/500x500-000000-80-0-0.jpg" },
  { id: 5, title: "Anti-Hero",         artist: "Taylor Swift",         album: "Midnights",         duration: 30, color: "#1a6fd4",
    src: "https://cdns-preview-7.dzcdn.net/stream/c-7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c-5.mp3",
    cover: "https://e-cdns-images.dzcdn.net/images/cover/6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d/500x500-000000-80-0-0.jpg" },
  { id: 6, title: "Stay",              artist: "The Kid LAROI",        album: "F*CK LOVE 3",       duration: 30, color: "#27ae60",
    src: "https://cdns-preview-e.dzcdn.net/stream/c-e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8-5.mp3",
    cover: "https://e-cdns-images.dzcdn.net/images/cover/8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e/500x500-000000-80-0-0.jpg" },
];

const ACCENT_COLORS = [
  "#c0392b","#8e44ad","#16a085","#e67e22","#2980b9",
  "#1abc9c","#d35400","#6c3483","#27ae60","#e74c3c",
];

const fmt = (s) => {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ─── Animated waveform bars ───────────────────────────────────────────────────
const Visualizer = ({ isPlaying, color }) => (
  <div className="flex items-end gap-[2px] h-7 px-1" aria-hidden="true">
    {Array.from({ length: 24 }).map((_, i) => (
      <motion.div
        key={i}
        className="w-[3px] rounded-full flex-shrink-0"
        style={{ background: color || "#a78bfa", opacity: isPlaying ? 1 : 0.25 }}
        animate={isPlaying
          ? { height: ["25%", `${28 + ((i * 37 + 13) % 72)}%`, "25%"] }
          : { height: "20%" }}
        transition={isPlaying ? {
          duration: 0.45 + (i % 5) * 0.1,
          repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: i * 0.035,
        } : { duration: 0.3 }}
      />
    ))}
  </div>
);

// ─── Album art component ──────────────────────────────────────────────────────
const AlbumArt = ({ src, isPlaying, color, size = "lg" }) => {
  const dim = size === "lg" ? "w-56 h-56 sm:w-64 sm:h-64" : "w-full h-full";
  return (
    <div className="relative flex-shrink-0">
      <div className="absolute inset-0 rounded-2xl blur-3xl scale-110 opacity-30 transition-all duration-700"
        style={{ background: color }} />
      <motion.div
        className={`relative ${dim} rounded-2xl overflow-hidden shadow-2xl`}
        animate={{ scale: isPlaying ? 1 : 0.93 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="album" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#1e1b4b,#312e81)" }}>
            <TbWaveSine size={48} className="text-white/15" />
          </div>
        )}
      </motion.div>
    </div>
  );
};

// ─── Progress scrubber ────────────────────────────────────────────────────────
const Scrubber = ({ current, duration, onChange }) => {
  const pct = duration > 0 ? (current / duration) * 100 : 0;
  return (
    <div className="w-full">
      <div className="flex justify-between text-[11px] text-white/25 mb-1.5 tabular-nums font-mono">
        <span>{fmt(current)}</span><span>{fmt(duration)}</span>
      </div>
      <div className="relative h-1 group cursor-pointer">
        <input type="range" min="0" max={duration || 100} step="0.1" value={current}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" aria-label="Seek" />
        <div className="absolute inset-0 rounded-full bg-white/10" />
        <div className="absolute inset-y-0 left-0 rounded-full transition-none"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg,#a78bfa,#60a5fa)" }} />
        <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `calc(${pct}% - 6px)` }} />
      </div>
    </div>
  );
};

// ─── Track row in queue/search ────────────────────────────────────────────────
const TrackRow = ({ track, isCurrent, isPlaying, onSelect, liked, onLike, showDuration = true }) => (
  <motion.div
    layout
    whileHover={{ backgroundColor: "rgba(255,255,255,0.06)" }}
    whileTap={{ scale: 0.98 }}
    onClick={onSelect}
    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${isCurrent ? "bg-white/10" : ""}`}
  >
    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 relative">
      {track.cover
        ? <img src={track.cover} alt="" className="w-full h-full object-cover" />  // eslint-disable-line
        : <div className="w-full h-full bg-white/10 flex items-center justify-center"><TbWaveSine size={14} className="text-white/30" /></div>}
      {isCurrent && isPlaying && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="flex items-end gap-[2px] h-3">
            {[0,1,2].map((i) => (
              <motion.div key={i} className="w-[2px] bg-white rounded-full"
                animate={{ height: ["30%","100%","30%"] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }} />
            ))}
          </div>
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p className={`text-sm truncate leading-tight ${isCurrent ? "text-white font-semibold" : "text-white/80"}`}>{track.title}</p>
      <p className="text-xs text-white/30 truncate">{track.artist}</p>
    </div>
    <button onClick={(e) => { e.stopPropagation(); onLike(); }}
      className="p-1 text-white/20 hover:text-pink-400 transition-colors flex-shrink-0" aria-label="Like">
      {liked ? <FaHeart size={12} className="text-pink-400" /> : <FaRegHeart size={12} />}
    </button>
    {showDuration && (
      <span className="text-white/20 text-[11px] tabular-nums flex-shrink-0 w-7 text-right font-mono">
        {fmt(track.duration)}
      </span>
    )}
  </motion.div>
);

// ─── SEARCH BAR ───────────────────────────────────────────────────────────────
const SearchBar = ({ query, onChange, onClear, searching }) => (
  <div className="relative flex items-center">
    <div className="absolute left-3.5 text-white/30 flex items-center">
      {searching
        ? <ImSpinner8 size={14} className="animate-spin text-violet-400" />
        : <FaSearch size={13} />}
    </div>
    <input
      type="text"
      value={query}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search songs, artists, albums…"
      className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white/8 border border-white/8 text-white text-sm placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:bg-white/12 transition-all"
    />
    <AnimatePresence>
      {query && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
          onClick={onClear}
          className="absolute right-3 text-white/25 hover:text-white transition-colors"
          aria-label="Clear search">
          <MdClose size={16} />
        </motion.button>
      )}
    </AnimatePresence>
  </div>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const MusicApp = ({ musicOpen, setMusicOpen }) => {
  const [tracks, setTracks]           = useState([]);
  const [idx, setIdx]                 = useState(0);
  const [isPlaying, setIsPlaying]     = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration]       = useState(0);
  const [volume, setVolume]           = useState(0.75);
  const [muted, setMuted]             = useState(false);
  const [shuffle, setShuffle]         = useState(false);
  const [repeat, setRepeat]           = useState(false);
  const [liked, setLiked]             = useState(new Set());
  const [view, setView]               = useState("player");   // "player" | "queue" | "search"
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching]     = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [audioError, setAudioError]   = useState(false);
  const [chartLoaded, setChartLoaded] = useState(false);

  const audioRef    = useRef(null);
  const prevIdx     = useRef(null);
  const searchTimer = useRef(null);

  const track = tracks[idx] ?? null;

  // ── Load Deezer chart on mount via JSONP ──────────────────────────────────
  useEffect(() => {
    const id = "deezer-chart-jsonp";
    window.__deezerChartCb = (data) => {
      try {
        const parsed = (data?.data || []).filter((t) => t.preview).slice(0, 12).map((t, i) => ({
          id:       t.id,
          title:    t.title_short || t.title,
          artist:   t.artist?.name ?? "Unknown",
          album:    t.album?.title ?? "",
          src:      t.preview,
          cover:    t.album?.cover_medium ?? "",
          duration: t.duration ?? 30,
          color:    ACCENT_COLORS[i % ACCENT_COLORS.length],
        }));
        if (parsed.length > 0) { setTracks(parsed); setChartLoaded(true); }
        else setTracks(FALLBACK_TRACKS);
      } catch { setTracks(FALLBACK_TRACKS); }
      document.getElementById(id)?.remove();
    };
    const script = document.createElement("script");
    script.id = id;
    script.src = "https://api.deezer.com/chart/0/tracks?limit=12&output=jsonp&callback=__deezerChartCb";
    script.onerror = () => { setTracks(FALLBACK_TRACKS); };
    document.body.appendChild(script);
    return () => { document.getElementById(id)?.remove(); };
  }, []);

  // ── Deezer search via JSONP ───────────────────────────────────────────────
  const runSearch = useCallback((q) => {
    if (!q.trim()) { setSearchResults([]); setSearchError(false); return; }
    setSearching(true);
    setSearchError(false);

    const id = "deezer-search-jsonp";
    document.getElementById(id)?.remove();

    const cbName = "__deezerSearchCb_" + Date.now();
    window[cbName] = (data) => {
      try {
        const results = (data?.data || []).filter((t) => t.preview).slice(0, 15).map((t, i) => ({
          id:       t.id,
          title:    t.title_short || t.title,
          artist:   t.artist?.name ?? "Unknown",
          album:    t.album?.title ?? "",
          src:      t.preview,
          cover:    t.album?.cover_medium ?? "",
          duration: t.duration ?? 30,
          color:    ACCENT_COLORS[i % ACCENT_COLORS.length],
        }));
        setSearchResults(results);
        if (results.length === 0) setSearchError(true);
      } catch { setSearchError(true); }
      setSearching(false);
      document.getElementById(id)?.remove();
      delete window[cbName];
    };

    const script = document.createElement("script");
    script.id = id;
    script.src = `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=15&output=jsonp&callback=${cbName}`;
    script.onerror = () => { setSearching(false); setSearchError(true); document.getElementById(id)?.remove(); };
    document.body.appendChild(script);
  }, []);

  // Debounced search input handler
  const handleSearchChange = useCallback((val) => {
    setSearchQuery(val);
    clearTimeout(searchTimer.current);
    if (!val.trim()) { setSearchResults([]); setSearchError(false); setSearching(false); return; }
    searchTimer.current = setTimeout(() => runSearch(val), 450);
  }, [runSearch]);

  // Play a track from search
  const playFromSearch = useCallback((t) => {
    // Check if already in queue
    const existing = tracks.findIndex((tr) => tr.id === t.id);
    if (existing !== -1) {
      setIdx(existing);
    } else {
      const newTracks = [...tracks, t];
      setTracks(newTracks);
      setIdx(newTracks.length - 1);
    }
    setIsPlaying(true);
    setView("player");
  }, [tracks]);

  // ── Sync audio src when track changes ────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    const shouldAutoPlay = isPlaying || (prevIdx.current !== null && prevIdx.current !== idx);
    prevIdx.current = idx;
    audio.src = track.src;
    audio.load();
    setCurrentTime(0);
    setDuration(0);
    setAudioError(false);
    if (shouldAutoPlay) {
      setLoading(true);
      audio.play().catch(() => setAudioError(true));
    }
  }, [idx, track]); // eslint-disable-line

  // ── Play / Pause ─────────────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { setLoading(true); audio.play().catch(() => { setAudioError(true); setIsPlaying(false); }); }
    else audio.pause();
  }, [isPlaying]);

  // ── Volume ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  // ── Audio event listeners ─────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime     = () => setCurrentTime(audio.currentTime);
    const onDur      = () => setDuration(audio.duration || 0);
    const onCanPlay  = () => setLoading(false);
    const onWaiting  = () => setLoading(true);
    const onPlaying  = () => { setLoading(false); setAudioError(false); };
    const onError    = () => { setLoading(false); setAudioError(true); };
    const onEnded    = () => {
      if (repeat === "one") { audio.currentTime = 0; audio.play(); }
      else goNext(true);
    };
    audio.addEventListener("timeupdate",     onTime);
    audio.addEventListener("loadedmetadata", onDur);
    audio.addEventListener("durationchange", onDur);
    audio.addEventListener("canplay",        onCanPlay);
    audio.addEventListener("waiting",        onWaiting);
    audio.addEventListener("playing",        onPlaying);
    audio.addEventListener("error",          onError);
    audio.addEventListener("ended",          onEnded);
    return () => {
      audio.removeEventListener("timeupdate",     onTime);
      audio.removeEventListener("loadedmetadata", onDur);
      audio.removeEventListener("durationchange", onDur);
      audio.removeEventListener("canplay",        onCanPlay);
      audio.removeEventListener("waiting",        onWaiting);
      audio.removeEventListener("playing",        onPlaying);
      audio.removeEventListener("error",          onError);
      audio.removeEventListener("ended",          onEnded);
    };
  }, [repeat]); // eslint-disable-line

  const goNext = useCallback((auto = false) => {
    setIdx((i) => {
      if (tracks.length === 0) return i;
      if (shuffle) return Math.floor(Math.random() * tracks.length);
      const next = (i + 1) % tracks.length;
      if (!auto && next === 0 && repeat !== "all") { setIsPlaying(false); return i; }
      return next;
    });
    if (!isPlaying && !auto) setIsPlaying(true);
  }, [shuffle, tracks.length, repeat, isPlaying]);

  const goPrev = useCallback(() => {
    if (currentTime > 3 && audioRef.current) { audioRef.current.currentTime = 0; return; }
    setIdx((i) => (i === 0 ? tracks.length - 1 : i - 1));
    setIsPlaying(true);
  }, [currentTime, tracks.length]);

  const seek = useCallback((t) => {
    if (audioRef.current) audioRef.current.currentTime = clamp(t, 0, duration);
    setCurrentTime(clamp(t, 0, duration));
  }, [duration]);

  const toggleRepeat = () => setRepeat((r) => r === false ? "all" : r === "all" ? "one" : false);
  const toggleLike   = (id) => setLiked((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    if (!musicOpen) return;
    const h = (e) => {
      if (e.target.tagName === "INPUT") return;
      if (e.code === "Space")      { e.preventDefault(); setIsPlaying((p) => !p); }
      if (e.code === "ArrowRight") seek(currentTime + 5);
      if (e.code === "ArrowLeft")  seek(currentTime - 5);
      if (e.code === "ArrowUp")    setVolume((v) => clamp(v + 0.05, 0, 1));
      if (e.code === "ArrowDown")  setVolume((v) => clamp(v - 0.05, 0, 1));
      if (e.code === "KeyN")       goNext();
      if (e.code === "KeyP")       goPrev();
      if (e.code === "KeyM")       setMuted((m) => !m);
      if (e.code === "KeyS" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setView("search"); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [musicOpen, currentTime, seek, goNext, goPrev]);

  const accentColor = track?.color ?? "#a78bfa";
  const repeatColor = repeat ? "#a78bfa" : "rgba(255,255,255,0.3)";
  const shuffleColor = shuffle ? "#a78bfa" : "rgba(255,255,255,0.3)";

  if (!musicOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="music-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="safe-overlay-backdrop"
        style={{ bottom: "var(--taskbar-height, 52px)" }}
        style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(28px)" }}
      >
        <motion.div
          initial={{ scale: 0.92, y: 24 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.92, y: 24 }}
          transition={{ type: "spring", damping: 22, stiffness: 280 }}
          className="relative w-full flex flex-col overflow-hidden"
          style={{
            maxWidth: 420,
            maxHeight: "94vh",
            background: "linear-gradient(175deg,#13111c 0%,#0b0913 100%)",
            border: "1px solid rgba(167,139,250,0.1)",
            boxShadow: "0 48px 96px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.04)",
            borderRadius: 28,
          }}
        >
          {/* Dynamic color wash */}
          <div className="absolute inset-0 pointer-events-none transition-all duration-1000"
            style={{ background: `radial-gradient(ellipse 80% 50% at 50% -10%, ${accentColor}22 0%, transparent 65%)` }} />

          {/* ── HEADER ────────────────────────────────────────────────────── */}
          <div className="relative flex items-center justify-between px-5 pt-5 pb-1 flex-shrink-0">
            {/* Left button: queue toggle or back */}
            <button
              onClick={() => setView(view === "queue" ? "player" : view === "search" ? "player" : "queue")}
              className="p-2 rounded-xl text-white/30 hover:text-white hover:bg-white/8 transition-colors"
              aria-label="Toggle queue"
            >
              {view === "queue" || view === "search"
                ? <MdClose size={18} />
                : <MdQueueMusic size={18} />}
            </button>

            {/* Center label */}
            <span className="text-white/40 text-[11px] font-medium uppercase tracking-widest">
              {view === "queue" ? "Queue" : view === "search" ? "Search" : "Now Playing"}
            </span>

            {/* Right: search icon + close */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setView(view === "search" ? "player" : "search")}
                className={`p-2 rounded-xl transition-colors ${view === "search" ? "text-violet-400 bg-violet-500/15" : "text-white/30 hover:text-white hover:bg-white/8"}`}
                aria-label="Search"
              >
                <FaSearch size={13} />
              </button>
              <button
                onClick={() => { setIsPlaying(false); setMusicOpen(false); }}
                className="p-2 rounded-xl text-white/30 hover:text-white hover:bg-white/8 transition-colors"
                aria-label="Close"
              >
                <MdClose size={18} />
              </button>
            </div>
          </div>

          {/* ── CONTENT AREA (scrollable) ──────────────────────────────── */}
          <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
            <AnimatePresence mode="wait">

              {/* ── SEARCH VIEW ─────────────────────────────────────────── */}
              {view === "search" && (
                <motion.div
                  key="search-view"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="px-4 pt-3 pb-4"
                >
                  <SearchBar
                    query={searchQuery}
                    onChange={handleSearchChange}
                    onClear={() => { setSearchQuery(""); setSearchResults([]); setSearchError(false); }}
                    searching={searching}
                  />

                  <div className="mt-3">
                    {/* Searching state */}
                    {searching && !searchResults.length && (
                      <div className="flex flex-col items-center py-10 text-white/30 gap-2">
                        <ImSpinner8 size={24} className="animate-spin text-violet-400" />
                        <p className="text-sm">Searching Deezer…</p>
                      </div>
                    )}

                    {/* Error / no results */}
                    {searchError && !searching && (
                      <div className="flex flex-col items-center py-10 text-white/25 gap-2">
                        <TbMusicSearch size={32} />
                        <p className="text-sm">No results found</p>
                        <p className="text-xs text-white/15">Try a different song or artist</p>
                      </div>
                    )}

                    {/* Empty state — show trending prompt */}
                    {!searchQuery && !searching && !searchError && (
                      <div className="pt-2">
                        <p className="text-white/25 text-xs uppercase tracking-widest font-medium mb-3 px-1">Trending</p>
                        {tracks.slice(0, 8).map((t, i) => (
                          <TrackRow key={t.id} track={t}
                            isCurrent={track?.id === t.id} isPlaying={isPlaying}
                            onSelect={() => playFromSearch(t)}
                            liked={liked.has(t.id)} onLike={() => toggleLike(t.id)} />
                        ))}
                      </div>
                    )}

                    {/* Search results */}
                    {searchResults.length > 0 && !searching && (
                      <div className="pt-1">
                        <p className="text-white/25 text-xs uppercase tracking-widest font-medium mb-2 px-1">
                          {searchResults.length} results
                        </p>
                        {searchResults.map((t) => (
                          <TrackRow key={t.id} track={t}
                            isCurrent={track?.id === t.id} isPlaying={isPlaying}
                            onSelect={() => playFromSearch(t)}
                            liked={liked.has(t.id)} onLike={() => toggleLike(t.id)} />
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── QUEUE VIEW ──────────────────────────────────────────── */}
              {view === "queue" && (
                <motion.div
                  key="queue-view"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="px-2 pt-2 pb-4"
                >
                  <p className="text-white/25 text-xs uppercase tracking-widest font-medium mb-2 px-2">
                    {tracks.length} tracks
                  </p>
                  {tracks.map((t, i) => (
                    <TrackRow key={t.id} track={t}
                      isCurrent={i === idx} isPlaying={isPlaying}
                      onSelect={() => { setIdx(i); setIsPlaying(true); setView("player"); }}
                      liked={liked.has(t.id)} onLike={() => toggleLike(t.id)} />
                  ))}
                </motion.div>
              )}

              {/* ── NOW PLAYING VIEW ────────────────────────────────────── */}
              {view === "player" && (
                <motion.div
                  key="player-view"
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center gap-4 px-6 pb-6 pt-2"
                >
                  {/* Album art */}
                  <AnimatePresence mode="wait">
                    <motion.div key={`art-${idx}`}
                      initial={{ opacity: 0, scale: 0.88, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -8 }}
                      transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}>
                      <AlbumArt src={track?.cover} isPlaying={isPlaying && !loading} color={accentColor} />
                    </motion.div>
                  </AnimatePresence>

                  {/* Visualizer */}
                  <Visualizer isPlaying={isPlaying && !loading} color={accentColor} />

                  {/* Track info + like */}
                  <div className="w-full flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <AnimatePresence mode="wait">
                        <motion.h2 key={`title-${idx}`}
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.22 }}
                          className="text-white font-bold text-xl leading-tight truncate">
                          {loading
                            ? <span className="inline-block h-5 w-44 bg-white/10 rounded animate-pulse" />
                            : audioError ? "Track unavailable" : (track?.title ?? "—")}
                        </motion.h2>
                      </AnimatePresence>
                      <p className="text-white/35 text-sm truncate mt-0.5">
                        {track?.artist}{track?.album ? ` · ${track.album}` : ""}
                      </p>
                    </div>
                    <button onClick={() => track && toggleLike(track.id)}
                      className="p-1.5 flex-shrink-0 mt-0.5" aria-label="Like">
                      <motion.div whileTap={{ scale: 1.4 }} transition={{ type: "spring", stiffness: 400 }}>
                        {liked.has(track?.id)
                          ? <FaHeart size={18} className="text-pink-400" />
                          : <FaRegHeart size={18} className="text-white/20 hover:text-white/60 transition-colors" />}
                      </motion.div>
                    </button>
                  </div>

                  {/* Scrubber */}
                  <div className="w-full">
                    <Scrubber current={currentTime} duration={duration} onChange={seek} />
                  </div>

                  {/* Main transport controls */}
                  <div className="w-full flex items-center justify-between">
                    <motion.button whileTap={{ scale: 0.88 }} onClick={() => setShuffle((s) => !s)}
                      style={{ color: shuffleColor }} className="p-2 transition-colors" aria-label="Shuffle">
                      <FaRandom size={15} />
                    </motion.button>

                    <motion.button whileTap={{ scale: 0.88 }} onClick={goPrev}
                      className="p-2 text-white/70 hover:text-white transition-colors" aria-label="Previous">
                      <FaStepBackward size={22} />
                    </motion.button>

                    {/* Play / Pause button */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.93 }}
                      onClick={() => setIsPlaying((p) => !p)}
                      className="w-14 h-14 rounded-full flex items-center justify-center relative"
                      style={{
                        background: `linear-gradient(135deg, ${accentColor}, #60a5fa)`,
                        boxShadow: `0 8px 32px ${accentColor}55`,
                      }}
                      aria-label={isPlaying ? "Pause" : "Play"}
                    >
                      <AnimatePresence mode="wait">
                        {loading ? (
                          <motion.div key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : isPlaying ? (
                          <motion.div key="pause" initial={{ scale: 0.6 }} animate={{ scale: 1 }}>
                            <FaPause size={20} className="text-white" />
                          </motion.div>
                        ) : (
                          <motion.div key="play" initial={{ scale: 0.6 }} animate={{ scale: 1 }} style={{ marginLeft: 2 }}>
                            <FaPlay size={20} className="text-white" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>

                    <motion.button whileTap={{ scale: 0.88 }} onClick={() => goNext()}
                      className="p-2 text-white/70 hover:text-white transition-colors" aria-label="Next">
                      <FaStepForward size={22} />
                    </motion.button>

                    <motion.button whileTap={{ scale: 0.88 }} onClick={toggleRepeat}
                      style={{ color: repeatColor }} className="p-2 transition-colors relative" aria-label="Repeat">
                      <FaRedo size={15} />
                      {repeat === "one" && (
                        <span className="absolute -top-0.5 -right-0.5 text-[8px] font-black text-violet-300">1</span>
                      )}
                    </motion.button>
                  </div>

                  {/* Volume row */}
                  <div className="w-full flex items-center gap-2.5">
                    <button onClick={() => setMuted((m) => !m)}
                      className="text-white/25 hover:text-white transition-colors flex-shrink-0" aria-label="Mute">
                      {muted || volume === 0 ? <FaVolumeMute size={13} />
                        : volume < 0.5 ? <FaVolumeDown size={13} />
                        : <FaVolumeUp size={13} />}
                    </button>
                    <div className="relative flex-1 h-1 group cursor-pointer">
                      <input type="range" min="0" max="1" step="0.01" value={muted ? 0 : volume}
                        onChange={(e) => { setVolume(parseFloat(e.target.value)); setMuted(false); }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" aria-label="Volume" />
                      <div className="absolute inset-0 rounded-full bg-white/10" />
                      <div className="absolute inset-y-0 left-0 rounded-full bg-white/35"
                        style={{ width: `${(muted ? 0 : volume) * 100}%` }} />
                    </div>
                  </div>

                  {/* Quick search shortcut pill */}
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setView("search")}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/6 border border-white/8 text-white/40 text-xs hover:text-white/60 hover:bg-white/10 transition-all"
                  >
                    <FaSearch size={10} />
                    <span>Search for any song…</span>
                  </motion.button>

                  <p className="text-white/10 text-[10px] text-center">
                    Space · ← → seek · ↑↓ vol · N next · M mute
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── MINI NOW PLAYING BAR (shown in search/queue views) ────── */}
          <AnimatePresence>
            {(view === "search" || view === "queue") && track && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                className="flex-shrink-0 flex items-center gap-3 mx-4 mb-4 px-3 py-2.5 rounded-2xl bg-white/6 border border-white/8"
              >
                <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0">
                  {track.cover
                    ? <img src={track.cover} alt="" className="w-full h-full object-cover" /> // eslint-disable-line
                    : <div className="w-full h-full bg-white/10" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-semibold truncate">{track.title}</p>
                  <p className="text-white/30 text-[11px] truncate">{track.artist}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <motion.button whileTap={{ scale: 0.88 }} onClick={goPrev}
                    className="p-1.5 text-white/40 hover:text-white transition-colors" aria-label="Previous">
                    <FaStepBackward size={13} />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => setIsPlaying((p) => !p)}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${accentColor}, #60a5fa)` }}
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {loading
                      ? <ImSpinner8 size={12} className="text-white animate-spin" />
                      : isPlaying ? <FaPause size={12} className="text-white" />
                      : <FaPlay size={12} className="text-white" style={{ marginLeft: 1 }} />}
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.88 }} onClick={() => goNext()}
                    className="p-1.5 text-white/40 hover:text-white transition-colors" aria-label="Next">
                    <FaStepForward size={13} />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hidden audio element */}
          <audio ref={audioRef} preload="metadata" crossOrigin="anonymous" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MusicApp;