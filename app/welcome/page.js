"use client";
import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { FiArrowRight } from "react-icons/fi";
import { ImSpinner8 } from "react-icons/im";

export default function WelcomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const proceed = () => {
    if (loading) return;
    setLoading(true);
    try { new Audio("/start.mp3").play(); } catch {}
    router.push("/home");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="relative flex flex-col h-screen items-center justify-center homepage overflow-hidden"
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      {/* Card */}
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center gap-6 px-8 py-10 rounded-3xl border border-white/12 bg-black/40 backdrop-blur-2xl shadow-2xl w-full max-w-sm"
        style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.05), 0 40px 80px rgba(0,0,0,0.7)" }}
      >
        {/* Avatar */}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="relative"
        >
          <div className="absolute inset-0 rounded-full bg-blue-500/30 blur-xl" />
          <Image
            src="/img.jpeg"
            width={88}
            height={88}
            className="relative rounded-full border-2 border-white/20 shadow-xl"
            alt="Rasheed Tajudeen"
          />
        </motion.div>

        {/* Text */}
        <div className="text-center">
          <h1 className="text-white text-xl font-semibold mb-1">Rasheed Tajudeen</h1>
          <p className="text-white/50 text-sm">Full-Stack Developer · Cybersecurity</p>
          <p className="text-white/30 text-xs mt-1">Toronto, ON, Canada</p>
        </div>

        {/* CTA */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={proceed}
          disabled={loading}
          className="
            w-full flex items-center justify-center gap-2
            py-3 px-6 rounded-2xl text-white text-sm font-semibold
            bg-blue-600 hover:bg-blue-500 disabled:opacity-60
            transition-colors shadow-lg shadow-blue-500/30
          "
        >
          {loading ? (
            <>
              <ImSpinner8 className="animate-spin" size={16} />
              Loading...
            </>
          ) : (
            <>
              Enter Portfolio
              <FiArrowRight size={16} />
            </>
          )}
        </motion.button>
      </motion.div>

      {/* Footer hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="relative z-10 mt-6 text-white/20 text-xs"
      >
        Press Enter or click to continue
      </motion.p>
    </motion.div>
  );
}