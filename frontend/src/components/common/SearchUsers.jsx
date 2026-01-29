import React, { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { FaSearch, FaUser, FaLock, FaUserPlus, FaSync } from 'react-icons/fa';
import useUserSearch from '../../hooks/useUserSearch';
import useUserSuggestions from '../../hooks/useUserSuggestions';

const SearchUsers = ({ onNavigate }) => {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  // Use custom hooks
  const { results, loading: searchLoading, searchUsers, clearResults } = useUserSearch();
  const { suggestions, loading: suggestionsLoading, refreshSuggestions } = useUserSuggestions();

  const loading = searchLoading || suggestionsLoading;

  // Debug API URL on component mount
  useEffect(() => {
    console.log('🔍 REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
  }, []);

  // Debounced search effect
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (query.trim().length >= 2) {
        searchUsers(query);
        setShowResults(true);
      } else if (query.trim().length === 0) {
        clearResults();
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [query, searchUsers, clearResults]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setShowResults(value.length > 0);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission
      if (query.trim().length >= 2) {
        searchUsers(query);
      }
    }
  };

  const handleUserClick = (userId) => {
    setQuery('');
    setShowResults(false);
    onNavigate('userProfile', userId);
  };

  const UserItem = ({ user }) => (
    <div
      onClick={() => handleUserClick(user._id)}
      className="flex items-center space-x-4 p-4 hover:bg-gray-700/50 cursor-pointer transition-colors duration-200 transform hover:scale-[1.01]"
    >
      <img
        src={user.pic || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1YjmQy7iBycLxXrdwvrl38TG9G_LxSHC1eg&s'}
        alt={user.name}
        className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500"
      />
      <div className="flex-1">
        <h4 className="font-medium text-gray-100">{user.name}</h4>
        <p className="text-sm text-gray-400">{user.email}</p>
        <div className="flex items-center text-xs mt-1 text-gray-400">
          <FaUser className="w-3 h-3 mr-1" />
          <span>{user.followers?.length || 0} followers</span>
        </div>
        {user.isPrivate && (
          <div className="flex items-center text-xs mt-1 text-gray-500">
            <FaLock className="w-3 h-3 mr-1" />
            <span>Private Profile</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-gray-800 rounded-3xl shadow-2xl mb-8 animate-fade-in-up">
      
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-xl font-semibold text-gray-100 mb-4">Discover People</h2>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FaSearch className="w-5 h-5 text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Search users..."
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="block w-full pl-12 pr-4 py-3 border border-gray-700 rounded-full leading-5 bg-gray-900 text-gray-100 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
          {loading && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
              <LoadingSpinner size="sm" color="indigo" />
            </div>
          )}
        </div>
      </div>


      {showResults && (
        <div className="border-b border-gray-700 animate-slide-in-down">
          {loading ? (
            <div className="p-6 text-center">
              <LoadingSpinner size="md" color="indigo" />
            </div>
          ) : results.length > 0 ? (
            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              <div className="px-6 py-2 text-sm font-medium text-gray-400 bg-gray-700/50">
                Search Results ({results.length})
              </div>
              {results.map(user => (
                <UserItem key={user._id} user={user} />
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="p-6 text-center text-gray-500">
              <FaUserPlus className="mx-auto w-12 h-12 text-gray-600 mb-3" />
              <p>No users found for "{query}"</p>
            </div>
          ) : null}
        </div>
      )}


      {!showResults && (
        <div className="animate-fade-in">
          <div className="px-6 py-4 text-sm font-medium text-gray-400 bg-gray-700/50 flex justify-between items-center">
            <span>Suggested for You</span>
            <button
              onClick={refreshSuggestions}
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
              aria-label="Refresh suggestions"
            >
              <FaSync className="w-4 h-4" />
            </button>
          </div>
          {suggestions.length > 0 ? (
            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              {suggestions.map(user => (
                <UserItem key={user._id} user={user} />
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              <FaUser className="mx-auto w-12 h-12 text-gray-600 mb-3" />
              <p>No suggestions available at the moment.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchUsers;