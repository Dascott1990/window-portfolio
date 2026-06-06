"use client";
// ./premium/Fintech.js  — backend-connected
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { MdPayments, MdClose, MdHistory, MdCheckCircle, MdError } from "react-icons/md";
import { FaCreditCard, FaWifi, FaRegClock, FaMoneyBillWave } from "react-icons/fa";
import { transactionsAPI } from "../../lib/api";

const Fintech = ({ onClose }) => {
  const [paymentStatus,  setPaymentStatus]  = useState(null);
  const [showHistory,    setShowHistory]    = useState(false);
  const [history,        setHistory]        = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const controls    = useAnimation();
  const nfcControls = useAnimation();

  const glassEffect  = "backdrop-blur-xl bg-white/15 dark:bg-black/15";
  const borderEffect = "border border-white/20 dark:border-gray-800/30";

  const buttonVariants = {
    hover: { scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" },
    tap:   { scale: 0.95 },
  };

  // ── Load transaction history from backend ──────────────────────────────────
  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await transactionsAPI.list();
      setHistory(Array.isArray(data) ? data : data?.items ?? []);
    } catch (err) {
      console.error("Failed to load transactions:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // ── Process payment and persist ────────────────────────────────────────────
  const processPayment = async () => {
    setPaymentStatus("processing");
    await controls.start({ backgroundColor: "rgba(20,132,188,0.2)", transition: { duration: 0.3 } });

    const isSuccess = Math.random() > 0.2;
    setTimeout(async () => {
      if (isSuccess) {
        setPaymentStatus("success");
        controls.start({ backgroundColor: "rgba(40,167,69,0.2)", transition: { duration: 0.3 } });
        // Save to backend
        try {
          await transactionsAPI.create({
            merchant: "Tim Hortons",
            amount:   4.25,
            currency: "CAD",
            status:   "success",
            method:   "nfc",
          });
        } catch (err) {
          console.error("Transaction save failed:", err);
        }
      } else {
        setPaymentStatus("failed");
        controls.start({ backgroundColor: "rgba(220,53,69,0.2)", transition: { duration: 0.3 } });
      }
    }, 2000);
  };

  const resetPayment = () => {
    setPaymentStatus(null);
    controls.start({ backgroundColor: "rgba(0,0,0,0)", transition: { duration: 0.3 } });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black flex flex-col"
        style={{ bottom: "var(--taskbar-height, 52px)" }}
      >
        {/* Header */}
        <div className={`flex justify-between items-center p-4 ${glassEffect} ${borderEffect} z-30`}>
          <div className="flex items-center space-x-3">
            <MdPayments className="text-blue-400 text-2xl" />
            <h1 className="text-white font-medium text-lg">NovaPay</h1>
          </div>
          <motion.button whileHover="hover" whileTap="tap" variants={buttonVariants} onClick={onClose}
            className={`p-2 rounded-full ${glassEffect}`}>
            <MdClose className="text-white text-xl" />
          </motion.button>
        </div>

        {/* Main */}
        <div className="flex-1 flex flex-col md:flex-row items-center justify-center p-4 relative overflow-hidden">
          {/* NFC area */}
          <motion.div
            animate={controls}
            className={`w-full md:w-1/2 h-64 md:h-full flex flex-col items-center justify-center p-6 ${borderEffect} rounded-2xl md:rounded-none md:border-r-0`}
          >
            <div className="relative w-48 h-32 flex items-center justify-center">
              <motion.div
                animate={{ rotate: paymentStatus === "processing" ? [0, -5, 5, 0] : 0,
                  transition: { duration: 0.5, repeat: paymentStatus === "processing" ? Infinity : 0 } }}
                className={`absolute z-10 w-48 h-32 rounded-xl shadow-lg flex flex-col justify-between p-4
                  ${paymentStatus === "success" ? "bg-gradient-to-br from-green-500 to-green-600"
                  : paymentStatus === "failed"  ? "bg-gradient-to-br from-red-500 to-red-600"
                  : "bg-gradient-to-br from-blue-500 to-blue-600"}`}
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
            </div>

            {paymentStatus === null && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8 text-center">
                <p className="text-white/80 mb-4">Tap your card or phone near the terminal</p>
                <motion.button whileHover="hover" whileTap="tap" variants={buttonVariants} onClick={processPayment}
                  className="px-8 py-3 rounded-full bg-blue-600 text-white font-medium flex items-center">
                  <FaCreditCard className="mr-2" /> Start Transaction
                </motion.button>
              </motion.div>
            )}

            {paymentStatus === "processing" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 text-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="text-white text-2xl mx-auto mb-2">
                  <FaWifi />
                </motion.div>
                <p className="text-white/80">Processing payment…</p>
              </motion.div>
            )}

            {paymentStatus === "success" && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-8 text-center">
                <MdCheckCircle className="text-green-400 text-4xl mx-auto mb-2" />
                <h3 className="text-white font-medium text-xl mb-1">Payment Complete</h3>
                <p className="text-white/80 mb-4">$4.25 CAD — Tim Hortons</p>
                <div className="flex space-x-3 justify-center">
                  <motion.button whileHover="hover" whileTap="tap" variants={buttonVariants} onClick={resetPayment}
                    className={`px-4 py-2 rounded-full ${glassEffect} text-white text-sm`}>New Payment</motion.button>
                  <motion.button whileHover="hover" whileTap="tap" variants={buttonVariants}
                    onClick={() => { setShowHistory(true); loadHistory(); }}
                    className={`px-4 py-2 rounded-full ${glassEffect} text-white text-sm flex items-center`}>
                    <MdHistory className="mr-1" /> History
                  </motion.button>
                </div>
              </motion.div>
            )}

            {paymentStatus === "failed" && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-8 text-center">
                <MdError className="text-red-400 text-4xl mx-auto mb-2" />
                <h3 className="text-white font-medium text-xl mb-1">Payment Failed</h3>
                <p className="text-white/80 mb-4">Please try again or use another card</p>
                <motion.button whileHover="hover" whileTap="tap" variants={buttonVariants} onClick={resetPayment}
                  className="px-8 py-3 rounded-full bg-blue-600 text-white font-medium">Try Again</motion.button>
              </motion.div>
            )}
          </motion.div>

          {/* Story area */}
          <div className={`w-full md:w-1/2 h-full flex flex-col items-center justify-center p-6 ${borderEffect} rounded-2xl md:rounded-none md:border-l-0`}>
            <div className="max-w-md">
              <h2 className="text-white text-2xl font-medium mb-4">My Canadian Payment Journey</h2>
              <p className="text-white/80 mb-6">
                Moving to Canada introduced me to the seamless world of contactless payments.
                The "Tap &amp; Go" culture was revolutionary — no more fumbling with cash.
              </p>
              <div className={`p-4 rounded-lg ${glassEffect} mb-6`}>
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-500/20 p-2 rounded-full"><FaMoneyBillWave className="text-blue-400 text-lg" /></div>
                  <div>
                    <h3 className="text-white font-medium mb-1">Why Contactless?</h3>
                    <p className="text-white/70 text-sm">• 3× faster than chip • More secure than cash • Accepted at 95% of Canadian retailers</p>
                  </div>
                </div>
              </div>
              <div className={`p-4 rounded-lg ${glassEffect}`}>
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-500/20 p-2 rounded-full"><FaRegClock className="text-blue-400 text-lg" /></div>
                  <div>
                    <h3 className="text-white font-medium mb-1">Did You Know?</h3>
                    <p className="text-white/70 text-sm">Over 70% of Canadian in-person transactions use tap technology.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* History modal */}
        <AnimatePresence>
          {showHistory && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                className={`w-full max-w-md max-h-[80vh] rounded-2xl overflow-hidden ${glassEffect} ${borderEffect}`}>
                <div className={`p-4 flex justify-between items-center ${borderEffect}`}>
                  <h3 className="text-white font-medium">Transaction History</h3>
                  <button onClick={() => setShowHistory(false)} className="text-white p-1 rounded-full hover:bg-white/10">
                    <MdClose size={20} />
                  </button>
                </div>
                <div className="overflow-y-auto max-h-[60vh]">
                  {loadingHistory ? (
                    <p className="text-white/50 text-center py-8">Loading…</p>
                  ) : history.length === 0 ? (
                    <p className="text-white/50 text-center py-8">No transactions yet.</p>
                  ) : (
                    history.map((txn) => (
                      <div key={txn.id} className={`p-4 flex justify-between items-center ${borderEffect} border-t`}>
                        <div>
                          <p className="text-white font-medium">{txn.merchant}</p>
                          <p className="text-white/50 text-sm">{txn.created_at?.slice(0, 10)} · {txn.method || "nfc"}</p>
                        </div>
                        <p className={`font-medium ${txn.status === "success" ? "text-green-400" : "text-red-400"}`}>
                          {txn.currency} {Number(txn.amount).toFixed(2)}
                        </p>
                      </div>
                    ))
                  )}
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