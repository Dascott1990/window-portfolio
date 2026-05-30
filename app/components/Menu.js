import React, { useState, useRef, useEffect, useCallback } from "react";
import { FcBullish, FcGraduationCap, FcCollaboration, FcFolder } from "react-icons/fc";
import { BiSolidFilePdf } from "react-icons/bi";
import { BiChevronUp, BiChevronDown } from "react-icons/bi";
import { FiSearch, FiPower, FiX } from "react-icons/fi";
import {
  FaGamepad, FaMusic, FaMapMarkerAlt, FaCalendarAlt,
  FaRobot, FaCamera, FaChartLine, FaHeartbeat,
} from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { VscGithubInverted } from "react-icons/vsc";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

// ─── App registry ─────────────────────────────────────────────────────────────
const PINNED_APPS = [
  { id: "projects",    label: "Projects",    icon: <FcFolder size={26} />,                                    type: "action",  category: "work" },
  { id: "resume",      label: "Resume",      icon: <BiSolidFilePdf size={24} className="text-red-400" />,     type: "action",  category: "work" },
  { id: "experience",  label: "Experience",  icon: <FcCollaboration size={26} />,                             type: "action",  category: "work" },
  { id: "impact",      label: "Impact",      icon: <FcBullish size={26} />,                                   type: "action",  category: "work" },
  { id: "education",   label: "Education",   icon: <FcGraduationCap size={26} />,                             type: "action",  category: "work" },
  { id: "github",      label: "GitHub",      icon: <VscGithubInverted size={24} className="text-white" />,    type: "link",    category: "work",   href: "https://github.com/dascott1990" },
  { id: "game",        label: "Game",        icon: <FaGamepad size={24} className="text-green-400" />,        type: "action",  category: "apps" },
  { id: "music",       label: "Music",       icon: <FaMusic size={22} className="text-purple-400" />,         type: "action",  category: "apps" },
  { id: "map",         label: "Map",         icon: <FaMapMarkerAlt size={24} className="text-rose-400" />,    type: "action",  category: "apps" },
  { id: "contact",     label: "Contact",     icon: <MdEmail size={26} className="text-sky-400" />,            type: "action",  category: "apps" },
  { id: "calendar",    label: "Calendar",    icon: <FaCalendarAlt size={22} className="text-amber-400" />,    type: "action",  category: "apps" },
  { id: "health",      label: "Health",      icon: <FaHeartbeat size={22} className="text-pink-400" />,       type: "action",  category: "apps" },
  { id: "ai",          label: "Project AI",  icon: <FaRobot size={24} className="text-indigo-400" />,         type: "action",  category: "apps" },
  { id: "camera",      label: "Camera",      icon: <FaCamera size={22} className="text-cyan-400" />,          type: "action",  category: "apps" },
  { id: "assets",      label: "Assets",      icon: <FaChartLine size={22} className="text-teal-400" />,       type: "action",  category: "apps" },
];

const PROFILE_FIELDS = [
  ["Name",       "Rasheed Tajudeen"],
  ["Email",      "dascottblog@gmail.com"],
  ["Phone",      "+1 416 505 6927"],
  ["Location",   "Toronto, ON, Canada"],
  ["Experience", `${new Date().getFullYear() - 2022}+ years`],
];

// ─── Menu component ───────────────────────────────────────────────────────────
const Menu = ({
  isStartMenuOpen,
  setShowModal,
  screen,
  setexperience,
  setImpact,
  setEducation,
  setInfo,
  info,
}) => {
  const [search, setSearch]     = useState("");
  const [focused, setFocused]   = useState(null); // keyboard-navigated app id
  const searchRef               = useRef(null);
  const menuRef                 = useRef(null);

  // Auto-focus search when menu opens; clear when it closes
  useEffect(() => {
    if (isStartMenuOpen) {
      setTimeout(() => searchRef.current?.focus(), 120);
    } else {
      setSearch("");
      setFocused(null);
    }
  }, [isStartMenuOpen]);

  const handleAppClick = useCallback((id) => {
    try { new Audio("/click.wav").play(); } catch {}
    const map = {
      projects:   () => setShowModal(true),
      experience: () => setexperience(true),
      impact:     () => setImpact(true),
      education:  () => setEducation(true),
    };
    map[id]?.();
  }, [setShowModal, setexperience, setImpact, setEducation]);

  const filtered = search.trim()
    ? PINNED_APPS.filter((a) =>
        a.label.toLowerCase().includes(search.toLowerCase())
      )
    : PINNED_APPS;

  // Group apps by category when not searching
  const workApps  = filtered.filter((a) => a.category === "work");
  const otherApps = filtered.filter((a) => a.category === "apps");
  const isFiltering = search.trim().length > 0;

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === "Escape") { setSearch(""); searchRef.current?.blur(); }
  };

  return (
    <div className="flex flex-col items-center justify-center flex-grow pointer-events-none">
      <AnimatePresence>
        {isStartMenuOpen && screen && (
          <motion.div
            ref={menuRef}
            key="start-menu"
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{   opacity: 0, y: 10,  scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto flex flex-col mt-auto mb-2 w-[520px] smbelow:w-[95vw] rounded-2xl overflow-hidden"
            style={{
              maxHeight: "68vh",
              background: "rgba(15, 17, 26, 0.92)",
              backdropFilter: "blur(28px) saturate(1.8)",
              WebkitBackdropFilter: "blur(28px) saturate(1.8)",
              border: "1px solid rgba(255,255,255,0.09)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
            }}
          >
            {/* ── Search ──────────────────────────────────────────────── */}
            <div className="px-4 pt-4 pb-3 flex-shrink-0">
              <div className="relative flex items-center">
                <FiSearch className="absolute left-3.5 text-gray-500 text-sm pointer-events-none" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search apps…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-9 pr-9 py-2.5 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500/40 transition-all"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)" }}
                />
                {search && (
                  <button
                    onClick={() => { setSearch(""); searchRef.current?.focus(); }}
                    className="absolute right-3 text-gray-500 hover:text-white transition-colors"
                    aria-label="Clear"
                  >
                    <FiX size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* ── App grid (scrollable) ────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-4 pb-3" style={{ scrollbarWidth: "none" }}>

              {/* No results */}
              {isFiltering && filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-gray-600 gap-2">
                  <FiSearch size={26} className="opacity-40" />
                  <p className="text-sm">No apps found for "{search}"</p>
                </div>
              )}

              {/* Filtered results (flat) */}
              {isFiltering && filtered.length > 0 && (
                <>
                  <SectionLabel label={`${filtered.length} result${filtered.length !== 1 ? "s" : ""}`} />
                  <AppGrid apps={filtered} focused={focused} onAppClick={handleAppClick} />
                </>
              )}

              {/* Default grouped view */}
              {!isFiltering && (
                <>
                  <SectionLabel label="Work & Portfolio" />
                  <AppGrid apps={workApps} focused={focused} onAppClick={handleAppClick} />

                  <SectionLabel label="Applications" className="mt-3" />
                  <AppGrid apps={otherApps} focused={focused} onAppClick={handleAppClick} />
                </>
              )}
            </div>

            {/* ── Divider ──────────────────────────────────────────────── */}
            <div className="mx-4 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }} />

            {/* ── Profile footer ───────────────────────────────────────── */}
            <div className="px-4 py-3 flex-shrink-0">
              <button
                onClick={() => {
                  try { new Audio("/click.wav").play(); } catch {}
                  setInfo(!info);
                }}
                className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl transition-colors group"
                style={{ background: "transparent" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <div className="relative flex-shrink-0">
                  <Image
                    src="/img.jpeg"
                    width={36}
                    height={36}
                    className="rounded-full object-cover"
                    style={{ border: "1.5px solid rgba(255,255,255,0.18)" }}
                    alt="Profile"
                  />
                  {/* Online dot */}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0f111a]" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-white text-sm font-semibold leading-tight truncate">Rasheed Tajudeen</p>
                  <p className="text-gray-500 text-xs truncate">Full-Stack · Cybersecurity</p>
                </div>
                <div className="text-gray-600 flex-shrink-0 transition-colors group-hover:text-gray-400">
                  {info ? <BiChevronDown size={18} /> : <BiChevronUp size={18} />}
                </div>
              </button>

              {/* Expanded profile info */}
              <AnimatePresence>
                {info && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div
                      className="mt-2 rounded-xl px-4 py-3"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                    >
                      <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                        {PROFILE_FIELDS.map(([k, v]) => (
                          <React.Fragment key={k}>
                            <dt className="text-gray-600 font-medium text-xs">{k}</dt>
                            <dd className="text-gray-300 text-xs truncate">{v}</dd>
                          </React.Fragment>
                        ))}
                        <dt className="text-gray-600 font-medium text-xs">Skills</dt>
                        <dd className="text-gray-300 text-xs leading-relaxed col-span-1">
                          React · Node.js · TypeScript · PostgreSQL · Docker · AWS
                        </dd>
                      </dl>

                      {/* Social links */}
                      <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                        <a href="https://github.com/dascott1990" target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white transition-colors"
                          style={{ background: "rgba(255,255,255,0.06)" }}>
                          <VscGithubInverted size={13} /> GitHub
                        </a>
                        <a href="https://www.linkedin.com/in/rasheed-tajudeen-614606374" target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white transition-colors"
                          style={{ background: "rgba(255,255,255,0.06)" }}>
                          <span className="text-[#0A66C2] font-bold text-xs">in</span> LinkedIn
                        </a>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Section label ────────────────────────────────────────────────────────────
const SectionLabel = ({ label, className = "" }) => (
  <p className={`text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-2 px-1 ${className}`}>
    {label}
  </p>
);

// ─── App grid ─────────────────────────────────────────────────────────────────
const AppGrid = ({ apps, focused, onAppClick }) => (
  <div className="grid grid-cols-5 smbelow:grid-cols-4 gap-1 mb-1">
    {apps.map((app, i) => (
      <AppTile
        key={app.id}
        app={app}
        isFocused={focused === app.id}
        delay={i * 0.015}
        onClick={() => onAppClick(app.id)}
      />
    ))}
  </div>
);

// ─── App tile ─────────────────────────────────────────────────────────────────
const AppTile = ({ app, isFocused, delay, onClick }) => {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.15, ease: "easeOut" }}
      className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl cursor-pointer select-none outline-none group"
      style={{
        background: isFocused ? "rgba(59,130,246,0.18)" : "transparent",
        WebkitTapHighlightColor: "transparent",
      }}
      whileTap={{ scale: 0.94, transition: { duration: 0.1 } }}
      onClick={onClick}
      onMouseEnter={(e) => { if (!isFocused) e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
      onMouseLeave={(e) => { if (!isFocused) e.currentTarget.style.background = "transparent"; }}
      role="button"
      aria-label={app.label}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
    >
      <div
        className="w-11 h-11 flex items-center justify-center rounded-xl"
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {app.icon}
      </div>
      <span className="text-gray-400 text-[10px] font-medium leading-tight text-center max-w-[56px] truncate group-hover:text-gray-200 transition-colors">
        {app.label}
      </span>
    </motion.div>
  );

  if (app.type === "link") {
    return (
      <Link key={app.id} href={app.href} target="_blank" rel="noopener noreferrer" onClick={onClick}>
        {content}
      </Link>
    );
  }
  return content;
};

export default Menu;