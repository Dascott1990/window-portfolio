"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { FcBullish, FcGraduationCap, FcCollaboration, FcFolder } from "react-icons/fc";
import { BiSolidFilePdf, BiChevronUp, BiChevronDown } from "react-icons/bi";
import { FiSearch, FiX } from "react-icons/fi";
import {
  FaGamepad, FaMusic, FaMapMarkerAlt, FaCalendarAlt,
  FaRobot, FaCamera, FaChartLine, FaHeartbeat, FaCreditCard,
} from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { VscGithubInverted } from "react-icons/vsc";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const PINNED_APPS = [
  { id: "projects",   label: "Projects",   icon: <FcFolder size={24} />,                                   type: "action", category: "work" },
  { id: "resume",     label: "Resume",     icon: <BiSolidFilePdf size={22} className="text-red-400" />,    type: "action", category: "work" },
  { id: "experience", label: "Experience", icon: <FcCollaboration size={24} />,                            type: "action", category: "work" },
  { id: "impact",     label: "Impact",     icon: <FcBullish size={24} />,                                  type: "action", category: "work" },
  { id: "education",  label: "Education",  icon: <FcGraduationCap size={24} />,                            type: "action", category: "work" },
  { id: "github",     label: "GitHub",     icon: <VscGithubInverted size={22} className="text-white" />,   type: "link",   category: "work", href: "https://github.com/dascott1990" },
  { id: "game",       label: "Game",       icon: <FaGamepad size={22} className="text-green-400" />,       type: "action", category: "apps" },
  { id: "music",      label: "Music",      icon: <FaMusic size={20} className="text-purple-400" />,        type: "action", category: "apps" },
  { id: "map",        label: "Map",        icon: <FaMapMarkerAlt size={22} className="text-rose-400" />,   type: "action", category: "apps" },
  { id: "contact",    label: "Contact",    icon: <MdEmail size={24} className="text-sky-400" />,           type: "action", category: "apps" },
  { id: "calendar",   label: "Calendar",   icon: <FaCalendarAlt size={20} className="text-amber-400" />,   type: "action", category: "apps" },
  { id: "health",     label: "Health",     icon: <FaHeartbeat size={20} className="text-pink-400" />,      type: "action", category: "apps" },
  { id: "ai",         label: "Project AI", icon: <FaRobot size={22} className="text-indigo-400" />,        type: "action", category: "apps" },
  { id: "camera",     label: "Camera",     icon: <FaCamera size={20} className="text-cyan-400" />,         type: "action", category: "apps" },
  { id: "assets",     label: "Assets",     icon: <FaChartLine size={20} className="text-teal-400" />,      type: "action", category: "apps" },
  { id: "fintech",    label: "NovaPay",    icon: <FaCreditCard size={20} className="text-blue-400" />,     type: "action", category: "apps" },
];

const PROFILE_FIELDS = [
  ["Name",       "Rasheed Tajudeen"],
  ["Email",      "dascottblog@gmail.com"],
  ["Phone",      "+1 416 505 6927"],
  ["Location",   "Toronto, ON, Canada"],
  ["Experience", `${new Date().getFullYear() - 2022}+ years`],
];

const Menu = ({
  isStartMenuOpen, setShowModal, screen,
  setexperience, setImpact, setEducation,
  setInfo, info, setShowFintech,
  // All app openers — wired from home page
  setGame, setMusicOpen, setMapOpen,
  setShowCalendar, setShowHealth, setShowAI,
  setShowCamera, setShowAssetNews, setShowContact,
  setShowResume,
}) => {
  const [search,  setSearch]  = useState("");
  const [focused, setFocused] = useState(null);
  const searchRef = useRef(null);

  useEffect(() => {
    if (isStartMenuOpen) setTimeout(() => searchRef.current?.focus(), 120);
    else { setSearch(""); setFocused(null); }
  }, [isStartMenuOpen]);

  const handleAppClick = useCallback((id) => {
    try { new Audio("/click.wav").play(); } catch {}
    const map = {
      projects:   () => setShowModal?.(true),
      experience: () => setexperience?.(true),
      impact:     () => setImpact?.(true),
      education:  () => setEducation?.(true),
      fintech:    () => setShowFintech?.(true),
      resume:     () => setShowResume?.(true),
      game:       () => setGame?.(true),
      music:      () => setMusicOpen?.(true),
      map:        () => setMapOpen?.(true),
      calendar:   () => setShowCalendar?.(true),
      health:     () => setShowHealth?.(true),
      ai:         () => setShowAI?.(true),
      camera:     () => setShowCamera?.(true),
      assets:     () => setShowAssetNews?.(true),
      contact:    () => setShowContact?.(true),
      github:     () => window.open("https://github.com/dascott1990", "_blank"),
    };
    map[id]?.();
  }, [
    setShowModal, setexperience, setImpact, setEducation, setShowFintech,
    setShowResume, setGame, setMusicOpen, setMapOpen, setShowCalendar,
    setShowHealth, setShowAI, setShowCamera, setShowAssetNews, setShowContact,
  ]);

  const filtered    = search.trim()
    ? PINNED_APPS.filter(a => a.label.toLowerCase().includes(search.toLowerCase()))
    : PINNED_APPS;
  const workApps    = filtered.filter(a => a.category === "work");
  const otherApps   = filtered.filter(a => a.category === "apps");
  const isFiltering = search.trim().length > 0;

  return (
    <div className="flex flex-col items-center justify-center flex-grow pointer-events-none">
      <AnimatePresence>
        {isStartMenuOpen && screen && (
          <motion.div
            key="start-menu"
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto flex flex-col mt-auto mb-2 rounded-2xl overflow-hidden"
            style={{
              width: "min(520px, 95vw)",
              maxHeight: "min(68vh, calc(100vh - var(--taskbar-height,52px) - 16px))",
              background: "rgba(15,17,26,0.94)",
              backdropFilter: "blur(28px) saturate(1.8)",
              WebkitBackdropFilter: "blur(28px) saturate(1.8)",
              border: "1px solid rgba(255,255,255,0.09)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
            }}
          >
            {/* Search */}
            <div className="px-3 pt-3 pb-2 flex-shrink-0">
              <div className="relative flex items-center">
                <FiSearch className="absolute left-3 text-gray-500 text-sm pointer-events-none" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search apps…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => { if (e.key === "Escape") { setSearch(""); searchRef.current?.blur(); } }}
                  className="w-full pl-8 pr-8 py-2 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500/40 transition-all"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)" }}
                />
                {search && (
                  <button onClick={() => { setSearch(""); searchRef.current?.focus(); }}
                    className="absolute right-3 text-gray-500 hover:text-white">
                    <FiX size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* App grid */}
            <div className="flex-1 overflow-y-auto px-3 pb-2" style={{ scrollbarWidth: "none" }}>
              {isFiltering && filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-gray-600 gap-2">
                  <FiSearch size={22} className="opacity-40" />
                  <p className="text-xs">No apps found for "{search}"</p>
                </div>
              )}
              {isFiltering && filtered.length > 0 && (
                <><SectionLabel label={`${filtered.length} result${filtered.length !== 1 ? "s" : ""}`} />
                  <AppGrid apps={filtered} focused={focused} onAppClick={handleAppClick} /></>
              )}
              {!isFiltering && (
                <>
                  <SectionLabel label="Work & Portfolio" />
                  <AppGrid apps={workApps} focused={focused} onAppClick={handleAppClick} />
                  <SectionLabel label="Applications" className="mt-2" />
                  <AppGrid apps={otherApps} focused={focused} onAppClick={handleAppClick} />
                </>
              )}
            </div>

            <div className="mx-3 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }} />

            {/* Profile footer */}
            <div className="px-3 py-2 flex-shrink-0">
              <button
                onClick={() => { try { new Audio("/click.wav").play(); } catch {} setInfo(!info); }}
                className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl transition-colors group"
                style={{ background: "transparent" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div className="relative flex-shrink-0">
                  <Image src="/img.jpeg" width={32} height={32}
                    className="rounded-full object-cover"
                    style={{ border: "1.5px solid rgba(255,255,255,0.18)" }}
                    alt="Profile" />
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border-2 border-[#0f111a]" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-white text-xs font-semibold leading-tight truncate">Rasheed Tajudeen</p>
                  <p className="text-gray-500 text-[10px] truncate">Full-Stack · Cybersecurity</p>
                </div>
                <div className="text-gray-600 flex-shrink-0">
                  {info ? <BiChevronDown size={16} /> : <BiChevronUp size={16} />}
                </div>
              </button>

              <AnimatePresence>
                {info && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}
                    className="overflow-hidden">
                    <div className="mt-1.5 rounded-xl px-3 py-2.5"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        {PROFILE_FIELDS.map(([k, v]) => (
                          <React.Fragment key={k}>
                            <dt className="text-gray-600 font-medium">{k}</dt>
                            <dd className="text-gray-300 truncate">{v}</dd>
                          </React.Fragment>
                        ))}
                        <dt className="text-gray-600 font-medium">Skills</dt>
                        <dd className="text-gray-300 leading-relaxed text-[10px]">
                          React · Node.js · TypeScript · PostgreSQL · Docker · AWS
                        </dd>
                      </dl>
                      <div className="flex gap-2 mt-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                        <a href="https://github.com/dascott1990" target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] text-gray-400 hover:text-white transition-colors"
                          style={{ background: "rgba(255,255,255,0.06)" }}>
                          <VscGithubInverted size={11} /> GitHub
                        </a>
                        <a href="https://www.linkedin.com/in/rasheed-tajudeen-614606374" target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] text-gray-400 hover:text-white transition-colors"
                          style={{ background: "rgba(255,255,255,0.06)" }}>
                          <span className="text-[#0A66C2] font-bold text-[10px]">in</span> LinkedIn
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

const SectionLabel = ({ label, className = "" }) => (
  <p className={`text-[9px] font-semibold text-gray-600 uppercase tracking-widest mb-1.5 px-1 ${className}`}>
    {label}
  </p>
);

const AppGrid = ({ apps, focused, onAppClick }) => (
  <div className="grid gap-0.5 mb-1" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))" }}>
    {apps.map((app, i) => (
      <AppTile key={app.id} app={app} isFocused={focused === app.id}
        delay={i * 0.012} onClick={() => onAppClick(app.id)} />
    ))}
  </div>
);

const AppTile = ({ app, isFocused, delay, onClick }) => {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.14 }}
      className="flex flex-col items-center gap-1 p-2 rounded-xl cursor-pointer select-none group"
      style={{ background: isFocused ? "rgba(59,130,246,0.18)" : "transparent", WebkitTapHighlightColor: "transparent" }}
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      onMouseEnter={e => { if (!isFocused) e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
      onMouseLeave={e => { if (!isFocused) e.currentTarget.style.background = "transparent"; }}
      role="button" aria-label={app.label} tabIndex={0}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
    >
      <div className="w-10 h-10 flex items-center justify-center rounded-xl"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
        {app.icon}
      </div>
      <span className="text-gray-400 text-[9px] font-medium leading-tight text-center w-full truncate group-hover:text-gray-200 transition-colors px-0.5">
        {app.label}
      </span>
    </motion.div>
  );
  if (app.type === "link") {
    return <Link href={app.href} target="_blank" rel="noopener noreferrer" onClick={onClick}>{content}</Link>;
  }
  return content;
};

export default Menu;