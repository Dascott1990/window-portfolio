import React, { useState, useEffect } from "react";
import { FcFolder } from "react-icons/fc";
import { VscGithubInverted } from "react-icons/vsc";
import { BiSolidFilePdf } from "react-icons/bi";
import { 
  FaGamepad, 
  FaRegMoon, 
  FaRegSun, 
  FaMusic, 
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaHeartbeat,
  FaRobot,
  FaCamera,
  FaChartLine
} from "react-icons/fa";
import { MdEmail, MdHealthAndSafety } from "react-icons/md";
import { motion, useMotionValue, AnimatePresence } from "framer-motion";
import Calendar from "./premium/Calendar";
import Health from "./premium/Health";
import ProjectAI from "./premium/ProjectAI";
import Camera from "./premium/Camera";
import AssetNews from './premium/AssetNews';
import Contact from "./premium/Contact";
import Resume from "./premium/Resume";

const DesktopItems = ({ isStartMenuOpen, setGame, setMusicOpen, setMapOpen, setShowModal }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [time, setTime] = useState(new Date());
  const [weather, setWeather] = useState({ temp: '--°', condition: '--' });
  const [togglePosition, setTogglePosition] = useState({ x: 0, y: 0 });
  const [showCalendar, setShowCalendar] = useState(false);
  const [showHealth, setShowHealth] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showAssetNews, setShowAssetNews] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  // Load saved position and dark mode from localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem('togglePosition');
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    
    if (savedPosition) setTogglePosition(JSON.parse(savedPosition));
    if (savedDarkMode) setDarkMode(savedDarkMode);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const x = useMotionValue(togglePosition.x);
  const y = useMotionValue(togglePosition.y);

  const handleDragEnd = (event, info) => {
    const newPosition = { x: info.point.x, y: info.point.y };
    setTogglePosition(newPosition);
    localStorage.setItem('togglePosition', JSON.stringify(newPosition));
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const playSound = () => {
    try {
      new Audio("/click.wav").play();
    } catch (e) {
      console.log("Sound error:", e);
    }
  };

  const iconAnimation = {
    hover: { scale: 1.05, y: -2 },
    tap: { scale: 0.95 },
  };

  const glassEffect = "backdrop-blur-sm bg-white/30 dark:bg-gray-900/10";
  const borderEffect = "border border-white/30 dark:border-gray-800/20";
  const shadowEffect = "shadow-lg shadow-black/30 hover:shadow-xl hover:shadow-black/40";

  const icons = [
    { 
      icon: <FcFolder size={48} className="drop-shadow-lg" />, 
      label: "Projects", 
      action: () => { playSound(); setShowModal(true); },
      bg: "bg-blue-100/20"
    },
    { 
      icon: <FaRobot size={48} className="text-indigo-500 drop-shadow-lg" />, 
      label: "Project AI", 
      action: () => { playSound(); setShowAI(true); },
      bg: "bg-indigo-500/20"
    },
    { 
      icon: <VscGithubInverted size={48} className="text-gray-800 dark:text-gray-100 drop-shadow-lg" />, 
      label: "Github", 
      action: () => { playSound(); window.open("https://github.com/dascott1990", "_blank"); },
      bg: "bg-gray-800/20 dark:bg-gray-100/20"
    },
    { 
  icon: <BiSolidFilePdf size={48} className="text-red-500 drop-shadow-lg" />, 
  label: "Resume", 
  action: () => { playSound(); setShowResume(true); },
  bg: "bg-red-500/20"
},
    { 
      icon: <FaGamepad size={48} className="text-green-500 drop-shadow-lg" />, 
      label: "Game", 
      action: () => { playSound(); setGame(true); },
      bg: "bg-green-500/20"
    },
    { 
      icon: <FaMusic size={48} className="text-purple-500 drop-shadow-lg" />, 
      label: "Music", 
      action: () => { playSound(); setMusicOpen(true); },
      bg: "bg-purple-500/20"
    },
    { 
      icon: <FaMapMarkerAlt size={48} className="text-red-400 drop-shadow-lg" />, 
      label: "Map", 
      action: () => { playSound(); setMapOpen(true); },
      bg: "bg-red-400/20"
    },
    { 
      icon: <MdEmail size={48} className="text-blue-400 drop-shadow-lg" />, 
      label: "Contact", 
      action: () => { playSound(); setShowContact(true); },
      bg: "bg-blue-400/20"
    },
    { 
      icon: <FaCalendarAlt size={48} className="text-yellow-500 drop-shadow-lg" />, 
      label: "Calendar", 
      action: () => { playSound(); setShowCalendar(true); },
      bg: "bg-yellow-500/20"
    },
    { 
      icon: <MdHealthAndSafety size={48} className="text-pink-500 drop-shadow-lg" />, 
      label: "Health", 
      action: () => { playSound(); setShowHealth(true); },
      bg: "bg-pink-500/20"
    },
    { 
      icon: <FaCamera size={48} className="text-cyan-500 drop-shadow-lg" />, 
      label: "Camera", 
      action: () => { playSound(); setShowCamera(true); },
      bg: "bg-cyan-500/20"
    },
    { 
      icon: <FaChartLine size={48} className="text-teal-500 drop-shadow-lg" />, 
      label: "Assets", 
      action: () => { playSound(); setShowAssetNews(true); },
      bg: "bg-teal-500/20"
    }
  ];

  return (
    <div className={isStartMenuOpen ? "hidden" : "block w-full h-full"}>
      {/* iOS Status Bar (Mobile Only) */}
      <div className="fixed top-0 left-0 right-0 z-50 md:hidden">
        <div className={`flex justify-between items-center px-4 py-2 ${glassEffect} ${borderEffect}`}>
          <div className="text-sm font-semibold text-white">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-xs font-medium text-white flex items-center">
              <span className="mr-1">{weather.condition}</span>
              <span>{weather.temp}</span>
            </div>
            <div className="flex items-center space-x-1">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-1 h-3 bg-white rounded-full opacity-80" />
              ))}
            </div>
            <span className="text-xs font-medium text-white">5G</span>
            <div className="flex items-center">
              <div className="w-4 h-2 border border-white rounded-sm">
                <div className="h-full bg-white w-3/4" />
              </div>
              <div className="w-1 h-1 ml-px bg-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-8">
        {icons.map((item, index) => (
          <motion.div
            key={index}
            variants={iconAnimation}
            whileHover="hover"
            whileTap="tap"
            onClick={item.action}
            className={`flex flex-col items-center p-6 rounded-2xl ${glassEffect} ${borderEffect} ${shadowEffect} cursor-pointer ${item.bg}`}
          >
            <div className="p-3 rounded-xl bg-white/30 dark:bg-black/20 backdrop-blur-sm">
              {item.icon}
            </div>
            <p className="text-white dark:text-gray-100 mt-3 font-medium text-sm">{item.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden grid grid-cols-4 gap-4 p-4 pt-20 pb-24">
        {icons.map((item, index) => (
          <motion.div
            key={index}
            variants={iconAnimation}
            whileHover="hover"
            whileTap="tap"
            onClick={item.action}
            className={`flex flex-col items-center p-3 rounded-xl ${glassEffect} ${borderEffect} ${shadowEffect} cursor-pointer ${item.bg}`}
          >
            <div className="w-12 h-12 flex items-center justify-center p-2 rounded-lg bg-white/30 dark:bg-black/20 backdrop-blur-sm">
              {React.cloneElement(item.icon, { size: 28 })}
            </div>
            <p className="text-white dark:text-gray-100 text-xs mt-2 font-medium">{item.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Premium Components */}
      <AnimatePresence>
        {showCalendar && <Calendar onClose={() => setShowCalendar(false)} />}
        {showHealth && <Health onClose={() => setShowHealth(false)} />}
        {showAI && <ProjectAI onClose={() => setShowAI(false)} />}
        {showCamera && <Camera onClose={() => setShowCamera(false)} />}
        {showAssetNews && (
          <AssetNews 
            onClose={() => setShowAssetNews(false)}
            glassEffect={glassEffect}
            borderEffect={borderEffect}
            shadowEffect={shadowEffect}
          />
        )}
        {showResume && <Resume onClose={() => setShowResume(false)} />}
        {showContact && <Contact onClose={() => setShowContact(false)} />}
      </AnimatePresence>

      {/* Enhanced Dark Mode Toggle */}
      <motion.button
        drag
        dragConstraints={{
          top: 0,
          left: 0,
          right: windowSize.width - 48,
          bottom: windowSize.height - 48,
        }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x, y }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          setDarkMode(!darkMode);
          playSound();
        }}
        className={`fixed p-3 rounded-full ${glassEffect} ${borderEffect} shadow-[0_0_60px_rgba(0,0,0,0.7)] hover:shadow-[0_0_100px_rgba(0,0,0,0.8)] z-50 cursor-grab active:cursor-grabbing`}
        aria-label="Toggle dark mode"
        initial={togglePosition}
      >
        {darkMode ? (
          <FaRegSun className="text-yellow-300 text-xl" />
        ) : (
          <FaRegMoon className="text-gray-700 text-xl" />
        )}
      </motion.button>
    </div>
  );
};

export default DesktopItems;