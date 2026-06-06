"use client";
// ./premium/Contact.js  — backend-connected
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch, FiUser, FiPhone, FiMail, FiEdit2,
  FiChevronLeft, FiX, FiPlus, FiLoader,
} from "react-icons/fi";
import { FaStar } from "react-icons/fa";
import { contactsAPI } from "../../lib/api";

// ── Small helpers ────────────────────────────────────────────────────────────
const Avatar = ({ name, size = "md" }) => {
  const s = size === "lg" ? "w-24 h-24 text-3xl" : "w-10 h-10 text-base";
  const letter = (name || "?")[0].toUpperCase();
  const colors = ["bg-blue-500","bg-purple-500","bg-emerald-500","bg-rose-500","bg-amber-500"];
  const color  = colors[letter.charCodeAt(0) % colors.length];
  return (
    <div className={`${s} ${color} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {letter}
    </div>
  );
};

const Contact = ({ onClose }) => {
  const [contacts,         setContacts]         = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);
  const [searchQuery,      setSearchQuery]      = useState("");
  const [selectedContact,  setSelectedContact]  = useState(null);
  const [isMobile,         setIsMobile]         = useState(false);
  const [showAdd,          setShowAdd]          = useState(false);
  const [newContact,       setNewContact]       = useState({ name: "", phone: "", email: "", notes: "" });
  const [saving,           setSaving]           = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Fetch from backend ─────────────────────────────────────────────────────
  const fetchContacts = useCallback(async (q = "") => {
    try {
      setLoading(true);
      setError(null);
      const data = await contactsAPI.list(q);
      setContacts(Array.isArray(data) ? data : data?.items ?? []);
    } catch (err) {
      console.error("Contacts fetch failed:", err);
      setError("Could not load contacts. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  // ── Debounced search ───────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => fetchContacts(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery, fetchContacts]);

  // ── Toggle favourite ───────────────────────────────────────────────────────
  const toggleFavorite = async (id) => {
    const contact = contacts.find((c) => c.id === id);
    if (!contact) return;
    const updated = { ...contact, is_favorite: !contact.is_favorite };
    setContacts((prev) => prev.map((c) => (c.id === id ? updated : c)));
    if (selectedContact?.id === id) setSelectedContact(updated);
    try {
      await contactsAPI.update(id, { is_favorite: updated.is_favorite });
    } catch (err) {
      // revert on failure
      setContacts((prev) => prev.map((c) => (c.id === id ? contact : c)));
    }
  };

  // ── Create contact ─────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!newContact.name.trim()) return;
    setSaving(true);
    try {
      const created = await contactsAPI.create(newContact);
      setContacts((prev) => [created, ...prev]);
      setNewContact({ name: "", phone: "", email: "", notes: "" });
      setShowAdd(false);
    } catch (err) {
      alert("Failed to save contact: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await contactsAPI.remove(id);
      setContacts((prev) => prev.filter((c) => c.id !== id));
      if (selectedContact?.id === id) setSelectedContact(null);
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  // ── Group alphabetically ───────────────────────────────────────────────────
  const favorites = contacts.filter((c) => c.is_favorite);
  const grouped   = contacts.reduce((acc, c) => {
    const l = (c.name || "?")[0].toUpperCase();
    acc[l]  = acc[l] ? [...acc[l], c] : [c];
    return acc;
  }, {});
  const sortedKeys = Object.keys(grouped).sort();

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-white dark:bg-gray-900 overflow-hidden"
      style={{ bottom: "var(--taskbar-height, 52px)" }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          {selectedContact && isMobile ? (
            <button onClick={() => setSelectedContact(null)} className="p-2 mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
              <FiChevronLeft size={20} className="text-gray-600 dark:text-gray-300" />
            </button>
          ) : (
            <button onClick={onClose} className="p-2 mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
              <FiX size={20} className="text-gray-600 dark:text-gray-300" />
            </button>
          )}
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Contacts</h1>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600"
        >
          <FiPlus size={20} />
        </button>
      </div>

      {/* Add contact form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 flex flex-wrap gap-2"
          >
            {["name", "phone", "email", "notes"].map((field) => (
              <input
                key={field}
                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                value={newContact[field]}
                onChange={(e) => setNewContact({ ...newContact, [field]: e.target.value })}
                className="flex-1 min-w-[120px] px-3 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ))}
            <button
              onClick={handleCreate}
              disabled={saving || !newContact.name.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex h-[calc(100%-56px)]">
        {/* List panel */}
        <motion.div
          className={`bg-gray-50 dark:bg-gray-800 overflow-y-auto ${selectedContact && !isMobile ? "w-1/2" : "w-full"}`}
          animate={{ x: selectedContact && isMobile ? "-100%" : 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Search */}
          <div className="p-4 sticky top-0 bg-gray-50 dark:bg-gray-800 z-10">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search contacts…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <FiLoader className="animate-spin mr-2" /> Loading…
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-400 text-sm">{error}</div>
          ) : (
            <>
              {/* Favourites */}
              {favorites.length > 0 && (
                <div className="px-4 py-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Favourites</p>
                  {favorites.map((c) => <ContactRow key={c.id} contact={c} onSelect={setSelectedContact} onToggleFav={toggleFavorite} />)}
                </div>
              )}

              {/* Alphabetical */}
              <div className="px-4 pb-4">
                {sortedKeys.map((letter) => (
                  <div key={letter} className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{letter}</p>
                    {grouped[letter].sort((a, b) => a.name.localeCompare(b.name)).map((c) => (
                      <ContactRow key={c.id} contact={c} onSelect={setSelectedContact} onToggleFav={toggleFavorite} />
                    ))}
                  </div>
                ))}
                {contacts.length === 0 && (
                  <p className="text-center text-gray-400 py-8 text-sm">No contacts found.</p>
                )}
              </div>
            </>
          )}
        </motion.div>

        {/* Detail panel */}
        <AnimatePresence>
          {selectedContact && (
            <motion.div
              className={`bg-white dark:bg-gray-900 overflow-y-auto ${isMobile ? "absolute inset-0" : "w-1/2 border-l border-gray-200 dark:border-gray-700"}`}
              initial={{ x: isMobile ? "100%" : 0, opacity: isMobile ? 0 : 1 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: isMobile ? "100%" : 0, opacity: isMobile ? 0 : 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="p-6">
                <div className="flex flex-col items-center mb-6">
                  <Avatar name={selectedContact.name} size="lg" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-4 mb-1">{selectedContact.name}</h2>
                  <button onClick={() => toggleFavorite(selectedContact.id)} className={`p-2 ${selectedContact.is_favorite ? "text-yellow-500" : "text-gray-400"}`}>
                    <FaStar size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Contact Info</p>
                    <div className="space-y-4">
                      {selectedContact.phone && (
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800"><FiPhone className="text-gray-600 dark:text-gray-300" /></div>
                          <div>
                            <p className="text-xs text-gray-500">Phone</p>
                            <p className="text-gray-900 dark:text-white">{selectedContact.phone}</p>
                          </div>
                        </div>
                      )}
                      {selectedContact.email && (
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800"><FiMail className="text-gray-600 dark:text-gray-300" /></div>
                          <div>
                            <p className="text-xs text-gray-500">Email</p>
                            <p className="text-gray-900 dark:text-white">{selectedContact.email}</p>
                          </div>
                        </div>
                      )}
                      {selectedContact.notes && (
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800"><FiEdit2 className="text-gray-600 dark:text-gray-300" /></div>
                          <div>
                            <p className="text-xs text-gray-500">Notes</p>
                            <p className="text-gray-900 dark:text-white">{selectedContact.notes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button className="flex-1 py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition">Message</button>
                    <button className="flex-1 py-2 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-900 dark:text-white rounded-lg text-sm transition">Call</button>
                    <button onClick={() => handleDelete(selectedContact.id)} className="py-2 px-4 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg text-sm transition">Delete</button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const ContactRow = ({ contact, onSelect, onToggleFav }) => (
  <motion.div
    whileHover={{ scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
    className="flex items-center p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
    onClick={() => onSelect(contact)}
  >
    <Avatar name={contact.name} />
    <div className="ml-3 flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{contact.name}</p>
      <p className="text-xs text-gray-500 truncate">{contact.phone || contact.email || ""}</p>
    </div>
    <button
      onClick={(e) => { e.stopPropagation(); onToggleFav(contact.id); }}
      className={`p-1 flex-shrink-0 ${contact.is_favorite ? "text-yellow-500" : "text-gray-400 dark:text-gray-500"}`}
    >
      <FaStar size={16} />
    </button>
  </motion.div>
);

export default Contact;