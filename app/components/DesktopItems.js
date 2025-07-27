import React, { useState, useEffect } from "react";
import { FcFolder } from "react-icons/fc";
import { VscGithubInverted } from "react-icons/vsc";
import { BiSolidFilePdf } from "react-icons/bi";
import { FaGamepad, FaRegMoon, FaRegSun, FaMusic, FaMapMarkerAlt } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { motion, useMotionValue } from "framer-motion";

const DesktopItems = ({ isStartMenuOpen, setShowModal, setGame, setMusicOpen, setMapOpen }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [time, setTime] = useState(new Date());
  const [weather, setWeather] = useState({ temp: '--°', condition: '--' });
  const [togglePosition, setTogglePosition] = useState({ x: 0, y: 0 });

  // Load saved position from localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem('togglePosition');
    if (savedPosition) {
      setTogglePosition(JSON.parse(savedPosition));
    }
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
  }, [darkMode]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=San%20Francisco&units=metric&appid=${process.env.NEXT_PUBLIC_WEATHER_API_KEY}`
        );
        const data = await response.json();
        setWeather({
          temp: `${Math.round(data.main.temp)}°C`,
          condition: data.weather[0].main
        });
      } catch (error) {
        console.error("Weather API error:", error);
      }
    };
    
    fetchWeather();
    const weatherInterval = setInterval(fetchWeather, 600000);
    return () => clearInterval(weatherInterval);
  }, []);

  const playSound = () => new Audio("click.wav").play();

  const iconAnimation = {
    hover: { scale: 1.05, y: -2 },
    tap: { scale: 0.95 },
  };

  const glassEffect = "backdrop-blur-md bg-white/20 dark:bg-gray-800/30";
  const borderEffect = "border border-white/20 dark:border-gray-600/30";
  const shadowEffect = "shadow-lg shadow-black/20";

  const icons = [
    { icon: <FcFolder size={48} />, label: "Projects", action: () => { playSound(); setShowModal(true); } },
    { icon: <VscGithubInverted size={48} className="text-white" />, label: "Github", action: () => { playSound(); window.open("https://github.com/dascott1990", "_blank"); } },
    { icon: <BiSolidFilePdf size={48} className="text-red-600" />, label: "Resume", action: () => { playSound(); window.open("https://drive.google.com/file/d/1tYMVwL4xGvdwlP4xn8UC8K24gz0PrS6F/view?usp=drive_link", "_blank"); } },
    { icon: <FaGamepad size={48} className="text-green-500" />, label: "Game", action: () => { playSound(); setGame(true); } },
    { icon: <FaMusic size={48} className="text-purple-500" />, label: "Music", action: () => { playSound(); setMusicOpen(true); } },
    { icon: <FaMapMarkerAlt size={48} className="text-red-500" />, label: "Map", action: () => { playSound(); setMapOpen(true); } },
    { icon: <MdEmail size={48} className="text-blue-400" />, label: "Contact", action: () => { playSound(); window.location.href = "mailto:dascottblog@gmail.com"; } }
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
            className={`flex flex-col items-center p-4 rounded-xl ${glassEffect} ${borderEffect} ${shadowEffect} cursor-pointer`}
          >
            {item.icon}
            <p className="text-white mt-2">{item.label}</p>
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
            className={`flex flex-col items-center p-2 rounded-xl ${glassEffect} ${borderEffect} ${shadowEffect} cursor-pointer`}
          >
            <div className="w-14 h-14 flex items-center justify-center">
              {React.cloneElement(item.icon, { size: 36 })}
            </div>
            <p className="text-white text-xs mt-1">{item.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Draggable Dark Mode Toggle */}
      <motion.button
        drag
        dragConstraints={{
          top: 0,
          left: 0,
          right: typeof window !== 'undefined' ? window.innerWidth - 48 : 0,
          bottom: typeof window !== 'undefined' ? window.innerHeight - 48 : 0,
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
        className={`fixed p-3 rounded-full ${glassEffect} ${borderEffect} ${shadowEffect} z-50 cursor-grab active:cursor-grabbing`}
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