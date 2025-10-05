import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaHome, FaUserCircle, FaSignOutAlt, FaComments, FaSearch } from 'react-icons/fa';

const Layout = ({ children, onNavigate, activeTab, hideNav = false }) => {
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
        ? 'text-blue-600 bg-blue-50 transform scale-105' 
        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
    }`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900 font-sans relative">
      <main className={`flex-grow transition-all duration-300 ${
        hideNav ? 'pb-0' : 'pb-20'
      }`}>
        {children}
      </main>

      {showSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Search Users</h3>
              <button 
                onClick={() => setShowSearch(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
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
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full mt-4 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Search
            </button>
          </div>
        </div>
      )}

      {!hideNav && (
        <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 shadow-lg">
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
                  ? 'text-blue-600 bg-blue-50 transform scale-105' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
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
              className="flex flex-col items-center p-3 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-300"
            >
              <FaSignOutAlt className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">Logout</span>
            </button>
          </div>
        </footer>
      )}

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