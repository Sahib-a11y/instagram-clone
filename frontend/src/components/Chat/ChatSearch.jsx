import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { FaSearch, FaUserPlus, FaTimes } from 'react-icons/fa';

const ChatSearch = ({ onStartConversation, onClose }) => {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const searchUsers = useCallback(async (query) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/search?query=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery) {
        searchUsers(searchQuery);
        setShowResults(true);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, searchUsers]);

  const handleStartConversation = async (user) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          participantId: user._id
        })
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Conversation created:', data.conversation);
        onStartConversation(data.conversation);
        setSearchQuery('');
        setSearchResults([]);
        onClose();
      } else {
        alert(data.error || 'Failed to start conversation');
      }
    } catch (error) {
      console.error('Start conversation error:', error);
      alert('Failed to start conversation');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Search Users</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <FaTimes className="w-5 h-5" />
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaSearch className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading && (
        <div className="flex justify-center py-4">
          <LoadingSpinner size="sm" />
        </div>
      )}

      {showResults && searchResults.length > 0 && (
        <div className="mt-4 max-h-60 overflow-y-auto">
          {searchResults.map(user => (
            <div
              key={user._id}
              className="flex items-center p-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
              onClick={() => handleStartConversation(user)}
            >
              <img
                src={user.pic || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1YjmQy7iBycLxXrdwvrl38TG9G_LxSHC1eg&s'}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover mr-3"
              />
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{user.name}</h4>
                <p className="text-sm text-gray-500">{user.email}</p>
                {user.isPrivate && (
                  <span className="text-xs text-gray-400">Private Account</span>
                )}
              </div>
              <FaUserPlus className="text-blue-500" />
            </div>
          ))}
        </div>
      )}

      {showResults && searchQuery && searchResults.length === 0 && !loading && (
        <div className="text-center py-4 text-gray-500">
          <p>No users found for "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
};

export default ChatSearch;