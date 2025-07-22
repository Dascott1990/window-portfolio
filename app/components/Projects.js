import React, { useState } from "react";
import AnimatedItem from "./AnimatedItem";
import { MdOutlineClose } from "react-icons/md";
import Image from "next/image";
import { BsChevronLeft } from "react-icons/bs";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const Projects = ({ showModal, setShowModal }) => {
  const [sureplug, setSureplug] = useState(false);
  const [scam, setScam] = useState(false);
  const [track, setTrack] = useState(false);
  const [virtual, setVirtual] = useState(false);
  const [statesapi, setStatesapi] = useState(false);
  const [heart, setHeart] = useState(false);
  const [qr, setQR] = useState(false);
  
  return (
    <AnimatePresence>
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black bg-opacity-70"
          style={{ backdropFilter: "blur(2px)" }}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-gray-100 w-[900px] smbelow:h-[600px] smbelow:overflow-y-auto smbelow:mt-5 h-auto rounded-sm shadow-xl border border-gray-300"
            style={{
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
            }}
          >
            {/* Windows Title Bar */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-3 py-1 flex items-center justify-between">
              <div className="flex items-center">
                <BsChevronLeft className="text-white mr-2" />
                <span className="text-white font-medium text-sm">Personal Projects</span>
              </div>
              <div className="flex">
                <button 
                  className="text-white p-1 hover:bg-blue-700 transition-colors duration-150"
                  onClick={() => {
                    const audio = new Audio("click.wav");
                    audio.play();
                    setShowModal(false);
                  }}
                >
                  <MdOutlineClose className="text-lg" />
                </button>
              </div>
            </div>

            {/* Window Content */}
            <div className="flex flex-col items-start justify-start p-4 bg-gray-100">
              {sureplug && (
                <AnimatedItem animationConfig={{ delay: 0.1 }}>
                  <button
                    className="flex items-center text-blue-600 mb-4 text-sm cursor-pointer hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                    onClick={() => {
                      const audio = new Audio("click.wav");
                      audio.play();
                      setSureplug(false);
                    }}
                  >
                    <BsChevronLeft className="mr-1" />
                    Back
                  </button>
                  <div className="flex flex-col w-full bg-white p-4 rounded-sm shadow-sm border border-gray-200">
                    <h1 className="text-2xl font-semibold text-gray-800 border-b pb-2 mb-4 border-gray-300 w-full">
                      FusionPay
                    </h1>
                    <p className="text-gray-700 text-sm mb-4">
                      Built with React Native, Expo Router, Reanimated 3, Zustand, MMKV, Clerk Auth, CoinMarketCap API, Victory Native, Styled Components, NativeBase, TypeScript.{" "}
                    </p>
                    <Link
                      href="https://github.com/Dascott1990/FinTech-FusionPay"
                      target="_blank"
                      className="text-blue-600 text-sm mb-5 hover:underline"
                    >
                      Fintech App
                    </Link>
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">
                      About FusionPay
                    </h2>
                    <p className="text-gray-700 text-sm mb-4 leading-6">
                      A high-performance FinTech app engineered with React Native and Clerk OTP, enabling users to manage crypto assets, track live market prices, and experience gesture-powered finance—all in real-time.
                    </p>

                    <div className="bg-blue-50 p-3 rounded-sm border border-blue-100">
                      <ol className="text-gray-700 text-sm leading-6 list-decimal pl-4">
                        <li className="mb-1">
                          Built a secure FinTech app with OTP-based auth using Clerk.
                        </li>
                        <li className="mb-1">
                          Integrated real-time crypto pricing via CoinMarketCap API.
                        </li>
                        <li>
                          Designed gesture-based UI with Reanimated 3 and Zustand state.
                        </li>
                      </ol>
                    </div>
                  </div>
                </AnimatedItem>
              )}

              {scam && (
                <AnimatedItem animationConfig={{ delay: 0.1 }}>
                  <button
                    className="flex items-center text-blue-600 mb-4 text-sm cursor-pointer hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                    onClick={() => {
                      const audio = new Audio("click.wav");
                      audio.play();
                      setScam(false);
                    }}
                  >
                    <BsChevronLeft className="mr-1" />
                    Back
                  </button>
                  <div className="flex flex-col w-full bg-white p-4 rounded-sm shadow-sm border border-gray-200">
                    <h1 className="text-2xl font-semibold text-gray-800 border-b pb-2 mb-4 border-gray-300 w-full">
                      Hyperswitch
                    </h1>
                    <p className="text-gray-700 text-sm mb-4">
                      Open-Source Payment Orchestration{" "}
                    </p>
                    <Link
                      href="https://hyperswitch.io/"
                      target="_blank"
                      className="text-blue-600 text-sm mb-5 hover:underline"
                    >
                      Hyperswitch.io
                    </Link>
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">
                      About Hyperswitch
                    </h2>
                    <p className="text-gray-700 text-sm mb-4 leading-6">
                      Enterprise-grade open-source payments platform enabling unified API access to cards, wallets, BNPL, and bank transfers. Modular, scalable, and trusted by top fintechs.
                    </p>
                  </div>
                </AnimatedItem>
              )}

              {track && (
                <AnimatedItem animationConfig={{ delay: 0.1 }}>
                  <button
                    className="flex items-center text-blue-600 mb-4 text-sm cursor-pointer hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                    onClick={() => {
                      const audio = new Audio("click.wav");
                      audio.play();
                      setTrack(false);
                    }}
                  >
                    <BsChevronLeft className="mr-1" />
                    Back
                  </button>
                  <div className="flex flex-col w-full bg-white p-4 rounded-sm shadow-sm border border-gray-200">
                    <h1 className="text-2xl font-semibold text-gray-800 border-b pb-2 mb-4 border-gray-300 w-full">
                      DBOS Transact
                    </h1>
                    <p className="text-gray-700 text-sm mb-4">
                      Durable Workflow System (Open Source){" "}
                    </p>
                    <Link
                      href="https://github.com/Dascott1990/cron-transact-py/tree/main"
                      target="_blank"
                      className="text-blue-600 text-sm mb-5 hover:underline"
                    >
                      Github Repository
                    </Link>
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">
                      About DBOS Transact
                    </h2>
                    <p className="text-gray-700 text-sm mb-4 leading-6">
                      DBOS Transact is a fault-tolerant workflow engine built on PostgreSQL that enables developers to write reliable, durable Python applications without the overhead of external task queues or orchestrators. The system uses annotated Python functions to checkpoint execution state directly in a database, ensuring automatic recovery from crashes, power failures, or system restarts.

                      Ideal for AI agents, payment systems, and data pipelines, DBOS simplifies error handling, scheduling, and queue management by leveraging the robustness of Postgres.
                    </p>
                  </div>
                </AnimatedItem>
              )}

              {virtual && (
                <AnimatedItem animationConfig={{ delay: 0.1 }}>
                  <button
                    className="flex items-center text-blue-600 mb-4 text-sm cursor-pointer hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                    onClick={() => {
                      const audio = new Audio("click.wav");
                      audio.play();
                      setVirtual(false);
                    }}
                  >
                    <BsChevronLeft className="mr-1" />
                    Back
                  </button>
                  <div className="flex flex-col w-full bg-white p-4 rounded-sm shadow-sm border border-gray-200">
                    <h1 className="text-2xl font-semibold text-gray-800 border-b pb-2 mb-4 border-gray-300 w-full">
                      Dask Blog Project
                    </h1>
                    <p className="text-gray-700 text-sm mb-4">
                      Flask, PostgreSQL, HTML, CSS, Bootstrap, JavaScript, Heroku, GitHub CI/CD, REST API, Flask-Login.{" "}
                    </p>
                    <Link
                      href="https://github.com/Dascott1990/blog-project"
                      target="_blank"
                      className="text-blue-600 text-sm mb-5 hover:underline"
                    >
                      daskBlog
                    </Link> 
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">
                      About Dask Blog
                    </h2>
                    <p className="text-gray-700 text-sm mb-4 leading-6">
                      Dask Blog is a full-stack blogging platform developed to deliver insightful content on finance, tech, and politics. It allows creators to manage posts, interact via threaded comments, and authenticate securely. Built with scalability and clean architecture in mind, the platform runs on Flask and PostgreSQL, with seamless deployment via Heroku and CI/CD from GitHub.
                    </p>
                    <div className="bg-blue-50 p-3 rounded-sm border border-blue-100">
                      <ol className="text-gray-700 text-sm leading-6 list-decimal pl-4">
                        <li className="mb-1">
                          Frontend: HTML, CSS, JavaScript, Bootstrap
                        </li>
                        <li className="mb-1">
                          Backend: Python (Flask), Flask-Login, Jinja2
                        </li>
                        <li className="mb-1">
                          Database: PostgreSQL
                        </li>
                        <li className="mb-1">
                          APIs: RESTful endpoints
                        </li>
                        <li>
                          Deployment: Heroku (Procfile + Gunicorn), GitHub CI
                        </li>
                      </ol>
                    </div>
                  </div>
                </AnimatedItem>
              )}

              {statesapi && (
                <AnimatedItem animationConfig={{ delay: 0.1 }}>
                  <button
                    className="flex items-center text-blue-600 mb-4 text-sm cursor-pointer hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                    onClick={() => {
                      const audio = new Audio("click.wav");
                      audio.play();
                      setStatesapi(false);
                    }}
                  >
                    <BsChevronLeft className="mr-1" />
                    Back
                  </button>
                  <div className="flex flex-col w-full bg-white p-4 rounded-sm shadow-sm border border-gray-200">
                    <h1 className="text-2xl font-semibold text-gray-800 border-b pb-2 mb-4 border-gray-300 w-full">
                      Nigeria States & Local Government API
                    </h1>
                    <p className="text-gray-700 text-sm mb-4">
                      Built with NodeJS & Postman{" "}
                    </p>

                    <h2 className="text-lg font-semibold text-gray-800 mb-2">
                      About Nigeria States & Local Government API
                    </h2>
                    <p className="text-gray-700 text-sm mb-4 leading-6">
                      A mini project that compiles all the States and Local
                      Governments in an API. The API was implemented in NodeJS for
                      developers to fetch Nigeria states and Local Government
                      Dynamically.
                    </p>
                  </div>
                </AnimatedItem>
              )}

              {heart && (
                <AnimatedItem animationConfig={{ delay: 0.1 }}>
                  <button
                    className="flex items-center text-blue-600 mb-4 text-sm cursor-pointer hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                    onClick={() => {
                      const audio = new Audio("click.wav");
                      audio.play();
                      setHeart(false);
                    }}
                  >
                    <BsChevronLeft className="mr-1" />
                    Back
                  </button>
                  <div className="flex flex-col w-full bg-white p-4 rounded-sm shadow-sm border border-gray-200">
                    <h1 className="text-2xl font-semibold text-gray-800 border-b pb-2 mb-4 border-gray-300 w-full">
                      Expert System for Diagnosing Heart Disease
                    </h1>
                    <p className="text-gray-700 text-sm mb-4">
                      Built with Flutter, Node JS, MongoDB & Bootstrap
                    </p>

                    <h2 className="text-lg font-semibold text-gray-800 mb-2">
                      About Expert System
                    </h2>
                    <p className="text-gray-700 text-sm mb-4 leading-6">
                      The Expert system was developed for Diagnosing Heart Disease
                      using a standard rule base. I implemented user-friendly web
                      and mobile interfaces for easy access to the system. I also
                      designed and developed the system's architecture, including
                      the rule base and decision tree algorithm for accurate
                      diagnosis of heart disease.
                    </p>
                  </div>
                </AnimatedItem>
              )}

              {qr && (
                <AnimatedItem animationConfig={{ delay: 0.1 }}>
                  <button
                    className="flex items-center text-blue-600 mb-4 text-sm cursor-pointer hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                    onClick={() => {
                      const audio = new Audio("click.wav");
                      audio.play();
                      setQR(false);
                    }}
                  >
                    <BsChevronLeft className="mr-1" />
                    Back
                  </button>
                  <div className="flex flex-col w-full bg-white p-4 rounded-sm shadow-sm border border-gray-200">
                    <h1 className="text-2xl font-semibold text-gray-800 border-b pb-2 mb-4 border-gray-300 w-full">
                      QR Code attenance system
                    </h1>
                    <p className="text-gray-700 text-sm mb-4">
                      Built with Flutter & Firebase
                    </p>

                    <h2 className="text-lg font-semibold text-gray-800 mb-2">
                      About QR Code attenance system
                    </h2>
                    <p className="text-gray-700 text-sm mb-4 leading-6">
                      The QR Code Attendance System is a mobile application
                      developed using Flutter and Firebase that simplifies the
                      process of tracking attendance for various events, classes, or
                      meetings. This modern solution replaces the traditional
                      paper-based attendance sheet with an efficient digital system.
                    </p>
                  </div>
                </AnimatedItem>
              )}

              {!sureplug &&
                !scam &&
                !track &&
                !virtual &&
                !statesapi &&
                !heart &&
                !qr && (
                  <div className="flex flex-col w-full">
                    <h1 className="text-2xl smbelow:text-xl font-semibold text-gray-800 border-b pb-3 border-gray-300 w-full">
                      Personal Projects
                    </h1>
                    <div className="grid grid-cols-3 smbelow:grid-cols-1 gap-3 mt-4">
                      <motion.div
                        whileHover={{ y: -2, boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          const audio = new Audio("click.wav");
                          audio.play();
                          setSureplug(true);
                        }}
                        className="flex flex-col cursor-pointer bg-white p-3 rounded-sm border border-gray-200 hover:border-blue-300 transition-all"
                      >
                        <div className="flex gap-3">
                          <Image
                            src="/fusionpay.png"
                            width={60}
                            height={60}
                            className="rounded-sm border border-gray-200"
                            alt="FusionPay"
                          />
                          <div className="flex flex-col">
                            <p className="text-gray-800 font-medium">FusionPay</p>
                            <p className="text-gray-600 text-sm">Mobile App</p>
                            <p className="text-gray-500 text-xs mt-1">
                              React Native, Expo Router, Reanimated 3, Zustand, MMKV, Clerk Auth...
                            </p>
                          </div>
                        </div>
                      </motion.div>

                      <motion.div
                        whileHover={{ y: -2, boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          const audio = new Audio("click.wav");
                          audio.play();
                          setScam(true);
                        }}
                        className="flex flex-col cursor-pointer bg-white p-3 rounded-sm border border-gray-200 hover:border-blue-300 transition-all"
                      >
                        <div className="flex gap-3">
                          <Image 
                            src="/scam.png" 
                            width={60} 
                            height={60}
                            className="rounded-sm border border-gray-200"
                            alt="Hyperswitch"
                          />
                          <div className="flex flex-col">
                            <p className="text-gray-800 font-medium">Hyperswitch</p>
                            <p className="text-gray-600 text-sm">Open-Source</p>
                            <p className="text-gray-500 text-xs mt-1">
                              Rust, Docker, Postgres, Redis, Diesel, TypeScript...
                            </p>
                          </div>
                        </div>
                      </motion.div>

                      <motion.div
                        whileHover={{ y: -2, boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          const audio = new Audio("click.wav");
                          audio.play();
                          setTrack(true);
                        }}
                        className="flex flex-col cursor-pointer bg-white p-3 rounded-sm border border-gray-200 hover:border-blue-300 transition-all"
                      >
                        <div className="flex gap-3">
                          <Image 
                            src="/dobs.png" 
                            width={60} 
                            height={60}
                            className="rounded-sm border border-gray-200"
                            alt="DBOS"
                          />
                          <div className="flex flex-col">
                            <p className="text-gray-800 font-medium">DBOS</p>
                            <p className="text-gray-600 text-sm">Open Source</p>
                            <p className="text-gray-500 text-xs mt-1">
                              Python, PostgreSQL, Alembic, Pydantic, Pytest, Docker...
                            </p>
                          </div>
                        </div>
                      </motion.div>

                      <motion.div
                        whileHover={{ y: -2, boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          const audio = new Audio("click.wav");
                          audio.play();
                          setVirtual(true);
                        }}
                        className="flex flex-col cursor-pointer bg-white p-3 rounded-sm border border-gray-200 hover:border-blue-300 transition-all"
                      >
                        <div className="flex gap-3">
                          <Image
                            src="/daskblog.png"
                            width={60}
                            height={60}
                            className="rounded-sm border border-gray-200"
                            alt="Dask Blog"
                          />
                          <div className="flex flex-col">
                            <p className="text-gray-800 font-medium">Dask Blog Project</p>
                            <p className="text-gray-600 text-sm">Website</p>
                            <p className="text-gray-500 text-xs mt-1">
                              Flask, PostgreSQL, HTML, CSS, Bootstrap, JavaScript...
                            </p>
                          </div>
                        </div>
                      </motion.div>

                      <motion.div
                        whileHover={{ y: -2, boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          const audio = new Audio("click.wav");
                          audio.play();
                          setStatesapi(true);
                        }}
                        className="flex flex-col cursor-pointer bg-white p-3 rounded-sm border border-gray-200 hover:border-blue-300 transition-all"
                      >
                        <div className="flex gap-3">
                          <Image 
                            src="/canadaflag.png" 
                            width={60} 
                            height={60}
                            className="rounded-sm border border-gray-200"
                            alt="States API"
                          />
                          <div className="flex flex-col">
                            <p className="text-gray-800 font-medium">States & LGAs API</p>
                            <p className="text-gray-600 text-sm">REST API</p>
                            <p className="text-gray-500 text-xs mt-1">
                              Node & Postman
                            </p>
                          </div>
                        </div>
                      </motion.div>

                      <motion.div
                        whileHover={{ y: -2, boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          const audio = new Audio("click.wav");
                          audio.play();
                          setHeart(true);
                        }}
                        className="flex flex-col cursor-pointer bg-white p-3 rounded-sm border border-gray-200 hover:border-blue-300 transition-all"
                      >
                        <div className="flex gap-3">
                          <Image
                            src="/heart.png"
                            width={60}
                            height={60}
                            className="rounded-sm border border-gray-200"
                            alt="Heart Disease ES"
                          />
                          <div className="flex flex-col">
                            <p className="text-gray-800 font-medium">Heart Disease E.S</p>
                            <p className="text-gray-600 text-sm">Mobile App</p>
                            <p className="text-gray-500 text-xs mt-1">
                              Flutter & Node JS
                            </p>
                          </div>
                        </div>
                      </motion.div>

                      <motion.div
                        whileHover={{ y: -2, boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          const audio = new Audio("click.wav");
                          audio.play();
                          setQR(true);
                        }}
                        className="col-span-3 smbelow:col-span-1 flex flex-col cursor-pointer bg-white p-3 rounded-sm border border-gray-200 hover:border-blue-300 transition-all"
                      >
                        <div className="flex gap-3">
                          <Image
                            src="/qr.png"
                            width={60}
                            height={60}
                            className="rounded-sm border border-gray-200"
                            alt="QR Attendance"
                          />
                          <div className="flex flex-col">
                            <p className="text-gray-800 font-medium">QR Code Attendance System</p>
                            <p className="text-gray-600 text-sm">Mobile App</p>
                            <p className="text-gray-500 text-xs mt-1">
                              Flutter & Firebase
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Projects;