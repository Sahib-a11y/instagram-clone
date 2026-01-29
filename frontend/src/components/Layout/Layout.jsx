import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaHome, FaUserCircle, FaSignOutAlt, FaComments, FaSearch } from 'react-icons/fa';
import SearchUsers from '../common/SearchUsers';

const Layout = ({ children, onNavigate, activeTab, hideNav = false }) => {
  const { user, logout } = useAuth();
  const [showSearch, setShowSearch] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const handleNavigation = (path) => {
    onNavigate(path);
    setShowSearch(false);
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-4">
          <div className="bg-gray-900 rounded-3xl w-full max-w-md mx-4 shadow-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h3 className="text-xl font-semibold text-gray-100">Discover People</h3>
              <button
                onClick={() => setShowSearch(false)}
                className="text-gray-400 hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
              <SearchUsers onNavigate={(page, data) => {
                onNavigate(page, data);
                setShowSearch(false);
              }} />
            </div>
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