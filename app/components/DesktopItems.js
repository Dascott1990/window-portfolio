import React from "react";
import { FcFolder } from "react-icons/fc";
import { VscGithubInverted } from "react-icons/vsc";
import Link from "next/link";
import { BiSolidFilePdf } from "react-icons/bi";
import { FaGamepad, FaRegMoon, FaRegSun } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { motion } from "framer-motion";
import "react-toastify/dist/ReactToastify.css";

const DesktopItems = ({ isStartMenuOpen, setShowModal, setGame }) => {
  const [darkMode, setDarkMode] = React.useState(false);

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const iconAnimation = {
    hover: { scale: 1.05, y: -2 },
    tap: { scale: 0.95 },
  };

  const glassEffect = "backdrop-blur-md bg-opacity-20 dark:bg-opacity-30";
  const borderEffect = "border border-white/20 dark:border-gray-600/30";
  const shadowEffect = "shadow-lg shadow-black/20";

  return (
    <div className={isStartMenuOpen ? "hidden" : "block w-full"}>
      {/* Theme Toggle */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          setDarkMode(!darkMode);
          new Audio("click.wav").play();
        }}
        className={`fixed top-4 right-4 p-2 rounded-full ${glassEffect} ${borderEffect} ${shadowEffect} bg-white/50 dark:bg-gray-800/50 z-50`}
        aria-label="Toggle dark mode"
      >
        {darkMode ? (
          <FaRegSun className="text-yellow-300 text-xl" />
        ) : (
          <FaRegMoon className="text-gray-700 text-xl" />
        )}
      </motion.button>

      <div className="flex flex-col items-start justify-start w-full p-8 gap-6">
        {/* Projects */}
        <motion.div
          variants={iconAnimation}
          whileHover="hover"
          whileTap="tap"
          className={`flex flex-col items-center justify-center p-1 rounded-md relative transition-all duration-200 hover:shadow-xl hover:bg-slate-900/50 hover:cursor-pointer ${glassEffect} ${borderEffect} ${shadowEffect}`}
          onClick={() => {
            const audio = new Audio("click.wav");
            audio.play();
            setShowModal(true);
          }}
        >
          <FcFolder className="text-6xl" />
          <p className="text-white text-center">Projects</p>
        </motion.div>

        {/* GitHub */}
        <Link
          href="https://github.com/dascott1990"
          onClick={() => {
            const audio = new Audio("click.wav");
            audio.play();
          }}
          target="_blank"
        >
          <motion.div
            variants={iconAnimation}
            whileHover="hover"
            whileTap="tap"
            className={`flex flex-col items-center justify-center p-1 rounded-md relative transition-all duration-200 hover:shadow-xl hover:bg-slate-900/50 hover:cursor-pointer ${glassEffect} ${borderEffect} ${shadowEffect}`}
          >
            <VscGithubInverted className="text-[60px] text-white" />
            <p className="text-white text-center mt-1">Github</p>
          </motion.div>
        </Link>

        {/* Resume */}
        <Link
          href="https://drive.google.com/file/d/1tYMVwL4xGvdwlP4xn8UC8K24gz0PrS6F/view?usp=drive_link"
          onClick={() => {
            const audio = new Audio("click.wav");
            audio.play();
          }}
          target="_blank"
        >
          <motion.div
            variants={iconAnimation}
            whileHover="hover"
            whileTap="tap"
            className={`flex flex-col items-center justify-center rounded-md transition-all duration-200 hover:shadow-xl hover:bg-slate-900/50 hover:cursor-pointer ${glassEffect} ${borderEffect} ${shadowEffect}`}
          >
            <BiSolidFilePdf className="text-red-600 text-7xl" />
            <p className="text-white text-center mt-1">Resume</p>
          </motion.div>
        </Link>

        {/* Game */}
        <motion.div
          variants={iconAnimation}
          whileHover="hover"
          whileTap="tap"
          onClick={() => {
            setGame(true);
            const audio = new Audio("click.wav");
            audio.play();
          }}
          className={`flex flex-col items-center justify-center rounded-md transition-all duration-200 hover:shadow-xl hover:bg-slate-900/50 hover:cursor-pointer ${glassEffect} ${borderEffect} ${shadowEffect}`}
        >
          <FaGamepad className="text-green-500 text-6xl" />
          <p className="text-white text-center">Game</p>
        </motion.div>

        {/* Email */}
        <Link
          href="mailto:dascottblog@gmail.com"
          onClick={() => {
            const audio = new Audio("click.wav");
            audio.play();
          }}
        >
          <motion.div
            variants={iconAnimation}
            whileHover="hover"
            whileTap="tap"
            className={`flex flex-col items-center justify-center rounded-md transition-all duration-200 hover:shadow-xl hover:bg-slate-900/50 hover:cursor-pointer ${glassEffect} ${borderEffect} ${shadowEffect}`}
          >
            <MdEmail className="text-blue-400 text-6xl" />
            <p className="text-white text-center">Contact</p>
          </motion.div>
        </Link>
      </div>
    </div>
  );
};

export default DesktopItems;