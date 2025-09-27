import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import TimeAgo from '../common/TimeAgo';
import ChatSearch from './ChatSearch';
import { FaComment, FaUserPlus, FaCheckCircle, FaEllipsisV, FaSearch, FaPlus, FaCircle, FaExclamationTriangle, FaSync } from 'react-icons/fa';

const ChatList = ({ onSelectConversation, onNavigate, refreshTrigger, onNewConversation }) => {
  const { token, user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [messageRequests, setMessageRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chats');
  const [showSearch, setShowSearch] = useState(false);
  const [error, setError] = useState(null);

  const fetchConversations = async () => {
    try {
      setError(null);
      const response = await fetch(`${process.env.REACT_APP_API_URL}conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched conversations:', data.conversations);
        setConversations(data.conversations || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch conversations');
        console.error('Failed to fetch conversations:', errorData);
      }
    } catch (error) {
      console.error('Fetch conversations error:', error);
      setError('Network error occurred while fetching conversations');
    }
  };

  const fetchMessageRequests = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}message-requests`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessageRequests(data.requests || []);
      } else {
        console.error('Failed to fetch message requests');
      }
    } catch (error) {
      console.error('Fetch message requests error:', error);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchConversations(), fetchMessageRequests()]);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load conversations');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (token) {
      fetchAllData();
    }
  }, [token, refreshTrigger]);

  
  useEffect(() => {
    if (onNewConversation) {
      setConversations(prev => {
        const exists = prev.find(conv => conv._id === onNewConversation._id);
        if (!exists) {
          return [onNewConversation, ...prev];
        }
        return prev;
      });
    }
  }, [onNewConversation]);

  const acceptRequest = async (conversationId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}accept-request/${conversationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const acceptedRequest = messageRequests.find(req => req._id === conversationId);
        if (acceptedRequest) {
          setConversations(prev => [acceptedRequest, ...prev]);
          setMessageRequests(prev => prev.filter(req => req._id !== conversationId));
        }
      }
    } catch (error) {
      console.error('Accept request error:', error);
    }
  };

  const handleSearchResult = (conversation) => {
    setConversations(prev => {
      const exists = prev.find(conv => conv._id === conversation._id);
      if (!exists) {
        return [conversation, ...prev];
      }
      return prev;
    });
    
    onSelectConversation(conversation);
    setShowSearch(false);
  };

  const handleRetry = () => {
    setError(null);
    fetchAllData();
  };

  const hasUnreadMessages = (conversation) => {
    if (!conversation.lastMessage || !user) return false;
    
    const lastMessage = conversation.lastMessage;
    return lastMessage.sender._id !== user._id && 
           (!lastMessage.readBy || !lastMessage.readBy.some(read => read.user === user._id));
  };

  const getLastMessagePreview = (conversation) => {
    if (!conversation.lastMessage) return 'Start a conversation';
    
    const lastMessage = conversation.lastMessage;
    const isYou = lastMessage.sender._id === user._id;
    
    return `${isYou ? 'You: ' : ''}${lastMessage.content}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (showSearch) {
    return (
      <ChatSearch 
        onStartConversation={handleSearchResult} 
        onClose={() => setShowSearch(false)}
      />
    );
  }

  const ChatItem = ({ conversation, isRequest = false }) => {
    const otherParticipant = conversation.participants?.find(
      p => p._id !== user?._id
    );

    const unread = hasUnreadMessages(conversation);
    const lastMessagePreview = getLastMessagePreview(conversation);

    return (
      <div
        className="flex items-center p-4 hover:bg-gray-100 cursor-pointer border-b border-gray-200 relative"
        onClick={() => !isRequest && onSelectConversation(conversation)}
      >
        <div className="relative">
          <img
            src={otherParticipant?.pic || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1YjmQy7iBycLxXrdwvrl38TG9G_LxSHC1eg&s'}
            alt={otherParticipant?.name}
            className="w-12 h-12 rounded-full object-cover mr-3"
          />
          {otherParticipant?.isOnline && !isRequest && (
            <FaCircle className="absolute bottom-0 right-2 w-3 h-3 text-green-500 bg-white rounded-full" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-gray-900 truncate">{otherParticipant?.name}</h4>
            {conversation.lastMessage && (
              <span className="text-xs text-gray-500 whitespace-nowrap">
                <TimeAgo date={conversation.lastActivity} />
              </span>
            )}
          </div>
          <p className={`text-sm truncate ${unread ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
            {lastMessagePreview}
          </p>
        </div>
        {unread && (
          <div className="absolute top-3 right-3 w-2 h-2 bg-blue-500 rounded-full"></div>
        )}
        {isRequest && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              acceptRequest(conversation._id);
            }}
            className="ml-2 bg-green-500 text-white p-2 rounded-full hover:bg-green-600"
          >
            <FaCheckCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  };

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md h-full p-4">
        <div className="flex flex-col items-center justify-center h-full text-center">
          <FaExclamationTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Conversations</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            <FaSync className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md h-full">
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeTab === 'chats'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('chats')}
          >
            <FaComment className="inline-block mr-2" />
            Chats
          </button>
          <button
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeTab === 'requests'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('requests')}
          >
            <FaUserPlus className="inline-block mr-2" />
            Requests ({messageRequests.length})
          </button>
        </div>
      </div>

      {/* Search btn */}
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={() => setShowSearch(true)}
          className="w-full flex items-center justify-center space-x-2 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
        >
          <FaSearch className="w-4 h-4" />
          <span>Search Users</span>
          <FaPlus className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-y-auto max-h-96">
        {activeTab === 'chats' ? (
          conversations.length > 0 ? (
            conversations.map(conversation => (
              <ChatItem key={conversation._id} conversation={conversation} />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FaComment className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No conversations yet</p>
              <button
                onClick={() => setShowSearch(true)}
                className="text-blue-500 hover:text-blue-600 mt-2"
              >
                Start a conversation
              </button>
            </div>
          )
        ) : (
          messageRequests.length > 0 ? (
            messageRequests.map(request => (
              <ChatItem key={request._id} conversation={request} isRequest={true} />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FaUserPlus className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No message requests</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ChatList;