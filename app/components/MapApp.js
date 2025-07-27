// components/MapApp.js
"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { IoMdClose, IoMdLocate } from "react-icons/io";
import { MdDragIndicator, MdFullscreen, MdFullscreenExit } from "react-icons/md";
import { FaSearch, FaRegMoon, FaRegSun } from "react-icons/fa";
import { BiCurrentLocation } from "react-icons/bi";
import dynamic from "next/dynamic";

// Dynamically import the map component to enable lazy loading
const Map = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  ),
});

const MapApp = ({ mapOpen, setMapOpen }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState([]);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [windowSize, setWindowSize] = useState({ width: 800, height: 600 });
  const [userLocation, setUserLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const searchInputRef = useRef(null);

  // Handle window dragging
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Get user's current location
  const handleLocateMe = () => {
    new Audio("click.wav").play();
    setLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLoadingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLoadingLocation(false);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      setLoadingLocation(false);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    new Audio("click.wav").play();
    if (searchQuery.trim()) {
      // In a real implementation, you would call the map API's geocoding service here
      // For now, we'll just add it to recent searches
      setRecentSearches((prev) => {
        const newSearches = [searchQuery, ...prev].slice(0, 5);
        return newSearches;
      });
      setSearchQuery("");
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    new Audio("click.wav").play();
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      setWindowSize({
        width: window.innerWidth - 40,
        height: window.innerHeight - 40,
      });
      setPosition({ x: 20, y: 20 });
    } else {
      setWindowSize({ width: 800, height: 600 });
    }
  };

  // Close window
  const handleClose = () => {
    new Audio("click.wav").play();
    setMapOpen(false);
    setIsFullscreen(false);
  };

  if (!mapOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", damping: 20 }}
      className={`fixed rounded-lg overflow-hidden flex flex-col ${darkMode ? "dark" : ""} ${
        darkMode ? "bg-gray-800/80" : "bg-white/80"
      } backdrop-blur-md border ${darkMode ? "border-gray-600/30" : "border-white/20"} shadow-xl`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${windowSize.width}px`,
        height: `${windowSize.height}px`,
        zIndex: 100,
        cursor: isDragging ? "grabbing" : "default",
      }}
      onMouseMove={handleMouseMove}
    >
      {/* Title Bar */}
      <div
        className={`flex items-center justify-between p-2 ${
          darkMode ? "bg-gray-900/70" : "bg-gray-200/70"
        } cursor-move`}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="flex items-center">
          <MdDragIndicator
            className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-600"}`}
          />
          <span className={`ml-2 font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
            Map Explorer
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-1 rounded ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-300"}`}
          >
            {darkMode ? (
              <FaRegSun className="text-yellow-300" />
            ) : (
              <FaRegMoon className="text-gray-600" />
            )}
          </button>
          <button
            onClick={toggleFullscreen}
            className={`p-1 rounded ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-300"}`}
          >
            {isFullscreen ? (
              <MdFullscreenExit className={`text-lg ${darkMode ? "text-gray-300" : "text-gray-600"}`} />
            ) : (
              <MdFullscreen className={`text-lg ${darkMode ? "text-gray-300" : "text-gray-600"}`} />
            )}
          </button>
          <button
            onClick={handleClose}
            className={`p-1 rounded ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-300"}`}
          >
            <IoMdClose className={`text-lg ${darkMode ? "text-gray-300" : "text-gray-600"}`} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        {/* Map Container */}
        <div className="w-full h-full">
          <Map
            darkMode={darkMode}
            userLocation={userLocation}
            searchQuery={searchQuery}
          />
        </div>

        {/* Search Panel */}
        <div
          className={`absolute top-4 left-4 p-4 rounded-lg ${
            darkMode ? "bg-gray-800/80" : "bg-white/80"
          } backdrop-blur-md border ${
            darkMode ? "border-gray-600/30" : "border-white/20"
          } shadow-lg w-80`}
        >
          <form onSubmit={handleSearch} className="mb-4">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for places..."
                className={`w-full pl-10 pr-4 py-2 rounded-lg ${
                  darkMode ? "bg-gray-700/90 text-white" : "bg-white/90 text-gray-800"
                } border ${
                  darkMode ? "border-gray-600/30" : "border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              <FaSearch
                className={`absolute left-3 top-3 ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              />
            </div>
          </form>

          <button
            onClick={handleLocateMe}
            disabled={loadingLocation}
            className={`flex items-center justify-center w-full py-2 rounded-lg mb-4 ${
              darkMode
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            } transition-colors duration-200`}
          >
            {loadingLocation ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              <>
                <BiCurrentLocation className="mr-2" />
                Find My Location
              </>
            )}
          </button>

          {recentSearches.length > 0 && (
            <div>
              <h3 className={`font-medium mb-2 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}>
                Recent Searches
              </h3>
              <ul className="space-y-2">
                {recentSearches.map((search, index) => (
                  <li
                    key={index}
                    className={`px-3 py-2 rounded-md cursor-pointer ${
                      darkMode
                        ? "hover:bg-gray-700/50 text-gray-200"
                        : "hover:bg-gray-200/50 text-gray-700"
                    } transition-colors duration-200`}
                    onClick={() => {
                      setSearchQuery(search);
                      searchInputRef.current.focus();
                    }}
                  >
                    <div className="flex items-center">
                      <IoMdLocate className="mr-2" />
                      {search}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MapApp;