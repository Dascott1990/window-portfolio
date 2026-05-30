"use client";
import React, { useEffect, useState } from "react";
import { TypeAnimation } from "react-type-animation";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const QUOTES = [
  "Before you marry a person, make them use a computer with slow Internet.",
  "On the keyboard of life, keep one finger on the escape key.",
  "Debugging is removing bugs. Programming is putting them in.",
  "There are only two hard things: cache invalidation and naming things.",
  "If at first you don't succeed — call it version 1.0.",
  "Life would be easier if we just had the source code.",
  "The more I C, the less I see.",
];

export default function Intro() {
  const router = useRouter();
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gray-950">
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(59,130,246,0.15),transparent)]" />

      <main className="relative flex flex-col h-full items-center justify-center gap-8 p-6 z-10">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-2xl scale-150" />
          <Image
            src="/download.png"
            width={96}
            height={96}
            alt="Logo"
            className="relative drop-shadow-2xl rounded-full"
          />
        </motion.div>

        {/* Quote container */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="max-w-2xl w-full"
        >
          <div
            className="rounded-2xl border border-white/8 bg-white/5 backdrop-blur-xl p-8 shadow-2xl"
            style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 24px 80px rgba(0,0,0,0.6)" }}
          >
            <TypeAnimation
              sequence={[
                quote,
                600,
                () => router.push("/welcome"),
              ]}
              wrapper="p"
              speed={55}
              className="text-white/90 text-center font-mono text-base sm:text-lg leading-relaxed tracking-tight"
            />
          </div>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 0.5, duration: 3, ease: "linear" }}
          style={{ originX: 0 }}
          className="w-full max-w-sm h-0.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
        />
      </main>
    </div>
  );
}