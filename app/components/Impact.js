"use client";
import React from "react";
import { MdOutlineClose } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";

const IMPACTS = [
  {
    title: "Google Developer Students Club (GDSC)",
    role: "Lead & Mentor",
    desc: "Led and mentored 130+ developers, organizing hands-on workshops in full-stack development, empowering new talent with real-world skills. Guided teams that built mobile apps for Google Solution Challenge 2023, fostering innovation and collaboration.",
  },
  {
    title: "Altschool Africa & Angela Yu 100 Days of Code",
    role: "Student & Self-Driven Developer",
    desc: "Completed Altschool Africa's comprehensive full-stack development program, gaining expertise in React, Node.js, API development, and deployment. Finished Angela Yu's 100 Days of Code iOS course, building native iOS apps and strengthening mobile development skills.",
  },
  {
    title: "Smart Home & IoT Solutions",
    role: "Developer & Innovator",
    desc: "Designed and built smart home devices integrating sensors, automation, and cloud connectivity using Node.js and JavaScript. Delivered secure IoT solutions enabling remote control and real-time monitoring for enhanced home convenience.",
  },
  {
    title: "Cybersecurity Research & Advocacy",
    role: "Researcher & Educator",
    desc: "Investigated emerging cyber threats including SIM swapping, Office 365 scams, and AI-powered identity spoofing. Developed educational content and proof-of-concept tools to raise awareness and strengthen defenses against evolving attacks.",
  },
  {
    title: "Mentorship & Community",
    role: "Mentor & Trainer",
    desc: "Guided junior developers on full-stack JavaScript, authentication, API security, and scalable app architecture. Contributed open-source projects and shared knowledge through blogs, tutorials, and workshops.",
  },
];

const Impact = ({ impact, setImpact }) => {
  const close = () => {
    try { new Audio("click.wav").play(); } catch {}
    setImpact(false);
  };

  return (
    <AnimatePresence>
      {impact && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", bottom: "var(--taskbar-height,52px)" }}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full rounded-2xl overflow-hidden flex flex-col"
            style={{
              maxWidth: 700, maxHeight: "88vh",
              background: "rgba(15,17,26,0.96)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.8)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)" }}>
              <span className="text-white font-semibold text-sm">Impact</span>
              <button onClick={close} className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors">
                <MdOutlineClose size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: "none" }}>
              <h1 className="text-lg sm:text-2xl font-bold text-white border-b border-white/10 pb-2">Impact</h1>
              {IMPACTS.map((item, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="p-4 rounded-xl border border-white/8"
                  style={{ background: "rgba(255,255,255,0.04)" }}>
                  <h3 className="text-sm sm:text-base font-semibold text-white mb-0.5">{item.title}</h3>
                  <p className="text-xs text-blue-400 font-medium mb-2">{item.role}</p>
                  <p className="text-xs sm:text-sm text-white/65 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Impact;