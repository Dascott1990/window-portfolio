import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { 
  MdPayments,
  MdClose,
  MdHistory,
  MdCheckCircle,
  MdError
} from 'react-icons/md';
import { 
  FaCreditCard,
  FaWifi,
  FaRegClock,
  FaMoneyBillWave
} from 'react-icons/fa';

const Fintech = ({ onClose }) => {
  // State management
  const [paymentStatus, setPaymentStatus] = useState(null); // null, 'processing', 'success', 'failed'
  const [showHistory, setShowHistory] = useState(false);
  const controls = useAnimation();
  const nfcControls = useAnimation();
  const containerRef = useRef(null);

  // Effects
  const glassEffect = "backdrop-blur-xl bg-white/15 dark:bg-black/15";
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

  // NFC pulse animation
  const startNFCPulse = async () => {
    while (true) {
      await nfcControls.start({
        scale: 1.5,
        opacity: 0,
        transition: { duration: 1.5, ease: "easeOut" }
      });
      await nfcControls.start({
        scale: 1,
        opacity: 0.7,
        transition: { duration: 0 }
      });
    }
  };

  // Process payment
  const processPayment = async () => {
    setPaymentStatus('processing');
    
    // Simulate NFC connection
    await controls.start({
      backgroundColor: "rgba(20, 132, 188, 0.2)",
      transition: { duration: 0.3 }
    });
    
    // Random success/failure (80% success rate)
    const isSuccess = Math.random() > 0.2;
    setTimeout(() => {
      setPaymentStatus(isSuccess ? 'success' : 'failed');
      
      if (isSuccess) {
        controls.start({
          backgroundColor: "rgba(40, 167, 69, 0.2)",
          transition: { duration: 0.3 }
        });
      } else {
        controls.start({
          backgroundColor: "rgba(220, 53, 69, 0.2)",
          transition: { duration: 0.3 }
        });
      }
    }, 2000);
  };

  // Reset payment flow
  const resetPayment = () => {
    setPaymentStatus(null);
    controls.start({
      backgroundColor: "rgba(0, 0, 0, 0)",
      transition: { duration: 0.3 }
    });
  };

  // Demo transaction history
  const transactionHistory = [
    { id: 1, merchant: "Tim Hortons", amount: 4.25, date: "2023-05-15", time: "08:42", currency: "CAD" },
    { id: 2, merchant: "Shoppers Drug Mart", amount: 18.75, date: "2023-05-14", time: "17:30", currency: "CAD" },
    { id: 3, merchant: "Metro", amount: 62.40, date: "2023-05-13", time: "12:15", currency: "CAD" },
    { id: 4, merchant: "LCBO", amount: 29.99, date: "2023-05-12", time: "19:00", currency: "CAD" },
    { id: 5, merchant: "Pizza Pizza", amount: 22.50, date: "2023-05-11", time: "20:30", currency: "CAD" },
  ];

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black flex flex-col"
      >
        {/* Header */}
        <div className={`flex justify-between items-center p-4 ${glassEffect} ${borderEffect} z-30`}>
          <div className="flex items-center space-x-3">
            <MdPayments className="text-blue-400 text-2xl" />
            <h1 className="text-white font-medium text-lg">NovaPay</h1>
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
          className="flex-1 flex flex-col md:flex-row items-center justify-center p-4 relative overflow-hidden"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* NFC Payment Area (Left Side) */}
          <motion.div 
            animate={controls}
            className={`w-full md:w-1/2 h-64 md:h-full flex flex-col items-center justify-center p-6 ${borderEffect} rounded-2xl md:rounded-none md:border-r-0`}
          >
            <div className="relative w-48 h-32 flex items-center justify-center">
              {/* Credit Card */}
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ 
                  rotate: paymentStatus === 'processing' ? [0, -5, 5, 0] : 0,
                  transition: { 
                    duration: 0.5,
                    repeat: paymentStatus === 'processing' ? Infinity : 0
                  }
                }}
                className={`absolute z-10 w-48 h-32 rounded-xl ${paymentStatus === null ? 'bg-gradient-to-br from-blue-500 to-blue-600' : paymentStatus === 'success' ? 'bg-gradient-to-br from-green-500 to-green-600' : paymentStatus === 'failed' ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'} shadow-lg flex flex-col justify-between p-4`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-white text-xs font-medium">NovaPay</span>
                  <FaWifi className="text-white/80 text-lg" />
                </div>
                <div className="text-white text-lg font-medium mt-4">•••• •••• •••• 4242</div>
                <div className="flex justify-between items-end">
                  <span className="text-white/80 text-xs">Scott Das</span>
                  <span className="text-white/80 text-xs">EXP 12/25</span>
                </div>
              </motion.div>
              
              {/* NFC Waves */}
              <motion.div
                animate={nfcControls}
                className="absolute w-48 h-32 rounded-xl border-2 border-blue-400/70 pointer-events-none"
                initial={{ scale: 1, opacity: 0.7 }}
              />
              <motion.div
                animate={nfcControls}
                className="absolute w-48 h-32 rounded-xl border-2 border-blue-400/50 pointer-events-none"
                initial={{ scale: 1, opacity: 0.7 }}
                transition={{ delay: 0.3 }}
              />
            </div>
            
            {/* Payment Status */}
            {paymentStatus === null && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8 text-center"
              >
                <p className="text-white/80 mb-4">Tap your card or phone near the terminal</p>
                <motion.button
                  whileHover="hover"
                  whileTap="tap"
                  variants={buttonVariants}
                  onClick={processPayment}
                  className={`px-8 py-3 rounded-full bg-blue-600 text-white font-medium flex items-center`}
                >
                  <FaCreditCard className="mr-2" />
                  Start Transaction
                </motion.button>
              </motion.div>
            )}
            
            {paymentStatus === 'processing' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-8 text-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="text-white text-2xl mx-auto mb-2"
                >
                  <FaWifi />
                </motion.div>
                <p className="text-white/80">Processing payment...</p>
              </motion.div>
            )}
            
            {paymentStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-8 text-center"
              >
                <MdCheckCircle className="text-green-400 text-4xl mx-auto mb-2" />
                <h3 className="text-white font-medium text-xl mb-1">Payment Complete</h3>
                <p className="text-white/80 mb-4">$4.25 CAD - Tim Hortons</p>
                <div className="flex space-x-3 justify-center">
                  <motion.button
                    whileHover="hover"
                    whileTap="tap"
                    variants={buttonVariants}
                    onClick={resetPayment}
                    className={`px-4 py-2 rounded-full ${glassEffect} text-white text-sm`}
                  >
                    New Payment
                  </motion.button>
                  <motion.button
                    whileHover="hover"
                    whileTap="tap"
                    variants={buttonVariants}
                    onClick={() => setShowHistory(true)}
                    className={`px-4 py-2 rounded-full ${glassEffect} text-white text-sm flex items-center`}
                  >
                    <MdHistory className="mr-1" />
                    History
                  </motion.button>
                </div>
              </motion.div>
            )}
            
            {paymentStatus === 'failed' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-8 text-center"
              >
                <MdError className="text-red-400 text-4xl mx-auto mb-2" />
                <h3 className="text-white font-medium text-xl mb-1">Payment Failed</h3>
                <p className="text-white/80 mb-4">Please try again or use another card</p>
                <motion.button
                  whileHover="hover"
                  whileTap="tap"
                  variants={buttonVariants}
                  onClick={resetPayment}
                  className={`px-8 py-3 rounded-full bg-blue-600 text-white font-medium`}
                >
                  Try Again
                </motion.button>
              </motion.div>
            )}
          </motion.div>
          
          {/* Story/CTA Area (Right Side) */}
          <div className={`w-full md:w-1/2 h-full flex flex-col items-center justify-center p-6 ${borderEffect} rounded-2xl md:rounded-none md:border-l-0`}>
            <div className="max-w-md">
              <h2 className="text-white text-2xl font-medium mb-4">My Canadian Payment Journey</h2>
              <p className="text-white/80 mb-6">
                Moving to Canada introduced me to the seamless world of contactless payments. 
                Coming from traditional banking systems, the "Tap & Go" culture was revolutionary - 
                no more fumbling with cash or waiting for chip authorization.
              </p>
              <p className="text-white/80 mb-6">
                With my experience building financial systems at Meta and Apple, I wanted to create 
                something that captures both the technical elegance and human simplicity of modern 
                payments. NovaPay is that vision - secure, instant, and delightful.
              </p>
              
              <div className={`p-4 rounded-lg ${glassEffect} mb-6`}>
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-500/20 p-2 rounded-full">
                    <FaMoneyBillWave className="text-blue-400 text-lg" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">Why Contactless?</h3>
                    <p className="text-white/70 text-sm">
                      • 3x faster than chip payments<br />
                      • More secure than cash<br />
                      • Accepted at 95% of Canadian retailers
                    </p>
                  </div>
                </div>
              </div>
              
              <div className={`p-4 rounded-lg ${glassEffect}`}>
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-500/20 p-2 rounded-full">
                    <FaRegClock className="text-blue-400 text-lg" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">Did You Know?</h3>
                    <p className="text-white/70 text-sm">
                      Canada has one of the highest contactless adoption rates globally, 
                      with over 70% of in-person transactions using tap technology.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Transaction History Modal */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className={`w-full max-w-md max-h-[80vh] rounded-2xl overflow-hidden ${glassEffect} ${borderEffect}`}
              >
                <div className={`p-4 flex justify-between items-center ${borderEffect}`}>
                  <h3 className="text-white font-medium">Transaction History</h3>
                  <button 
                    onClick={() => setShowHistory(false)}
                    className="text-white p-1 rounded-full hover:bg-white/10"
                  >
                    <MdClose size={20} />
                  </button>
                </div>
                
                <div className="overflow-y-auto max-h-[60vh]">
                  {transactionHistory.map((txn) => (
                    <div key={txn.id} className={`p-4 flex justify-between items-center ${borderEffect} border-t`}>
                      <div>
                        <p className="text-white font-medium">{txn.merchant}</p>
                        <p className="text-white/50 text-sm">{txn.date} at {txn.time}</p>
                      </div>
                      <p className="text-white font-medium">{txn.currency} {txn.amount.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default Fintech;