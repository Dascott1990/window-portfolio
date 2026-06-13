"use client";
import React from "react";
import { MdOutlineClose } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import { FcGraduationCap, FcIdea, FcCommandLine, FcLock } from "react-icons/fc";

const EDU_DATA = [
  {
    institution: "École Supérieure Sainte Félicité", years: "2016 – 2020",
    degree: "Bachelor of Law & Political Science", grade: "A+",
    icon: <FcGraduationCap size={28} />, color: "bg-blue-500",
    highlights: ["Bilingual French–English environment","Multidisciplinary coursework in law, business, communication","Project management certification"],
    activities: ["Debate & Moot Court","Legal Aid Club","Political Science Roundtable","Academic Research Group","Student Government","Faculty Journal","Model UN Delegate"],
  },
  {
    institution: "AltSchool Africa", years: "Feb 2022 – Mar 2023",
    degree: "Diploma in Frontend Web Development",
    icon: <FcIdea size={28} />, color: "bg-purple-500",
    highlights: ["HTML, CSS, JavaScript, React","Built production-ready components","Participated in open-source projects"],
  },
  {
    institution: "Angela Yu Bootcamp", years: "2023",
    degree: "100 Days of Python, Web & App Development",
    icon: <FcCommandLine size={28} />, color: "bg-green-500",
    highlights: ["Mastered Flask, APIs, Python scripting","App design and backend logic","Full-stack apps with REST APIs","Deployment pipelines"],
  },
  {
    institution: "Canadore College", years: "2024 – 2025",
    degree: "Cybersecurity Program",
    icon: <FcLock size={28} />, color: "bg-red-500",
    highlights: ["Network security & threat modeling","Ethical hacking techniques","Digital forensics","Incident response","Governance, risk & compliance (GRC)"],
  },
];

const Education = ({ education, setEducation }) => {
  const close = () => {
    try { new Audio("click.wav").play(); } catch {}
    setEducation(false);
  };

  return (
    <AnimatePresence>
      {education && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-x-0 z-50 flex items-center justify-center p-3 sm:p-4"
          style={{
            top: "var(--mobile-status-bar, 0px)",
            bottom: "var(--taskbar-height, 52px)",
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(4px)",
            paddingTop: "max(12px, env(safe-area-inset-top))",
            paddingBottom: "max(12px, env(safe-area-inset-bottom))",
          }}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full rounded-xl overflow-hidden flex flex-col"
            style={{
              maxWidth: 700,
              maxHeight: "100%",
              background: "#f3f4f6",
              border: "1px solid #d1d5db",
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
            }}
          >
            {/* Title bar */}
            <div
              className="flex items-center justify-between px-4 py-2 flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)" }}
            >
              <span className="text-white font-semibold text-sm">Education Timeline</span>
              <button onClick={close} className="p-1 hover:bg-blue-700 text-white rounded transition-colors">
                <MdOutlineClose size={18} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: "none" }}>
              <h1 className="text-lg sm:text-2xl font-semibold text-gray-800 border-b pb-2 mb-4 border-gray-300">
                Academic Journey
              </h1>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300" />
                <div className="space-y-6">
                  {EDU_DATA.map((edu, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="relative pl-10"
                    >
                      <div className={`absolute left-2 w-4 h-4 rounded-full ${edu.color} border-2 border-white -translate-x-1/2`} />
                      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">{edu.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-start justify-between gap-1 mb-1">
                              <h2 className="text-sm sm:text-base font-semibold text-gray-800 leading-tight">{edu.institution}</h2>
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded whitespace-nowrap flex-shrink-0">{edu.years}</span>
                            </div>
                            <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-1">{edu.degree}</h3>
                            {edu.grade && (
                              <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded mb-2">Grade: {edu.grade}</span>
                            )}
                            <div>
                              <p className="text-xs font-semibold text-gray-600 mb-1">Key Achievements:</p>
                              <ul className="text-xs text-gray-600 space-y-0.5 list-disc list-inside">
                                {edu.highlights.map((h, j) => <li key={j}>{h}</li>)}
                              </ul>
                            </div>
                            {edu.activities && (
                              <div className="mt-2">
                                <p className="text-xs font-semibold text-gray-600 mb-1">Activities:</p>
                                <div className="flex flex-wrap gap-1">
                                  {edu.activities.map((a, j) => (
                                    <span key={j} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{a}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-blue-800 mb-1">Learning Philosophy</h3>
                <p className="text-xs text-gray-700 leading-relaxed">
                  From law to code to cybersecurity — each discipline builds on the last. The common thread is problem-solving at scale.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Education;