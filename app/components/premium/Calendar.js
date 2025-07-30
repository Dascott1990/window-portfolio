import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCalendarAlt } from 'react-icons/fa';

const Calendar = ({ onClose }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dateString, setDateString] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      setDateString(now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 flex items-center justify-center z-50"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white/90 dark:bg-gray-800/90 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex flex-col items-center">
          <FaCalendarAlt className="text-blue-500 text-5xl mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Calendar</h2>
          <p className="text-4xl font-bold text-gray-700 dark:text-gray-200 mb-2">
            {currentTime.toLocaleTimeString()}
          </p>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            {dateString}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default Calendar;