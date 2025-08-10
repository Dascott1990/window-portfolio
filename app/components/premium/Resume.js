// ./premium/Resume.js
import React from "react";
import { motion } from "framer-motion";
import { 
  FiDownload,
  FiMail,
  FiPhone,
  FiMapPin,
  FiLinkedin,
  FiGithub,
  FiX
} from "react-icons/fi";
import { FaReact, FaNodeJs, FaPython } from "react-icons/fa";
import { SiTypescript, SiTailwindcss, SiFramer } from "react-icons/si";

const Resume = ({ onClose }) => {
  const skills = [
    { name: "React", icon: <FaReact className="text-blue-500" />, level: 90 },
    { name: "TypeScript", icon: <SiTypescript className="text-blue-600" />, level: 85 },
    { name: "Node.js", icon: <FaNodeJs className="text-green-600" />, level: 80 },
    { name: "Python", icon: <FaPython className="text-yellow-600" />, level: 75 },
    { name: "Tailwind CSS", icon: <SiTailwindcss className="text-cyan-400" />, level: 95 },
    { name: "Framer Motion", icon: <SiFramer className="text-purple-500" />, level: 85 }
  ];

  const experiences = [
    {
      role: "Senior Frontend Developer",
      company: "Tech Innovations Inc.",
      period: "2020 - Present",
      description: "Lead a team of 5 developers to build responsive web applications using React and TypeScript."
    },
    {
      role: "Frontend Developer",
      company: "Digital Solutions LLC",
      period: "2018 - 2020",
      description: "Developed and maintained user interfaces for enterprise applications."
    }
  ];

  const education = [
    {
      degree: "MSc Computer Science",
      institution: "Stanford University",
      period: "2016 - 2018"
    },
    {
      degree: "BSc Software Engineering",
      institution: "MIT",
      period: "2012 - 2016"
    }
  ];

  return (
    <motion.div 
      className="fixed inset-0 z-50 bg-white dark:bg-gray-900"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header with close button */}
      <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Resume</h1>
        <motion.button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Close resume"
        >
          <FiX className="text-gray-600 dark:text-gray-300 text-xl" />
        </motion.button>
      </div>

      {/* Scrollable content container */}
      <div className="absolute inset-0 pt-16 pb-4 overflow-y-auto">
        <div className="flex flex-col md:flex-row min-h-full">
          {/* Left Panel - Profile - Sticky on desktop */}
          <motion.div 
            className="md:w-1/3 p-6 bg-gray-50 dark:bg-gray-800 md:sticky md:top-16 md:h-[calc(100vh-64px)] md:overflow-y-auto"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex flex-col items-center mb-6">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 mb-4 overflow-hidden">
                <img 
                  src="/profile.jpg" 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ffffff'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";
                  }}
                />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">David Scott</h2>
              <p className="text-blue-500 dark:text-blue-400 font-medium">Senior Frontend Developer</p>
              <p className="flex items-center text-gray-600 dark:text-gray-300 mt-2">
                <FiMapPin className="mr-1" /> San Francisco, CA
              </p>
            </div>

            {/* Contact Info */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Contact</h3>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-600 dark:text-gray-300">
                  <FiMail className="mr-2 text-blue-500" /> david.scott@example.com
                </li>
                <li className="flex items-center text-gray-600 dark:text-gray-300">
                  <FiPhone className="mr-2 text-blue-500" /> (555) 123-4567
                </li>
                <li className="flex items-center text-gray-600 dark:text-gray-300">
                  <FiLinkedin className="mr-2 text-blue-500" /> linkedin.com/in/davidscott
                </li>
                <li className="flex items-center text-gray-600 dark:text-gray-300">
                  <FiGithub className="mr-2 text-blue-500" /> github.com/dascott1990
                </li>
              </ul>
            </div>

            {/* Skills */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Skills</h3>
              <div className="space-y-3">
                {skills.map((skill, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center text-gray-700 dark:text-gray-300">
                        {skill.icon}
                        <span className="ml-2">{skill.name}</span>
                      </span>
                      <span className="text-sm text-gray-500">{skill.level}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full" 
                        style={{ width: `${skill.level}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Panel - Content */}
          <motion.div 
            className="md:w-2/3 p-6"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {/* About */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">About Me</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Passionate frontend developer with 6+ years of experience building responsive and accessible web applications. 
                Specialized in React, TypeScript, and modern CSS frameworks. Strong advocate for clean code, 
                performance optimization, and intuitive user experiences.
              </p>
            </section>

            {/* Experience */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Experience</h2>
              <div className="space-y-6">
                {experiences.map((exp, index) => (
                  <motion.div 
                    key={index}
                    className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700"
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.1 }}
                  >
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{exp.role}</h3>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-blue-500 dark:text-blue-400">{exp.company}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">{exp.period}</p>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">{exp.description}</p>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Education */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Education</h2>
              <div className="space-y-4">
                {education.map((edu, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{edu.degree}</h3>
                    <div className="flex items-center justify-between">
                      <p className="text-blue-500 dark:text-blue-400">{edu.institution}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">{edu.period}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Download Button - Sticky on mobile */}
            <div className="md:static fixed bottom-4 left-0 right-0 px-4 md:px-0 md:mt-8">
              <div className="md:flex justify-center">
                <motion.a
                  href="https://drive.google.com/file/d/1tYMVwL4xGvdwlP4xn8UC8K24gz0PrS6F/view?usp=drive_link"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all w-full md:w-auto"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiDownload className="mr-2" />
                  Download Resume
                </motion.a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Resume;