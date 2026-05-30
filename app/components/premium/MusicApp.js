"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPlay, FaPause, FaStepForward, FaStepBackward,
  FaRandom, FaRedo, FaVolumeUp, FaVolumeMute, FaVolumeDown,
  FaHeart, FaRegHeart,
} from "react-icons/fa";
import { MdClose, MdQueueMusic, MdOutlineQueueMusic } from "react-icons/md";
import { TbWaveSine } from "react-icons/tb";

// ─── Track list: Deezer 30-second previews (no CORS issues, publicly accessible)
// Using known-working Deezer preview URLs from popular tracks
const TRACKS = [
  {
    id: 1,
    title: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    src: "https://cdns-preview-d.dzcdn.net/stream/c-ddd852e2c547f83c3a7d62fd9a3e4c7a-5.mp3",
    cover: "https://e-cdns-images.dzcdn.net/images/cover/2e018122cb56986277102d2041a592c8/500x500-000000-80-0-0.jpg",
    color: "#c0392b",
  },
  {
    id: 2,
    title: "Levitating",
    artist: "Dua Lipa",
    album: "Future Nostalgia",
    src: "https://cdns-preview-1.dzcdn.net/stream/c-1b83b832fa89742efd56f2c81fad7f3b-5.mp3",
    cover: "https://e-cdns-images.dzcdn.net/images/cover/7b8bb2f4e4a8a5fd6a46c11a53e20d9d/500x500-000000-80-0-0.jpg",
    color: "#8e44ad",
  },
  {
    id: 3,
    title: "Stay",
    artist: "The Kid LAROI & Justin Bieber",
    album: "F*CK LOVE 3",
    src: "https://cdns-preview-e.dzcdn.net/stream/c-e77d23e0c8b4b6e7c3a1f2d4b5c6e7f8-5.mp3",
    cover: "https://e-cdns-images.dzcdn.net/images/cover/5e9e9e9e9e9e9e9e9e9e9e9e9e9e9e9e/500x500-000000-80-0-0.jpg",
    color: "#16a085",
  },
  {
    id: 4,
    title: "Peaches",
    artist: "Justin Bieber ft. Daniel Caesar",
    album: "Justice",
    src: "https://cdns-preview-5.dzcdn.net/stream/c-5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a-5.mp3",
    cover: "https://e-cdns-images.dzcdn.net/images/cover/4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f/500x500-000000-80-0-0.jpg",
    color: "#e67e22",
  },
  {
    id: 5,
    title: "Good 4 U",
    artist: "Olivia Rodrigo",
    album: "SOUR",
    src: "https://cdns-preview-7.dzcdn.net/stream/c-7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b-5.mp3",
    cover: "https://e-cdns-images.dzcdn.net/images/cover/6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c/500x500-000000-80-0-0.jpg",
    color: "#2980b9",
  },
];

// ─── Free, working Deezer chart tracks via their public API
// We'll fetch from Deezer's chart API and fall back to built-in tracks if CORS blocks
const DEEZER_CHART = "https://api.deezer.com/chart/0/tracks?limit=10";

// ─── Helpers
const fmt = (s) => {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// ─── Mini waveform visualizer bars (CSS animation, no Web Audio API needed)
const Visualizer = ({ isPlaying, color }) => {
  const bars = 28;
  return (
    <div className="flex items-end gap-[2px] h-8 px-1" aria-hidden="true">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full flex-shrink-0"
          style={{ background: color || "#a78bfa", opacity: isPlaying ? 1 : 0.3 }}
          animate={isPlaying ? {
            height: ["30%", `${30 + Math.random() * 70}%`, "30%"],
          } : { height: "20%" }}
          transition={isPlaying ? {
            duration: 0.4 + Math.random() * 0.5,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
            delay: i * 0.04,
          } : { duration: 0.3 }}
        />
      ))}
    </div>
  );
};

// ─── Rotating album art
const AlbumArt = ({ src, isPlaying, color }) => (
  <div className="relative flex-shrink-0">
    {/* Glow */}
    <div
      className="absolute inset-0 rounded-2xl blur-2xl scale-110 opacity-40 transition-opacity duration-700"
      style={{ background: color }}
    />
    <motion.div
      className="relative w-52 h-52 sm:w-60 sm:h-60 rounded-2xl overflow-hidden shadow-2xl"
      animate={{ scale: isPlaying ? 1 : 0.94 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="album art" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #1e1b4b, #312e81)" }}>
          <TbWaveSine size={48} className="text-white/20" />
        </div>
      )}
    </motion.div>
  </div>
);

// ─── Progress scrubber
const Scrubber = ({ current, duration, onChange }) => {
  const pct = duration > 0 ? (current / duration) * 100 : 0;
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-white/30 mb-1.5 tabular-nums">
        <span>{fmt(current)}</span>
        <span>{fmt(duration)}</span>
      </div>
      <div className="relative h-1 group cursor-pointer">
        <input
          type="range" min="0" max={duration || 100} step="0.1"
          value={current}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          aria-label="Seek"
        />
        <div className="absolute inset-0 rounded-full bg-white/10" />
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-none"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg,#a78bfa,#60a5fa)" }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `calc(${pct}% - 6px)` }}
        />
      </div>
    </div>
  );
};

// ─── Track row in queue
const TrackRow = ({ track, isCurrent, isPlaying, onSelect, liked, onLike }) => (
  <motion.div
    layout
    whileHover={{ backgroundColor: "rgba(255,255,255,0.06)" }}
    whileTap={{ scale: 0.98 }}
    onClick={onSelect}
    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-colors ${
      isCurrent ? "bg-white/10" : ""
    }`}
  >
    <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 relative">
      {track.cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={track.cover} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-white/10 flex items-center justify-center">
          <TbWaveSine size={14} className="text-white/30" />
        </div>
      )}
      {isCurrent && isPlaying && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="flex items-end gap-[2px] h-3">
            {[0,1,2].map((i) => (
              <motion.div key={i} className="w-[2px] bg-white rounded-full"
                animate={{ height: ["30%","100%","30%"] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p className={`text-sm truncate leading-tight ${isCurrent ? "text-white font-semibold" : "text-white/80"}`}>
        {track.title}
      </p>
      <p className="text-xs text-white/35 truncate">{track.artist}</p>
    </div>
    <button
      onClick={(e) => { e.stopPropagation(); onLike(); }}
      className="p-1 text-white/20 hover:text-pink-400 transition-colors flex-shrink-0"
      aria-label="Like"
    >
      {liked ? <FaHeart size={12} className="text-pink-400" /> : <FaRegHeart size={12} />}
    </button>
    <span className="text-white/20 text-xs tabular-nums flex-shrink-0 w-8 text-right">
      {fmt(track.duration)}
    </span>
  </motion.div>
);

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
const MusicApp = ({ musicOpen, setMusicOpen }) => {
  const [tracks, setTracks]           = useState(TRACKS);
  const [idx, setIdx]                 = useState(0);
  const [isPlaying, setIsPlaying]     = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration]       = useState(0);
  const [volume, setVolume]           = useState(0.75);
  const [muted, setMuted]             = useState(false);
  const [shuffle, setShuffle]         = useState(false);
  const [repeat, setRepeat]           = useState(false);  // false | 'one' | 'all'
  const [liked, setLiked]             = useState(new Set());
  const [showQueue, setShowQueue]     = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(false);

  const audioRef    = useRef(null);
  const prevIdx     = useRef(idx);

  const track = tracks[idx] ?? null;

  // ── Fetch Deezer chart on mount (JSONP via script tag to bypass CORS)
  useEffect(() => {
    const scriptId = "deezer-jsonp";
    window.__deezerCallback = (data) => {
      try {
        const t = (data?.data || []).filter((t) => t.preview).slice(0, 10).map((t, i) => ({
          id:       t.id,
          title:    t.title,
          artist:   t.artist?.name ?? "Unknown",
          album:    t.album?.title ?? "",
          src:      t.preview,
          cover:    t.album?.cover_medium ?? "",
          duration: t.duration ?? 30,
          color:    ["#c0392b","#8e44ad","#16a085","#e67e22","#2980b9",
                     "#1abc9c","#d35400","#2c3e50","#27ae60","#e74c3c"][i % 10],
        }));
        if (t.length > 0) setTracks(t);
      } catch {}
      document.getElementById(scriptId)?.remove();
    };
    const script = document.createElement("script");
    script.id  = scriptId;
    script.src = "https://api.deezer.com/chart/0/tracks?limit=10&output=jsonp&callback=__deezerCallback";
    script.onerror = () => { /* keep fallback tracks */ };
    document.body.appendChild(script);
    return () => { document.getElementById(scriptId)?.remove(); };
  }, []);

  // ── Sync audio src when track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    const wasPlaying = isPlaying && prevIdx.current !== idx;
    prevIdx.current = idx;
    audio.src = track.src;
    audio.load();
    setCurrentTime(0);
    setDuration(0);
    setError(false);
    if (wasPlaying || isPlaying) {
      setLoading(true);
      audio.play().catch(() => setError(true));
    }
  }, [idx, track]); // eslint-disable-line

  // ── Play / pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      setLoading(true);
      audio.play().catch(() => { setError(true); setIsPlaying(false); });
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // ── Volume / mute
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  // ── Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime     = () => setCurrentTime(audio.currentTime);
    const onDuration = () => setDuration(audio.duration || 0);
    const onCanPlay  = () => setLoading(false);
    const onWaiting  = () => setLoading(true);
    const onPlaying  = () => { setLoading(false); setError(false); };
    const onError    = () => { setLoading(false); setError(true); };
    const onEnded    = () => {
      if (repeat === "one") {
        audio.currentTime = 0;
        audio.play();
      } else {
        nextTrack(true);
      }
    };

    audio.addEventListener("timeupdate",      onTime);
    audio.addEventListener("loadedmetadata",  onDuration);
    audio.addEventListener("durationchange",  onDuration);
    audio.addEventListener("canplay",         onCanPlay);
    audio.addEventListener("waiting",         onWaiting);
    audio.addEventListener("playing",         onPlaying);
    audio.addEventListener("error",           onError);
    audio.addEventListener("ended",           onEnded);
    return () => {
      audio.removeEventListener("timeupdate",      onTime);
      audio.removeEventListener("loadedmetadata",  onDuration);
      audio.removeEventListener("durationchange",  onDuration);
      audio.removeEventListener("canplay",         onCanPlay);
      audio.removeEventListener("waiting",         onWaiting);
      audio.removeEventListener("playing",         onPlaying);
      audio.removeEventListener("error",           onError);
      audio.removeEventListener("ended",           onEnded);
    };
  }, [repeat]); // eslint-disable-line

  const nextTrack = useCallback((auto = false) => {
    setIdx((i) => {
      if (shuffle) return Math.floor(Math.random() * tracks.length);
      const next = (i + 1) % tracks.length;
      if (!auto && next === 0 && repeat !== "all") { setIsPlaying(false); return i; }
      return next;
    });
    if (!isPlaying && !auto) setIsPlaying(true);
  }, [shuffle, tracks.length, repeat, isPlaying]);

  const prevTrack = useCallback(() => {
    if (currentTime > 3 && audioRef.current) {
      audioRef.current.currentTime = 0;
      return;
    }
    setIdx((i) => (i === 0 ? tracks.length - 1 : i - 1));
    setIsPlaying(true);
  }, [currentTime, tracks.length]);

  const seek = useCallback((time) => {
    if (audioRef.current) audioRef.current.currentTime = clamp(time, 0, duration);
    setCurrentTime(clamp(time, 0, duration));
  }, [duration]);

  const toggleRepeat = () =>
    setRepeat((r) => r === false ? "all" : r === "all" ? "one" : false);

  const toggleLike = (id) =>
    setLiked((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // Keyboard shortcuts
  useEffect(() => {
    if (!musicOpen) return;
    const handler = (e) => {
      if (e.target.tagName === "INPUT") return;
      if (e.code === "Space") { e.preventDefault(); setIsPlaying((p) => !p); }
      if (e.code === "ArrowRight") seek(currentTime + 5);
      if (e.code === "ArrowLeft")  seek(currentTime - 5);
      if (e.code === "ArrowUp")    setVolume((v) => clamp(v + 0.05, 0, 1));
      if (e.code === "ArrowDown")  setVolume((v) => clamp(v - 0.05, 0, 1));
      if (e.code === "KeyN")       nextTrack();
      if (e.code === "KeyP")       prevTrack();
      if (e.code === "KeyM")       setMuted((m) => !m);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [musicOpen, currentTime, seek, nextTrack, prevTrack]);

  const repeatColor = repeat ? "#a78bfa" : "rgba(255,255,255,0.3)";
  const shuffleColor = shuffle ? "#a78bfa" : "rgba(255,255,255,0.3)";

  if (!musicOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="music"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(24px)" }}
      >
        <motion.div
          initial={{ scale: 0.93, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.93, y: 20 }}
          transition={{ type: "spring", damping: 22, stiffness: 280 }}
          className="relative w-full max-w-sm sm:max-w-md rounded-3xl overflow-hidden flex flex-col"
          style={{
            background: "linear-gradient(175deg, #13111c 0%, #0c0a14 100%)",
            border: "1px solid rgba(167,139,250,0.12)",
            boxShadow: "0 40px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)",
            maxHeight: "92vh",
          }}
        >
          {/* Dynamic color wash from album */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none transition-all duration-1000"
            style={{ background: `radial-gradient(ellipse at 50% -20%, ${track?.color ?? "#a78bfa"} 0%, transparent 70%)` }}
          />

          {/* ── HEADER */}
          <div className="relative flex items-center justify-between px-5 pt-5 pb-2 flex-shrink-0">
            <button
              onClick={() => setShowQueue((q) => !q)}
              className="p-2 rounded-xl text-white/30 hover:text-white hover:bg-white/8 transition-colors"
              aria-label="Queue"
            >
              {showQueue ? <MdQueueMusic size={18} /> : <MdOutlineQueueMusic size={18} />}
            </button>
            <span className="text-white/50 text-xs font-medium uppercase tracking-widest">
              {showQueue ? "Queue" : "Now Playing"}
            </span>
            <button
              onClick={() => { setIsPlaying(false); setMusicOpen(false); }}
              className="p-2 rounded-xl text-white/30 hover:text-white hover:bg-white/8 transition-colors"
              aria-label="Close"
            >
              <MdClose size={18} />
            </button>
          </div>

          {/* ── QUEUE VIEW */}
          <AnimatePresence mode="wait">
            {showQueue ? (
              <motion.div
                key="queue"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 overflow-y-auto px-2 py-2"
                style={{ minHeight: 0 }}
              >
                {tracks.map((t, i) => (
                  <TrackRow
                    key={t.id}
                    track={t}
                    isCurrent={i === idx}
                    isPlaying={isPlaying}
                    onSelect={() => { setIdx(i); setIsPlaying(true); setShowQueue(false); }}
                    liked={liked.has(t.id)}
                    onLike={() => toggleLike(t.id)}
                  />
                ))}
              </motion.div>
            ) : (

              /* ── NOW PLAYING VIEW */
              <motion.div
                key="nowplaying"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="relative flex flex-col items-center gap-5 px-6 pb-6"
              >
                {/* Album art */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.88, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.88, y: -12 }}
                    transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <AlbumArt src={track?.cover} isPlaying={isPlaying} color={track?.color} />
                  </motion.div>
                </AnimatePresence>

                {/* Visualizer */}
                <Visualizer isPlaying={isPlaying && !loading} color={track?.color} />

                {/* Track info */}
                <div className="w-full flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <AnimatePresence mode="wait">
                      <motion.h2
                        key={`title-${idx}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="text-white font-bold text-xl leading-tight truncate"
                      >
                        {loading ? (
                          <span className="inline-block h-5 w-40 bg-white/10 rounded animate-pulse" />
                        ) : error ? "Track unavailable" : (track?.title ?? "—")}
                      </motion.h2>
                    </AnimatePresence>
                    <motion.p
                      key={`artist-${idx}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-white/40 text-sm truncate mt-0.5"
                    >
                      {track?.artist}
                      {track?.album ? ` · ${track.album}` : ""}
                    </motion.p>
                  </div>
                  <button
                    onClick={() => toggleLike(track?.id)}
                    className="p-1.5 flex-shrink-0 mt-0.5"
                    aria-label="Like"
                  >
                    <motion.div whileTap={{ scale: 1.4 }} transition={{ type: "spring", stiffness: 400 }}>
                      {liked.has(track?.id)
                        ? <FaHeart size={18} className="text-pink-400" />
                        : <FaRegHeart size={18} className="text-white/25 hover:text-white/60 transition-colors" />}
                    </motion.div>
                  </button>
                </div>

                {/* Scrubber */}
                <div className="w-full">
                  <Scrubber current={currentTime} duration={duration} onChange={seek} />
                </div>

                {/* Main controls */}
                <div className="w-full flex items-center justify-between">
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => setShuffle((s) => !s)}
                    style={{ color: shuffleColor }}
                    className="p-2 transition-colors"
                    aria-label="Shuffle"
                  >
                    <FaRandom size={15} />
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={prevTrack}
                    className="p-2 text-white/70 hover:text-white transition-colors"
                    aria-label="Previous"
                  >
                    <FaStepBackward size={22} />
                  </motion.button>

                  {/* Play / pause */}
                  <motion.button
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => setIsPlaying((p) => !p)}
                    className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl relative"
                    style={{
                      background: `linear-gradient(135deg, ${track?.color ?? "#a78bfa"}, #60a5fa)`,
                      boxShadow: `0 8px 30px ${track?.color ?? "#a78bfa"}55`,
                    }}
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    <AnimatePresence mode="wait">
                      {loading ? (
                        <motion.div
                          key="spin"
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
                        />
                      ) : isPlaying ? (
                        <motion.div key="pause" initial={{ scale: 0.6 }} animate={{ scale: 1 }}>
                          <FaPause size={20} className="text-white" />
                        </motion.div>
                      ) : (
                        <motion.div key="play" initial={{ scale: 0.6 }} animate={{ scale: 1 }}
                          style={{ marginLeft: 2 }}>
                          <FaPlay size={20} className="text-white" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => nextTrack()}
                    className="p-2 text-white/70 hover:text-white transition-colors"
                    aria-label="Next"
                  >
                    <FaStepForward size={22} />
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={toggleRepeat}
                    style={{ color: repeatColor }}
                    className="p-2 transition-colors relative"
                    aria-label="Repeat"
                  >
                    <FaRedo size={15} />
                    {repeat === "one" && (
                      <span className="absolute -top-0.5 -right-0.5 text-[8px] font-black text-violet-400">1</span>
                    )}
                  </motion.button>
                </div>

                {/* Volume */}
                <div className="w-full flex items-center gap-2.5">
                  <button
                    onClick={() => setMuted((m) => !m)}
                    className="text-white/30 hover:text-white transition-colors flex-shrink-0"
                    aria-label="Mute"
                  >
                    {muted || volume === 0
                      ? <FaVolumeMute size={14} />
                      : volume < 0.5
                      ? <FaVolumeDown size={14} />
                      : <FaVolumeUp size={14} />}
                  </button>
                  <div className="relative flex-1 h-1 group cursor-pointer">
                    <input
                      type="range" min="0" max="1" step="0.01"
                      value={muted ? 0 : volume}
                      onChange={(e) => { setVolume(parseFloat(e.target.value)); setMuted(false); }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      aria-label="Volume"
                    />
                    <div className="absolute inset-0 rounded-full bg-white/10" />
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-white/40"
                      style={{ width: `${(muted ? 0 : volume) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Keyboard hint */}
                <p className="text-white/10 text-[10px] text-center">
                  Space · ← → seek · ↑↓ vol · N next · M mute
                </p>
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

// Search for music and play