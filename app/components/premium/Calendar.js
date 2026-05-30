// ./premium/Calendar.js
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaCalendarAlt, FaPlus, FaBell, FaTrash, FaEdit, FaChevronLeft, FaChevronRight,
} from "react-icons/fa";
import { FiX } from "react-icons/fi";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const Calendar = ({ onClose }) => {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", time: "" });
  const [alert, setAlert] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Reminder check
  useEffect(() => {
    events.forEach((ev) => {
      const evTime = new Date(`${ev.dateStr}T${ev.time}`);
      if (Math.abs(currentTime - evTime) < 1000) {
        setAlert(`🔔 ${ev.title} starts now!`);
        setTimeout(() => setAlert(""), 5000);
      }
    });
  }, [currentTime, events]);

  // Build calendar grid
  const firstDay = viewDate.getDay();
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () =>
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () =>
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const selectedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
  const dayEvents = events.filter((e) => e.dateStr === selectedDateStr);

  const addEvent = () => {
    if (!newEvent.title.trim() || !newEvent.time) return;
    setEvents((prev) => [...prev, { ...newEvent, dateStr: selectedDateStr, id: Date.now() }]);
    setNewEvent({ title: "", time: "" });
    setShowForm(false);
  };

  const deleteEvent = (id) => setEvents((prev) => prev.filter((e) => e.id !== id));

  const hasEvents = (d) => {
    const str = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return events.some((e) => e.dateStr === str);
  };

  return (
    <AnimatePresence>
      <motion.div
        key="calendar"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.96, y: 16 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.96, y: 16 }}
          transition={{ type: "spring", damping: 22, stiffness: 280 }}
          className="w-full max-w-3xl rounded-2xl overflow-hidden bg-gray-900 border border-white/8 shadow-2xl flex flex-col"
          style={{ maxHeight: "90vh" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-blue-700 to-blue-600 flex-shrink-0">
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="text-white/80" />
              <span className="text-white font-semibold">Calendar</span>
            </div>
            <div className="text-white/70 text-xs tabular-nums hidden sm:block">
              {currentTime.toLocaleTimeString()}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
            >
              <FiX size={16} />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
            {/* Left: Month grid */}
            <div className="sm:w-64 flex-shrink-0 p-4 border-b sm:border-b-0 sm:border-r border-white/8">
              {/* Month nav */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg hover:bg-white/8 text-gray-400 hover:text-white transition-colors"
                >
                  <FaChevronLeft size={12} />
                </button>
                <span className="text-white text-sm font-semibold">
                  {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
                </span>
                <button
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg hover:bg-white/8 text-gray-400 hover:text-white transition-colors"
                >
                  <FaChevronRight size={12} />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAYS.map((d) => (
                  <div key={d} className="text-center text-gray-500 text-[10px] font-semibold py-1">
                    {d[0]}
                  </div>
                ))}
              </div>

              {/* Cells */}
              <div className="grid grid-cols-7 gap-0.5">
                {cells.map((d, i) => {
                  if (!d) return <div key={`e-${i}`} />;
                  const thisDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
                  const isToday = isSameDay(thisDate, today);
                  const isSelected = isSameDay(thisDate, selectedDate);
                  const hasDot = hasEvents(d);

                  return (
                    <button
                      key={d}
                      onClick={() => setSelectedDate(thisDate)}
                      className={`
                        relative flex flex-col items-center justify-center h-8 rounded-lg text-xs font-medium transition-colors
                        ${isSelected ? "bg-blue-600 text-white" : isToday ? "bg-blue-600/20 text-blue-400" : "text-gray-300 hover:bg-white/8"}
                      `}
                    >
                      {d}
                      {hasDot && (
                        <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-blue-400"}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Day view */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Day header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/8 flex-shrink-0">
                <div>
                  <p className="text-white font-semibold text-sm">
                    {selectedDate.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
                  </p>
                  <p className="text-gray-500 text-xs">{dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""}</p>
                </div>
                <button
                  onClick={() => setShowForm((v) => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition-colors"
                >
                  <FaPlus size={10} /> Add
                </button>
              </div>

              {/* Alert */}
              <AnimatePresence>
                {alert && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mx-4 mt-3 px-4 py-2.5 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-300 text-sm flex items-center gap-2"
                  >
                    <FaBell className="flex-shrink-0" /> {alert}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Add form */}
              <AnimatePresence>
                {showForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-4 pt-3 overflow-hidden"
                  >
                    <div className="flex gap-2 flex-wrap">
                      <input
                        autoFocus
                        type="text"
                        placeholder="Event title"
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                        onKeyDown={(e) => e.key === "Enter" && addEvent()}
                        className="flex-1 min-w-[120px] px-3 py-2 rounded-lg bg-white/6 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        type="time"
                        value={newEvent.time}
                        onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                        className="px-3 py-2 rounded-lg bg-white/6 border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        onClick={addEvent}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setShowForm(false)}
                        className="px-4 py-2 bg-white/6 hover:bg-white/10 text-gray-300 text-sm rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Events list */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                <AnimatePresence>
                  {dayEvents.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center h-32 text-gray-600"
                    >
                      <FaCalendarAlt size={28} className="mb-2 opacity-30" />
                      <p className="text-sm">No events this day</p>
                    </motion.div>
                  ) : (
                    dayEvents.map((ev) => (
                      <motion.div
                        key={ev.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/8 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                          <div>
                            <p className="text-white text-sm font-medium">{ev.title}</p>
                            <p className="text-gray-400 text-xs">{ev.time}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteEvent(ev.id)}
                          className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <FaTrash size={12} />
                        </button>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Calendar;