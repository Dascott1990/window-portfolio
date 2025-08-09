"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoMdClose, IoMdLocate, IoMdSearch } from "react-icons/io";
import { FaRegMoon, FaRegSun } from "react-icons/fa";
import dynamic from "next/dynamic";

// Custom debounce implementation (no lodash dependency)
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

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
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (isFullscreen) {
        document.documentElement.style.overflow = 'hidden';
      } else {
        document.documentElement.style.overflow = '';
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isFullscreen]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocateMe = useCallback(() => {
    setLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
          setLoadingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLoadingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      setLoadingLocation(false);
    }
  }, []);

  const debouncedSearch = useCallback(
    debounce((query) => {
      if (query.trim()) {
        setTimeout(() => {
          setSearchResults([
            { id: 1, name: `${query} (City Center)`, type: 'city' },
            { id: 2, name: `${query} Main Station`, type: 'station' },
            { id: 3, name: `${query} Central Park`, type: 'park' },
          ]);
          setShowSearchResults(true);
        }, 300);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300),
    []
  );

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setRecentSearches((prev) => {
        const newSearches = [searchQuery, ...prev.filter(item => item !== searchQuery)].slice(0, 5);
        return newSearches;
      });
      setShowSearchResults(false);
      searchInputRef.current.blur();
    }
  };

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleClose = useCallback(() => {
    setMapOpen(false);
    setIsFullscreen(false);
  }, [setMapOpen]);

  const handleMapReady = useCallback(() => {
    setMapReady(true);
  }, []);

  if (!mapOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className={`fixed inset-0 ${isFullscreen ? '' : 'p-4 sm:p-6'} ${darkMode ? 'dark' : ''}`}
        style={{ zIndex: 100 }}
      >
        <div className={`absolute inset-0 rounded-xl overflow-hidden flex flex-col ${
          darkMode ? 'bg-gray-900/90' : 'bg-white/90'
        } backdrop-blur-lg border ${
          darkMode ? 'border-gray-700/50' : 'border-gray-200/50'
        } shadow-2xl`}>
          
          {/* Close Button - Adjusted with better spacing */}
          <button
            onClick={handleClose}
            className={`absolute top-4 right-4 z-50 p-3 rounded-full ${
              darkMode ? 'bg-gray-800/90 hover:bg-gray-700/90' : 'bg-white/90 hover:bg-gray-200/90'
            } backdrop-blur-md shadow-lg border ${
              darkMode ? 'border-gray-700/30' : 'border-gray-200/30'
            } transition-colors`}
            style={{
              width: '44px',
              height: '44px',
              margin: '12px' // Added margin for better spacing
              
            }}
          >
            <IoMdClose className={`text-xl ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} />
          </button>

          <div className="flex-1 relative overflow-hidden">
            <Map
              darkMode={darkMode}
              userLocation={userLocation}
              searchQuery={searchQuery}
              onMapReady={handleMapReady}
            />

            {/* Rest of your existing code remains exactly the same */}
            <div className="absolute top-4 left-0 right-0 flex justify-center px-4 pointer-events-none">
              <div className={`flex items-center justify-between w-full max-w-4xl ${
                darkMode ? 'bg-gray-800/80' : 'bg-white/80'
              } backdrop-blur-md rounded-full p-1 shadow-lg border ${
                darkMode ? 'border-gray-700/30' : 'border-gray-200/30'
              } pointer-events-auto`}>
                <div ref={searchContainerRef} className="relative flex-1">
                  <form onSubmit={handleSearch} className="flex">
                    <button
                      type="submit"
                      className={`p-2 rounded-full ${
                        darkMode ? 'text-gray-300 hover:bg-gray-700/50' : 'text-gray-600 hover:bg-gray-200/50'
                      }`}
                    >
                      <IoMdSearch className="text-xl" />
                    </button>
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onFocus={() => searchQuery && setShowSearchResults(true)}
                      placeholder="Search for places or addresses"
                      className={`flex-1 py-2 px-1 bg-transparent focus:outline-none ${
                        darkMode ? 'text-white placeholder-gray-400' : 'text-gray-800 placeholder-gray-500'
                      }`}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setShowSearchResults(false);
                        }}
                        className={`p-2 rounded-full ${
                          darkMode ? 'text-gray-400 hover:bg-gray-700/50' : 'text-gray-500 hover:bg-gray-200/50'
                        }`}
                      >
                        <IoMdClose />
                      </button>
                    )}
                  </form>

                  <AnimatePresence>
                    {showSearchResults && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className={`absolute left-0 right-0 mt-1 rounded-xl shadow-xl overflow-hidden ${
                          darkMode ? 'bg-gray-800/90' : 'bg-white/90'
                        } backdrop-blur-lg border ${
                          darkMode ? 'border-gray-700/30' : 'border-gray-200/30'
                        }`}
                      >
                        {searchResults.length > 0 ? (
                          <ul className="divide-y divide-gray-200/20">
                            {searchResults.map((result) => (
                              <li
                                key={result.id}
                                className={`p-3 cursor-pointer flex items-center ${
                                  darkMode
                                    ? 'hover:bg-gray-700/50 text-gray-200'
                                    : 'hover:bg-gray-100/50 text-gray-800'
                                } transition-colors`}
                                onClick={() => {
                                  setSearchQuery(result.name);
                                  setShowSearchResults(false);
                                }}
                              >
                                <div className="flex items-center">
                                  <div className={`p-2 rounded-full mr-3 ${
                                    darkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'
                                  }`}>
                                    <IoMdLocate className={
                                      result.type === 'city' ? 'text-blue-500' : 
                                      result.type === 'station' ? 'text-purple-500' : 
                                      'text-green-500'
                                    } />
                                  </div>
                                  <div>
                                    <p className="font-medium">{result.name}</p>
                                    <p className={`text-sm ${
                                      darkMode ? 'text-gray-400' : 'text-gray-500'
                                    }`}>
                                      {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                                    </p>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className={`p-4 text-center ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            No results found
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`p-2 mx-1 rounded-full ${
                    darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-200/50'
                  } transition-colors`}
                >
                  {darkMode ? (
                    <FaRegSun className="text-yellow-300 text-xl" />
                  ) : (
                    <FaRegMoon className="text-gray-600 text-xl" />
                  )}
                </button>
              </div>
            </div>

            <div className="absolute bottom-4 right-4 flex flex-col space-y-3">
              <div className={`flex flex-col rounded-xl overflow-hidden ${
                darkMode ? 'bg-gray-800/80' : 'bg-white/80'
              } backdrop-blur-md shadow-lg border ${
                darkMode ? 'border-gray-700/30' : 'border-gray-200/30'
              }`}>
                <button
                  className={`p-3 ${
                    darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-200/50'
                  } transition-colors`}
                >
                  <span className={`text-xl ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>+</span>
                </button>
                <div className={`h-px ${darkMode ? 'bg-gray-700/50' : 'bg-gray-200/50'}`} />
                <button
                  className={`p-3 ${
                    darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-200/50'
                  } transition-colors`}
                >
                  <span className={`text-xl ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>−</span>
                </button>
              </div>

              <button
                onClick={handleLocateMe}
                disabled={loadingLocation}
                className={`p-3 rounded-xl ${
                  darkMode ? 'bg-gray-800/80 hover:bg-gray-700/80' : 'bg-white/80 hover:bg-gray-200/80'
                } backdrop-blur-md shadow-lg border ${
                  darkMode ? 'border-gray-700/30' : 'border-gray-200/30'
                } transition-colors flex items-center justify-center`}
              >
                {loadingLocation ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500" />
                ) : (
                  <IoMdLocate className={`text-xl ${
                    darkMode ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                )}
              </button>

              <button
                onClick={toggleFullscreen}
                className={`p-3 rounded-xl ${
                  darkMode ? 'bg-gray-800/80 hover:bg-gray-700/80' : 'bg-white/80 hover:bg-gray-200/80'
                } backdrop-blur-md shadow-lg border ${
                  darkMode ? 'border-gray-700/30' : 'border-gray-200/30'
                } transition-colors`}
              >
                {isFullscreen ? (
                  <svg className={`w-5 h-5 mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 7a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 6a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className={`w-5 h-5 mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>

            <AnimatePresence>
              {recentSearches.length > 0 && !searchQuery && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className={`absolute bottom-20 left-4 w-80 rounded-xl ${
                    darkMode ? 'bg-gray-800/80' : 'bg-white/80'
                  } backdrop-blur-md shadow-lg border ${
                    darkMode ? 'border-gray-700/30' : 'border-gray-200/30'
                  } p-4`}
                >
                  <h3 className={`font-medium mb-3 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Recent Searches
                  </h3>
                  <ul className="space-y-2">
                    {recentSearches.map((search, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`px-3 py-2 rounded-lg cursor-pointer flex items-center ${
                          darkMode
                            ? 'hover:bg-gray-700/50 text-gray-200'
                            : 'hover:bg-gray-200/50 text-gray-800'
                        } transition-colors`}
                        onClick={() => {
                          setSearchQuery(search);
                          searchInputRef.current.focus();
                        }}
                      >
                        <IoMdSearch className="mr-2 opacity-70" />
                        <span className="truncate">{search}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MapApp;