"use client";
/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║              NEURAL CAMERA PRO  ·  v3.0                         ║
 * ║  Flagship camera experience — React + Canvas + Web APIs         ║
 * ║  Designed to surpass Snapchat, Apple Camera, Samsung Camera      ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import React, {
  useState, useEffect, useRef, useCallback, useMemo, useReducer,
} from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";

// ─── Icons (inline SVG — zero extra deps) ────────────────────────────────────
const Icon = ({ d, size = 20, className = "", strokeWidth = 1.5, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round"
    strokeLinejoin="round" className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const ICONS = {
  close:     "M18 6 6 18M6 6l12 12",
  flip:      "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  capture:   null,
  flash:     "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  flashOff:  "M17.97 4.03A9 9 0 0 0 3.22 17.23M8 8l-4 9h9l-1 8 10-12H13l1-8zM22 2 2 22",
  grid:      "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  settings:  "M12 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0 14c-6.627 0-8 2.015-8 3v1h16v-1c0-.985-1.373-3-8-3z",
  download:  "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
  timer:     "M12 2a10 10 0 110 20A10 10 0 0112 2zm0 6v4l3 3",
  burst:     "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18",
  hdr:       "M4 6h16M4 12h16M4 18h7",
  portrait:  "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 110 8 4 4 0 010-8z",
  night:     "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z",
  video:     "M15 10l4.553-2.277A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z",
  photo:     "M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z",
  ai:        "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2",
  zoom:      "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7",
  gallery:   "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  film:      "M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z",
  brain:     "M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z",
  scan:      "M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2",
};

// ─── Camera modes ────────────────────────────────────────────────────────────
const MODES = [
  { id: "portrait",   label: "PORTRAIT",   icon: ICONS.portrait, color: "#f472b6" },
  { id: "photo",      label: "PHOTO",       icon: ICONS.photo,    color: "#60a5fa" },
  { id: "video",      label: "VIDEO",       icon: ICONS.video,    color: "#f87171" },
  { id: "night",      label: "NIGHT",       icon: ICONS.night,    color: "#818cf8" },
  { id: "pro",        label: "PRO",         icon: ICONS.settings, color: "#34d399" },
  { id: "ai",         label: "AI",          icon: ICONS.ai,       color: "#fb923c" },
  { id: "burst",      label: "BURST",       icon: ICONS.burst,    color: "#facc15" },
  { id: "cinematic",  label: "CINEMATIC",   icon: ICONS.film,     color: "#a78bfa" },
];

// ─── AI scene labels ──────────────────────────────────────────────────────────
const AI_SCENES = ["Portrait", "Landscape", "Food", "Night Scene", "Architecture",
  "Macro", "Motion", "Text", "Low Light", "Backlit"];

// ─── Canvas filter stacks per mode ───────────────────────────────────────────
const FILTERS = {
  photo:     "",
  portrait:  "saturate(1.15) contrast(1.05)",
  night:     "brightness(1.35) saturate(0.85) contrast(1.1)",
  ai:        "saturate(1.3) contrast(1.08) brightness(1.05)",
  pro:       "",
  burst:     "",
  video:     "",
  cinematic: "contrast(1.2) saturate(0.75) brightness(0.95)",
};

// ─── Overlay effects per mode ─────────────────────────────────────────────────
const OVERLAYS = {
  cinematic: { bars: true,  vignette: true,  grain: false, tint: null },
  night:     { bars: false, vignette: true,  grain: true,  tint: "rgba(20,10,60,0.18)" },
  portrait:  { bars: false, vignette: true,  grain: false, tint: null },
  ai:        { bars: false, vignette: false, grain: false, tint: null },
};

// ─── State reducer ────────────────────────────────────────────────────────────
const initialState = {
  mode:           "photo",
  facingMode:     "environment",
  flashMode:      "off",       // off | on | auto
  zoom:           1,
  timer:          0,           // 0 | 3 | 10
  hdr:            false,
  gridEnabled:    false,
  isRecording:    false,
  recordSeconds:  0,
  capturedImages: [],
  timerCountdown: null,
  fps:            0,
  brightness:     0,           // -50 to +50
  contrast:       0,
  saturation:     0,
  exposure:       0,
  iso:            "auto",
  shutterSpeed:   "auto",
  whiteBalance:   "auto",
  aiScene:        null,
  faceCount:      0,
  showSettings:   false,
  showGallery:    false,
  showDevPanel:   false,
  scanMode:       false,       // edge-detection / neural overlay
  isFullscreen:   false,
  notification:   null,
  burstCount:     0,
  beautyLevel:    0,
  depthEnabled:   false,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET": return { ...state, ...action.payload };
    case "TOGGLE": return { ...state, [action.key]: !state[action.key] };
    case "ADD_IMAGE": return { ...state, capturedImages: [action.img, ...state.capturedImages].slice(0, 30) };
    case "NOTIFY": return { ...state, notification: action.msg };
    default: return state;
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const rand  = (lo, hi) => Math.floor(Math.random() * (hi - lo + 1)) + lo;

// ─── Main component ───────────────────────────────────────────────────────────
const Camera = ({ onClose }) => {
  const [st, dispatch] = useReducer(reducer, initialState);
  const set  = useCallback((payload) => dispatch({ type: "SET",    payload }), []);
  const tog  = useCallback((key)     => dispatch({ type: "TOGGLE", key }),     []);
  const note = useCallback((msg)     => {
    dispatch({ type: "NOTIFY", msg });
    setTimeout(() => dispatch({ type: "NOTIFY", msg: null }), 2800);
  }, []);

  // Refs
  const videoRef      = useRef(null);
  const canvasRef     = useRef(null);
  const overlayRef    = useRef(null);    // canvas for AI overlays
  const streamRef     = useRef(null);
  const animFrameRef  = useRef(null);
  const recTimerRef   = useRef(null);
  const mediaRecRef   = useRef(null);
  const recChunks     = useRef([]);
  const fpsFrames     = useRef([]);
  const timerRef      = useRef(null);
  const rootRef       = useRef(null);

  // Motion values for zoom gesture
  const zoomMV = useMotionValue(st.zoom);
  const zoomSpring = useSpring(zoomMV, { stiffness: 200, damping: 22 });

  // ── Start camera stream ───────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const constraints = {
        video: {
          facingMode: st.facingMode,
          width:  { ideal: 3840, min: 1280 },
          height: { ideal: 2160, min: 720 },
          frameRate: { ideal: 60, min: 30 },
        },
        audio: st.mode === "video",
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      note(`Camera ready · ${st.facingMode === "environment" ? "Rear" : "Front"}`);
    } catch (err) {
      note("⚠ Camera access denied");
    }
  }, [st.facingMode, st.mode, note]);

  useEffect(() => { startCamera(); }, [st.facingMode]);

  // Clean up on unmount
  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    cancelAnimationFrame(animFrameRef.current);
    clearInterval(recTimerRef.current);
    clearTimeout(timerRef.current);
  }, []);

  // ── FPS monitor loop ──────────────────────────────────────────────
  useEffect(() => {
    let id;
    const loop = (now) => {
      fpsFrames.current.push(now);
      fpsFrames.current = fpsFrames.current.filter((t) => now - t < 1000);
      set({ fps: fpsFrames.current.length });
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [set]);

  // ── AI scene simulation ───────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      if (st.mode === "ai" || st.mode === "photo") {
        set({ aiScene: AI_SCENES[rand(0, AI_SCENES.length - 1)], faceCount: rand(0, 3) });
      }
    }, 3500);
    return () => clearInterval(id);
  }, [st.mode, set]);

  // ── Canvas overlay renderer (AI boxes, scan lines, focus ring) ───
  useEffect(() => {
    const canvas = overlayRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let id;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (st.mode === "ai" && st.faceCount > 0) {
        // Simulated face-detection boxes
        ctx.strokeStyle = "#00f5d4";
        ctx.lineWidth   = 1.5;
        ctx.font        = "11px 'SF Mono', monospace";
        ctx.fillStyle   = "#00f5d4";
        for (let i = 0; i < st.faceCount; i++) {
          const bx = 80 + i * 140, by = 100 + (i % 2) * 60, bw = 110, bh = 130;
          // Corner brackets only (Apple-style)
          const cs = 18;
          [[bx,by],[bx+bw,by],[bx,by+bh],[bx+bw,by+bh]].forEach(([cx,cy],qi) => {
            ctx.beginPath();
            ctx.moveTo(cx + (qi % 2 === 0 ? cs : -cs), cy);
            ctx.lineTo(cx, cy);
            ctx.lineTo(cx, cy + (qi < 2 ? cs : -cs));
            ctx.stroke();
          });
          ctx.fillText(`Face ${i + 1} · 98%`, bx + 2, by - 6);
        }
      }

      if (st.scanMode) {
        // Scanline sweep
        const now = performance.now();
        const y   = ((now * 0.15) % canvas.height);
        const grad = ctx.createLinearGradient(0, y - 40, 0, y + 40);
        grad.addColorStop(0,   "rgba(0,245,212,0)");
        grad.addColorStop(0.5, "rgba(0,245,212,0.35)");
        grad.addColorStop(1,   "rgba(0,245,212,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, y - 40, canvas.width, 80);

        // Corner crosshairs
        ctx.strokeStyle = "rgba(0,245,212,0.5)";
        ctx.lineWidth = 1;
        [[20,20],[canvas.width-20,20],[20,canvas.height-20],[canvas.width-20,canvas.height-20]].forEach(([cx,cy]) => {
          ctx.beginPath(); ctx.moveTo(cx - 12, cy); ctx.lineTo(cx + 12, cy); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx, cy - 12); ctx.lineTo(cx, cy + 12); ctx.stroke();
        });

        ctx.font = "10px 'SF Mono', monospace";
        ctx.fillStyle = "rgba(0,245,212,0.7)";
        ctx.fillText(`NEURAL SCAN · ${canvas.width}×${canvas.height}`, 20, canvas.height - 14);
      }

      id = requestAnimationFrame(draw);
    };
    id = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(id);
  }, [st.mode, st.faceCount, st.scanMode]);

  // ── CSS filter pipeline ───────────────────────────────────────────
  const liveFilter = useMemo(() => {
    const base   = FILTERS[st.mode] || "";
    const bright = `brightness(${1 + st.brightness / 100})`;
    const cont   = `contrast(${1 + st.contrast / 100})`;
    const sat    = `saturate(${1 + st.saturation / 100})`;
    const beauty = st.beautyLevel > 0 ? `blur(${st.beautyLevel * 0.3}px) saturate(${1 + st.beautyLevel * 0.01})` : "";
    return `${bright} ${cont} ${sat} ${base} ${beauty}`.trim();
  }, [st.mode, st.brightness, st.contrast, st.saturation, st.beautyLevel]);

  // ── Capture photo ─────────────────────────────────────────────────
  const capturePhoto = useCallback((fromBurst = false) => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width  = video.videoWidth  || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");

    if (st.mode === "night") {
      // Simulated multi-frame HDR night merge
      for (let f = 0; f < 4; f++) {
        ctx.globalAlpha = 0.25;
        ctx.filter      = `brightness(${1.2 + f * 0.15}) ${liveFilter}`;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
      ctx.globalAlpha = 1;
      ctx.filter      = "";
    } else {
      ctx.filter = liveFilter;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.filter = "";
    }

    // Cinematic bars baked into photo
    if (st.mode === "cinematic") {
      const barH = canvas.height * 0.08;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, barH);
      ctx.fillRect(0, canvas.height - barH, canvas.width, barH);
    }

    // Timestamp watermark in pro mode
    if (st.mode === "pro") {
      ctx.font      = "14px 'SF Mono', monospace";
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      ctx.fillText(new Date().toISOString(), 16, canvas.height - 16);
    }

    const dataUrl = canvas.toDataURL("image/jpeg", 0.96);
    dispatch({ type: "ADD_IMAGE", img: { src: dataUrl, mode: st.mode, ts: Date.now() } });
    if (!fromBurst) note(`✓ Captured · ${st.mode.toUpperCase()}`);
  }, [st.mode, liveFilter, note]);

  // ── Burst mode ────────────────────────────────────────────────────
  const captureBurst = useCallback(async () => {
    set({ burstCount: 0 });
    note("Burst: capturing 10 frames…");
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 80));
      capturePhoto(true);
      set({ burstCount: i + 1 });
    }
    note("✓ Burst complete — 10 frames");
    set({ burstCount: 0 });
  }, [capturePhoto, set, note]);

  // ── Timer capture ─────────────────────────────────────────────────
  const startTimerCapture = useCallback(() => {
    if (!st.timer) { capturePhoto(); return; }
    let count = st.timer;
    set({ timerCountdown: count });
    timerRef.current = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(timerRef.current);
        set({ timerCountdown: null });
        capturePhoto();
      } else {
        set({ timerCountdown: count });
      }
    }, 1000);
  }, [st.timer, capturePhoto, set]);

  // ── Shutter handler ───────────────────────────────────────────────
  const handleShutter = useCallback(() => {
    if (st.mode === "video") {
      if (st.isRecording) {
        mediaRecRef.current?.stop();
        clearInterval(recTimerRef.current);
        set({ isRecording: false, recordSeconds: 0 });
        note("✓ Video saved");
      } else {
        const stream = streamRef.current;
        if (!stream) return;
        recChunks.current = [];
        const mr = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" });
        mr.ondataavailable = (e) => recChunks.current.push(e.data);
        mr.onstop = () => {
          const blob = new Blob(recChunks.current, { type: "video/webm" });
          const url  = URL.createObjectURL(blob);
          const a    = document.createElement("a");
          a.href = url; a.download = `neural-cam-${Date.now()}.webm`; a.click();
        };
        mr.start(100);
        mediaRecRef.current = mr;
        set({ isRecording: true, recordSeconds: 0 });
        recTimerRef.current = setInterval(() => set({ recordSeconds: s => s + 1 }), 1000);
      }
    } else if (st.mode === "burst") {
      captureBurst();
    } else {
      startTimerCapture();
    }
  }, [st.mode, st.isRecording, capturePhoto, captureBurst, startTimerCapture, set, note]);

  // ── Flip camera ───────────────────────────────────────────────────
  const flipCamera = useCallback(() => {
    set({ facingMode: st.facingMode === "environment" ? "user" : "environment" });
  }, [st.facingMode, set]);

  // ── Zoom via pinch (touch) ────────────────────────────────────────
  const touchStartRef = useRef(null);
  const onTouchStart  = (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartRef.current = { dist: Math.hypot(dx, dy), zoom: st.zoom };
    }
  };
  const onTouchMove = (e) => {
    if (e.touches.length === 2 && touchStartRef.current) {
      const dx   = e.touches[0].clientX - e.touches[1].clientX;
      const dy   = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const newZ = clamp(touchStartRef.current.zoom * (dist / touchStartRef.current.dist), 1, 5);
      set({ zoom: parseFloat(newZ.toFixed(2)) });
      zoomMV.set(newZ);
    }
  };

  // ── Tap-to-focus ──────────────────────────────────────────────────
  const [focusRing, setFocusRing] = useState(null);
  const handleTapFocus = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setFocusRing({ x, y, key: Date.now() });
    setTimeout(() => setFocusRing(null), 900);
  };

  // ── Record timer display ──────────────────────────────────────────
  const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ── Flashlight ───────────────────────────────────────────────────
  const toggleFlashlight = useCallback(async () => {
    const next = st.flashMode === "off" ? "on" : st.flashMode === "on" ? "auto" : "off";
    set({ flashMode: next });
    try {
      const track = streamRef.current?.getVideoTracks()[0];
      if (track?.getCapabilities()?.torch) {
        await track.applyConstraints({ advanced: [{ torch: next === "on" }] });
      }
    } catch {}
    note(`Flash: ${next.toUpperCase()}`);
  }, [st.flashMode, set, note]);

  // ── Download last photo ───────────────────────────────────────────
  const downloadLast = useCallback(() => {
    if (!st.capturedImages.length) return;
    const a    = document.createElement("a");
    a.href     = st.capturedImages[0].src;
    a.download = `neural-cam-${Date.now()}.jpg`;
    a.click();
    note("✓ Downloaded");
  }, [st.capturedImages, note]);

  // ── PRO controls row ──────────────────────────────────────────────
  const PRO_CONTROLS = [
    { label: "EV",    key: "exposure",    min: -3, max: 3,  step: 0.1, unit: "" },
    { label: "BR",    key: "brightness",  min: -50, max: 50, step: 1,  unit: "" },
    { label: "CT",    key: "contrast",    min: -50, max: 50, step: 1,  unit: "" },
    { label: "SAT",   key: "saturation",  min: -50, max: 50, step: 1,  unit: "" },
  ];

  const modeColor = MODES.find((m) => m.id === st.mode)?.color ?? "#60a5fa";
  const overlay   = OVERLAYS[st.mode] || {};

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        background: "#000",
        fontFamily: "'SF Pro Display', '-apple-system', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* ── Hidden canvases ──────────────────────────────────────── */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ══════════════════════════════════════════════════════════
          MAIN VIEWFINDER
         ══════════════════════════════════════════════════════════ */}
      <div
        className="relative flex-1 overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onClick={handleTapFocus}
      >
        {/* Video feed */}
        <video
          ref={videoRef}
          autoPlay playsInline muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            filter:    liveFilter,
            transform: `scaleX(${st.facingMode === "user" ? -1 : 1}) scale(${st.zoom})`,
            transition: "transform 0.12s ease-out, filter 0.3s ease",
          }}
        />

        {/* AI overlay canvas */}
        <canvas
          ref={overlayRef}
          width={typeof window !== "undefined" ? window.innerWidth : 1280}
          height={typeof window !== "undefined" ? window.innerHeight : 720}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 3 }}
        />

        {/* Cinematic letterbox bars */}
        <AnimatePresence>
          {overlay.bars && (
            <>
              <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} exit={{ scaleY: 0 }}
                style={{ originY: 0 }}
                className="absolute top-0 left-0 right-0 bg-black pointer-events-none z-10"
                transition={{ duration: 0.4, ease: [0.16,1,0.3,1] }}
                {...{ style: { height: "8.5%", background: "#000", zIndex: 10, originY: 0, position: "absolute", top: 0, left: 0, right: 0 } }}
              />
              <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} exit={{ scaleY: 0 }}
                className="absolute bottom-0 left-0 right-0 bg-black pointer-events-none"
                transition={{ duration: 0.4, ease: [0.16,1,0.3,1] }}
                {...{ style: { height: "8.5%", background: "#000", zIndex: 10, position: "absolute", bottom: 0, left: 0, right: 0 } }}
              />
            </>
          )}
        </AnimatePresence>

        {/* Night / vignette overlay */}
        {overlay.vignette && (
          <div className="absolute inset-0 pointer-events-none" style={{
            zIndex: 4,
            background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)",
          }} />
        )}

        {/* Grain overlay */}
        {overlay.grain && (
          <div className="absolute inset-0 pointer-events-none" style={{
            zIndex: 4,
            opacity: 0.12,
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
          }} />
        )}

        {/* Grid lines */}
        {st.gridEnabled && (
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
            {[33, 66].map((p) => (
              <React.Fragment key={p}>
                <div style={{ position: "absolute", left: `${p}%`, top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.2)" }} />
                <div style={{ position: "absolute", top: `${p}%`, left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.2)" }} />
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Tap-to-focus ring */}
        <AnimatePresence>
          {focusRing && (
            <motion.div
              key={focusRing.key}
              initial={{ scale: 1.8, opacity: 1 }}
              animate={{ scale: 1,   opacity: 1 }}
              exit={{   scale: 0.9,  opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              style={{
                position: "absolute",
                left:     focusRing.x - 28,
                top:      focusRing.y - 28,
                width: 56, height: 56,
                border: `1.5px solid ${modeColor}`,
                borderRadius: 4,
                zIndex: 20,
              }}
            >
              {/* Corner ticks */}
              {[[0,0],[1,0],[0,1],[1,1]].map(([rx,ry], i) => (
                <div key={i} style={{
                  position: "absolute",
                  [rx ? "right" : "left"]: -1, [ry ? "bottom" : "top"]: -1,
                  width: 8, height: 8,
                  borderRight:  rx ? `2px solid ${modeColor}` : "none",
                  borderLeft:   !rx ? `2px solid ${modeColor}` : "none",
                  borderBottom: ry ? `2px solid ${modeColor}` : "none",
                  borderTop:    !ry ? `2px solid ${modeColor}` : "none",
                }} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timer countdown overlay */}
        <AnimatePresence>
          {st.timerCountdown !== null && (
            <motion.div
              key={st.timerCountdown}
              initial={{ scale: 1.4, opacity: 0 }}
              animate={{ scale: 1,   opacity: 1 }}
              exit={{   scale: 0.6,  opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ zIndex: 30 }}
            >
              <span style={{
                fontSize: 96, fontWeight: 700, color: modeColor,
                textShadow: `0 0 40px ${modeColor}88, 0 0 80px ${modeColor}44`,
              }}>
                {st.timerCountdown}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Burst counter */}
        <AnimatePresence>
          {st.burstCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="absolute bottom-1/2 left-1/2 -translate-x-1/2 pointer-events-none"
              style={{ zIndex: 30 }}
            >
              <span style={{
                fontSize: 18, fontWeight: 700, color: "#facc15",
                background: "rgba(0,0,0,0.6)", padding: "6px 16px", borderRadius: 20,
              }}>
                BURST {st.burstCount}/10
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ DYNAMIC ISLAND-STYLE NOTIFICATION ══ */}
        <AnimatePresence>
          {st.notification && (
            <motion.div
              initial={{ y: -60, scale: 0.85, opacity: 0 }}
              animate={{ y: 0,   scale: 1,    opacity: 1 }}
              exit={{   y: -40,  scale: 0.9,  opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              style={{
                position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)",
                background: "rgba(20,20,28,0.92)",
                backdropFilter: "blur(20px)",
                border: `1px solid ${modeColor}44`,
                borderRadius: 20, padding: "8px 18px",
                color: "#fff", fontSize: 13, fontWeight: 500,
                zIndex: 50, whiteSpace: "nowrap",
                boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px ${modeColor}22`,
              }}
            >
              <span style={{ color: modeColor, marginRight: 6 }}>●</span>
              {st.notification}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ TOP HUD ══ */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, zIndex: 20,
          padding: "12px 16px",
          background: "linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, transparent 100%)",
        }}>
          <div className="flex items-center justify-between">
            {/* Left: close + flash */}
            <div className="flex items-center gap-3">
              <button onClick={onClose}
                style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                <Icon d={ICONS.close} size={16} />
              </button>
              <button onClick={toggleFlashlight}
                style={{ width: 36, height: 36, borderRadius: "50%", background: st.flashMode !== "off" ? modeColor + "44" : "rgba(255,255,255,0.12)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: st.flashMode !== "off" ? modeColor : "#fff" }}>
                <Icon d={st.flashMode !== "off" ? ICONS.flash : ICONS.flashOff} size={16} />
              </button>
              <button onClick={() => tog("gridEnabled")}
                style={{ width: 36, height: 36, borderRadius: "50%", background: st.gridEnabled ? modeColor + "44" : "rgba(255,255,255,0.12)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: st.gridEnabled ? modeColor : "#fff" }}>
                <Icon d={ICONS.grid} size={16} />
              </button>
            </div>

            {/* Center: AI scene tag */}
            {st.aiScene && (
              <motion.div
                key={st.aiScene}
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{
                  background: "rgba(0,0,0,0.55)", backdropFilter: "blur(12px)",
                  borderRadius: 12, padding: "4px 12px",
                  border: `1px solid ${modeColor}55`,
                  fontSize: 11, fontWeight: 600, color: modeColor,
                  letterSpacing: "0.06em",
                }}
              >
                ✦ {st.aiScene.toUpperCase()}
              </motion.div>
            )}

            {/* Right: stats + HDR + scan */}
            <div className="flex items-center gap-2">
              {/* HDR toggle */}
              <button onClick={() => tog("hdr")}
                style={{ padding: "4px 10px", borderRadius: 8, background: st.hdr ? modeColor + "44" : "rgba(255,255,255,0.12)", border: "none", cursor: "pointer", color: st.hdr ? modeColor : "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em" }}>
                HDR
              </button>
              {/* Scan mode */}
              <button onClick={() => tog("scanMode")}
                style={{ width: 36, height: 36, borderRadius: "50%", background: st.scanMode ? "#00f5d4" + "33" : "rgba(255,255,255,0.12)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: st.scanMode ? "#00f5d4" : "#fff" }}>
                <Icon d={ICONS.scan} size={16} />
              </button>
              {/* FPS badge */}
              <div style={{
                padding: "3px 8px", borderRadius: 8, background: "rgba(0,0,0,0.55)",
                fontSize: 10, fontWeight: 700, color: st.fps >= 50 ? "#4ade80" : "#facc15",
                letterSpacing: "0.06em",
              }}>
                {st.fps}fps
              </div>
            </div>
          </div>
        </div>

        {/* ══ RECORDING BADGE ══ */}
        <AnimatePresence>
          {st.isRecording && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              style={{
                position: "absolute", top: 70, left: "50%", transform: "translateX(-50%)",
                background: "rgba(0,0,0,0.75)", borderRadius: 16,
                display: "flex", alignItems: "center", gap: 8,
                padding: "6px 14px", zIndex: 20,
              }}
            >
              <motion.div
                animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }}
                style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
              <span style={{ color: "#fff", fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                {fmtTime(st.recordSeconds)}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ ZOOM LEVEL PILL ══ */}
        {st.zoom !== 1 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            style={{
              position: "absolute", bottom: "38%", left: "50%", transform: "translateX(-50%)",
              background: "rgba(0,0,0,0.6)", borderRadius: 16, padding: "4px 14px",
              color: "#fff", fontSize: 14, fontWeight: 600, zIndex: 20,
            }}
          >
            {st.zoom.toFixed(1)}×
          </motion.div>
        )}

        {/* ══ GALLERY THUMBNAIL (bottom-left) ══ */}
        {st.capturedImages.length > 0 && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); set({ showGallery: true }); }}
            style={{
              position: "absolute", bottom: 140, left: 20, zIndex: 20,
              width: 52, height: 52, borderRadius: 10, overflow: "hidden",
              border: "2px solid rgba(255,255,255,0.6)", cursor: "pointer",
              background: "#000",
            }}
          >
            <img src={st.capturedImages[0].src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            {st.capturedImages.length > 1 && (
              <div style={{ position: "absolute", bottom: 2, right: 4, color: "#fff", fontSize: 9, fontWeight: 700, textShadow: "0 1px 3px #000" }}>
                +{st.capturedImages.length - 1}
              </div>
            )}
          </motion.button>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          PRO CONTROLS (shows when mode = "pro")
         ══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {st.mode === "pro" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ background: "rgba(12,12,16,0.97)", overflow: "hidden", flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-center gap-4 px-4 py-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {PRO_CONTROLS.map(({ label, key, min, max, step }) => (
                <div key={key} style={{ flexShrink: 0, textAlign: "center", minWidth: 80 }}>
                  <div style={{ color: modeColor, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 4 }}>
                    {label} {st[key] > 0 ? "+" : ""}{st[key]}
                  </div>
                  <input
                    type="range" min={min} max={max} step={step}
                    value={st[key]}
                    onChange={(e) => set({ [key]: parseFloat(e.target.value) })}
                    style={{ width: 80, accentColor: modeColor }}
                  />
                </div>
              ))}
              {/* Beauty slider */}
              <div style={{ flexShrink: 0, textAlign: "center", minWidth: 80 }}>
                <div style={{ color: "#f472b6", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 4 }}>
                  BEAUTY {st.beautyLevel}
                </div>
                <input type="range" min={0} max={10} step={1} value={st.beautyLevel}
                  onChange={(e) => set({ beautyLevel: parseInt(e.target.value) })}
                  style={{ width: 80, accentColor: "#f472b6" }} />
              </div>
              {/* ISO */}
              <div style={{ flexShrink: 0, textAlign: "center", minWidth: 80 }}>
                <div style={{ color: "#facc15", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 4 }}>
                  ISO
                </div>
                <select value={st.iso} onChange={(e) => set({ iso: e.target.value })}
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: 6, padding: "2px 6px", fontSize: 11, cursor: "pointer" }}>
                  {["auto","100","200","400","800","1600","3200"].map((v) => (
                    <option key={v} value={v} style={{ background: "#111" }}>{v}</option>
                  ))}
                </select>
              </div>
              {/* WB */}
              <div style={{ flexShrink: 0, textAlign: "center", minWidth: 80 }}>
                <div style={{ color: "#60a5fa", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 4 }}>
                  WB
                </div>
                <select value={st.whiteBalance} onChange={(e) => set({ whiteBalance: e.target.value })}
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: 6, padding: "2px 6px", fontSize: 11, cursor: "pointer" }}>
                  {["auto","sunny","cloudy","shade","tungsten","fluorescent"].map((v) => (
                    <option key={v} value={v} style={{ background: "#111" }}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════
          MODE CAROUSEL
         ══════════════════════════════════════════════════════════ */}
      <div style={{ background: "rgba(0,0,0,0.85)", flexShrink: 0, paddingTop: 10, paddingBottom: 6 }}>
        <div className="flex items-center justify-center gap-1 overflow-x-auto px-4"
          style={{ scrollbarWidth: "none" }}>
          {MODES.map((m) => (
            <motion.button
              key={m.id}
              onClick={() => { set({ mode: m.id }); note(`Mode: ${m.label}`); }}
              whileTap={{ scale: 0.94 }}
              style={{
                flexShrink: 0,
                padding: "5px 13px", borderRadius: 16,
                background: st.mode === m.id ? m.color + "28" : "transparent",
                border: st.mode === m.id ? `1px solid ${m.color}66` : "1px solid transparent",
                cursor: "pointer",
                transition: "all 0.18s",
              }}
            >
              <span style={{
                fontSize: 11, fontWeight: st.mode === m.id ? 700 : 400,
                letterSpacing: "0.08em",
                color: st.mode === m.id ? m.color : "rgba(255,255,255,0.45)",
              }}>
                {m.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          BOTTOM CONTROLS
         ══════════════════════════════════════════════════════════ */}
      <div style={{
        background: "rgba(0,0,0,0.92)",
        backdropFilter: "blur(20px)",
        flexShrink: 0,
        paddingBottom: "env(safe-area-inset-bottom, 16px)",
      }}>
        {/* Zoom bar */}
        <div className="flex items-center justify-center gap-3 py-2 px-4">
          {[1, 1.5, 2, 3, 5].map((z) => (
            <motion.button
              key={z}
              onClick={() => { set({ zoom: z }); zoomMV.set(z); }}
              whileTap={{ scale: 0.9 }}
              style={{
                width: st.zoom === z ? 46 : 36,
                height: st.zoom === z ? 46 : 36,
                borderRadius: "50%",
                background: st.zoom === z ? modeColor + "33" : "rgba(255,255,255,0.08)",
                border: st.zoom === z ? `1.5px solid ${modeColor}` : "1px solid rgba(255,255,255,0.12)",
                color: st.zoom === z ? modeColor : "rgba(255,255,255,0.55)",
                fontSize: st.zoom === z ? 13 : 11,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.18s",
                flexShrink: 0,
              }}
            >
              {z}×
            </motion.button>
          ))}
        </div>

        {/* Shutter row */}
        <div className="flex items-center justify-between px-8 pb-4" style={{ minHeight: 96 }}>
          {/* Left: download / timer */}
          <div className="flex flex-col items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={downloadLast}
              disabled={!st.capturedImages.length}
              style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: st.capturedImages.length ? "#fff" : "rgba(255,255,255,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: st.capturedImages.length ? "pointer" : "default",
              }}
            >
              <Icon d={ICONS.download} size={18} />
            </motion.button>
            {/* Timer cycle */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                const next = st.timer === 0 ? 3 : st.timer === 3 ? 10 : 0;
                set({ timer: next });
                note(next === 0 ? "Timer off" : `Timer: ${next}s`);
              }}
              style={{
                width: 44, height: 44, borderRadius: "50%",
                background: st.timer > 0 ? modeColor + "33" : "rgba(255,255,255,0.1)",
                border: `1px solid ${st.timer > 0 ? modeColor + "66" : "rgba(255,255,255,0.15)"}`,
                color: st.timer > 0 ? modeColor : "rgba(255,255,255,0.55)",
                fontSize: 11, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
            >
              {st.timer === 0 ? <Icon d={ICONS.timer} size={17} /> : `${st.timer}s`}
            </motion.button>
          </div>

          {/* CENTER: Shutter button */}
          <motion.button
            onClick={handleShutter}
            whileTap={{ scale: 0.92 }}
            style={{
              width: 76, height: 76, borderRadius: "50%", cursor: "pointer",
              border: `3px solid ${st.mode === "video" && st.isRecording ? "#ef4444" : "#ffffff"}`,
              padding: 4,
              background: "transparent",
              flexShrink: 0,
            }}
          >
            <motion.div
              animate={{
                scale:        st.mode === "burst" ? [1, 1.08, 1] : 1,
                borderRadius: st.mode === "video" && st.isRecording ? "8px" : "50%",
                background:   st.mode === "video"
                  ? (st.isRecording ? "#ef4444" : "#ef4444cc")
                  : modeColor,
              }}
              transition={{ duration: 0.2 }}
              style={{ width: "100%", height: "100%", borderRadius: "50%" }}
            />
          </motion.button>

          {/* Right: flip + gallery count */}
          <div className="flex flex-col items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9, rotate: 180 }}
              onClick={flipCamera}
              style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Icon d={ICONS.flip} size={18} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => set({ showDevPanel: !st.showDevPanel })}
              style={{
                width: 44, height: 44, borderRadius: "50%",
                background: st.showDevPanel ? modeColor + "33" : "rgba(255,255,255,0.1)",
                border: `1px solid ${st.showDevPanel ? modeColor + "66" : "rgba(255,255,255,0.15)"}`,
                color: st.showDevPanel ? modeColor : "rgba(255,255,255,0.55)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Icon d={ICONS.brain} size={17} />
            </motion.button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          DEV ANALYTICS PANEL
         ══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {st.showDevPanel && (
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed", top: 0, right: 0, bottom: 0, width: 260, zIndex: 60,
              background: "rgba(8,8,14,0.97)",
              backdropFilter: "blur(28px)",
              borderLeft: "1px solid rgba(255,255,255,0.07)",
              overflowY: "auto", padding: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <span style={{ color: "#00f5d4", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em" }}>
                ⬡ NEURAL DIAGNOSTICS
              </span>
              <button onClick={() => set({ showDevPanel: false })} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
                <Icon d={ICONS.close} size={16} />
              </button>
            </div>

            {[
              { label: "RENDER FPS",    value: `${st.fps} fps`,       color: st.fps >= 50 ? "#4ade80" : "#facc15" },
              { label: "ZOOM",          value: `${st.zoom.toFixed(2)}×`, color: modeColor },
              { label: "MODE",          value: st.mode.toUpperCase(), color: modeColor },
              { label: "FLASH",         value: st.flashMode.toUpperCase(), color: "#facc15" },
              { label: "FACES",         value: `${st.faceCount} detected`, color: "#f472b6" },
              { label: "AI SCENE",      value: st.aiScene || "—",     color: "#fb923c" },
              { label: "HDR",           value: st.hdr ? "ON" : "OFF", color: st.hdr ? "#4ade80" : "#6b7280" },
              { label: "SCAN MODE",     value: st.scanMode ? "ACTIVE" : "OFF", color: st.scanMode ? "#00f5d4" : "#6b7280" },
              { label: "CAPTURES",      value: `${st.capturedImages.length} photos`, color: "#a78bfa" },
              { label: "BRIGHTNESS",    value: st.brightness,         color: "#60a5fa" },
              { label: "CONTRAST",      value: st.contrast,           color: "#60a5fa" },
              { label: "SATURATION",    value: st.saturation,         color: "#60a5fa" },
              { label: "BEAUTY",        value: st.beautyLevel,        color: "#f472b6" },
              { label: "ISO",           value: st.iso,                color: "#facc15" },
              { label: "WHITE BALANCE", value: st.whiteBalance,       color: "#60a5fa" },
              { label: "TIMER",         value: st.timer === 0 ? "OFF" : `${st.timer}s`, color: "#fb923c" },
              { label: "FACING",        value: st.facingMode === "environment" ? "REAR" : "FRONT", color: "#34d399" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}>
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em" }}>{label}</span>
                <span style={{ color, fontSize: 11, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{String(value)}</span>
              </div>
            ))}

            {/* CSS filter display */}
            <div style={{ marginTop: 16, padding: 10, background: "rgba(255,255,255,0.04)", borderRadius: 8 }}>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 6 }}>ACTIVE FILTER PIPELINE</div>
              <div style={{ color: "#00f5d4", fontSize: 10, wordBreak: "break-all", lineHeight: 1.6 }}>
                {liveFilter || "none"}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════
          GALLERY MODAL
         ══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {st.showGallery && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, zIndex: 70,
              background: "rgba(0,0,0,0.92)",
              backdropFilter: "blur(24px)",
            }}
            onClick={() => set({ showGallery: false })}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", damping: 24, stiffness: 260 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                background: "rgba(14,14,20,0.98)",
                borderRadius: "20px 20px 0 0",
                padding: 20, maxHeight: "80vh", overflowY: "auto",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>
                  Gallery · {st.capturedImages.length} Photos
                </span>
                <button onClick={() => set({ showGallery: false })} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>
                  <Icon d={ICONS.close} size={20} />
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
                {st.capturedImages.map((img, i) => (
                  <motion.div key={img.ts} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                    style={{ position: "relative", aspectRatio: "1", borderRadius: 8, overflow: "hidden", cursor: "pointer" }}
                    onClick={() => { const a = document.createElement("a"); a.href = img.src; a.download = `neural-${img.ts}.jpg`; a.click(); }}
                  >
                    <img src={img.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{
                      position: "absolute", bottom: 4, left: 4,
                      padding: "2px 6px", borderRadius: 6,
                      background: "rgba(0,0,0,0.6)",
                      color: MODES.find((m) => m.id === img.mode)?.color ?? "#fff",
                      fontSize: 8, fontWeight: 700, letterSpacing: "0.06em",
                    }}>
                      {img.mode?.toUpperCase()}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Camera;