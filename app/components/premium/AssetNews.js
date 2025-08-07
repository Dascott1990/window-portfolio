// ./premium/AssetNews.js
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiX, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { FaBitcoin, FaEthereum } from 'react-icons/fa';
import { SiTesla, SiApple } from 'react-icons/si';
import { GiOilDrum } from 'react-icons/gi';
import { IoMdFlash } from 'react-icons/io';

// Helper functions
const formatTimeAgo = (date) => {
  if (!date) return 'Just now';
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hour${Math.floor(seconds / 3600) === 1 ? '' : 's'} ago`;
  return `${Math.floor(seconds / 86400)} day${Math.floor(seconds / 86400) === 1 ? '' : 's'} ago`;
};

const getAssetTypeColor = (type) => {
  switch(type) {
    case 'crypto': return 'bg-orange-500/10 dark:bg-orange-500/15';
    case 'stock': return 'bg-green-500/10 dark:bg-green-500/15';
    case 'commodity': return 'bg-yellow-500/10 dark:bg-yellow-500/15';
    case 'forex': return 'bg-blue-500/10 dark:bg-blue-500/15';
    default: return 'bg-gray-500/10 dark:bg-gray-500/15';
  }
};

const AssetCard = ({ asset, borderEffect, shadowEffect }) => {
  const getChangeColor = (change) => 
    change >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400';

  const getTypeBadgeColor = (type) => {
    switch(type) {
      case 'crypto': return 'bg-orange-500/20 text-orange-600 dark:text-orange-400';
      case 'stock': return 'bg-green-500/20 text-green-600 dark:text-green-400';
      case 'commodity': return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400';
      case 'forex': return 'bg-blue-500/20 text-blue-600 dark:text-blue-400';
      default: return 'bg-gray-500/20 text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`rounded-xl p-4 ${getAssetTypeColor(asset.type)} ${borderEffect || 'border border-gray-200 dark:border-gray-700'} ${shadowEffect || 'shadow-sm'} cursor-pointer h-full flex flex-col`}
      aria-label={`${asset.name} price information`}
    >
      <div className="flex items-center justify-between mb-2 flex-1 min-w-0">
        <div className="flex items-center min-w-0">
          <div className="w-10 h-10 rounded-lg bg-white/30 dark:bg-black/20 flex items-center justify-center mr-3 flex-shrink-0">
            {asset.icon}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-800 dark:text-white truncate">{asset.symbol}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 truncate">{asset.name}</p>
          </div>
        </div>
        <div className="text-right ml-2 min-w-[90px]">
          <p className="font-semibold text-gray-800 dark:text-white truncate">
            ${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className={`flex items-center justify-end text-xs ${getChangeColor(asset.change)}`}>
            {asset.change >= 0 ? <FiArrowUp className="mr-1" /> : <FiArrowDown className="mr-1" />}
            {Math.abs(asset.change)}%
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center text-xs">
        <span className={`px-2 py-1 rounded-full ${getTypeBadgeColor(asset.type)} font-medium`}>
          {asset.type.toUpperCase()}
        </span>
        <span className="text-gray-500 dark:text-gray-400 truncate ml-2">
          {formatTimeAgo(asset.updatedAt)}
        </span>
      </div>
    </motion.div>
  );
};

const AssetNews = ({ onClose, glassEffect = 'backdrop-blur-sm bg-white/80 dark:bg-gray-900/80', borderEffect = 'border border-gray-200 dark:border-gray-700', shadowEffect = 'shadow-lg' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const fetchAssets = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const mockAssets = [
          { 
            id: 1, 
            symbol: 'BTC', 
            name: 'Bitcoin', 
            price: 63452.78, 
            change: 2.34, 
            icon: <FaBitcoin className="text-orange-500" size={20} />,
            type: 'crypto',
            updatedAt: new Date()
          },
          { 
            id: 2, 
            symbol: 'ETH', 
            name: 'Ethereum', 
            price: 3421.67, 
            change: -1.23, 
            icon: <FaEthereum className="text-purple-500" size={20} />,
            type: 'crypto',
            updatedAt: new Date()
          },
          { 
            id: 3, 
            symbol: 'TSLA', 
            name: 'Tesla Inc', 
            price: 876.54, 
            change: 0.87, 
            icon: <SiTesla className="text-red-500" size={20} />,
            type: 'stock',
            updatedAt: new Date()
          },
          { 
            id: 4, 
            symbol: 'AAPL', 
            name: 'Apple Inc', 
            price: 189.23, 
            change: -0.45, 
            icon: <SiApple className="text-gray-600 dark:text-gray-300" size={20} />,
            type: 'stock',
            updatedAt: new Date()
          },
          { 
            id: 5, 
            symbol: 'GOLD', 
            name: 'Gold', 
            price: 1987.32, 
            change: 1.56, 
            icon: <IoMdFlash className="text-yellow-500" size={20} />,
            type: 'commodity',
            updatedAt: new Date()
          },
          { 
            id: 6, 
            symbol: 'OIL', 
            name: 'Crude Oil', 
            price: 84.76, 
            change: -2.34, 
            icon: <GiOilDrum className="text-black dark:text-gray-300" size={20} />,
            type: 'commodity',
            updatedAt: new Date()
          },
          { 
            id: 7, 
            symbol: 'EUR/USD', 
            name: 'Euro/Dollar', 
            price: 1.0876, 
            change: 0.12, 
            icon: <span className="text-blue-500 font-bold">€/$</span>,
            type: 'forex',
            updatedAt: new Date()
          },
          { 
            id: 8, 
            symbol: 'GBP/USD', 
            name: 'Pound/Dollar', 
            price: 1.2743, 
            change: -0.34, 
            icon: <span className="text-red-500 font-bold">£/$</span>,
            type: 'forex',
            updatedAt: new Date()
          }
        ];
        
        setAssets(mockAssets);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Error fetching assets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
    const interval = setInterval(fetchAssets, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const filteredAssets = assets.filter(asset => 
    asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    asset.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={`fixed inset-0 z-50 overflow-y-auto p-4 ${glassEffect} ${borderEffect} ${shadowEffect}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="asset-news-title"
      >
        <div className="min-h-full flex flex-col max-w-7xl mx-auto">
          {/* Window Header */}
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h2 id="asset-news-title" className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-white truncate">
              Asset News & Rates
            </h2>
            <button
              onClick={onClose}
              className={`p-1 md:p-2 rounded-full ${glassEffect} hover:bg-white/20 dark:hover:bg-black/20 focus:outline-none focus:ring-2 focus:ring-gray-400`}
              aria-label="Close asset news"
            >
              <FiX className="text-gray-800 dark:text-white" size={20} />
            </button>
          </div>

          {/* Search Bar */}
          <div className={`relative mb-4 md:mb-6 ${glassEffect} ${borderEffect} rounded-lg overflow-hidden`}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-500" size={18} aria-hidden="true" />
            </div>
            <input
              type="text"
              placeholder="Search assets (BTC, Apple, Gold...)"
              className="w-full py-2 md:py-3 pl-10 pr-4 bg-transparent text-gray-800 dark:text-white placeholder-gray-500 focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search assets"
              autoFocus
            />
          </div>

          {/* Status Bar */}
          <div className="flex justify-between items-center mb-3 md:mb-4">
            {lastUpdated && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Updated {formatTimeAgo(lastUpdated)}
              </p>
            )}
            {loading && (
              <div className="flex items-center" aria-busy="true">
                <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" aria-hidden="true"></div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Updating...</span>
              </div>
            )}
          </div>

          {/* Asset Grid */}
          <div className="flex-1 overflow-y-auto pb-4">
            {filteredAssets.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {filteredAssets.map((asset) => (
                  <AssetCard 
                    key={asset.id} 
                    asset={asset}
                    borderEffect={borderEffect}
                    shadowEffect={shadowEffect}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 md:py-12">
                <FiSearch className="text-gray-400 text-3xl md:text-4xl mb-3 md:mb-4" aria-hidden="true" />
                <p className="text-gray-500 dark:text-gray-400 text-center">
                  No assets found matching "{searchQuery}"
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-white/20 dark:border-gray-800/20">
            <div className="flex flex-wrap justify-center gap-2">
              <span className="px-2 py-1 text-xs rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">STOCKS</span>
              <span className="px-2 py-1 text-xs rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-medium">CRYPTO</span>
              <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 font-medium">COMMODITIES</span>
              <span className="px-2 py-1 text-xs rounded-full bg-green-500/10 text-green-600 dark:text-green-400 font-medium">FOREX</span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AssetNews;