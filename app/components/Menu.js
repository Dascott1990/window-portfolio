import React from "react";
import { FcBullish } from "react-icons/fc";
import { FcGraduationCap } from "react-icons/fc";
import { BiSolidFilePdf } from "react-icons/bi";
import { FcCollaboration } from "react-icons/fc";
import { BiChevronUp, BiChevronDown } from "react-icons/bi";
import { FcFolder } from "react-icons/fc";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const Menu = ({
  isStartMenuOpen,
  setShowModal,
  screen,
  setexperience,
  setImpact,
  setEducation,
  setInfo,
  info,
}) => {
  return (
    <div className={`flex flex-col items-center justify-center flex-grow ${isStartMenuOpen ? "bg-black bg-opacity-20 backdrop-blur-sm" : ""}`}>
      <AnimatePresence>
        {isStartMenuOpen && screen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col mt-auto bg-gray-100 bg-opacity-90 backdrop-blur-lg border border-gray-300 rounded-lg shadow-xl w-[500px] smbelow:w-[95%] overflow-hidden"
            style={{
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)"
            }}
          >
            {/* Windows Start Menu Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2">
              <p className="text-white font-medium text-sm">Rasheed Tajudeen - Developer Portfolio</p>
            </div>

            {/* Menu Tiles */}
            <div className="grid grid-cols-5 gap-4 p-4 smbelow:grid-cols-3 smbelow:gap-3">
              <motion.div
                whileHover={{ scale: 1.05, boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)" }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center justify-center cursor-pointer p-3 rounded-md bg-white bg-opacity-80 hover:bg-opacity-100 transition-all border border-gray-200"
                onClick={() => {
                  new Audio("click.wav").play();
                  setShowModal(true);
                }}
              >
                <FcFolder className="text-4xl mb-2" />
                <p className="text-gray-800 text-sm font-medium">Projects</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05, boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)" }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center justify-center cursor-pointer p-3 rounded-md bg-white bg-opacity-80 hover:bg-opacity-100 transition-all border border-gray-200"
              >
                <Link
                  href="https://drive.google.com/file/d/1tYMVwL4xGvdwlP4xn8UC8K24gz0PrS6F/view?usp=drive_link"
                  target="_blank"
                  onClick={() => new Audio("click.wav").play()}
                  className="flex flex-col items-center"
                >
                  <BiSolidFilePdf className="text-4xl mb-2 text-red-600" />
                  <p className="text-gray-800 text-sm font-medium">Resume</p>
                </Link>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05, boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)" }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center justify-center cursor-pointer p-3 rounded-md bg-white bg-opacity-80 hover:bg-opacity-100 transition-all border border-gray-200"
                onClick={() => {
                  new Audio("click.wav").play();
                  setexperience(true);
                }}
              >
                <FcCollaboration className="text-4xl mb-2" />
                <p className="text-gray-800 text-sm font-medium">Experience</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05, boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)" }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center justify-center cursor-pointer p-3 rounded-md bg-white bg-opacity-80 hover:bg-opacity-100 transition-all border border-gray-200"
                onClick={() => {
                  new Audio("click.wav").play();
                  setImpact(true);
                }}
              >
                <FcBullish className="text-4xl mb-2" />
                <p className="text-gray-800 text-sm font-medium">Impact</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05, boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)" }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center justify-center cursor-pointer p-3 rounded-md bg-white bg-opacity-80 hover:bg-opacity-100 transition-all border border-gray-200"
                onClick={() => {
                  new Audio("click.wav").play();
                  setEducation(true);
                }}
              >
                <FcGraduationCap className="text-4xl mb-2" />
                <p className="text-gray-800 text-sm font-medium">Education</p>
              </motion.div>
            </div>

            {/* Info Section */}
            {info && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="px-4 overflow-hidden"
              >
                <div className="bg-white bg-opacity-70 rounded-md p-4 border border-gray-200">
                  <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
                    <div className="font-medium">Name:</div>
                    <div>Rasheed Tajudeen</div>
                    
                    <div className="font-medium">Email:</div>
                    <div className="truncate">dascottblog@gmail.com</div>
                    
                    <div className="font-medium">Phone:</div>
                    <div>+1 416 505 6927</div>
                    
                    <div className="font-medium">Experience:</div>
                    <div>{`${new Date().getFullYear() - 2022} year${
                      new Date().getFullYear() - 2022 > 1 ? "s" : ""
                    }`}</div>
                    
                    <div className="font-medium">Skills:</div>
                    <div className="col-span-1">
                      React, Next.js, JavaScript, TypeScript, Node.js, Express,
                      PostgreSQL, MongoDB, GraphQL, REST APIs, JWT, OAuth,
                      WebSockets, Docker, AWS, Git, CI/CD, Security Best Practices,
                      Flutter, Dart, iOS (Swift/SwiftUI), Python, UI/UX, HTML, CSS
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Footer with Profile */}
            <div className="flex items-center bg-gray-200 bg-opacity-80 p-3 mt-auto border-t border-gray-300">
              <div className="flex items-center flex-grow">
                <Image
                  src="/img.jpeg"
                  width={40}
                  height={40}
                  className="rounded-full border-2 border-white shadow-sm"
                  alt="Profile"
                />
                <div className="ml-3">
                  <p className="text-gray-800 font-medium text-sm">Rasheed Tajudeen</p>
                  <p className="text-gray-600 text-xs">Web/Mobile Developer</p>
                </div>
              </div>
              <button
                onClick={() => {
                  new Audio("click.wav").play();
                  setInfo(!info);
                }}
                className="p-1 rounded-full hover:bg-gray-300 transition-colors"
              >
                {info ? (
                  <BiChevronDown className="text-2xl text-gray-700" />
                ) : (
                  <BiChevronUp className="text-2xl text-gray-700" />
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Menu;