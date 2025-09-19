import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaHome, FaUserCircle, FaSignOutAlt, FaChevronDown, FaComments } from 'react-icons/fa';

const Layout = ({ children, onNavigate, activeTab }) => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    setShowMobileMenu(false);
  };

  const handleNavigation = (path) => {
    onNavigate(path);
    setShowDropdown(false);
    setShowMobileMenu(false);
  };

  const getNavLinkClasses = (tabName) => {
    const baseClasses = "flex items-center w-full space-x-4 p-3 rounded-md font-medium transition-all duration-300 transform hover:scale-105";
    const activeClasses = "text-indigo-400 bg-gray-700/50";
    const inactiveClasses = "text-gray-400 hover:text-indigo-400 hover:bg-gray-700";
    
    return `${baseClasses} ${activeTab === tabName ? activeClasses : inactiveClasses}`;
  };

  return (
    <div className="flex min-h-screen bg-gray-900 text-gray-100 font-sans">
      {/* Fixed Sidebar */}
      <aside className="fixed top-0 left-0 h-full w-64 bg-gray-800 shadow-2xl border-r border-gray-700 z-50 flex flex-col justify-between">
        <div className="flex flex-col items-center p-6">
          {/* Logo */}
          <h1
            className="text-3xl font-extrabold text-indigo-500 cursor-pointer hover:text-indigo-400 transition-colors"
            onClick={() => handleNavigation('home')}
          >
            Connect
          </h1>

          {/* Desktop Navigation */}
          <nav className="mt-10 w-full">
            <button
              onClick={() => handleNavigation('home')}
              className={getNavLinkClasses('home')}
            >
              <FaHome className="w-6 h-6" />
              <span>Home</span>
            </button>
            <button
              onClick={() => handleNavigation('profile')}
              className={getNavLinkClasses('profile')}
            >
              <FaUserCircle className="w-6 h-6" />
              <span>Profile</span>
            </button>
            <button
              onClick={() => handleNavigation('chat')}
              className={getNavLinkClasses('chat')}
            >
              <FaComments className="w-6 h-6" />
              <span>Messages</span>
            </button>
          </nav>
        </div>

        {/* User Menu at bottom of sidebar */}
        <div className="relative p-6 border-t border-gray-700">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center justify-between w-full space-x-2 text-gray-400 hover:text-white transition-colors p-3 rounded-full hover:bg-gray-700/50"
          >
            <img
              src={user?.pic || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1YjmQy7iBycLxXrdwvrl38TG9G_LxSHC1eg&s'}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500"
            />
            <span className="text-base font-semibold truncate flex-grow text-left ml-2">{user?.name}</span>
            <FaChevronDown className={`w-4 h-4 transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute bottom-24 left-0 right-0 mx-4 w-auto bg-gray-800 rounded-lg shadow-2xl border border-gray-700 z-50 animate-fade-in-down">
              <div className="py-2">
                <div className="px-4 py-3 border-b border-gray-700">
                  <p className="text-sm font-semibold text-gray-100">{user?.name}</p>
                  <p className="text-xs text-gray-400 mt-1 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => handleNavigation('profile')}
                  className="flex items-center w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  <FaUserCircle className="w-5 h-5 mr-3" />
                  <span>My Profile</span>
                </button>
                <button
                  onClick={() => handleNavigation('chat')}
                  className="flex items-center w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  <FaComments className="w-5 h-5 mr-3" />
                  <span>Messages</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-900/50 transition-colors"
                >
                  <FaSignOutAlt className="w-5 h-5 mr-3" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow ml-64 p-8">
        {children}
      </main>

      {/* Mobile Menu (Overlay) */}
      <div className={`md:hidden fixed inset-y-0 left-0 bg-gray-800 z-50 w-64 shadow-2xl transform transition-transform duration-300 ${showMobileMenu ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full justify-between p-6">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-indigo-500">Menu</h1>
              <button onClick={() => setShowMobileMenu(false)} className="p-2 text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="space-y-2">
              <button
                onClick={() => handleNavigation('home')}
                className={getNavLinkClasses('home')}
              >
                <FaHome className="w-6 h-6" />
                <span>Home</span>
              </button>
              <button
                onClick={() => handleNavigation('profile')}
                className={getNavLinkClasses('profile')}
              >
                <FaUserCircle className="w-6 h-6" />
                <span>Profile</span>
              </button>
              <button
                onClick={() => handleNavigation('chat')}
                className={getNavLinkClasses('chat')}
              >
                <FaComments className="w-6 h-6" />
                <span>Messages</span>
              </button>
            </nav>
          </div>

          <div className="p-4 border-t border-gray-700">
            <button
              onClick={handleLogout}
              className="flex items-center w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-900/50 transition-colors rounded-md"
            >
              <FaSignOutAlt className="w-5 h-5 mr-3" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-40"
          onClick={() => setShowMobileMenu(false)}
        />
      )}
    </div>
  );
};

export default Layout;