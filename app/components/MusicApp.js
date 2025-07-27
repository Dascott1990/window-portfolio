// components/MusicApp.js
"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaPlay, FaPause, FaStepForward, FaStepBackward, FaVolumeUp } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import { MdDragIndicator } from "react-icons/md";
import { FaRegSun, FaRegMoon } from "react-icons/fa";

const MusicApp = ({ musicOpen, setMusicOpen }) => {
  const [songs, setSongs] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(80);
  const [darkMode, setDarkMode] = useState(false);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [windowSize, setWindowSize] = useState({ width: 500, height: 600 });

  const audioRef = React.useRef(null);

  // Fetch music data from Deezer API
  useEffect(() => {
    const fetchMusic = async () => {
      try {
        const response = await fetch(
          "https://api.deezer.com/playlist/908622995"
        );
        const data = await response.json();
        setSongs(data.tracks.data);
      } catch (error) {
        console.error("Error fetching music:", error);
        // Fallback data if API fails
        setSongs([
          {
            id: 1,
            title: "Sample Song 1",
            artist: { name: "Artist 1" },
            preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
            duration: 180
          },
          {
            id: 2,
            title: "Sample Song 2",
            artist: { name: "Artist 2" },
            preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
            duration: 210
          }
        ]);
      }
    };

    fetchMusic();
  }, []);

  // Handle play/pause
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentSongIndex]);

  // Update progress bar
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("ended", handleNext);

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("ended", handleNext);
    };
  }, [currentSongIndex]);

  // Handle volume change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const handlePlayPause = () => {
    new Audio("click.wav").play();
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    new Audio("click.wav").play();
    setCurrentSongIndex((prevIndex) => (prevIndex + 1) % songs.length);
    setProgress(0);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    new Audio("click.wav").play();
    setCurrentSongIndex((prevIndex) => 
      prevIndex === 0 ? songs.length - 1 : prevIndex - 1
    );
    setProgress(0);
    setIsPlaying(true);
  };

  const handleSongSelect = (index) => {
    new Audio("click.wav").play();
    setCurrentSongIndex(index);
    setIsPlaying(true);
  };

  const handleProgressChange = (e) => {
    const newProgress = e.target.value;
    setProgress(newProgress);
    if (audioRef.current) {
      audioRef.current.currentTime = (newProgress / 100) * audioRef.current.duration;
    }
  };

  const handleVolumeChange = (e) => {
    setVolume(e.target.value);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const formatTime = (seconds) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!musicOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", damping: 20 }}
      className={`fixed rounded-lg overflow-hidden flex flex-col ${darkMode ? 'dark' : ''} ${darkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-md border ${darkMode ? 'border-gray-600/30' : 'border-white/20'} shadow-xl`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${windowSize.width}px`,
        height: `${windowSize.height}px`,
        zIndex: 100,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      onMouseMove={handleMouseMove}
      >
      {/* Title Bar */}
      <div 
        className={`flex items-center justify-between p-2 ${darkMode ? 'bg-gray-900/70' : 'bg-gray-200/70'} cursor-move`}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="flex items-center">
          <MdDragIndicator className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          <span className={`ml-2 font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>Music Player</span>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-300'}`}
          >
            {darkMode ? <FaRegSun className="text-yellow-300" /> : <FaRegMoon className="text-gray-600" />}
          </button>
          <button 
            onClick={() => {
              new Audio("click.wav").play();
              setMusicOpen(false);
            }}
            className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-300'}`}
          >
            <IoMdClose className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col p-4">
        {/* Now Playing */}
        {songs.length > 0 && (
          <div className={`mb-6 p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-300/50'}`}>
            <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              Now Playing
            </h3>
            <div className="flex items-center">
              <div className="flex-1">
                <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {songs[currentSongIndex]?.title || 'Unknown Title'}
                </h4>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {songs[currentSongIndex]?.artist?.name || 'Unknown Artist'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={handlePrev}
                  className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-400'}`}
                >
                  <FaStepBackward className={darkMode ? 'text-white' : 'text-gray-800'} />
                </button>
                <button 
                  onClick={handlePlayPause}
                  className={`p-3 rounded-full ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`}
                >
                  {isPlaying ? (
                    <FaPause className="text-white" />
                  ) : (
                    <FaPlay className="text-white" />
                  )}
                </button>
                <button 
                  onClick={handleNext}
                  className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-400'}`}
                >
                  <FaStepForward className={darkMode ? 'text-white' : 'text-gray-800'} />
                </button>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1">
                <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                  {formatTime(audioRef.current?.currentTime || 0)}
                </span>
                <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
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
                style={{
                  background: darkMode 
                    ? `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progress}%, #4b5563 ${progress}%, #4b5563 100%)`
                    : `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progress}%, #d1d5db ${progress}%, #d1d5db 100%)`
                }}
              />
            </div>
            
            {/* Volume Control */}
            <div className="flex items-center mt-4">
              <FaVolumeUp className={`mr-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: darkMode 
                    ? `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume}%, #4b5563 ${volume}%, #4b5563 100%)`
                    : `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume}%, #d1d5db ${volume}%, #d1d5db 100%)`
                }}
              />
            </div>
          </div>
        )}

        {/* Playlist */}
        <div className="flex-1 overflow-y-auto">
          <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Playlist
          </h3>
          <div className="space-y-2">
            {songs.map((song, index) => (
              <div
                key={song.id}
                onClick={() => handleSongSelect(index)}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${index === currentSongIndex ? (darkMode ? 'bg-blue-600/30 border border-blue-500/50' : 'bg-blue-400/30 border border-blue-400/50') : (darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-400/30')}`}
              >
                <div>
                  <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {song.title}
                  </h4>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {song.artist?.name || 'Unknown Artist'}
                  </p>
                </div>
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {formatTime(song.duration)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={songs[currentSongIndex]?.preview}
        onEnded={handleNext}
      />
    </motion.div>
  );
};

export default MusicApp;