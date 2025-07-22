import React from "react";
import AnimatedItem from "./AnimatedItem";
import { MdOutlineClose } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";

const Experience = ({ experience, setexperience }) => {
  const experienceData = [
    {
      id: 1,
      year: "2022 - Present",
      title: "Full-Stack Developer & Instructor (Sapiova)",
      icon: "💻",
      points: [
        "Built full-stack web apps using React, Node.js, Express, and PostgreSQL with strong RESTful and GraphQL API design",
        "Implemented secure auth systems using JWT, OAuth2, and two-factor login for production apps",
        "Designed responsive UI/UX optimized for MacBook, iPhone, iPad using native design principles",
        "Deployed scalable apps using Docker, CI/CD pipelines on AWS and Vercel",
        "Trained 150+ students in JavaScript, backend API development, frontend architecture, and DevOps best practices"
      ],
      category: "development"
    },
    {
      id: 2,
      year: "2022",
      title: "Completed Angela Yu's 100 Days of Code Bootcamp",
      icon: "🔥",
      points: [
        "Built 20+ web projects including REST APIs, authentication flows, and UI/UX clones",
        "Mastered Node.js, Express, EJS, MongoDB, and deployment techniques via hands-on projects",
        "Strengthened full-stack logic and version control through daily Git & GitHub workflow"
      ],
      category: "education"
    },
    {
      id: 3,
      year: "2022 - 2023",
      title: "iOS & Cross-Platform Mobile Developer",
      icon: "📱",
      points: [
        "Built and deployed iOS apps with Swift & SwiftUI during Apple dev practice sessions",
        "Developed Flutter apps integrating Firebase, REST APIs, and UI state management",
        "Created smart home UI and productivity tools as part of mobile prototype development"
      ],
      category: "mobile"
    },
    {
      id: 4,
      year: "2023 - Present",
      title: "Cybersecurity Analyst & CISO (Research-based)",
      icon: "🔒",
      points: [
        "Investigated dark web scams, SIM swapping, phishing, and Office365 spoofing",
        "Conducted research on AI-based impersonation threats and developed POCs",
        "Proposed face/voice verification systems for secure video communication"
      ],
      category: "security"
    },
    {
      id: 5,
      year: "2023 - Present",
      title: "Mentor, Trainer & Open-Source Contributor",
      icon: "🧠",
      points: [
        "Mentored junior devs in full-stack JavaScript and deployment practices",
        "Contributed to open-source projects with clean architecture and reusable components",
        "Wrote dev-focused tutorials and walkthroughs to help learners grow"
      ],
      category: "community"
    }
  ];

  return (
    <AnimatePresence>
      {experience && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-gray-100 w-[900px] max-h-[80vh] overflow-y-auto rounded-lg shadow-xl border border-gray-300"
            style={{
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)"
            }}
          >
            {/* Windows Title Bar */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center">
                <span className="text-white font-medium text-sm">Experience Terminal</span>
              </div>
              <button 
                className="text-white p-1 hover:bg-blue-700 transition-colors duration-150"
                onClick={() => {
                  new Audio("click.wav").play();
                  setexperience(false);
                }}
              >
                <MdOutlineClose className="text-lg" />
              </button>
            </div>

            {/* Window Content */}
            <div className="p-6">
              <h1 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-2 border-gray-300">
                Professional Journey
              </h1>

              <div className="space-y-6">
                {experienceData.map((exp, index) => (
                  <motion.div
                    key={exp.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.01 }}
                    className={`p-5 rounded-lg border border-gray-200 backdrop-blur-sm bg-white bg-opacity-80 hover:bg-opacity-100 transition-all ${
                      exp.category === 'security' ? 'border-l-4 border-l-red-500' :
                      exp.category === 'mobile' ? 'border-l-4 border-l-blue-500' :
                      exp.category === 'education' ? 'border-l-4 border-l-purple-500' :
                      'border-l-4 border-l-green-500'
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="text-3xl mr-4">{exp.icon}</div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h2 className="text-xl font-semibold text-gray-800">{exp.title}</h2>
                          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {exp.year}
                          </span>
                        </div>
                        
                        <div className="mt-3 space-y-2">
                          {exp.points.map((point, i) => (
                            <div key={i} className="flex items-start">
                              <span className="text-xs text-gray-500 mr-2 mt-1">▶</span>
                              <p className="text-gray-700 text-sm">{point}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: experienceData.length * 0.1 + 0.2 }}
                className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4"
              >
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Career Evolution</h3>
                <p className="text-gray-700">
                  From full-stack development to mobile engineering to cybersecurity leadership - 
                  each phase builds technical depth while expanding strategic perspective. 
                  The constant thread is creating robust systems and mentoring others.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Experience;