// components/premium/MusicApp.js
"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { 
  FaPlay, FaPause, FaStepForward, FaStepBackward, 
  FaVolumeUp, FaVolumeMute, FaRandom, FaRedoAlt 
} from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import { MdQueueMusic, MdOutlineLibraryMusic } from "react-icons/md";
import { IoSunnyOutline, IoMoonOutline } from "react-icons/io5";
import { RiPlayListFill } from "react-icons/ri";

const MusicApp = ({ musicOpen, setMusicOpen }) => {
  // Player state
  const [songs, setSongs] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [showPlaylist, setShowPlaylist] = useState(true);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Refs
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const controls = useAnimation();
  const containerRef = useRef(null);

  // Animation variants
  const slideUp = {
    hidden: { y: "100%" },
    visible: { y: 0 },
    exit: { y: "100%" }
  };

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  // Fetch music data
  useEffect(() => {
    const fetchMusic = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          "https://api.deezer.com/playlist/908622995"
        );
        const data = await response.json();
        setSongs(data.tracks?.data || []);
      } catch (error) {
        console.error("Error fetching music:", error);
        // Fallback data with proper duration values
        setSongs([
          {
            id: 1,
            title: "Blinding Lights",
            artist: { name: "The Weeknd" },
            album: { cover_medium: "https://e-cdns-images.dzcdn.net/images/cover/2e018122cb56986277102d2041a592c8/500x500-000000-80-0-0.jpg" },
            preview: "https://cdns-preview-6.dzcdn.net/stream/c-6b86e181585c1f7f9d4a4b5e5a8f1d0f-3.mp3",
            duration: 203
          },
          {
            id: 2,
            title: "Save Your Tears",
            artist: { name: "The Weeknd" },
            album: { cover_medium: "https://e-cdns-images.dzcdn.net/images/cover/2e018122cb56986277102d2041a592c8/500x500-000000-80-0-0.jpg" },
            preview: "https://cdns-preview-5.dzcdn.net/stream/c-5d72a775c3b8a8f6a8b5a5e5a8f1d0f-3.mp3",
            duration: 215
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMusic();
  }, []);

  // Handle play/pause
  useEffect(() => {
    if (!audioRef.current || !songs.length) return;

    if (isPlaying) {
      audioRef.current.play().catch(e => console.log("Play error:", e));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentSongIndex, songs]);

  // Update progress bar
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("ended", handleSongEnd);

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("ended", handleSongEnd);
    };
  }, [currentSongIndex]);

  // Handle volume change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  // Animation on song change
  useEffect(() => {
    controls.start("visible");
  }, [currentSongIndex, controls]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (!songs.length) return;
    
    if (shuffle) {
      setCurrentSongIndex(Math.floor(Math.random() * songs.length));
    } else {
      setCurrentSongIndex((prevIndex) => (prevIndex + 1) % songs.length);
    }
    setProgress(0);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    if (!songs.length) return;
    
    if (audioRef.current?.currentTime > 3) {
      // If more than 3 seconds into song, restart it
      audioRef.current.currentTime = 0;
      setProgress(0);
    } else {
      // Otherwise go to previous song
      setCurrentSongIndex((prevIndex) => 
        prevIndex === 0 ? songs.length - 1 : prevIndex - 1
      );
      setProgress(0);
      setIsPlaying(true);
    }
  };

  const handleSongEnd = () => {
    if (repeat && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else {
      handleNext();
    }
  };

  const handleSongSelect = (index) => {
    if (index >= 0 && index < songs.length) {
      setCurrentSongIndex(index);
      setIsPlaying(true);
    }
  };

  const handleProgressChange = (e) => {
    const newProgress = parseFloat(e.target.value);
    if (isNaN(newProgress)) return;
    
    setProgress(newProgress);
    
    if (audioRef.current && audioRef.current.duration && isFinite(audioRef.current.duration)) {
      const newTime = (newProgress / 100) * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    if (!isNaN(newVolume)) {
      setVolume(newVolume);
      if (isMuted && newVolume > 0) {
        setIsMuted(false);
      }
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getGradientStyle = (value, darkMode) => {
    const safeValue = Math.min(100, Math.max(0, value));
    return {
      background: darkMode 
        ? `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${safeValue}%, #4b5563 ${safeValue}%, #4b5563 100%)`
        : `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${safeValue}%, #d1d5db ${safeValue}%, #d1d5db 100%)`
    };
  };

  if (!musicOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={fadeIn}
        transition={{ duration: 0.3 }}
        className={`fixed inset-0 z-50 flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-gray-100'} backdrop-blur-lg`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-4 ${darkMode ? 'bg-gray-800/50' : 'bg-white/50'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setMusicOpen(false)}
              className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
            >
              <IoMdClose className={darkMode ? 'text-gray-300' : 'text-gray-700'} size={20} />
            </button>
            <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Music Player
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
            >
              {darkMode ? (
                <IoSunnyOutline className="text-yellow-300" size={20} />
              ) : (
                <IoMoonOutline className="text-gray-700" size={20} />
              )}
            </button>
            <button 
              onClick={() => setShowPlaylist(!showPlaylist)}
              className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
            >
              <RiPlayListFill className={darkMode ? 'text-gray-300' : 'text-gray-700'} size={20} />
            </button>
          </div>
        </div>

        {/* Main Content */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className={`animate-spin rounded-full h-12 w-12 border-t-2 ${darkMode ? 'border-blue-400' : 'border-blue-600'}`}></div>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Playlist Sidebar */}
            <AnimatePresence>
              {showPlaylist && (
                <motion.div
                  initial={{ x: -300 }}
                  animate={{ x: 0 }}
                  exit={{ x: -300 }}
                  transition={{ type: 'spring', damping: 25 }}
                  className={`w-64 border-r ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white/50'} flex-shrink-0 flex flex-col`}
                >
                  <div className="p-4">
                    <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      <MdOutlineLibraryMusic className="inline mr-2" />
                      Your Library
                    </h2>
                    <div className="space-y-1 overflow-y-auto">
                      {songs.length > 0 ? (
                        songs.map((song, index) => (
                          <motion.div
                            key={song.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleSongSelect(index)}
                            className={`p-3 rounded-lg cursor-pointer flex items-center ${index === currentSongIndex ? (darkMode ? 'bg-blue-600/30' : 'bg-blue-400/30') : (darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-200/50')}`}
                          >
                            <img 
                              src={song.album?.cover_medium || 'https://via.placeholder.com/50'} 
                              alt={song.title} 
                              className="w-10 h-10 rounded mr-3"
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {song.title}
                              </h3>
                              <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {song.artist?.name || 'Unknown Artist'}
                              </p>
                            </div>
                            <span className={`text-xs ml-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {formatTime(song.duration)}
                            </span>
                          </motion.div>
                        ))
                      ) : (
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          No songs available
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Now Playing View */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Album Art */}
              {songs.length > 0 && (
                <motion.div
                  key={currentSongIndex}
                  initial="hidden"
                  animate={controls}
                  variants={{
                    hidden: { opacity: 0, scale: 0.9 },
                    visible: { 
                      opacity: 1, 
                      scale: 1,
                      transition: { 
                        duration: 0.5,
                        ease: "easeOut"
                      } 
                    }
                  }}
                  className="flex-1 flex items-center justify-center p-8"
                >
                  {songs[currentSongIndex]?.album?.cover_medium ? (
                    <img
                      src={songs[currentSongIndex].album.cover_medium}
                      alt={songs[currentSongIndex].title}
                      className="w-full max-w-md rounded-2xl shadow-2xl"
                    />
                  ) : (
                    <div className={`w-full max-w-md h-64 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}>
                      <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>No Album Art</span>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Song Info */}
              <div className="px-6 pb-4 text-center">
                <motion.h2 
                  className={`text-2xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  {songs[currentSongIndex]?.title || 'No song selected'}
                </motion.h2>
                <motion.p 
                  className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  {songs[currentSongIndex]?.artist?.name || 'Unknown Artist'}
                </motion.p>
              </div>

              {/* Progress Bar */}
              <div className="px-6 pb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                    {formatTime(audioRef.current?.currentTime || 0)}
                  </span>
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                    {formatTime(songs[currentSongIndex]?.duration || 0)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={handleProgressChange}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={getGradientStyle(progress, darkMode)}
                  ref={progressRef}
                />
              </div>

              {/* Controls */}
              <div className="px-6 pb-8 flex flex-col items-center">
                <div className="flex items-center justify-center space-x-6 mb-4">
                  <button 
                    onClick={() => setShuffle(!shuffle)}
                    className={`p-2 ${shuffle ? (darkMode ? 'text-blue-400' : 'text-blue-600') : (darkMode ? 'text-gray-400' : 'text-gray-600')}`}
                  >
                    <FaRandom size={18} />
                  </button>
                  <button 
                    onClick={handlePrev}
                    disabled={!songs.length}
                    className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-200 text-gray-900'} ${!songs.length ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <FaStepBackward size={24} />
                  </button>
                  <button 
                    onClick={handlePlayPause}
                    disabled={!songs.length}
                    className={`p-4 rounded-full ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'} shadow-lg ${!songs.length ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isPlaying ? <FaPause size={24} /> : <FaPlay size={24} />}
                  </button>
                  <button 
                    onClick={handleNext}
                    disabled={!songs.length}
                    className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-200 text-gray-900'} ${!songs.length ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <FaStepForward size={24} />
                  </button>
                  <button 
                    onClick={() => setRepeat(!repeat)}
                    className={`p-2 ${repeat ? (darkMode ? 'text-blue-400' : 'text-blue-600') : (darkMode ? 'text-gray-400' : 'text-gray-600')}`}
                  >
                    <FaRedoAlt size={18} />
                  </button>
                </div>

                {/* Volume Control */}
                <div className="flex items-center w-full max-w-xs">
                  <button 
                    onClick={toggleMute}
                    disabled={!songs.length}
                    className={`p-2 mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'} ${!songs.length ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isMuted ? <FaVolumeMute size={18} /> : <FaVolumeUp size={18} />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={handleVolumeChange}
                    disabled={!songs.length}
                    className="flex-1 h-2 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    style={getGradientStyle(volume, darkMode)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Player Bar (hidden on desktop) */}
        {songs.length > 0 && (
          <motion.div
            className={`lg:hidden fixed bottom-0 left-0 right-0 p-3 ${darkMode ? 'bg-gray-800' : 'bg-white'} border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
            variants={slideUp}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: 'spring', damping: 25 }}
          >
            <div className="flex items-center">
              <img 
                src={songs[currentSongIndex]?.album?.cover_medium || 'https://via.placeholder.com/50'} 
                alt={songs[currentSongIndex]?.title} 
                className="w-12 h-12 rounded mr-3"
              />
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {songs[currentSongIndex]?.title || 'Unknown Title'}
                </h3>
                <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {songs[currentSongIndex]?.artist?.name || 'Unknown Artist'}
                </p>
              </div>
              <button 
                onClick={handlePlayPause}
                disabled={!songs.length}
                className={`p-2 rounded-full ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} ml-2 ${!songs.length ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isPlaying ? <FaPause className="text-white" /> : <FaPlay className="text-white" />}
              </button>
            </div>
          </motion.div>
        )}

        {/* Audio Element */}
        <audio
          ref={audioRef}
          src={songs[currentSongIndex]?.preview}
          onEnded={handleSongEnd}
          onError={(e) => console.error("Audio error:", e)}
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default MusicApp;