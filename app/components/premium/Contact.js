// ./premium/Contact.js
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiSearch, 
  FiUser, 
  FiPhone, 
  FiMail, 
  FiEdit2,
  FiChevronLeft,
  FiX,
  FiPlus
} from "react-icons/fi";
import { FaStar } from "react-icons/fa";

const Contact = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Mock contact data
    const mockContacts = [
      { id: 1, name: "John Doe", phone: "(555) 123-4567", email: "john.doe@example.com", notes: "Work colleague", isFavorite: true },
      { id: 2, name: "Jane Smith", phone: "(555) 987-6543", email: "jane.smith@example.com", notes: "Friend from college", isFavorite: false },
      { id: 3, name: "Alex Johnson", phone: "(555) 456-7890", email: "alex.j@example.com", notes: "Project manager", isFavorite: true },
      { id: 4, name: "Sarah Williams", phone: "(555) 789-0123", email: "sarah.w@example.com", notes: "", isFavorite: false },
      { id: 5, name: "Michael Brown", phone: "(555) 234-5678", email: "michael.b@example.com", notes: "Client", isFavorite: false },
      { id: 6, name: "Emily Davis", phone: "(555) 345-6789", email: "emily.d@example.com", notes: "Design team lead", isFavorite: true },
      { id: 7, name: "Robert Wilson", phone: "(555) 678-9012", email: "robert.w@example.com", notes: "", isFavorite: false },
      { id: 8, name: "Jessica Taylor", phone: "(555) 012-3456", email: "jessica.t@example.com", notes: "Marketing department", isFavorite: false },
    ];
    setContacts(mockContacts);
  }, []);

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedContacts = filteredContacts.reduce((acc, contact) => {
    const firstLetter = contact.name.charAt(0).toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(contact);
    return acc;
  }, {});

  const sortedGroups = Object.keys(groupedContacts).sort();

  const toggleFavorite = (id) => {
    setContacts(contacts.map(contact => 
      contact.id === id ? { ...contact, isFavorite: !contact.isFavorite } : contact
    ));
  };

  return (
    <motion.div 
      className="fixed inset-0 z-50 bg-white dark:bg-gray-900 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          {selectedContact && isMobile ? (
            <button 
              onClick={() => setSelectedContact(null)}
              className="p-2 mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <FiChevronLeft className="text-gray-600 dark:text-gray-300" size={20} />
            </button>
          ) : (
            <button 
              onClick={onClose}
              className="p-2 mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <FiX className="text-gray-600 dark:text-gray-300" size={20} />
            </button>
          )}
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Contacts</h1>
        </div>
        <button className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600">
          <FiPlus size={20} />
        </button>
      </div>

      <div className="flex h-[calc(100%-56px)]">
        {/* Contact List */}
        <motion.div 
          className={`bg-gray-50 dark:bg-gray-800 overflow-y-auto ${selectedContact && !isMobile ? 'w-1/2' : 'w-full'}`}
          initial={{ x: 0 }}
          animate={{ x: selectedContact && isMobile ? '-100%' : 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Search Bar */}
          <div className="p-4 sticky top-0 bg-gray-50 dark:bg-gray-800 z-10">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search contacts..."
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 dark:text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Favorites Section */}
          <div className="px-4 py-2">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Favorites
            </h2>
            <div className="space-y-1">
              {contacts
                .filter(contact => contact.isFavorite)
                .map(contact => (
                  <motion.div
                    key={contact.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="flex items-center p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setSelectedContact(contact)}
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
                      <FiUser size={18} />
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{contact.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{contact.phone}</p>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(contact.id);
                      }}
                      className="p-1 text-yellow-500"
                    >
                      <FaStar size={16} />
                    </button>
                  </motion.div>
                ))}
            </div>
          </div>

          {/* Alphabetical List */}
          <div className="px-4">
            {sortedGroups.map(letter => (
              <div key={letter} className="mb-4">
                <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  {letter}
                </h2>
                <div className="space-y-1">
                  {groupedContacts[letter]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(contact => (
                      <motion.div
                        key={contact.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="flex items-center p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setSelectedContact(contact)}
                      >
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
                          <FiUser size={18} />
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{contact.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{contact.phone}</p>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(contact.id);
                          }}
                          className={`p-1 ${contact.isFavorite ? 'text-yellow-500' : 'text-gray-400 dark:text-gray-500'}`}
                        >
                          <FaStar size={16} />
                        </button>
                      </motion.div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Contact Detail Pane */}
        <AnimatePresence>
          {(selectedContact && !isMobile) || (selectedContact && isMobile) ? (
            <motion.div 
              className={`bg-white dark:bg-gray-900 overflow-y-auto ${isMobile ? 'absolute inset-0' : 'w-1/2'}`}
              initial={{ x: isMobile ? '100%' : 0 }}
              animate={{ x: 0 }}
              exit={{ x: isMobile ? '100%' : 0 }}
              transition={{ duration: 0.3 }}
            >
              {selectedContact && (
                <div className="p-6">
                  <div className="flex flex-col items-center mb-6">
                    <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-white mb-4">
                      <FiUser size={36} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {selectedContact.name}
                    </h2>
                    <button 
                      onClick={() => toggleFavorite(selectedContact.id)}
                      className={`p-2 ${selectedContact.isFavorite ? 'text-yellow-500' : 'text-gray-400 dark:text-gray-500'}`}
                    >
                      <FaStar size={20} />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                        Contact Information
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 mr-3">
                            <FiPhone className="text-gray-600 dark:text-gray-300" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                            <p className="text-gray-900 dark:text-white">{selectedContact.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 mr-3">
                            <FiMail className="text-gray-600 dark:text-gray-300" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                            <p className="text-gray-900 dark:text-white">{selectedContact.email}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {selectedContact.notes && (
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                          Notes
                        </h3>
                        <div className="flex items-start">
                          <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 mr-3">
                            <FiEdit2 className="text-gray-600 dark:text-gray-300" />
                          </div>
                          <p className="text-gray-900 dark:text-white flex-1">
                            {selectedContact.notes}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-3 pt-4">
                      <button className="flex-1 py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition">
                        Message
                      </button>
                      <button className="flex-1 py-2 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg transition">
                        Call
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Contact;