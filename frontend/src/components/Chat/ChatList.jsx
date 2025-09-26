import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import useTyping from '../../hooks/useTyping';
import useMessages from '../../hooks/useMesaages';
import LoadingSpinner from '../common/LoadingSpinner';
import TimeAgo from '../common/TimeAgo';
import ChatSearch from './ChatSearch';
import { FaComment, FaUserPlus, FaCheckCircle, FaEllipsisV, FaSearch, FaPlus, FaCircle, FaExclamationTriangle, FaSync, FaEnvelope, FaCheck, FaCheckDouble } from 'react-icons/fa';

const ChatList = ({ onSelectConversation, onNavigate, refreshTrigger, onNewConversation, selectedConversation }) => {
  const { token, user } = useAuth();
  const { isConnected, onNewMessage, onUserStatusChange } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [messageRequests, setMessageRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chats');
  const [showSearch, setShowSearch] = useState(false);
  const [error, setError] = useState(null);
  const fetchConversations = async () => {
    try {
      setError(null);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched conversations:', data.conversations);
        const sortedConversations = (data.conversations || []).sort((a, b) => 
          new Date(b.lastActivity || b.createdAt) - new Date(a.lastActivity || a.createdAt)
        );
        setConversations(sortedConversations);
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
      const response = await fetch(`${process.env.REACT_APP_API_URL}/message-requests`, {
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
    if (!user) return;

    const handleNewMessage = (data) => {
      if (data.message && data.message.conversation) {
        setConversations(prev => {
          const conversationIndex = prev.findIndex(conv => conv._id === data.message.conversation);
          
          if (conversationIndex > -1) {
            const updatedConversations = [...prev];
            const conversation = updatedConversations[conversationIndex];
            const isNewMessage = !conversation.lastMessage || 
              conversation.lastMessage._id !== data.message._id;
            
            if (isNewMessage) {
              updatedConversations[conversationIndex] = {
                ...conversation,
                lastMessage: data.message,
                lastActivity: data.message.createdAt,
                unreadCount: conversation._id === selectedConversation?._id ? 
                  0 : (conversation.unreadCount || 0) + 1
              };
              
              // Move to top only if it's a new message (not an optimistic update)
              const [movedConversation] = updatedConversations.splice(conversationIndex, 1);
              return [movedConversation, ...updatedConversations];
            }
          }
          return prev;
        });
      }
    };

    const handleUserStatusChange = (data) => {
      if (data.userId && data.isOnline !== undefined) {
        setConversations(prev => prev.map(conv => {
          const updatedParticipants = conv.participants?.map(participant => 
            participant._id === data.userId 
              ? { ...participant, isOnline: data.isOnline, lastActive: data.lastActive }
              : participant
          );
          
          return {
            ...conv,
            participants: updatedParticipants
          };
        }));
      }
    };

    const cleanupNewMessage = onNewMessage(handleNewMessage);
    const cleanupUserStatusChange = onUserStatusChange(handleUserStatusChange);

    return () => {
      cleanupNewMessage();
      cleanupUserStatusChange();
    };
  }, [user, selectedConversation, onNewMessage, onUserStatusChange]);

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

  useEffect(() => {
    if (selectedConversation) {
      setConversations(prev => prev.map(conv => 
        conv._id === selectedConversation._id 
          ? { ...conv, unreadCount: 0 }
          : conv
      ));
    }
  }, [selectedConversation]);

  const acceptRequest = async (conversationId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/accept-request/${conversationId}`, {
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
    return (conversation.unreadCount || 0) > 0;
  };

  const getLastMessagePreview = (conversation) => {
    if (!conversation.lastMessage) return 'Start a conversation';
    
    const lastMessage = conversation.lastMessage;
    const isYou = lastMessage.sender._id === user._id;
    
   
    const content = lastMessage.content.length > 30 
      ? lastMessage.content.substring(0, 30) + '...' 
      : lastMessage.content;
    
    return `${isYou ? 'You: ' : ''}${content}`;
  };

  const getMessageStatusInfo = (conversation) => {
    if (!conversation.lastMessage) return null;

    const lastMessage = conversation.lastMessage;
    const isYou = lastMessage.sender._id === user._id;

    if (!isYou) return null;

    
    const otherParticipants = conversation.participants?.filter(p => p._id !== user._id) || [];
    const isSeen = otherParticipants.length > 0 && 
      otherParticipants.every(participant => 
        lastMessage.readBy?.some(read => read.user === participant._id)
      );

    if (isSeen) {
      return { status: 'seen', text: 'Seen', icon: FaCheckDouble, color: 'text-blue-600' };
    }

    
    const isDelivered = lastMessage.readBy?.some(read => read.user !== user._id);
    if (isDelivered) {
      return { status: 'delivered', text: 'Delivered', icon: FaCheckDouble, color: 'text-gray-500' };
    }

   
    const messageTime = new Date(lastMessage.createdAt);
    const now = new Date();
    const diffInSeconds = (now - messageTime) / 1000;

    if (diffInSeconds < 60) {
      return { status: 'sent-just-now', text: 'Sent just now', icon: FaCheck, color: 'text-gray-500' };
    }

    return { status: 'sent', text: 'Sent', icon: FaCheck, color: 'text-gray-500' };
  };

  const getTimeDisplay = (conversation) => {
    if (!conversation.lastMessage) return null;

    const lastMessage = conversation.lastMessage;
    const statusInfo = getMessageStatusInfo(conversation);

    if (statusInfo?.status === 'sent-just-now') {
      return 'Just now';
    }

    return <TimeAgo date={conversation.lastActivity} />;
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

   
    const { isTyping, typingDisplayText } = useTyping(conversation._id, user?._id);

    const unread = hasUnreadMessages(conversation);
    const unreadCount = conversation.unreadCount || 0;
    const lastMessagePreview = getLastMessagePreview(conversation);
    const statusInfo = getMessageStatusInfo(conversation);
    const timeDisplay = getTimeDisplay(conversation);
    const isSelected = selectedConversation?._id === conversation._id;

    const StatusIcon = statusInfo?.icon;

    return (
      <div
        className={`flex items-center p-4 cursor-pointer border-b border-gray-200 relative transition-all duration-200 ${
          isSelected 
            ? 'bg-blue-50 border-blue-200' 
            : 'hover:bg-gray-100'
        } ${unread ? 'bg-blue-25' : ''}`}
        onClick={() => !isRequest && onSelectConversation(conversation)}
      >
        <div className="relative flex-shrink-0">
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
          <div className="flex justify-between items-center mb-1">
            <h4 className={`font-semibold truncate ${unread ? 'text-blue-900' : 'text-gray-900'}`}>
              {otherParticipant?.name}
            </h4>
            {timeDisplay && (
              <span className={`text-xs whitespace-nowrap ml-2 ${
                unread ? 'text-blue-600 font-medium' : 'text-gray-500'
              }`}>
                {timeDisplay}
              </span>
            )}
          </div>
          
          <div className="flex justify-between items-center">
            <p className={`text-sm truncate flex-1 ${
              isTyping ? 'text-blue-600 italic' : 
              unread ? 'font-semibold text-gray-900' : 'text-gray-600'
            }`}>
              {isTyping ? typingDisplayText : lastMessagePreview}
            </p>
            
            //Message status indicator 
            {statusInfo && (
              <div className="flex items-center space-x-1 ml-2">
                <StatusIcon className={`w-3 h-3 ${statusInfo.color}`} />
                <span className={`text-xs whitespace-nowrap ${statusInfo.color}`}>
                  {statusInfo.text}
                </span>
              </div>
            )}
          </div>
        </div>
        
        //Enhanced unread indicator with count 
        {unreadCount > 0 && (
          <div className="ml-2 bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center font-medium flex-shrink-0">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
        
        {isRequest && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              acceptRequest(conversation._id);
            }}
            className="ml-2 bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition-colors flex-shrink-0"
            title="Accept request"
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
            className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            <FaSync className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md h-full flex flex-col">
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
              activeTab === 'chats'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('chats')}
          >
            <FaComment className="inline-block mr-2" />
            Chats {conversations.length > 0 && `(${conversations.length})`}
          </button>
          <button
            className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
              activeTab === 'requests'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('requests')}
          >
            <FaEnvelope className="inline-block mr-2" />
            Requests {messageRequests.length > 0 && `(${messageRequests.length})`}
          </button>
        </div>
      </div>

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

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'chats' ? (
          conversations.length > 0 ? (
            <div>
              {conversations.map(conversation => (
                <ChatItem key={conversation._id} conversation={conversation} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FaComment className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No conversations yet</p>
              <button
                onClick={() => setShowSearch(true)}
                className="text-blue-500 hover:text-blue-600 mt-2 transition-colors"
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
              <FaEnvelope className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No message requests</p>
            </div>
          )
        )}
      </div>


      <div className={`p-2 text-xs text-center border-t ${
        isConnected() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {isConnected() ? 'Connected to chat' : 'Disconnected - reconnecting...'}
      </div>
    </div>
  );
};

export default ChatList;