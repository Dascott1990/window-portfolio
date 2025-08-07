import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiX, 
  FiSend, 
  FiCpu,
  FiDatabase,
  FiCode,
  FiLayers
} from "react-icons/fi";
import { FaRobot, FaBrain } from "react-icons/fa";
import { IoMdFlash } from "react-icons/io";

const ProjectAI = ({ onClose }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [queries, setQueries] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [darkMode] = useState(localStorage.getItem("darkMode") === "true");
  const [activeCapability, setActiveCapability] = useState(null);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  // System initialization
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    document.documentElement.classList.toggle("dark", darkMode);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [darkMode]);

  const playSystemSound = () => {
    try {
      const audio = new Audio("/click.wav");
      audio.volume = 0.2;
      audio.play().catch(e => console.error("Audio play failed:", e));
    } catch (e) {
      console.error("Audio error:", e);
    }
  };

  const handleQuery = (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    playSystemSound();
    setQueries(prev => [...prev, { 
      text: query, 
      timestamp: new Date(),
      id: Date.now()
    }]);
    setIsProcessing(true);
    
    setTimeout(() => {
      setIsProcessing(false);
    }, 800 + Math.random() * 800); // Natural processing variation
    setQuery("");
  };

  const intelligentClose = () => {
    playSystemSound();
    setIsOpen(false);
    setTimeout(onClose, 300);
  };

  const capabilities = [
    { 
      icon: <FiCpu className="text-blue-500" size={20} />, 
      name: "Neural Core", 
      desc: "Parallel cognition engine"
    },
    { 
      icon: <FaBrain className="text-purple-500" size={18} />, 
      name: "Context Engine", 
      desc: "Semantic understanding"
    },
    { 
      icon: <FiCode className="text-emerald-500" size={20} />, 
      name: "Code Synthesizer", 
      desc: "Precision generation"
    },
    { 
      icon: <IoMdFlash className="text-amber-500" size={20} />, 
      name: "Real-Time Analysis", 
      desc: "Instant pattern recognition"
    }
  ];

  // Responsive values
  const isMobile = windowSize.width < 768;
  const modalMaxWidth = isMobile ? '95vw' : 'min(42rem, 90vw)';
  const modalHeight = isMobile ? '90vh' : '85vh';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ 
            type: "spring",
            damping: 25,
            stiffness: 350,
            mass: 0.7
          }}
          className="fixed inset-0 flex items-center justify-center p-4 z-[100]"
          role="dialog"
          aria-modal="true"
        >
          {/* Main Window Container */}
          <div 
            className="relative"
            style={{
              width: modalMaxWidth,
              height: modalHeight,
              maxHeight: '800px'
            }}
          >
            {/* Glass Panel */}
            <motion.div
              className="h-full w-full backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-white/30 dark:border-gray-800/30 rounded-2xl overflow-hidden flex flex-col shadow-xl shadow-black/10"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {/* Intelligent Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/20 dark:border-gray-800/20">
                <motion.div 
                  className="flex items-center space-x-3"
                  animate={{
                    x: [0, 0.5, -0.5, 0],
                    transition: {
                      repeat: Infinity,
                      repeatType: "mirror",
                      duration: 12,
                      ease: "easeInOut"
                    }
                  }}
                >
                  <motion.div
                    animate={{
                      rotate: [0, 3, -3, 0],
                      y: [0, -1, 1, 0],
                      transition: {
                        duration: 8,
                        repeat: Infinity,
                        repeatType: "mirror"
                      }
                    }}
                  >
                    <FaRobot className="text-2xl text-blue-600 dark:text-blue-400" />
                  </motion.div>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Cognitive Interface
                    </h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      System v2.4 · Operational
                    </p>
                  </div>
                </motion.div>
                
                <motion.button
                  onClick={intelligentClose}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg hover:bg-white/20 dark:hover:bg-gray-800/30 transition-all"
                  aria-label="Close interface"
                >
                  <FiX className="text-gray-700 dark:text-gray-300" />
                </motion.button>
              </div>

              {/* AI Core Content */}
              <div className="flex-1 overflow-hidden flex flex-col">
                {/* System Greeting */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="px-6 pt-5"
                >
                  <div className="bg-blue-500/10 dark:bg-blue-500/15 rounded-xl p-4 max-w-[90%]">
                    <p className="text-blue-600 dark:text-blue-300 font-medium leading-snug">
                      Ready for cognitive input. How may I assist?
                    </p>
                    <p className="text-xs text-blue-500/70 dark:text-blue-400/70 mt-1.5">
                      Last system check: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </motion.div>

                {/* Neural Capabilities Grid */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="px-6 py-5"
                >
                  <h3 className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 font-medium">
                    Active Neural Modules
                  </h3>
                  <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-3`}>
                    {capabilities.map((cap, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setActiveCapability(activeCapability === i ? null : i);
                          playSystemSound();
                        }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          activeCapability === i 
                            ? "bg-blue-500/10 border-blue-500/20 dark:bg-blue-500/15 dark:border-blue-500/30"
                            : "bg-white/30 border-white/25 dark:bg-gray-800/30 dark:border-gray-700/30"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="shrink-0">{cap.icon}</div>
                          <div className="overflow-hidden">
                            <h4 className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                              {cap.name}
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                              {cap.desc}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Query Interface */}
                <div className="flex-1 overflow-y-auto px-6 py-2 space-y-3">
                  {queries.map((q) => (
                    <motion.div
                      key={q.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="flex justify-end"
                    >
                      <div className="bg-gray-100/70 dark:bg-gray-700/70 rounded-xl p-3 max-w-[90%]">
                        <p className="text-gray-800 dark:text-gray-200">{q.text}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                          {q.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </motion.div>
                  ))}

                  {/* Processing Indicator */}
                  {isProcessing && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-blue-500/10 dark:bg-blue-500/15 rounded-xl p-3 max-w-[85%] w-fit ml-4"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1.5">
                          {[...Array(3)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400"
                              animate={{
                                scale: [1, 1.3, 1],
                                opacity: [0.7, 1, 0.7]
                              }}
                              transition={{
                                repeat: Infinity,
                                duration: 1.4,
                                delay: i * 0.15,
                                ease: "easeInOut"
                              }}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-blue-600 dark:text-blue-300">
                          Processing cognition...
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Input Neural Interface */}
                <div className="p-6 border-t border-white/20 dark:border-gray-800/20">
                  <form onSubmit={handleQuery} className="relative">
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className="w-full bg-white/70 dark:bg-gray-800/70 border border-white/30 dark:border-gray-700/30 rounded-xl overflow-hidden backdrop-blur-sm"
                    >
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Enter cognitive query..."
                        className="w-full bg-transparent py-3.5 pl-5 pr-14 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none text-sm md:text-base"
                        aria-label="AI query input"
                      />
                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ 
                          scale: 0.95,
                          transition: { duration: 0.08 }
                        }}
                        disabled={!query.trim()}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg ${
                          query.trim() 
                            ? "bg-blue-500 text-white shadow-sm shadow-blue-500/30"
                            : "bg-gray-200/70 dark:bg-gray-700/70 text-gray-500"
                        }`}
                        style={{
                          width: '2.25rem',
                          height: '2.25rem'
                        }}
                        aria-label="Submit query"
                      >
                        <FiSend className="mx-auto" size={16} />
                      </motion.button>
                    </motion.div>
                  </form>
                </div>
              </div>
            </motion.div>

            {/* Neural Network Background */}
            <motion.div
              className="absolute inset-0 pointer-events-none overflow-hidden z-[-1]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full bg-blue-500/5 dark:bg-blue-400/5"
                  style={{
                    width: `${Math.random() * 150 + 80}px`,
                    height: `${Math.random() * 150 + 80}px`,
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`
                  }}
                  animate={{
                    x: [0, (Math.random() - 0.5) * 40],
                    y: [0, (Math.random() - 0.5) * 40],
                    opacity: [0.03, 0.08, 0.03],
                    rotate: Math.random() * 360
                  }}
                  transition={{
                    duration: 40 + Math.random() * 20,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut"
                  }}
                />
              ))}
              
              {/* Neural connections */}
              <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                {[...Array(6)].map((_, i) => (
                  <motion.line
                    key={i}
                    x1={`${Math.random() * 100}%`}
                    y1={`${Math.random() * 100}%`}
                    x2={`${Math.random() * 100}%`}
                    y2={`${Math.random() * 100}%`}
                    stroke="rgba(59, 130, 246, 0.08)"
                    strokeWidth="0.5"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ 
                      pathLength: [0, 0.2, 0],
                      opacity: [0, 0.2, 0]
                    }}
                    transition={{
                      duration: 20 + Math.random() * 15,
                      repeat: Infinity,
                      delay: Math.random() * 3,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </svg>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProjectAI;