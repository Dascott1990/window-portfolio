import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { 
  FiCamera, 
  FiRotateCcw, 
  FiSave, 
  FiX,
  FiMaximize,
  FiMinimize,
  FiVideo,
  FiVideoOff,
  FiAperture,
  FiGrid,
  FiSun,
  FiMoon
} from 'react-icons/fi';
import { FaCircle, FaMagic } from 'react-icons/fa';
import { IoMdFlash, IoMdFlashOff } from 'react-icons/io';

const Camera = ({ onClose }) => {
  // State management
  const [stream, setStream] = useState(null);
  const [devices, setDevices] = useState([]);
  const [activeDevice, setActiveDevice] = useState(null);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [currentPhoto, setCurrentPhoto] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(true); // Always start in fullscreen
  const [darkMode, setDarkMode] = useState(false);
  const [flashMode, setFlashMode] = useState('off');
  const [showGallery, setShowGallery] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [gridVisible, setGridVisible] = useState(false);
  
  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Initialize fullscreen on mount
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        if (containerRef.current && !document.fullscreenElement) {
          await containerRef.current.requestFullscreen();
          setIsFullscreen(true);
        }
      } catch (err) {
        console.error("Fullscreen error:", err);
      }
    };
    
    enterFullscreen();

    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    };
  }, []);

  // Fullscreen handler
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Load preferences
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('cameraDarkMode') === 'true';
    const savedDevice = localStorage.getItem('preferredCamera');
    const savedFlash = localStorage.getItem('flashMode') || 'off';
    setDarkMode(savedDarkMode);
    setFlashMode(savedFlash);
    if (savedDevice) setActiveDevice(savedDevice);
  }, []);

  // Camera device handling
  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);
        if (videoDevices.length > 0 && !activeDevice) {
          setActiveDevice(videoDevices[0].deviceId);
        }
      } catch (err) {
        console.error('Error enumerating devices:', err);
      }
    };
    getDevices();
  }, [activeDevice]);

  // Stream management
  useEffect(() => {
    const startStream = async () => {
      if (!activeDevice) return;

      try {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }

        const constraints = {
          video: { 
            deviceId: { exact: activeDevice },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        };

        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(newStream);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().catch(e => console.log('Video play error:', e));
          };
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
      }
    };

    startStream();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [activeDevice]);

  // Capture functions
  const capturePhoto = async () => {
    playSound('shutter');
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || video.readyState !== 4) return;

    // Wait for video to be ready
    await new Promise(resolve => {
      if (video.readyState >= 3) resolve();
      else video.addEventListener('loadeddata', resolve, { once: true });
    });

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // Apply flash effect
    if (flashMode === 'on') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setTimeout(() => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        savePhotoToGallery();
      }, 100);
    } else {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      savePhotoToGallery();
    }
  };

  const savePhotoToGallery = () => {
    const canvas = canvasRef.current;
    const photoUrl = canvas.toDataURL('image/jpeg', 0.9);
    const newPhoto = {
      id: Date.now(),
      url: photoUrl,
      timestamp: new Date().toISOString()
    };
    setCapturedPhotos(prev => [newPhoto, ...prev]);
    setCurrentPhoto(newPhoto);
  };

  const savePhotoToDisk = (photoUrl) => {
    playSound('click');
    const link = document.createElement('a');
    link.href = photoUrl;
    link.download = `photo-${new Date().toISOString()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Camera controls
  const switchCamera = () => {
    playSound('click');
    if (devices.length < 2) return;
    
    const currentIndex = devices.findIndex(d => d.deviceId === activeDevice);
    const nextIndex = (currentIndex + 1) % devices.length;
    const nextDevice = devices[nextIndex].deviceId;
    
    setActiveDevice(nextDevice);
    localStorage.setItem('preferredCamera', nextDevice);
  };

  const toggleFlash = () => {
    playSound('click');
    const modes = ['off', 'on', 'auto'];
    const currentIndex = modes.indexOf(flashMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    const nextMode = modes[nextIndex];
    setFlashMode(nextMode);
    localStorage.setItem('flashMode', nextMode);
  };

  const toggleDarkMode = () => {
    playSound('click');
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('cameraDarkMode', newMode);
  };

  const toggleFullscreen = () => {
    playSound('click');
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.().catch(err => {
        console.error("Fullscreen error:", err);
      });
    }
  };

  const toggleGrid = () => {
    playSound('click');
    setGridVisible(!gridVisible);
  };

  const handleZoom = (e) => {
    const newZoom = Math.min(Math.max(1, e.target.value), 3);
    setZoomLevel(newZoom);
    if (videoRef.current) {
      videoRef.current.style.transform = `scale(${newZoom})`;
    }
  };

  // Audio feedback
  const playSound = (type) => {
    try {
      const sound = new Audio(type === 'shutter' ? '/shutter.wav' : '/click.wav');
      sound.volume = type === 'shutter' ? 0.7 : 0.3;
      sound.play().catch(e => console.log('Sound play failed:', e));
    } catch (e) {
      console.log('Sound error:', e);
    }
  };

  // UI Effects
  const glassEffect = "backdrop-blur-xl bg-white/15 dark:bg-black/15";
  const borderEffect = "border border-white/20 dark:border-gray-800/30";
  const shadowEffect = "shadow-2xl shadow-black/40";

  const buttonVariants = {
    hover: { scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.25)' },
    tap: { scale: 0.9 }
  };

  const floatingVariants = {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 20, opacity: 0 }
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-black"
    >
      {/* Header Bar */}
      <div 
        className={`flex justify-between items-center p-4 ${darkMode ? 'bg-black/30' : 'bg-white/20'} ${borderEffect}`}
      >
        <motion.button
          whileHover="hover"
          whileTap="tap"
          variants={buttonVariants}
          onClick={onClose}
          className={`p-2 rounded-full ${glassEffect}`}
        >
          <FiX className="text-white text-lg" />
        </motion.button>
        
        <motion.h2 
          className="text-white font-medium text-lg flex items-center gap-2"
        >
          <FiCamera className="text-cyan-400" />
          <span>Neural Camera</span>
        </motion.h2>
        
        <div className="flex space-x-2">
          <motion.button
            whileHover="hover"
            whileTap="tap"
            variants={buttonVariants}
            onClick={toggleDarkMode}
            className={`p-2 rounded-full ${glassEffect}`}
          >
            {darkMode ? (
              <FiSun className="text-yellow-300 text-lg" />
            ) : (
              <FiMoon className="text-gray-300 text-lg" />
            )}
          </motion.button>
        </div>
      </div>

      {/* Main Camera View */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        {stream ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-transform duration-300 ${currentPhoto ? 'hidden' : 'block'}`}
              style={{ transform: `scale(${zoomLevel})` }}
              onCanPlay={() => {
                videoRef.current?.play().catch(e => console.log('Video play error:', e));
              }}
            />
            
            {/* Grid Overlay */}
            {gridVisible && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="h-full w-full grid grid-cols-3 grid-rows-3 gap-0">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="border border-white/20" />
                  ))}
                </div>
              </div>
            )}
            
            {/* Flash Effect */}
            {flashMode === 'on' && (
              <motion.div 
                className="absolute inset-0 bg-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.9 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
              />
            )}
            
            <AnimatePresence>
              {currentPhoto && (
                <motion.img
                  key={currentPhoto.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  src={currentPhoto.url}
                  alt="Captured"
                  className="absolute inset-0 w-full h-full object-contain bg-black"
                />
              )}
            </AnimatePresence>
            
            <canvas ref={canvasRef} className="hidden" />
          </>
        ) : (
          <div className="text-white text-center p-8">
            <p className="text-lg">
              Camera access required
            </p>
            <p className="text-sm opacity-80 mt-2">
              Please allow camera permissions to use this feature
            </p>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className={`absolute bottom-0 left-0 right-0 p-4 ${darkMode ? 'bg-black/30' : 'bg-white/20'} ${borderEffect}`}>
        {/* Zoom Slider */}
        <motion.div 
          className="mb-4 px-2"
        >
          <input
            type="range"
            min="1"
            max="3"
            step="0.1"
            value={zoomLevel}
            onChange={handleZoom}
            className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer"
          />
        </motion.div>

        {/* Main Controls */}
        <div className="flex justify-between items-center">
          {/* Left Side Controls */}
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover="hover"
              whileTap="tap"
              variants={buttonVariants}
              onClick={toggleFlash}
              className={`p-3 rounded-full ${glassEffect}`}
            >
              {flashMode === 'off' ? (
                <IoMdFlashOff className="text-white text-xl" />
              ) : (
                <IoMdFlash className={`text-xl ${flashMode === 'on' ? 'text-yellow-300' : 'text-white'}`} />
              )}
            </motion.button>

            <motion.button
              whileHover="hover"
              whileTap="tap"
              variants={buttonVariants}
              onClick={toggleGrid}
              className={`p-3 rounded-full ${glassEffect} ${gridVisible ? 'bg-cyan-500/30' : ''}`}
            >
              <FiGrid className="text-white text-xl" />
            </motion.button>
          </div>

          {/* Capture Button */}
          <motion.div
            className="relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <button
              onClick={currentPhoto ? null : capturePhoto}
              className={`p-5 rounded-full ${currentPhoto ? 'bg-transparent' : 'bg-red-500/90'} ${shadowEffect} relative`}
            >
              {currentPhoto ? (
                <FaCircle className="text-white text-3xl" />
              ) : (
                <FaCircle className="text-white text-4xl" />
              )}
              {!currentPhoto && (
                <div className="absolute inset-0 rounded-full border-2 border-white/50" />
              )}
            </button>
          </motion.div>

          {/* Right Side Controls */}
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover="hover"
              whileTap="tap"
              variants={buttonVariants}
              onClick={switchCamera}
              disabled={devices.length < 2}
              className={`p-3 rounded-full ${glassEffect} ${devices.length < 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <FiRotateCcw className="text-white text-xl" />
            </motion.button>

            <motion.button
              whileHover="hover"
              whileTap="tap"
              variants={buttonVariants}
              onClick={() => setShowGallery(!showGallery)}
              className={`p-3 rounded-full ${glassEffect} ${showGallery ? 'bg-cyan-500/30' : ''}`}
            >
              <FiAperture className="text-white text-xl" />
            </motion.button>
          </div>
        </div>

        {/* Photo Actions */}
        <AnimatePresence>
          {currentPhoto && (
            <motion.div
              variants={floatingVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex justify-center mt-4 space-x-4"
            >
              <motion.button
                whileHover="hover"
                whileTap="tap"
                variants={buttonVariants}
                onClick={() => setCurrentPhoto(null)}
                className={`px-4 py-2 rounded-full ${glassEffect} flex items-center`}
              >
                <span className="text-white text-sm">Retake</span>
              </motion.button>
              <motion.button
                whileHover="hover"
                whileTap="tap"
                variants={buttonVariants}
                onClick={() => savePhotoToDisk(currentPhoto.url)}
                className={`px-4 py-2 rounded-full ${glassEffect} flex items-center`}
              >
                <FiSave className="text-white mr-2" />
                <span className="text-white text-sm">Save</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Gallery Panel */}
      <AnimatePresence>
        {showGallery && capturedPhotos.length > 0 && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-lg z-10 p-4 overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-lg font-medium">Your Captures</h3>
              <button 
                onClick={() => setShowGallery(false)}
                className="text-white p-2"
              >
                <FiX className="text-xl" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {capturedPhotos.map(photo => (
                <motion.div
                  key={photo.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setCurrentPhoto(photo);
                    setShowGallery(false);
                  }}
                  className="aspect-square bg-gray-800 rounded-lg overflow-hidden cursor-pointer"
                >
                  <img 
                    src={photo.url} 
                    alt="Capture" 
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Camera;