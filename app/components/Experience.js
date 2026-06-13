"use client";
import React from "react";
import { MdOutlineClose } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";

const EXP_DATA = [
  {
    year: "2022 - Present", icon: "💻",
    title: "Full-Stack Developer & Instructor (Sapiova)", category: "development",
    points: [
      "Built full-stack web apps using React, Node.js, Express, and PostgreSQL with RESTful and GraphQL API design",
      "Implemented secure auth systems using JWT, OAuth2, and two-factor login",
      "Designed responsive UI/UX for MacBook, iPhone, iPad using native design principles",
      "Deployed scalable apps using Docker, CI/CD on AWS and Vercel",
      "Trained 150+ students in JavaScript, backend API, frontend architecture, and DevOps",
    ],
  },
  {
    year: "2022", icon: "🔥",
    title: "Completed Angela Yu's 100 Days of Code Bootcamp", category: "education",
    points: [
      "Built 20+ web projects including REST APIs, authentication flows, and UI clones",
      "Mastered Node.js, Express, EJS, MongoDB, and deployment techniques",
      "Strengthened full-stack logic through daily Git & GitHub workflow",
    ],
  },
  {
    year: "2022 - 2023", icon: "📱",
    title: "iOS & Cross-Platform Mobile Developer", category: "mobile",
    points: [
      "Built and deployed iOS apps with Swift & SwiftUI",
      "Developed Flutter apps integrating Firebase, REST APIs, and UI state management",
      "Created smart home UI and productivity tools as mobile prototypes",
    ],
  },
  {
    year: "2023 - Present", icon: "🔒",
    title: "Cybersecurity Analyst & CISO (Research-based)", category: "security",
    points: [
      "Investigated dark web scams, SIM swapping, phishing, and Office365 spoofing",
      "Conducted research on AI-based impersonation threats and developed POCs",
      "Proposed face/voice verification systems for secure video communication",
    ],
  },
  {
    year: "2023 - Present", icon: "🧠",
    title: "Mentor, Trainer & Open-Source Contributor", category: "community",
    points: [
      "Mentored junior devs in full-stack JavaScript and deployment practices",
      "Contributed to open-source projects with clean architecture and reusable components",
      "Wrote dev-focused tutorials and walkthroughs to help learners grow",
    ],
  },
];

const BORDER_COLOR = {
  security: "border-l-red-500",
  mobile:   "border-l-blue-500",
  education:"border-l-purple-500",
  community:"border-l-green-500",
  development:"border-l-green-500",
};

const Experience = ({ experience, setexperience }) => {
  const close = () => {
    try { new Audio("click.wav").play(); } catch {}
    setexperience(false);
  };

  return (
    <AnimatePresence>
      {experience && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", bottom: "var(--taskbar-height,52px)" }}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full rounded-xl overflow-hidden flex flex-col"
            style={{ maxWidth: 700, maxHeight: "88vh", background: "#f3f4f6", border: "1px solid #d1d5db", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}
          >
            <div className="flex items-center justify-between px-4 py-2 flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)" }}>
              <span className="text-white font-semibold text-sm">Experience Terminal</span>
              <button onClick={close} className="p-1 hover:bg-blue-700 text-white rounded transition-colors">
                <MdOutlineClose size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: "none" }}>
              <h1 className="text-lg sm:text-2xl font-semibold text-gray-800 border-b pb-2 mb-2 border-gray-300">
                Professional Journey
              </h1>
              {EXP_DATA.map((exp, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`p-4 rounded-xl border border-gray-200 bg-white border-l-4 ${BORDER_COLOR[exp.category] || "border-l-green-500"}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{exp.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap justify-between items-start gap-1 mb-2">
                        <h2 className="text-sm sm:text-base font-semibold text-gray-800 leading-tight">{exp.title}</h2>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded whitespace-nowrap flex-shrink-0">{exp.year}</span>
                      </div>
                      <div className="space-y-1">
                        {exp.points.map((p, j) => (
                          <div key={j} className="flex items-start gap-1.5">
                            <span className="text-gray-400 text-xs mt-0.5 flex-shrink-0">▶</span>
                            <p className="text-xs text-gray-700 leading-relaxed">{p}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-2">
                <h3 className="text-sm font-semibold text-blue-800 mb-1">Career Evolution</h3>
                <p className="text-xs text-gray-700 leading-relaxed">
                  From full-stack development to mobile engineering to cybersecurity leadership — each phase builds technical depth while expanding strategic perspective.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Experience;