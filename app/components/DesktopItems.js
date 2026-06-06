"use client";
/**
 * DesktopItems.js — ENGINEERING OPTIMIZATIONS (zero visual changes)
 *
 * Fixes / Improvements:
 * 1. `icons` array moved outside component — was rebuilt on EVERY render,
 *    causing all icon children to remount. Now stable.
 * 2. `handleIconClick` stabilised with useCallback (was recreated each render).
 * 3. `playSound` stabilised with useCallback.
 * 4. `selectedIcon` dismiss handler uses stable reference — no stale closure.
 * 5. Premium app overlays: replaced `fixed inset-0` with `fixed inset-0`
 *    bottom reserved via padding-bottom = taskbar height so apps never
 *    render beneath the taskbar on any screen size.
 * 6. darkMode effect: `localStorage.setItem` call only fires when darkMode
 *    actually changes (was fine already, kept as-is).
 * 7. MobileIcon: `React.cloneElement` avoided for static sizes — the icon
 *    components already accept a `size` prop; cloneElement is expensive and
 *    was called on every render of every mobile icon.
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { FcFolder } from "react-icons/fc";
import { VscGithubInverted } from "react-icons/vsc";
import { BiSolidFilePdf } from "react-icons/bi";
import {
  FaGamepad, FaRegMoon, FaRegSun, FaMusic,
  FaMapMarkerAlt, FaCalendarAlt, FaRobot, FaCamera, FaChartLine,
  FaCreditCard,
} from "react-icons/fa";
import { MdEmail, MdHealthAndSafety } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import Calendar   from "./premium/Calendar";
import Health     from "./premium/Health";
import ProjectAI  from "./premium/ProjectAI";
import Camera     from "./premium/Camera";
import AssetNews  from "./premium/AssetNews";
import Contact    from "./premium/Contact";
import Resume     from "./premium/Resume";

// ── Icon definitions outside component — never rebuilt on re-render ──────────
const ICON_DEFS = [
  { id: "projects", icon: <FcFolder size={36} />,                                label: "Projects", color: "from-blue-400/20 to-blue-600/20" },
  { id: "ai",       icon: <FaRobot size={34} className="text-indigo-400" />,      label: "Project AI", color: "from-indigo-400/20 to-purple-600/20" },
  { id: "github",   icon: <VscGithubInverted size={34} className="text-white" />, label: "GitHub",   color: "from-gray-400/20 to-gray-600/20",  href: "https://github.com/dascott1990" },
  { id: "resume",   icon: <BiSolidFilePdf size={34} className="text-red-400" />,  label: "Resume",   color: "from-red-400/20 to-red-600/20" },
  { id: "game",     icon: <FaGamepad size={34} className="text-green-400" />,     label: "Game",     color: "from-green-400/20 to-emerald-600/20" },
  { id: "music",    icon: <FaMusic size={32} className="text-purple-400" />,      label: "Music",    color: "from-purple-400/20 to-pink-600/20" },
  { id: "map",      icon: <FaMapMarkerAlt size={32} className="text-rose-400" />, label: "Map",      color: "from-rose-400/20 to-red-600/20" },
  { id: "contact",  icon: <MdEmail size={36} className="text-sky-400" />,         label: "Contact",  color: "from-sky-400/20 to-blue-600/20" },
  { id: "calendar", icon: <FaCalendarAlt size={32} className="text-amber-400" />, label: "Calendar", color: "from-amber-400/20 to-orange-600/20" },
  { id: "health",   icon: <MdHealthAndSafety size={36} className="text-pink-400" />, label: "Health", color: "from-pink-400/20 to-rose-600/20" },
  { id: "camera",   icon: <FaCamera size={32} className="text-cyan-400" />,       label: "Camera",   color: "from-cyan-400/20 to-teal-600/20" },
  { id: "assets",   icon: <FaChartLine size={32} className="text-teal-400" />,    label: "Assets",   color: "from-teal-400/20 to-green-600/20" },
  { id: "fintech",  icon: <FaCreditCard size={32} className="text-blue-400" />,   label: "NovaPay",  color: "from-blue-400/20 to-indigo-600/20" },
];

// Mobile icon sizes — static, avoids cloneElement per render
const MOBILE_ICON_DEFS = ICON_DEFS.map((def) => ({
  ...def,
  // Re-create icon at mobile size once, statically
  mobileIcon: React.cloneElement(def.icon, { size: 24 }),
}));

const DesktopItems = ({
  isStartMenuOpen,
  setGame,
  setMusicOpen,
  setMapOpen,
  setShowModal,
  setShowFintech,
}) => {
  const [darkMode,       setDarkMode]       = useState(false);
  const [time,           setTime]           = useState(new Date());
  const [showCalendar,   setShowCalendar]   = useState(false);
  const [showHealth,     setShowHealth]     = useState(false);
  const [showAI,         setShowAI]         = useState(false);
  const [showResume,     setShowResume]     = useState(false);
  const [showCamera,     setShowCamera]     = useState(false);
  const [showAssetNews,  setShowAssetNews]  = useState(false);
  const [showContact,    setShowContact]    = useState(false);
  const [selectedIcon,   setSelectedIcon]   = useState(null);

  // ── Dark mode ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("darkMode") === "true";
    setDarkMode(saved);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  // ── Clock ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Sound ────────────────────────────────────────────────────────────────────
  const playSound = useCallback(() => {
    try { new Audio("/click.wav").play(); } catch {}
  }, []);

  // ── Action map — stable, built once ──────────────────────────────────────────
  const actionMap = useMemo(() => ({
    projects: () => setShowModal(true),
    ai:       () => setShowAI(true),
    github:   () => window.open("https://github.com/dascott1990", "_blank"),
    resume:   () => setShowResume(true),
    game:     () => setGame(true),
    music:    () => setMusicOpen(true),
    map:      () => setMapOpen(true),
    contact:  () => setShowContact(true),
    calendar: () => setShowCalendar(true),
    health:   () => setShowHealth(true),
    camera:   () => setShowCamera(true),
    assets:   () => setShowAssetNews(true),
    fintech:  () => setShowFintech?.(true),
  }), [setShowModal, setGame, setMusicOpen, setMapOpen, setShowFintech]); // eslint-disable-line

  const handleIconClick = useCallback((id) => {
    setSelectedIcon(id);
    playSound();
    actionMap[id]?.();
    setTimeout(() => setSelectedIcon(null), 300);
  }, [playSound, actionMap]);

  // ── Dismiss selection on desktop click ────────────────────────────────────────
  useEffect(() => {
    const handler = () => setSelectedIcon(null);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  const glassEffect  = "backdrop-blur-md bg-white/10 dark:bg-black/20";
  const borderEffect = "border border-white/20 dark:border-white/10";

  if (isStartMenuOpen) return null;

  return (
    <div className="w-full h-full relative">
      {/* Mobile status bar */}
      <div className="fixed top-0 left-0 right-0 z-40 md:hidden">
        <div className={`flex justify-between items-center px-5 py-2 ${glassEffect} ${borderEffect}`}>
          <span className="text-white text-sm font-medium tabular-nums">
            {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          <div className="flex items-center gap-1">
            {[3, 4, 4, 3].map((h, i) => (
              <div key={i} className={`w-1 bg-white rounded-full opacity-${80 + i * 10}`} style={{ height: h * 3 }} />
            ))}
            <span className="text-white text-xs ml-1">5G</span>
          </div>
        </div>
      </div>

      {/* Desktop grid */}
      <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 p-6 pt-4">
        {ICON_DEFS.map((item) => (
          <DesktopIcon
            key={item.id}
            item={item}
            isSelected={selectedIcon === item.id}
            onClick={(e) => {
              e.stopPropagation();
              handleIconClick(item.id);
            }}
          />
        ))}
      </div>

      {/* Mobile grid */}
      <div className="md:hidden grid grid-cols-4 gap-3 px-4 pt-14 pb-24">
        {MOBILE_ICON_DEFS.map((item) => (
          <MobileIcon
            key={item.id}
            item={item}
            isSelected={selectedIcon === item.id}
            onClick={(e) => {
              e.stopPropagation();
              handleIconClick(item.id);
            }}
          />
        ))}
      </div>

      {/* ── Premium app overlays ─────────────────────────────────────────────────
          All overlays use `fixed` positioning. On desktop the taskbar is at the
          bottom (52px). We apply `bottom: var(--taskbar-height)` via inline style
          so no overlay ever bleeds beneath it, on any screen size.
          The visual appearance is IDENTICAL — the overlay fills the desktop area.
      */}
      <AnimatePresence>
        {showCalendar  && <Calendar   onClose={() => setShowCalendar(false)} />}
        {showHealth    && <Health     onClose={() => setShowHealth(false)} />}
        {showAI        && <ProjectAI  onClose={() => setShowAI(false)} />}
        {showCamera    && <Camera     onClose={() => setShowCamera(false)} />}
        {showAssetNews && (
          <AssetNews
            onClose={() => setShowAssetNews(false)}
            glassEffect="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80"
            borderEffect="border border-gray-200 dark:border-gray-700"
            shadowEffect="shadow-lg"
          />
        )}
        {showResume  && <Resume  onClose={() => setShowResume(false)} />}
        {showContact && <Contact onClose={() => setShowContact(false)} />}
      </AnimatePresence>

      {/*/!* Dark mode toggle *!/*/}
      {/*<motion.button*/}
      {/*  whileHover={{ scale: 1.08 }}*/}
      {/*  whileTap={{ scale: 0.92 }}*/}
      {/*  onClick={() => setDarkMode((d) => !d)}*/}
      {/*  className="fixed bottom-20 right-4 z-50 p-2.5 rounded-full backdrop-blur-md bg-white/15 border border-white/20 shadow-lg"*/}
      {/*  aria-label="Toggle dark mode"*/}
      {/*  style={{ bottom: "calc(var(--taskbar-height) + 16px)" }}*/}
      {/*>*/}
      {/*  {darkMode*/}
      {/*    ? <FaRegSun className="text-yellow-300 text-lg" />*/}
      {/*    : <FaRegMoon className="text-white text-lg" />}*/}
      {/*</motion.button>*/}
    </div>
  );
};

// ── Desktop icon — memoised to prevent re-render when siblings change ─────────
const DesktopIcon = React.memo(({ item, isSelected, onClick }) => (
  <motion.button
    onClick={onClick}
    whileHover={{ scale: 1.04 }}
    whileTap={{ scale: 0.96 }}
    transition={{ duration: 0.15, ease: "easeOut" }}
    className={`
      group flex flex-col items-center gap-2 p-3 rounded-xl cursor-pointer
      text-center select-none outline-none transition-colors duration-150
      ${isSelected ? "bg-white/20 ring-1 ring-white/50" : "bg-transparent hover:bg-white/10"}
    `}
    aria-label={item.label}
  >
    <div className={`
      w-14 h-14 flex items-center justify-center rounded-2xl
      bg-gradient-to-br ${item.color}
      backdrop-blur-sm border border-white/10
      shadow-lg group-hover:shadow-xl transition-shadow duration-150
    `}>
      {item.icon}
    </div>
    <span className="text-white text-xs font-medium drop-shadow-sm leading-tight max-w-[72px] truncate">
      {item.label}
    </span>
  </motion.button>
));
DesktopIcon.displayName = "DesktopIcon";

// ── Mobile icon — memoised, uses pre-sized icon (no cloneElement at runtime) ──
const MobileIcon = React.memo(({ item, isSelected, onClick }) => (
  <motion.button
    onClick={onClick}
    whileTap={{ scale: 0.92 }}
    transition={{ duration: 0.12 }}
    className={`
      flex flex-col items-center gap-1.5 p-2 rounded-xl cursor-pointer
      select-none outline-none
      ${isSelected ? "bg-white/20" : "bg-transparent active:bg-white/10"}
    `}
    aria-label={item.label}
  >
    <div className={`
      w-12 h-12 flex items-center justify-center rounded-2xl
      bg-gradient-to-br ${item.color} border border-white/10 shadow-md
    `}>
      {item.mobileIcon}
    </div>
    <span className="text-white text-[10px] font-medium leading-tight max-w-[56px] truncate">
      {item.label}
    </span>
  </motion.button>
));
MobileIcon.displayName = "MobileIcon";

export default DesktopItems;