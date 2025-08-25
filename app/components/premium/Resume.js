// ./premium/Resume.js
import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { 
  FiDownload, FiMail, FiPhone, FiMapPin, FiLinkedin, FiGithub, FiX 
} from "react-icons/fi";
import { FaReact, FaNodeJs, FaPython } from "react-icons/fa";
import { SiTypescript, SiTailwindcss, SiFramer, SiPostgresql, SiDocker, SiAwsamplify } from "react-icons/si";

const Resume = ({ onClose }) => {
  const [copied, setCopied] = useState(false);
  const email = "dascottblog@gmail.com";

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const skills = [
    { name: "React", icon: <FaReact className="text-blue-500" />, level: 90 },
    { name: "TypeScript", icon: <SiTypescript className="text-blue-600" />, level: 85 },
    { name: "Node.js", icon: <FaNodeJs className="text-green-600" />, level: 88 },
    { name: "PostgreSQL", icon: <SiPostgresql className="text-indigo-600" />, level: 82 },
    { name: "Python", icon: <FaPython className="text-yellow-600" />, level: 75 },
    { name: "Tailwind CSS", icon: <SiTailwindcss className="text-cyan-400" />, level: 95 },
    { name: "Framer Motion", icon: <SiFramer className="text-purple-500" />, level: 85 },
    { name: "Docker", icon: <SiDocker className="text-blue-400" />, level: 80 },
    { name: "AWS", icon: <SiAwsamplify className="text-orange-500" />, level: 78 }
  ];

  const experiences = [
    {
      role: "Founder & Lead Engineer",
      company: "Dascott Global Ventures",
      period: "2020 - Present",
      description:
        "Founded and scaled a tech-driven real estate and smart homes company. Built digital infrastructure for property management, IoT smart home automation, and a gas distribution logistics system. Designed APIs, secure cloud deployments (AWS), and integrated full-stack apps for business operations."
    },
    {
      role: "Full-Stack Developer",
      company: "Freelance / GitHub Projects",
      period: "2018 - Present",
      description:
        "Developed numerous full-stack projects available on GitHub (github.com/dascott1990). Built RESTful and GraphQL APIs, authentication systems, real-time apps with WebSockets, and dashboards with React/Node/PostgreSQL. Focus on scalable and secure code."
    },
    {
      role: "Cybersecurity Engineer (Intern)",
      company: "Canadore College Labs",
      period: "2024 - 2025",
      description:
        "Hands-on work in penetration testing, secure API design, and vulnerability assessments. Assisted in building security frameworks for student and institutional projects."
    }
  ];

  const education = [
    { degree: "Cybersecurity Program", institution: "Canadore College", period: "2024 - 2025" },
    { degree: "Frontend Development", institution: "AltSchool Africa", period: "2022 - 2023" },
    { degree: "Full-Stack Bootcamps (Web Dev, Python, iOS)", institution: "Angela Yu Online Bootcamps", period: "2021 - 2024" }
  ];

  return (
    <motion.div 
      className="fixed inset-0 z-50 bg-white dark:bg-gray-900"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
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

      {/* Content */}
      <div className="absolute inset-0 pt-16 pb-4 overflow-y-auto">
        <div className="flex flex-col md:flex-row min-h-full">

          {/* Left Panel */}
          <motion.div 
            className="md:w-1/3 p-6 bg-gray-50 dark:bg-gray-800 md:sticky md:top-16 md:h-[calc(100vh-64px)] md:overflow-y-auto"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {/* Profile */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-40 h-40 relative rounded-full overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
                <Image
                  src="/img.jpeg"
                  alt="Rasheed Dascott"
                  layout="fill"
                  objectFit="cover"
                  className="rounded-full"
                />
              </div>
              <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                Rasheed Dascott
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
                Full Stack Developer · Cybersecurity Engineer · Founder @ Dascott Global Ventures
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Toronto, ON, Canada
              </p>
            </div>

            {/* Contact */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Contact</h3>
              <ul className="space-y-3">
                {/* Email */}
                <li>
                  <button
                    onClick={handleCopyEmail}
                    className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 rounded-xl shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)] transition-shadow text-gray-800 dark:text-white font-medium relative w-full justify-start"
                  >
                    <FiMail className="text-blue-500 mr-3 text-xl" />
                    <span>{email}</span>
                    {copied && (
                      <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-500 font-semibold text-sm">
                        Copied!
                      </span>
                    )}
                  </button>
                </li>

                {/* Phone */}
                <li>
                  <a 
                    href="tel:+14165056927" 
                    className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 rounded-xl shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)] transition-shadow text-gray-800 dark:text-white font-medium"
                  >
                    <FiPhone className="text-blue-500 mr-3 text-xl" />
                    <span>+1 (416) 505-6927</span>
                  </a>
                </li>

                {/* LinkedIn */}
                <li>
                  <a 
                    href="https://www.linkedin.com/in/rasheed-tajudeen-614606374" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 rounded-xl shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)] transition-shadow text-gray-800 dark:text-white font-medium"
                  >
                    <FiLinkedin className="text-blue-500 mr-3 text-xl" />
                    <span>LinkedIn</span>
                  </a>
                </li>

                {/* GitHub */}
                <li>
                  <a 
                    href="https://github.com/dascott1990" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 rounded-xl shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)] transition-shadow text-gray-800 dark:text-white font-medium"
                  >
                    <FiGithub className="text-blue-500 mr-3 text-xl" />
                    <span>GitHub</span>
                  </a>
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
                      <div className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full" style={{ width: `${skill.level}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Panel */}
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
                Full-stack developer and cybersecurity engineer with a passion for building secure, scalable, and user-friendly applications. Founder of Dascott Global Ventures, combining technology with real estate and smart-home innovation. Skilled in React, Node.js, PostgreSQL, cloud deployments, and security frameworks. Strong advocate for automation, clean code, and impactful digital transformation.
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

            {/* Download / Projects */}
            <div className="md:static fixed bottom-4 left-0 right-0 px-4 md:px-0 md:mt-8">
              <div className="md:flex justify-center">
                <motion.a
                  href="https://github.com/dascott1990"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all w-full md:w-auto"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiDownload className="mr-2" />
                  View My Projects
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
