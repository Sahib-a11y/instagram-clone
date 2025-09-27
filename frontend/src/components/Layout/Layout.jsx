import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaHome, FaUserCircle, FaSignOutAlt, FaComments, FaSearch } from 'react-icons/fa';

const Layout = ({ children, onNavigate, activeTab }) => {
  const { user, logout } = useAuth();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    logout();
  };

  const handleNavigation = (path) => {
    onNavigate(path);
    setShowSearch(false);
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      onNavigate('search', searchQuery.trim());
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  const getNavButtonClasses = (tabName) => {
    return `flex flex-col items-center p-3 rounded-lg transition-all duration-300 ${
      activeTab === tabName 
        ? 'text-indigo-400 bg-gray-700/50 transform scale-105' 
        : 'text-gray-400 hover:text-indigo-400 hover:bg-gray-700'
    }`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100 font-sans">
      {/* Main Content */}
      <main className="flex-grow pb-20"> {/* Added padding bottom for footer */}
        {children}
      </main>

      {/* Search Overlay */}
      {showSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl animate-fade-in-down">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Search Users</h3>
              <button 
                onClick={() => setShowSearch(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearch}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                autoFocus
              />
              <FaSearch className="absolute right-3 top-3 text-gray-400 w-5 h-5" />
            </div>
            <button
              onClick={() => {
                if (searchQuery.trim()) {
                  onNavigate('search', searchQuery.trim());
                  setShowSearch(false);
                  setSearchQuery('');
                }
              }}
              disabled={!searchQuery.trim()}
              className="w-full mt-4 px-4 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Search
            </button>
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 z-40">
        <div className="flex justify-around items-center py-3 px-4">
          <button
            onClick={() => handleNavigation('home')}
            className={getNavButtonClasses('home')}
          >
            <FaHome className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Home</span>
          </button>

          <button
            onClick={() => setShowSearch(true)}
            className={`flex flex-col items-center p-3 rounded-lg transition-all duration-300 ${
              showSearch 
                ? 'text-indigo-400 bg-gray-700/50 transform scale-105' 
                : 'text-gray-400 hover:text-indigo-400 hover:bg-gray-700'
            }`}
          >
            <FaSearch className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Search</span>
          </button>

          <button
            onClick={() => handleNavigation('profile')}
            className={getNavButtonClasses('profile')}
          >
            <FaUserCircle className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Profile</span>
          </button>

          <button
            onClick={() => handleNavigation('chat')}
            className={getNavButtonClasses('chat')}
          >
            <FaComments className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Messages</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex flex-col items-center p-3 rounded-lg text-red-500 hover:text-red-400 hover:bg-red-900/20 transition-all duration-300"
          >
            <FaSignOutAlt className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Logout</span>
          </button>
        </div>
      </footer>

      {/* Overlay for search */}
      {showSearch && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setShowSearch(false)}
        />
      )}
    </div>
  );
};

export default Layout;