import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { 
  MdHealthAndSafety, 
  MdClose,
  MdOutlineCloudUpload,
  MdOutlineMedicalServices,
  MdOutlineContactSupport
} from "react-icons/md";
import { 
  FaRobot, 
  FaRegFilePdf,
  FaChevronDown,
  FaChevronUp
} from "react-icons/fa";
import { BiSolidFilePdf } from "react-icons/bi";
import { IoMdFlashlight } from "react-icons/io";

const DoctorAI = ({ onClose }) => {
  // State management
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  const fileInputRef = useRef(null);
  const controls = useAnimation();

  // Effects
  const glassEffect = "backdrop-blur-xl bg-white/10 dark:bg-black/10";
  const borderEffect = "border border-white/20 dark:border-gray-800/30";
  const shadowEffect = "shadow-2xl shadow-black/40";

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1]
      }
    },
    exit: { 
      opacity: 0,
      y: 20,
      transition: { 
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };

  const buttonVariants = {
    hover: { scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.15)' },
    tap: { scale: 0.95 }
  };

  // File handling
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = selectedFiles.filter(file => 
      file.type === 'image/jpeg' || file.type === 'image/png'
    );
    
    if (validFiles.length > 0) {
      setFiles(validFiles);
      setDiagnosis(null);
      controls.start("visible");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileChange({ target: { files: e.dataTransfer.files } });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const removeFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    if (newFiles.length === 0) {
      controls.start("hidden");
    }
  };

  // Diagnosis simulation
  const simulateDiagnosis = useCallback(async () => {
    setIsLoading(true);
    setFlashActive(true);
    
    // Flash effect
    await controls.start({
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      transition: { duration: 0.1 }
    });
    
    await controls.start({
      backgroundColor: "rgba(255, 255, 255, 0)",
      transition: { duration: 0.3 }
    });
    setFlashActive(false);

    // Mock API call
    setTimeout(() => {
      const mockConditions = [
        {
          condition: "Normal Findings",
          confidence: 92,
          advice: "No abnormalities detected. Maintain regular check-ups.",
          details: "The AI analysis indicates no signs of pathology in the submitted images. All visible structures appear within normal limits. Continue with your regular healthcare routine.",
          severity: "normal"
        },
        {
          condition: "Possible Pneumonia",
          confidence: 87,
          advice: "Consult a pulmonologist for further evaluation.",
          details: "The analysis detected potential signs of lung consolidation. While not definitive, these findings suggest possible pneumonia. A follow-up with a specialist is recommended for confirmation and treatment.",
          severity: "moderate"
        },
        {
          condition: "Fracture Detected",
          confidence: 95,
          advice: "Visit an orthopedic specialist immediately.",
          details: "Clear signs of bone discontinuity were identified. The fracture appears to be complete with slight displacement. Immediate medical attention is required to prevent complications.",
          severity: "severe"
        }
      ];
      
      const randomCondition = mockConditions[Math.floor(Math.random() * mockConditions.length)];
      setDiagnosis(randomCondition);
      setIsLoading(false);
    }, 2000);
  }, [controls]);

  const handleSubmit = () => {
    if (files.length > 0) {
      simulateDiagnosis();
    }
  };

  const resetForm = () => {
    setFiles([]);
    setDiagnosis(null);
    controls.start("hidden");
  };

  const mockDownloadPDF = () => {
    controls.start({
      scale: [1, 1.05, 1],
      transition: { duration: 0.3 }
    });
    // In a real app, this would generate and download a PDF
    setTimeout(() => {
      alert("PDF report generated successfully");
    }, 500);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black flex flex-col"
      >
        {/* Flash effect layer */}
        <motion.div
          animate={controls}
          className="absolute inset-0 pointer-events-none z-40"
          style={{ backgroundColor: "rgba(0, 0, 0, 0)" }}
        />
        
        {/* Header */}
        <div className={`flex justify-between items-center p-4 ${glassEffect} ${borderEffect} z-30`}>
          <div className="flex items-center space-x-3">
            <MdHealthAndSafety className="text-blue-400 text-2xl" />
            <h1 className="text-white font-medium text-lg">DoctorAI</h1>
          </div>
          
          <motion.button
            whileHover="hover"
            whileTap="tap"
            variants={buttonVariants}
            onClick={onClose}
            className={`p-2 rounded-full ${glassEffect}`}
          >
            <MdClose className="text-white text-xl" />
          </motion.button>
        </div>

        {/* Main Content */}
        <motion.div 
          className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden"
          variants={containerVariants}
          initial="hidden"
          animate={files.length > 0 ? "visible" : "hidden"}
        >
          {!diagnosis ? (
            <>
              {/* Upload Area */}
              <div 
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current.click()}
                className={`w-full max-w-2xl aspect-square rounded-2xl border-2 border-dashed ${files.length > 0 ? 'border-blue-400' : 'border-white/30'} flex flex-col items-center justify-center cursor-pointer transition-colors duration-300 relative overflow-hidden`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg, image/png"
                  multiple
                  className="hidden"
                />
                
                {files.length === 0 ? (
                  <div className="text-center p-6">
                    <MdOutlineCloudUpload className="text-blue-400 text-5xl mx-auto mb-4" />
                    <h2 className="text-white text-xl font-medium mb-2">Upload Medical Images</h2>
                    <p className="text-white/70">Drag & drop files or click to browse</p>
                    <p className="text-sm text-white/50 mt-4">Supports: JPEG, PNG</p>
                  </div>
                ) : (
                  <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-1 p-1">
                    {files.slice(0, 4).map((file, index) => (
                      <div key={index} className="relative bg-black rounded-lg overflow-hidden">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover opacity-90"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(index);
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 hover:opacity-100 transition-opacity"
                        >
                          <MdClose size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upload Info */}
              {files.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-6 text-center"
                >
                  <p className="text-white/80 mb-4">
                    {files.length} file{files.length > 1 ? 's' : ''} selected
                  </p>
                  <motion.button
                    whileHover="hover"
                    whileTap="tap"
                    variants={buttonVariants}
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className={`px-8 py-3 rounded-full bg-blue-600 text-white font-medium flex items-center ${isLoading ? 'opacity-80' : ''}`}
                  >
                    {isLoading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="mr-2"
                        >
                          <FaRobot size={20} />
                        </motion.div>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <MdOutlineMedicalServices className="mr-2" size={20} />
                        Begin Analysis
                      </>
                    )}
                  </motion.button>
                </motion.div>
              )}
            </>
          ) : (
            /* Diagnosis Results */
            <div className="w-full max-w-2xl">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`rounded-2xl overflow-hidden ${borderEffect} ${shadowEffect}`}
              >
                {/* Condition Header */}
                <div className={`p-6 ${diagnosis.severity === 'severe' ? 'bg-red-500/90' : diagnosis.severity === 'moderate' ? 'bg-amber-500/90' : 'bg-green-500/90'} text-white`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold">{diagnosis.condition}</h2>
                      <p className="opacity-90 mt-1">AI-Powered Diagnosis</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">{diagnosis.confidence}%</div>
                      <div className="text-xs opacity-80">Confidence</div>
                    </div>
                  </div>
                </div>
                
                {/* Advice Section */}
                <div className="bg-white dark:bg-gray-800 p-6">
                  <div className="flex items-start">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full mr-4">
                      <MdOutlineMedicalServices className="text-blue-500 dark:text-blue-300 text-xl" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-white">Medical Advice</h3>
                      <p className="text-gray-600 dark:text-gray-300 mt-1">{diagnosis.advice}</p>
                    </div>
                  </div>
                </div>
                
                {/* Details Section */}
                <div className="bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-600">
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="w-full px-6 py-4 flex justify-between items-center text-left"
                  >
                    <span className="font-medium text-gray-700 dark:text-gray-200">Technical Details</span>
                    {showDetails ? (
                      <FaChevronUp className="text-gray-500 dark:text-gray-400" />
                    ) : (
                      <FaChevronDown className="text-gray-500 dark:text-gray-400" />
                    )}
                  </button>
                  
                  <AnimatePresence>
                    {showDetails && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="px-6 pb-6 overflow-hidden"
                      >
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                          <p className="text-gray-600 dark:text-gray-300">{diagnosis.details}</p>
                          <div className="mt-4 grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Analysis ID</p>
                              <p className="text-sm font-mono">DX-{Date.now().toString().slice(-6)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Timestamp</p>
                              <p className="text-sm">{new Date().toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
              
              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-6 grid grid-cols-3 gap-3"
              >
                <motion.button
                  whileHover="hover"
                  whileTap="tap"
                  variants={buttonVariants}
                  onClick={resetForm}
                  className={`py-3 rounded-lg ${glassEffect} ${borderEffect} flex flex-col items-center justify-center`}
                >
                  <MdOutlineCloudUpload className="text-blue-400 text-xl mb-1" />
                  <span className="text-xs text-white">New Scan</span>
                </motion.button>
                
                <motion.button
                  whileHover="hover"
                  whileTap="tap"
                  variants={buttonVariants}
                  onClick={mockDownloadPDF}
                  className={`py-3 rounded-lg ${glassEffect} ${borderEffect} flex flex-col items-center justify-center`}
                >
                  <BiSolidFilePdf className="text-red-400 text-xl mb-1" />
                  <span className="text-xs text-white">Save PDF</span>
                </motion.button>
                
                <motion.button
                  whileHover="hover"
                  whileTap="tap"
                  variants={buttonVariants}
                  onClick={onClose}
                  className={`py-3 rounded-lg ${glassEffect} ${borderEffect} flex flex-col items-center justify-center`}
                >
                  <MdOutlineContactSupport className="text-green-400 text-xl mb-1" />
                  <span className="text-xs text-white">Contact Doctor</span>
                </motion.button>
              </motion.div>
            </div>
          )}
        </motion.div>

        {/* Empty State */}
        <AnimatePresence>
          {files.length === 0 && !diagnosis && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10"
            >
              <div className="text-center max-w-md">
                <div className="relative mb-6">
                  <MdHealthAndSafety className="text-blue-400 text-6xl mx-auto" />
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      opacity: [0.8, 1, 0.8]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute -inset-4 rounded-full border-2 border-blue-400/30 pointer-events-none"
                  />
                </div>
                <h2 className="text-white text-2xl font-medium mb-3">AI-Powered Health Analysis</h2>
                <p className="text-white/80 mb-6">
                  Upload medical images for instant preliminary analysis. Our AI helps identify potential health concerns with clinical-grade accuracy.
                </p>
                <motion.button
                  whileHover="hover"
                  whileTap="tap"
                  variants={buttonVariants}
                  onClick={() => fileInputRef.current.click()}
                  className={`px-6 py-3 rounded-full ${glassEffect} ${borderEffect} text-white font-medium flex items-center mx-auto`}
                >
                  <MdOutlineCloudUpload className="mr-2" />
                  Upload Images
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Disclaimer Footer */}
        <div className={`p-3 text-center text-xs text-white/60 ${glassEffect} ${borderEffect} z-20`}>
<p>
  Rasheed's HealthAI is an AI-assisted tool intended for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment.
</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DoctorAI;