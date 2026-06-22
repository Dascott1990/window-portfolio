"use client";
/**
 * MapApp.js — "The Kindness Map" (clean layout rebuild)
 *
 * Layout: single top bar + right action rail + bottom tray.
 * Only one tray panel is ever visible at a time — no overlapping UI.
 * Panels: PLACES (warmth finder), STORY (AI narration), PIN (drop),
 *         MY PINS (saved notes). Layer toggles live inside the PLACES panel.
 *
 * Real data: Nominatim geocoding, Overpass API for public amenities,
 * /api/v1/ai/chat for AI narration, localStorage for saved pins.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
const PINS_KEY = "kindness_map_pins_v1";

const Map = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div style={{ flex: 1, background: "#0d1117", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid #4ade80", borderTopColor: "transparent", animation: "spin 0.9s linear infinite" }} />
    </div>
  ),
});

// ── Tokens ──────────────────────────────────────────────────────────────────
const C = {
  bg:      "#0B0F14",
  glass:   "rgba(13,18,26,0.88)",
  glassHi: "rgba(20,28,40,0.95)",
  border:  "rgba(255,255,255,0.09)",
  paper:   "#DDE8D8",
  muted:   "#6B8060",
  faint:   "rgba(107,128,96,0.55)",
  green:   "#4ade80",
  greenBg: "rgba(74,222,128,0.12)",
  amber:   "#fbbf24",
  amberBg: "rgba(251,191,36,0.12)",
  blue:    "#60a5fa",
  blueBg:  "rgba(96,165,250,0.12)",
  rose:    "#fb7185",
  roseBg:  "rgba(251,113,133,0.12)",
  sans:    "'Inter', -apple-system, sans-serif",
  mono:    "'JetBrains Mono', 'SF Mono', monospace",
  serif:   "'Fraunces', Georgia, serif",
};

const WARMTH_LAYERS = [
  { id: "library",  label: "Libraries",   emoji: "📚", color: C.blue,  bg: C.blueBg,  tag: "amenity=library" },
  { id: "park",     label: "Parks",       emoji: "🌳", color: C.green, bg: C.greenBg, tag: "leisure=park" },
  { id: "garden",   label: "Gardens",     emoji: "🌱", color: C.green, bg: C.greenBg, tag: "leisure=garden" },
  { id: "bench",    label: "Benches",     emoji: "🪑", color: C.amber, bg: C.amberBg, tag: "amenity=bench" },
  { id: "water",    label: "Free Water",  emoji: "💧", color: C.blue,  bg: C.blueBg,  tag: "amenity=drinking_water" },
  { id: "shelter",  label: "Shelters",    emoji: "🏠", color: C.rose,  bg: C.roseBg,  tag: "amenity=shelter" },
];

const uid = () => Math.random().toString(36).slice(2, 9);

// ── Persistence ──────────────────────────────────────────────────────────────
function loadPins() {
  try { return JSON.parse(localStorage.getItem(PINS_KEY) || "[]"); } catch { return []; }
}
function savePins(pins) {
  try { localStorage.setItem(PINS_KEY, JSON.stringify(pins)); } catch {}
}

// ── Real API calls ────────────────────────────────────────────────────────────
async function geocode(q) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6`, { headers: { "Accept-Language": "en" } });
    return await r.json();
  } catch { return []; }
}

async function reverseGeocode(lat, lng) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, { headers: { "Accept-Language": "en" } });
    return await r.json();
  } catch { return null; }
}

async function fetchPlaces(lat, lng, tags) {
  if (!tags.length) return [];
  const q = tags.map(t => { const [k, v] = t.split("="); return `node["${k}"="${v}"](around:800,${lat},${lng});`; }).join("\n");
  try {
    const r = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: `data=${encodeURIComponent(`[out:json][timeout:10];\n(\n${q}\n);\nout body;`)}` });
    return (await r.json()).elements || [];
  } catch { return []; }
}

async function streamStory(lat, lng, placeName, nearbyNames, onChunk, signal) {
  const system = `You are the voice of a kind, warm map. Write 2–3 short paragraphs about being at this location. Mention something specific and true about the area — a small history, a quality, something comforting. Then note what public, free, welcoming things are nearby from the list provided. End with one gentle sentence that makes the person feel the place is worth being in. Never use "vibrant", "bustling", or tourist-brochure language. Speak like a kind friend who knows the neighborhood.`;
  const content = `Location: ${placeName || `${lat.toFixed(4)}, ${lng.toFixed(4)}`}. Nearby public spaces: ${nearbyNames.slice(0, 6).join(", ") || "none found"}.`;
  const res = await fetch(`${API_URL}/api/v1/ai/chat`, {
    method: "POST", signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, messages: [{ role: "user", content }], max_tokens: 350 }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n"); buf = lines.pop();
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const d = line.slice(6).trim();
      if (d === "[DONE]") return;
      try { const ev = JSON.parse(d); if (ev.type === "content_block_delta") onChunk(ev.delta?.text || ""); } catch {}
    }
  }
}

// ── Primitives ────────────────────────────────────────────────────────────────
const Spinner = () => (
  <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${C.green}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
);

const IconBtn = ({ onClick, children, active, activeColor = C.green, title, badge, disabled }) => (
  <motion.button whileTap={{ scale: 0.88 }} onClick={onClick} title={title} disabled={disabled}
    style={{
      width: 44, height: 44, borderRadius: 14, flexShrink: 0,
      background: active ? (activeColor + "22") : C.glass,
      border: `1px solid ${active ? activeColor + "55" : C.border}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      cursor: disabled ? "not-allowed" : "pointer",
      backdropFilter: "blur(16px)", position: "relative",
      opacity: disabled ? 0.5 : 1, transition: "all 0.15s",
      boxShadow: active ? `0 0 12px ${activeColor}33` : "0 2px 8px rgba(0,0,0,0.3)",
    }}>
    <span style={{ fontSize: 18, lineHeight: 1 }}>{children}</span>
    {badge > 0 && (
      <div style={{ position: "absolute", top: 5, right: 5, width: 14, height: 14, borderRadius: "50%", background: C.amber, fontSize: 8, fontWeight: 800, color: "#000", fontFamily: C.mono, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {badge}
      </div>
    )}
  </motion.button>
);

// ── Bottom tray — the single panel zone ──────────────────────────────────────
const TRAY_HEIGHTS = { places: 320, story: 280, pin: 160, mypins: 300 };

function Tray({ panel, onClose, children }) {
  const h = TRAY_HEIGHTS[panel] || 280;
  return (
    <motion.div
      key={panel}
      initial={{ y: h + 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: h + 20, opacity: 0 }}
      transition={{ type: "spring", damping: 30, stiffness: 320 }}
      style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: h, zIndex: 20,
        background: C.glassHi, backdropFilter: "blur(28px)",
        borderTop: `1px solid ${C.border}`,
        borderRadius: "20px 20px 0 0",
        display: "flex", flexDirection: "column",
        boxShadow: "0 -16px 48px rgba(0,0,0,0.5)",
      }}>
      {/* Drag handle */}
      <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: C.border }} />
      </div>
      {/* Close row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px 10px" }}>
        {children.header}
        <button onClick={onClose} style={{ background: "none", border: "none", color: C.faint, cursor: "pointer", fontSize: 20, lineHeight: 1, padding: "0 4px" }}>×</button>
      </div>
      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", padding: "0 18px 18px" }}>
        {children.body}
      </div>
    </motion.div>
  );
}

// ── Places panel content ─────────────────────────────────────────────────────
function PlacesContent({ activeLayers, onToggleLayer, places, loading }) {
  const visiblePlaces = places.filter(p =>
    WARMTH_LAYERS.some(l => activeLayers.includes(l.id) && p.tags?.[l.tag.split("=")[0]] === l.tag.split("=")[1])
  );
  return (
    <>
      {/* Layer chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
        {WARMTH_LAYERS.map(l => {
          const on = activeLayers.includes(l.id);
          return (
            <motion.button key={l.id} whileTap={{ scale: 0.93 }} onClick={() => onToggleLayer(l.id)}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 11px", borderRadius: 20, fontSize: 12, fontWeight: 600, fontFamily: C.sans, cursor: "pointer", transition: "all 0.15s", background: on ? l.bg : "rgba(255,255,255,0.04)", border: `1px solid ${on ? l.color + "44" : C.border}`, color: on ? l.color : C.faint }}>
              {l.emoji} {l.label}
            </motion.button>
          );
        })}
      </div>
      {/* Results */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 0", color: C.faint, fontSize: 13 }}>
          <Spinner /> Searching nearby…
        </div>
      ) : visiblePlaces.length === 0 ? (
        <p style={{ color: C.faint, fontSize: 13, fontFamily: C.sans, lineHeight: 1.6 }}>
          No places found within 800m. Try enabling more layers or search for a different location.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {visiblePlaces.slice(0, 12).map((p, i) => {
            const layer = WARMTH_LAYERS.find(l => p.tags?.[l.tag.split("=")[0]] === l.tag.split("=")[1]);
            return (
              <div key={p.id || i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 12px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{layer?.emoji || "📍"}</span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ color: C.paper, fontSize: 13, fontWeight: 500, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.tags?.name || layer?.label || "Public space"}
                  </p>
                  {p.tags?.["addr:street"] && (
                    <p style={{ color: C.faint, fontSize: 10, margin: "1px 0 0", fontFamily: C.mono }}>{p.tags["addr:street"]}</p>
                  )}
                </div>
                <div style={{ marginLeft: "auto", flexShrink: 0, width: 6, height: 6, borderRadius: "50%", background: layer?.color || C.green }} />
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ── Story panel content ───────────────────────────────────────────────────────
function StoryContent({ story, loading }) {
  return loading && !story ? (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", color: C.faint, fontSize: 13, fontFamily: C.mono }}>
      <Spinner />
      <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.4, repeat: Infinity }}>
        reading the neighborhood…
      </motion.span>
    </div>
  ) : (
    <p style={{ color: C.paper, fontSize: 14, lineHeight: 1.8, margin: 0, fontFamily: C.sans, whiteSpace: "pre-wrap" }}>
      {story || "Tap ✨ after locating yourself to hear something kind about where you are."}
    </p>
  );
}

// ── Pin drop content ──────────────────────────────────────────────────────────
function PinDropContent({ onDrop }) {
  const [note, setNote] = useState("");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <input value={note} onChange={e => setNote(e.target.value)}
        onKeyDown={e => e.key === "Enter" && note.trim() && onDrop(note)}
        placeholder='e.g. "free coffee here Tuesdays" or "bench faces the sunrise"'
        autoFocus
        style={{ padding: "12px 14px", borderRadius: 12, fontSize: 14, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.paper, outline: "none", fontFamily: C.sans }} />
      <motion.button whileTap={{ scale: 0.97 }}
        onClick={() => note.trim() && onDrop(note)}
        disabled={!note.trim()}
        style={{ padding: "12px", borderRadius: 12, background: note.trim() ? C.amberBg : "rgba(255,255,255,0.04)", border: `1px solid ${note.trim() ? C.amber + "44" : C.border}`, color: note.trim() ? C.amber : C.faint, fontWeight: 700, fontSize: 14, cursor: note.trim() ? "pointer" : "default", fontFamily: C.sans }}>
        Drop kindness pin 📍
      </motion.button>
    </div>
  );
}

// ── My pins content ───────────────────────────────────────────────────────────
function MyPinsContent({ pins, onDelete }) {
  if (pins.length === 0) return (
    <p style={{ color: C.faint, fontSize: 13, fontFamily: C.sans, lineHeight: 1.6 }}>
      No kindness pins yet. Locate yourself and tap 🫶 to drop a note at your current spot.
    </p>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {[...pins].reverse().map(pin => (
        <div key={pin.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}` }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>📍</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: C.paper, fontSize: 13, margin: 0, lineHeight: 1.5 }}>{pin.note}</p>
            <p style={{ color: C.faint, fontSize: 10, margin: "3px 0 0", fontFamily: C.mono }}>{pin.lat?.toFixed(4)}, {pin.lng?.toFixed(4)}</p>
          </div>
          <button onClick={() => onDelete(pin.id)} style={{ background: "none", border: "none", color: C.faint, cursor: "pointer", fontSize: 16, padding: "0 2px", lineHeight: 1, flexShrink: 0 }}>×</button>
        </div>
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
const MapApp = ({ mapOpen, setMapOpen }) => {
  const [userLoc,     setUserLoc]     = useState(null);
  const [locating,    setLocating]    = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchRes,   setSearchRes]   = useState([]);
  const [showDrop,    setShowDrop]    = useState(false);
  const [activeLayers,setActiveLayers]= useState(["library", "park"]);
  const [places,      setPlaces]      = useState([]);
  const [placesLoading,setPlacesLoading] = useState(false);
  const [story,       setStory]       = useState("");
  const [storyLoading,setStoryLoading]= useState(false);
  const [tray,        setTray]        = useState(null); // null | "places" | "story" | "pin" | "mypins"
  const [pins,        setPins]        = useState([]);
  const abortRef  = useRef(null);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => { setPins(loadPins()); }, []);
  useEffect(() => { savePins(pins); }, [pins]);

  const openTray = (name) => setTray(prev => prev === name ? null : name);
  const closeTray = () => setTray(null);

  // ── Locate ──────────────────────────────────────────────────────────────────
  const locate = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => { setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); },
      ()  => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // ── Search ──────────────────────────────────────────────────────────────────
  const handleSearchInput = (val) => {
    setSearchQuery(val);
    clearTimeout(debounceRef.current);
    if (!val.trim()) { setSearchRes([]); setShowDrop(false); return; }
    debounceRef.current = setTimeout(async () => {
      const res = await geocode(val);
      setSearchRes(res); setShowDrop(true);
    }, 400);
  };

  const handleSelectResult = (r) => {
    setUserLoc({ lat: parseFloat(r.lat), lng: parseFloat(r.lon) });
    setSearchQuery(r.display_name.split(",")[0]);
    setSearchRes([]); setShowDrop(false);
  };

  // ── Places ──────────────────────────────────────────────────────────────────
  const loadPlaces = useCallback(async (lat, lng, layers) => {
    setPlacesLoading(true);
    const tags = WARMTH_LAYERS.filter(l => layers.includes(l.id)).map(l => l.tag);
    const res = await fetchPlaces(lat, lng, tags);
    setPlaces(res); setPlacesLoading(false);
  }, []);

  const handleOpenPlaces = () => {
    openTray("places");
    if (userLoc) loadPlaces(userLoc.lat, userLoc.lng, activeLayers);
    else locate();
  };

  const handleToggleLayer = (id) => {
    const next = activeLayers.includes(id) ? activeLayers.filter(l => l !== id) : [...activeLayers, id];
    setActiveLayers(next);
    if (userLoc) loadPlaces(userLoc.lat, userLoc.lng, next);
  };

  // ── Story ───────────────────────────────────────────────────────────────────
  const handleOpenStory = async () => {
    if (!userLoc) { locate(); return; }
    openTray("story");
    setStory(""); setStoryLoading(true);
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    try {
      const place = await reverseGeocode(userLoc.lat, userLoc.lng);
      const placeName = place?.display_name?.split(",").slice(0, 2).join(", ") || "";
      const nearbyNames = places.map(p => p.tags?.name).filter(Boolean);
      await streamStory(userLoc.lat, userLoc.lng, placeName, nearbyNames,
        chunk => setStory(prev => prev + chunk),
        abortRef.current.signal
      );
    } catch (e) {
      if (e.name !== "AbortError") setStory("Couldn't reach the AI — check the backend is running.");
    } finally { setStoryLoading(false); }
  };

  // ── Pins ────────────────────────────────────────────────────────────────────
  const dropPin = (note) => {
    if (!userLoc) return;
    setPins(prev => [...prev, { id: uid(), note, lat: userLoc.lat, lng: userLoc.lng, ts: Date.now() }]);
    closeTray();
  };

  if (!mapOpen) return null;

  const TRAY_LABELS = {
    places: { emoji: "🌿", text: "Good places nearby" },
    story:  { emoji: "✨", text: "What's good here" },
    pin:    { emoji: "🫶", text: "Drop a kindness pin" },
    mypins: { emoji: "📋", text: `My pins (${pins.length})` },
  };

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        style={{
          position: "fixed", inset: 0, bottom: "var(--taskbar-height, 52px)",
          zIndex: 100, background: C.bg, fontFamily: C.sans,
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}
      >

        {/* ── TOP BAR ──────────────────────────────────────────────────────── */}
        <div style={{
          flexShrink: 0, height: 56, display: "flex", alignItems: "center",
          padding: "0 12px", gap: 8, background: C.glass,
          backdropFilter: "blur(24px)", borderBottom: `1px solid ${C.border}`, zIndex: 30,
        }}>
          {/* Search input */}
          <div style={{ flex: 1, position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, borderRadius: 12, padding: "0 12px", gap: 8 }}>
              <span style={{ color: C.faint, fontSize: 14, flexShrink: 0 }}>🔍</span>
              <input
                value={searchQuery}
                onChange={e => handleSearchInput(e.target.value)}
                onFocus={() => searchRes.length && setShowDrop(true)}
                onBlur={() => setTimeout(() => setShowDrop(false), 150)}
                placeholder="Search any place…"
                style={{ flex: 1, padding: "9px 0", background: "none", border: "none", outline: "none", color: C.paper, fontSize: 14, fontFamily: C.sans, caretColor: C.green }}
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); setSearchRes([]); setShowDrop(false); }}
                  style={{ background: "none", border: "none", color: C.faint, cursor: "pointer", fontSize: 16, flexShrink: 0 }}>×</button>
              )}
            </div>
            {/* Dropdown */}
            <AnimatePresence>
              {showDrop && searchRes.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 50, background: C.glassHi, backdropFilter: "blur(20px)", border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", boxShadow: "0 16px 40px rgba(0,0,0,0.6)" }}>
                  {searchRes.slice(0, 5).map((r, i) => (
                    <button key={i} onMouseDown={() => handleSelectResult(r)}
                      style={{ width: "100%", padding: "11px 14px", background: "none", border: "none", textAlign: "left", color: C.paper, fontSize: 13, cursor: "pointer", borderBottom: i < 4 ? `1px solid rgba(255,255,255,0.04)` : "none", display: "block", fontFamily: C.sans }}>
                      <span style={{ opacity: 0.4, marginRight: 6 }}>📍</span>
                      {r.display_name.split(",").slice(0, 3).join(", ")}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Locate me */}
          <IconBtn onClick={locate} disabled={locating} title="Find my location">
            {locating ? <Spinner /> : "📍"}
          </IconBtn>

          {/* Close */}
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setMapOpen(false)}
            style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.muted, fontSize: 18, flexShrink: 0 }}>
            ×
          </motion.button>
        </div>

        {/* ── MAP + OVERLAYS ────────────────────────────────────────────────── */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <Map darkMode={true} userLocation={userLoc} searchQuery={searchQuery} onMapReady={() => {}} />

          {/* Right action rail */}
          <div style={{
            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
            display: "flex", flexDirection: "column", gap: 8, zIndex: 20,
          }}>
            <IconBtn onClick={handleOpenPlaces} active={tray === "places"} activeColor={C.green} title="Find good places nearby">🌿</IconBtn>
            <IconBtn onClick={handleOpenStory}  active={tray === "story"}  activeColor={C.green} title="What's good here">✨</IconBtn>
            <IconBtn onClick={() => { if (!userLoc) locate(); openTray("pin"); }} active={tray === "pin"} activeColor={C.amber} title="Drop a kindness pin">🫶</IconBtn>
            <IconBtn onClick={() => openTray("mypins")} active={tray === "mypins"} activeColor={C.amber} title="My kindness pins" badge={pins.length}>📋</IconBtn>
          </div>

          {/* Wordmark badge */}
          <div style={{ position: "absolute", bottom: tray ? TRAY_HEIGHTS[tray] + 12 : 16, left: 12, zIndex: 20, pointerEvents: "none", transition: "bottom 0.35s cubic-bezier(0.16,1,0.3,1)" }}>
            <div style={{ background: C.glass, backdropFilter: "blur(12px)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "7px 11px" }}>
              <p style={{ fontFamily: C.mono, fontSize: 9, color: C.green, letterSpacing: "0.1em", margin: 0 }}>KINDNESS MAP</p>
              <p style={{ fontFamily: C.sans, fontSize: 10, color: C.faint, margin: "1px 0 0" }}>🌿 places · ✨ story · 🫶 pin</p>
            </div>
          </div>

          {/* Bottom tray — one panel at a time */}
          <AnimatePresence>
            {tray && (
              <Tray panel={tray} onClose={closeTray}>
                {{
                  header: (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{TRAY_LABELS[tray]?.emoji}</span>
                      <span style={{ fontFamily: C.mono, fontSize: 10, color: C.green, letterSpacing: "0.08em" }}>
                        {TRAY_LABELS[tray]?.text?.toUpperCase()}
                      </span>
                    </div>
                  ),
                  body: tray === "places" ? (
                    <PlacesContent activeLayers={activeLayers} onToggleLayer={handleToggleLayer} places={places} loading={placesLoading} />
                  ) : tray === "story" ? (
                    <StoryContent story={story} loading={storyLoading} />
                  ) : tray === "pin" ? (
                    <PinDropContent onDrop={dropPin} />
                  ) : (
                    <MyPinsContent pins={pins} onDelete={id => setPins(prev => prev.filter(p => p.id !== id))} />
                  ),
                }}
              </Tray>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
};

export default MapApp;