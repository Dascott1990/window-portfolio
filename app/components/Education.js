import React from "react";
import AnimatedItem from "./AnimatedItem";
import { MdOutlineClose } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import { FcGraduationCap, FcIdea, FcCommandLine, FcLock } from "react-icons/fc";

const Education = ({ education, setEducation }) => {
  const educationData = [
    {
      id: 1,
      institution: "École Supérieure Sainte Félicité",
      years: "2016 – 2020",
      degree: "Bachelor of Law & Political Science",
      grade: "A+",
      icon: <FcGraduationCap className="text-3xl" />,
      highlights: [
        "Bilingual French–English environment",
        "Multidisciplinary coursework in law, business, communication",
        "Project management certification"
      ],
      activities: [
        "Debate & Moot Court",
        "Legal Aid Club",
        "Political Science Roundtable",
        "Academic Research Group",
        "Student Government",
        "Faculty Journal Contributor",
        "Model UN Delegate"
      ],
      color: "bg-blue-500"
    },
    {
      id: 2,
      institution: "AltSchool Africa",
      years: "Feb 2022 – Mar 2023",
      degree: "Diploma in Frontend Web Development",
      icon: <FcIdea className="text-3xl" />,
      highlights: [
        "HTML, CSS, JavaScript, React",
        "Built production-ready components",
        "Participated in open-source projects"
      ],
      color: "bg-purple-500"
    },
    {
      id: 3,
      institution: "Angela Yu Bootcamp",
      years: "2023",
      degree: "100 Days of Python, Web & App Development",
      icon: <FcCommandLine className="text-3xl" />,
      highlights: [
        "Mastered Flask, APIs, Python scripting",
        "App design and backend logic",
        "Developed full-stack applications with REST APIs",
        "Deployment pipelines"
      ],
      color: "bg-green-500"
    },
    {
      id: 4,
      institution: "Canadore College",
      years: "2024 – 2025",
      degree: "Cybersecurity Program",
      icon: <FcLock className="text-3xl" />,
      highlights: [
        "Network security & threat modeling",
        "Ethical hacking techniques",
        "Digital forensics",
        "Incident response",
        "Governance, risk & compliance (GRC)"
      ],
      color: "bg-red-500"
    }
  ];

  return (
    <AnimatePresence>
      {education && (
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
                <span className="text-white font-medium text-sm">Education Timeline</span>
              </div>
              <button 
                className="text-white p-1 hover:bg-blue-700 transition-colors duration-150"
                onClick={() => {
                  new Audio("click.wav").play();
                  setEducation(false);
                }}
              >
                <MdOutlineClose className="text-lg" />
              </button>
            </div>

            {/* Window Content */}
            <div className="p-6">
              <h1 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-2 border-gray-300">
                Academic Journey
              </h1>

              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-6 top-0 h-full w-0.5 bg-gray-300"></div>

                {educationData.map((edu, index) => (
                  <motion.div
                    key={edu.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative mb-8 pl-10"
                  >
                    {/* Timeline dot */}
                    <div className={`absolute left-0 w-4 h-4 rounded-full ${edu.color} border-2 border-white`}></div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-white p-5 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start">
                        <div className="mr-4 mt-1">
                          {edu.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h2 className="text-xl font-semibold text-gray-800">{edu.institution}</h2>
                            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {edu.years}
                            </span>
                          </div>
                          <h3 className="text-lg font-medium text-gray-700 mt-1">{edu.degree}</h3>
                          {edu.grade && (
                            <div className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-1">
                              Grade: {edu.grade}
                            </div>
                          )}

                          <div className="mt-3">
                            <h4 className="text-sm font-semibold text-gray-700 mb-1">Key Achievements:</h4>
                            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                              {edu.highlights.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>

                          {edu.activities && (
                            <div className="mt-3">
                              <h4 className="text-sm font-semibold text-gray-700 mb-1">Activities & Leadership:</h4>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {edu.activities.map((activity, i) => (
                                  <span 
                                    key={i}
                                    className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                                  >
                                    {activity}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: educationData.length * 0.1 + 0.2 }}
                className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4"
              >
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Learning Philosophy</h3>
                <p className="text-gray-700">
                  From law to code to cybersecurity - each discipline builds on the last. 
                  My education reflects a commitment to understanding systems, whether legal, 
                  technical, or organizational. The common thread is problem-solving at scale.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Education;