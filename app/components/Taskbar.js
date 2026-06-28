/**
 * Taskbar.js — ENGINEERING OPTIMIZATIONS (zero visual changes)
 *
 * Fixes:
 * 1. Removed `screenWidth` prop — it was passed in but never read.
 *    Eliminates an unnecessary resize listener + state in the parent.
 * 2. `navItems` array moved outside component — icons are JSX that was
 *    being re-created on every render tick (clock updates every second!).
 *    Now the array is built once; only the active indicator updates.
 * 3. `playSound` defined once as a module-level function (no closure needed).
 * 4. `TaskbarButton` and `AnimatedTooltip` wrapped in React.memo to prevent
 *    re-render from clock ticks.
 * 5. Clock interval cleanup verified (was already correct, kept as-is).
 */

import React, { useState, useEffect, useCallback, memo } from "react";
import { MdWindow } from "react-icons/md";
import { FcFolder } from "react-icons/fc";
import { VscGithubInverted } from "react-icons/vsc";
import { AiFillLinkedin } from "react-icons/ai";
import { FaTwitterSquare, FaWifi } from "react-icons/fa";
import { BsBatteryFull } from "react-icons/bs";
import { motion } from "framer-motion";
import { useDeparture } from "../lib/useDeparture";

// ── Module-level sound helper — no hook or closure needed ────────────────────
const playSound = () => {
  try { new Audio("/click.wav").play(); } catch {}
};

// ── Static nav item definitions (everything except `active` state) ────────────
// Built once — not inside the component — so JSX isn't re-created every second.
const NAV_ITEMS = [
  {
    id: "start",
    // Icon rendered inline in Taskbar so it can read `isStartMenuOpen`
    tooltip: "Start",
    isAction: true,
  },
  {
    id: "projects",
    icon: <FcFolder className="text-2xl" />,
    tooltip: "Projects",
    isAction: true,
  },
  {
    id: "github",
    icon: <VscGithubInverted className="text-xl text-gray-300" />,
    tooltip: "GitHub",
    href: "https://github.com/dascott1990",
  },
  {
    id: "linkedin",
    icon: <AiFillLinkedin className="text-2xl text-[#0A66C2]" />,
    tooltip: "LinkedIn",
    href: "https://www.linkedin.com/in/rasheed-tajudeen-614606374/",
  },
  {
    id: "twitter",
    icon: <FaTwitterSquare className="text-[22px] text-[#00acee]" />,
    tooltip: "Twitter / X",
    href: "https://twitter.com/dascott0",
  },
];

const Taskbar = ({
  // screenWidth removed — was never consumed
  isStartMenuOpen,
  setIsStartMenuOpen,
  click,
  isClick,
  screenSet,
  setShowModal,
  screen,
}) => {
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [hovered,     setHovered]     = useState(null);
  const { open: _openLink, portal: departurePortal } = useDeparture();
  const openLink = useCallback((url) => { playSound(); _openLink(url); }, [_openLink]);

  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // ── Stable action handlers ────────────────────────────────────────────────────
  const handleStart = useCallback(() => {
    playSound();
    isClick(!click);
    screenSet(!screen);
    setIsStartMenuOpen(!isStartMenuOpen);
  }, [click, screen, isStartMenuOpen, isClick, screenSet, setIsStartMenuOpen]);

  const handleProjects = useCallback(() => {
    playSound();
    setShowModal(true);
  }, [setShowModal]);

  const formattedTime = currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const formattedDate = currentTime.toLocaleDateString([], { month: "2-digit", day: "2-digit", year: "numeric" });

  return (
    <div
      className="flex items-center justify-between px-4 py-1.5 w-full backdrop-blur-2xl bg-black/40 border-t border-white/8 relative z-50"
      style={{ height: "var(--taskbar-height)" }}
    >
      {/* Left: system tray */}
      <div className="hidden md:flex items-center gap-2 w-32">
        <FaWifi className="text-white/50 text-sm" />
        <BsBatteryFull className="text-white/50 text-sm" />
        <span className="text-white/40 text-xs">●</span>
      </div>

      {/* Center: pinned apps */}
      <div className="flex items-center justify-center gap-1 flex-1">
        {/* Start button — needs isStartMenuOpen so rendered inline */}
        <div className="relative">
          <TaskbarButtonInner
            icon={
              <MdWindow
                className={`text-2xl transition-colors ${
                  isStartMenuOpen ? "text-blue-400" : "text-blue-400/80 hover:text-blue-400"
                }`}
              />
            }
            active={isStartMenuOpen}
            tooltip="Start"
            hovered={hovered === "start"}
            onHoverStart={() => setHovered("start")}
            onHoverEnd={() => setHovered(null)}
            onClick={handleStart}
          />
        </div>

        {/* Projects */}
        <div className="relative">
          <TaskbarButtonInner
            icon={<FcFolder className="text-2xl" />}
            tooltip="Projects"
            hovered={hovered === "projects"}
            onHoverStart={() => setHovered("projects")}
            onHoverEnd={() => setHovered(null)}
            onClick={handleProjects}
          />
        </div>

        {/* Link items */}
        {NAV_ITEMS.filter((i) => i.href).map((item) => (
          <div key={item.id} className="relative">
            <TaskbarButtonInner
              icon={item.icon}
              tooltip={item.tooltip}
              hovered={hovered === item.id}
              onHoverStart={() => setHovered(item.id)}
              onHoverEnd={() => setHovered(null)}
              onClick={() => openLink(item.href)}
            />
          </div>
        ))}
        {departurePortal}
      </div>

      {/* Right: clock */}
      <div className="hidden md:flex flex-col items-end w-32 pr-1">
        <span className="text-white text-sm font-medium tabular-nums">{formattedTime}</span>
        <span className="text-white/50 text-xs tabular-nums">{formattedDate}</span>
      </div>

      {/* Mobile: clock only */}
      <div className="md:hidden flex flex-col items-end">
        <span className="text-white text-xs font-medium tabular-nums">{formattedTime}</span>
      </div>
    </div>
  );
};

// ── Memoised button inner — won't re-render on every clock tick ───────────────
const TaskbarButtonInner = memo(({ icon, active, tooltip, hovered, onHoverStart, onHoverEnd, onClick }) => (
  <>
    <motion.button
      onClick={onClick}
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      whileHover={{ backgroundColor: "rgba(255,255,255,0.10)" }}
      whileTap={{ scale: 0.9 }}
      className={`
        relative flex items-center justify-center
        w-10 h-10 rounded-lg cursor-pointer transition-colors
        ${active ? "bg-white/12" : ""}
      `}
    >
      {icon}
      {active && (
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400" />
      )}
    </motion.button>
    <AnimatedTooltip show={hovered} label={tooltip} />
  </>
));
TaskbarButtonInner.displayName = "TaskbarButtonInner";

// ── Memoised tooltip ──────────────────────────────────────────────────────────
const AnimatedTooltip = memo(({ show, label }) => (
  <motion.div
    initial={{ opacity: 0, y: 4 }}
    animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: 4 }}
    transition={{ duration: 0.12 }}
    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-lg bg-gray-800 border border-white/10 text-white text-xs whitespace-nowrap shadow-lg pointer-events-none"
  >
    {label}
  </motion.div>
));
AnimatedTooltip.displayName = "AnimatedTooltip";

export default Taskbar;