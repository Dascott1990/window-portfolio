// ./premium/SmartCalendar.js
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaCalendarAlt, FaPlus, FaBell } from "react-icons/fa";

const SmartCalendar = ({ onClose }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [view, setView] = useState("month"); // month | week | day
  const [newEvent, setNewEvent] = useState({ title: "", date: "", time: "" });
  const [alert, setAlert] = useState("");

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Check alerts
  useEffect(() => {
    events.forEach(event => {
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
    setEvents([...events, newEvent]);
    setNewEvent({ title: "", date: "", time: "" });
  };

  const handleDeleteEvent = (index) => {
    const updated = [...events];
    updated.splice(index, 1);
    setEvents(updated);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Calendar Panel */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl p-6 max-w-4xl w-full shadow-2xl overflow-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <div className="flex items-center mb-4 sm:mb-0">
            <FaCalendarAlt className="text-blue-500 text-4xl mr-3" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Smart Calendar
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
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

          {/* View Buttons */}
          <div className="flex space-x-2">
            {["month", "week", "day"].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  view === v
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white"
                }`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Event Input */}
        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-6">
          <input
            type="text"
            placeholder="Event title"
            value={newEvent.title}
            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 w-full sm:w-1/3"
          />
          <input
            type="date"
            value={newEvent.date}
            onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600"
          />
          <input
            type="time"
            value={newEvent.time}
            onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600"
          />
          <button
            onClick={handleAddEvent}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:shadow-lg transition"
          >
            <FaPlus className="mr-2" /> Add
          </button>
        </div>

        {/* Alerts */}
        {alert && (
          <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-700 text-gray-800 dark:text-white rounded-lg shadow">
            <FaBell className="inline mr-2" /> {alert}
          </div>
        )}

        {/* Event List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {events.map((event, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.02 }}
              className="p-4 bg-white dark:bg-gray-700 rounded-xl shadow hover:shadow-lg transition relative"
            >
              <h3 className="font-semibold text-gray-800 dark:text-white">
                {event.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {event.date} | {event.time}
              </p>
              <button
                onClick={() => handleDeleteEvent(index)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
              >
                X
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default SmartCalendar;
