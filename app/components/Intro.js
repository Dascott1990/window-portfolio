import React, { useEffect, useState } from "react";
import { TypeAnimation } from "react-type-animation";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function Home() {
  const router = useRouter();

  const quotes = [
    "Before you marry a person, you should first make them use a computer with slow Internet to see who they really are.",
    "On the keyboard of life, always keep one finger on the escape key.",
    "If debugging is the process of removing software bugs, then programming must be the process of putting them in.",
    "There are two ways to write error-free programs; only the third one works.",
    "It's hardware that makes a machine fast. It's software that makes a fast machine slow.",
    "Like car accidents, most hardware problems are due to driver error",
    "If at first you don't succeed; call it version 1.0",
    "The more I C, the less I see.",
    "Life would be so much easier if we only had the source code.",
  ];

  function getRandomQuote() {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
  }

  const [currentQuote, setCurrentQuote] = useState(getRandomQuote());

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="relative h-screen w-full overflow-hidden"
    >
      {/* Futuristic background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 via-gray-800 to-gray-900">
        {/* Circuit grid pattern */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}></div>
        
        {/* Animated particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-blue-500"
            initial={{
              x: Math.random() * 100 + 'vw',
              y: Math.random() * 100 + 'vh',
              opacity: 0.3,
              width: Math.random() * 5 + 2 + 'px',
              height: Math.random() * 5 + 2 + 'px'
            }}
            animate={{
              x: Math.random() * 100 + 'vw',
              y: Math.random() * 100 + 'vh',
              transition: {
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                repeatType: 'reverse'
              }
            }}
          />
        ))}
      </div>

      <main className="relative flex flex-col h-full items-center justify-center p-5 z-10">
        {/* Logo with pulse animation */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ 
            scale: 1,
            opacity: 1,
            transition: { delay: 0.2 }
          }}
          whileHover={{
            scale: 1.05,
            transition: { duration: 0.3 }
          }}
          className="mb-8"
        >
          <motion.div
            animate={{
              boxShadow: [
                '0 0 0 0px rgba(59, 130, 246, 0)',
                '0 0 0 10px rgba(59, 130, 246, 0.1)',
                '0 0 0 0px rgba(59, 130, 246, 0)'
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatDelay: 5
            }}
            className="rounded-full p-2"
          >
            <Image 
              src="/download.png" 
              width={120} 
              height={120} 
              className="drop-shadow-lg"
              alt="Developer Logo"
            />
          </motion.div>
        </motion.div>

        {/* Quote container */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="max-w-3xl w-full"
        >
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl border border-gray-700 border-opacity-30 p-8 shadow-xl">
            <TypeAnimation
              sequence={[
                currentQuote,
                500,
                () => {
                  router.push("/welcome")
                },
              ]}
              wrapper="span"
              speed={50}
              style={{ 
                fontSize: "clamp(1.2rem, 3vw, 1.8rem)",
                display: "inline-block",
                fontFamily: "'JetBrains Mono', monospace"
              }}
              className="text-center text-white font-mono tracking-tight leading-relaxed"
            />
          </div>
        </motion.div>

        {/* Loading indicator */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ 
            delay: 0.6,
            duration: 2.5,
            ease: "linear"
          }}
          className="mt-8 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full max-w-md"
        />
      </main>
    </motion.div>
  );
}