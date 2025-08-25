// ./premium/Calender.js
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaCalendarAlt,
  FaPlus,
  FaBell,
  FaTrash,
  FaEdit,
} from "react-icons/fa";
import { FiX, FiSun, FiMoon } from "react-icons/fi";

const Calender = ({ onClose }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [view, setView] = useState("month");
  const [newEvent, setNewEvent] = useState({ title: "", date: "", time: "" });
  const [alert, setAlert] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    events.forEach((event) => {
      const eventTime = new Date(`${event.date}T${event.time}`);
      if (
        Math.abs(currentTime - eventTime) < 1000 &&
        eventTime > currentTime
      ) {
        setAlert(`Reminder: ${event.title} at ${event.time}`);
        setTimeout(() => setAlert(""), 5000);
      }
    });
  }, [currentTime, events]);

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.date || !newEvent.time) return;
    setEvents([newEvent, ...events]);
    setNewEvent({ title: "", date: "", time: "" });
  };

  const handleDeleteEvent = (index) => {
    setEvents(events.filter((_, i) => i !== index));
  };

  const handleEditEvent = (index) => {
    const event = events[index];
    setNewEvent(event);
    handleDeleteEvent(index);
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 backdrop-blur-md bg-white/10 dark:bg-black/20 border-b border-white/20 dark:border-gray-800/30">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 rounded-full bg-white/15 dark:bg-black/15"
          >
            <FiX className="text-white text-lg" />
          </motion.button>
          <div className="flex items-center gap-3">
            <FaCalendarAlt className="text-blue-400 text-3xl" />
            <div className="text-white">
              <h2 className="font-bold text-xl sm:text-2xl">
                Neural Calendar
              </h2>
              <p className="text-sm opacity-70">
                {currentTime.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                | {currentTime.toLocaleTimeString()}
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full bg-white/15 dark:bg-black/15"
          >
            {darkMode ? (
              <FiSun className="text-yellow-300 text-lg" />
            ) : (
              <FiMoon className="text-white text-lg" />
            )}
          </motion.button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 flex flex-col overflow-y-auto p-4 gap-4">
          {/* Event Input */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="text"
              placeholder="Event title"
              value={newEvent.title}
              onChange={(e) =>
                setNewEvent({ ...newEvent, title: e.target.value })
              }
              className="px-3 py-2 rounded-lg border border-white/20 dark:border-gray-700 bg-white/10 dark:bg-black/20 text-white placeholder-white/50 w-full sm:w-1/3"
            />
            <input
              type="date"
              value={newEvent.date}
              onChange={(e) =>
                setNewEvent({ ...newEvent, date: e.target.value })
              }
              className="px-3 py-2 rounded-lg border border-white/20 dark:border-gray-700 bg-white/10 dark:bg-black/20 text-white"
            />
            <input
              type="time"
              value={newEvent.time}
              onChange={(e) =>
                setNewEvent({ ...newEvent, time: e.target.value })
              }
              className="px-3 py-2 rounded-lg border border-white/20 dark:border-gray-700 bg-white/10 dark:bg-black/20 text-white"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddEvent}
              className="flex items-center px-4 py-2 bg-blue-500/90 text-white rounded-lg shadow-lg"
            >
              <FaPlus className="mr-2" /> Add
            </motion.button>
          </div>

          {/* Alerts */}
          {alert && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="p-3 bg-yellow-200 dark:bg-yellow-700 text-black dark:text-white rounded-lg shadow-lg flex items-center gap-2"
            >
              <FaBell /> {alert}
            </motion.div>
          )}

          {/* Event Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {events.map((event, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.03 }}
                className="p-4 bg-white/10 dark:bg-black/20 rounded-2xl shadow-lg backdrop-blur-md relative"
              >
                <h3 className="text-white font-semibold">{event.title}</h3>
                <p className="text-white/70 text-sm">
                  {event.date} | {event.time}
                </p>
                <div className="absolute top-2 right-2 flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.2 }}
                    onClick={() => handleEditEvent(index)}
                    className="text-yellow-300"
                  >
                    <FaEdit />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.2 }}
                    onClick={() => handleDeleteEvent(index)}
                    className="text-red-500"
                  >
                    <FaTrash />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Calender;
