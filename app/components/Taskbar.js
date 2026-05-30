import React, { useState, useEffect } from "react";
import { MdWindow } from "react-icons/md";
import { FcFolder } from "react-icons/fc";
import { VscGithubInverted } from "react-icons/vsc";
import { AiFillLinkedin } from "react-icons/ai";
import { FaTwitterSquare, FaWifi } from "react-icons/fa";
import { BsBatteryFull } from "react-icons/bs";
import Link from "next/link";
import { motion } from "framer-motion";

const Taskbar = ({
  screenWidth,
  isStartMenuOpen,
  setIsStartMenuOpen,
  click,
  isClick,
  screenSet,
  setShowModal,
  screen,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const playSound = () => {
    try { new Audio("/click.wav").play(); } catch {}
  };

  const formattedTime = currentTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const formattedDate = currentTime.toLocaleDateString([], {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });

  const navItems = [
    {
      id: "start",
      icon: (
        <MdWindow
          className={`text-2xl transition-colors ${
            isStartMenuOpen ? "text-blue-400" : "text-blue-400/80 hover:text-blue-400"
          }`}
        />
      ),
      tooltip: "Start",
      action: () => {
        playSound();
        isClick(!click);
        screenSet(!screen);
        setIsStartMenuOpen(!isStartMenuOpen);
      },
      active: isStartMenuOpen,
    },
    {
      id: "projects",
      icon: <FcFolder className="text-2xl" />,
      tooltip: "Projects",
      action: () => { playSound(); setShowModal(true); },
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

  return (
    <div
      className="
        flex items-center justify-between
        px-4 py-1.5 w-full
        backdrop-blur-2xl bg-black/40 border-t border-white/8
        relative z-50
      "
      style={{ minHeight: 52 }}
    >
      {/* Left: system tray / weather placeholder */}
      <div className="hidden md:flex items-center gap-2 w-32">
        <FaWifi className="text-white/50 text-sm" />
        <BsBatteryFull className="text-white/50 text-sm" />
        <span className="text-white/40 text-xs">●</span>
      </div>

      {/* Center: pinned apps */}
      <div className="flex items-center justify-center gap-1 flex-1">
        {navItems.map((item) => {
          const btn = (
            <TaskbarButton
              key={item.id}
              item={item}
              isHovered={hovered === item.id}
              onHoverStart={() => setHovered(item.id)}
              onHoverEnd={() => setHovered(null)}
            />
          );
          if (item.href) {
            return (
              <Link key={item.id} href={item.href} target="_blank" onClick={playSound}>
                {btn}
              </Link>
            );
          }
          return btn;
        })}
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

const TaskbarButton = ({ item, isHovered, onHoverStart, onHoverEnd }) => (
  <div className="relative">
    <motion.button
      onClick={item.action}
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      whileHover={{ backgroundColor: "rgba(255,255,255,0.10)" }}
      whileTap={{ scale: 0.9 }}
      className={`
        relative flex items-center justify-center
        w-10 h-10 rounded-lg cursor-pointer transition-colors
        ${item.active ? "bg-white/12" : ""}
      `}
      aria-label={item.tooltip}
    >
      {item.icon}
      {/* Active indicator dot */}
      {item.active && (
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400" />
      )}
    </motion.button>

    {/* Tooltip */}
    <AnimatedTooltip show={isHovered} label={item.tooltip} />
  </div>
);

const AnimatedTooltip = ({ show, label }) => (
  <motion.div
    initial={{ opacity: 0, y: 4 }}
    animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: 4 }}
    transition={{ duration: 0.12 }}
    pointerEvents="none"
    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-lg bg-gray-800 border border-white/10 text-white text-xs whitespace-nowrap shadow-lg pointer-events-none"
  >
    {label}
  </motion.div>
);

export default Taskbar;