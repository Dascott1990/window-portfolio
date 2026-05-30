import React, { useState, useRef, useEffect } from "react";
import { FcBullish, FcGraduationCap, FcCollaboration, FcFolder } from "react-icons/fc";
import { BiSolidFilePdf } from "react-icons/bi";
import { BiChevronUp, BiChevronDown } from "react-icons/bi";
import { FiSearch, FiPower } from "react-icons/fi";
import {
  FaGamepad, FaMusic, FaMapMarkerAlt, FaCalendarAlt,
  FaRobot, FaCamera, FaChartLine, FaHeartbeat
} from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { VscGithubInverted } from "react-icons/vsc";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const PINNED_APPS = [
  { id: "projects", label: "Projects", icon: <FcFolder size={28} />, type: "action" },
  { id: "resume", label: "Resume", icon: <BiSolidFilePdf size={26} className="text-red-400" />, type: "action" },
  { id: "experience", label: "Experience", icon: <FcCollaboration size={28} />, type: "action" },
  { id: "impact", label: "Impact", icon: <FcBullish size={28} />, type: "action" },
  { id: "education", label: "Education", icon: <FcGraduationCap size={28} />, type: "action" },
  { id: "github", label: "GitHub", icon: <VscGithubInverted size={26} className="text-white" />, type: "link", href: "https://github.com/dascott1990" },
  { id: "game", label: "Game", icon: <FaGamepad size={26} className="text-green-400" />, type: "action" },
  { id: "music", label: "Music", icon: <FaMusic size={24} className="text-purple-400" />, type: "action" },
  { id: "map", label: "Map", icon: <FaMapMarkerAlt size={26} className="text-rose-400" />, type: "action" },
  { id: "contact", label: "Contact", icon: <MdEmail size={28} className="text-sky-400" />, type: "action" },
  { id: "calendar", label: "Calendar", icon: <FaCalendarAlt size={24} className="text-amber-400" />, type: "action" },
  { id: "health", label: "Health", icon: <FaHeartbeat size={24} className="text-pink-400" />, type: "action" },
  { id: "ai", label: "Project AI", icon: <FaRobot size={26} className="text-indigo-400" />, type: "action" },
  { id: "camera", label: "Camera", icon: <FaCamera size={24} className="text-cyan-400" />, type: "action" },
  { id: "assets", label: "Assets", icon: <FaChartLine size={24} className="text-teal-400" />, type: "action" },
];

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
  const [search, setSearch] = useState("");
  const searchRef = useRef(null);

  useEffect(() => {
    if (isStartMenuOpen && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 150);
    } else {
      setSearch("");
    }
  }, [isStartMenuOpen]);

  const handleAppClick = (id) => {
    try { new Audio("/click.wav").play(); } catch {}
    const actions = {
      projects: () => setShowModal(true),
      experience: () => setexperience(true),
      impact: () => setImpact(true),
      education: () => setEducation(true),
    };
    actions[id]?.();
  };

  const filtered = search
    ? PINNED_APPS.filter((a) =>
        a.label.toLowerCase().includes(search.toLowerCase())
      )
    : PINNED_APPS;

  const menuVariants = {
    hidden: { opacity: 0, y: 16, scale: 0.97 },
    visible: {
      opacity: 1, y: 0, scale: 1,
      transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
    },
    exit: {
      opacity: 0, y: 12, scale: 0.97,
      transition: { duration: 0.15, ease: "easeIn" },
    },
  };

  return (
    <div className="flex flex-col items-center justify-center flex-grow pointer-events-none">
      <AnimatePresence>
        {isStartMenuOpen && screen && (
          <motion.div
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`
              pointer-events-auto flex flex-col mt-auto mb-2
              w-[540px] smbelow:w-[95vw] max-h-[70vh]
              rounded-2xl overflow-hidden
              backdrop-blur-2xl bg-gray-900/85 dark:bg-gray-950/90
              border border-white/10
              shadow-2xl shadow-black/60
            `}
            style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)" }}
          >
            {/* Search bar */}
            <div className="px-5 pt-5 pb-3">
              <div className="relative flex items-center">
                <FiSearch className="absolute left-3.5 text-gray-400 text-base" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search apps..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/8 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:bg-white/12 transition-all"
                />
              </div>
            </div>

            {/* Section label */}
            <div className="px-5 pb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                {search ? `Results (${filtered.length})` : "Pinned"}
              </p>
            </div>

            {/* App grid */}
            <div className="flex-1 overflow-y-auto px-4 pb-3">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                  <FiSearch size={28} className="mb-2 opacity-40" />
                  <p className="text-sm">No apps found</p>
                </div>
              ) : (
                <div className="grid grid-cols-5 smbelow:grid-cols-4 gap-1">
                  {filtered.map((app, i) => (
                    <AppTile
                      key={app.id}
                      app={app}
                      delay={i * 0.02}
                      onClick={() => handleAppClick(app.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="mx-5 border-t border-white/8" />

            {/* Footer / profile */}
            <div className="flex items-center justify-between px-5 py-3">
              <button
                onClick={() => {
                  try { new Audio("/click.wav").play(); } catch {}
                  setInfo(!info);
                }}
                className="flex items-center gap-3 hover:bg-white/8 rounded-xl px-2 py-1.5 transition-colors flex-1 min-w-0"
              >
                <Image
                  src="/img.jpeg"
                  width={36}
                  height={36}
                  className="rounded-full border border-white/20 flex-shrink-0"
                  alt="Profile"
                />
                <div className="text-left min-w-0">
                  <p className="text-white text-sm font-semibold truncate">Rasheed Tajudeen</p>
                  <p className="text-gray-400 text-xs truncate">Full-Stack · Cybersecurity</p>
                </div>
                {info ? (
                  <BiChevronDown className="text-gray-400 text-lg ml-auto flex-shrink-0" />
                ) : (
                  <BiChevronUp className="text-gray-400 text-lg ml-auto flex-shrink-0" />
                )}
              </button>
              <button
                className="p-2 rounded-xl hover:bg-white/8 text-gray-400 hover:text-white transition-colors ml-2 flex-shrink-0"
                aria-label="Shut down"
              >
                <FiPower size={18} />
              </button>
            </div>

            {/* Info panel */}
            <AnimatePresence>
              {info && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t border-white/8"
                >
                  <div className="px-5 py-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    {[
                      ["Name", "Rasheed Tajudeen"],
                      ["Email", "dascottblog@gmail.com"],
                      ["Phone", "+1 416 505 6927"],
                      ["Location", "Toronto, ON, Canada"],
                      ["Experience", `${new Date().getFullYear() - 2022}+ years`],
                    ].map(([k, v]) => (
                      <React.Fragment key={k}>
                        <span className="text-gray-500 font-medium">{k}</span>
                        <span className="text-gray-200 truncate">{v}</span>
                      </React.Fragment>
                    ))}
                    <span className="text-gray-500 font-medium">Skills</span>
                    <span className="text-gray-200 text-xs leading-relaxed col-span-1">
                      React · Node.js · TypeScript · PostgreSQL · Python · Docker · AWS · Swift · Flutter
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AppTile = ({ app, delay, onClick }) => {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.2 }}
      whileHover={{ backgroundColor: "rgba(255,255,255,0.08)" }}
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl cursor-pointer transition-colors"
    >
      <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/6 border border-white/8">
        {app.icon}
      </div>
      <span className="text-gray-300 text-[10px] font-medium leading-tight text-center max-w-[56px] truncate">
        {app.label}
      </span>
    </motion.div>
  );

  if (app.type === "link") {
    return (
      <Link href={app.href} target="_blank" onClick={onClick}>
        {content}
      </Link>
    );
  }
  return content;
};

export default Menu;