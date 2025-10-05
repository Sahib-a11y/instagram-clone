import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import LoadingSpinner from '../common/LoadingSpinner';
import TimeAgo from '../common/TimeAgo';
import ChatSearch from './ChatSearch';
import { FaComment, FaUserPlus, FaCheckCircle, FaSearch, FaPlus } from 'react-icons/fa';

const ChatList = ({ onSelectConversation, refreshTrigger, onNewConversation }) => {
  const { user } = useAuth();
  const { onNewMessage, onMessagesRead, onTyping, onStopTyping, isConnected } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [messageRequests, setMessageRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chats');
  const [showSearch, setShowSearch] = useState(false);

  const fetchConversations = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/conversations`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        const conversationsWithUnread = data.conversations?.map(conv => ({
          ...conv,
          unreadCount: conv.unreadCount || 0 // Ensure unreadCount exists
        })) || [];
        setConversations(conversationsWithUnread);
      }
    } catch (error) {
      console.error('Fetch conversations error:', error);
    }
  };

  const fetchMessageRequests = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/message-requests`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessageRequests(data.requests || []);
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
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, [refreshTrigger]);

  useEffect(() => {
    if (onNewConversation) {
      setConversations(prev => {
        const exists = prev.find(conv => conv._id === onNewConversation._id);
        return exists ? prev : [{ ...onNewConversation, unreadCount: 0 }, ...prev];
      });
    }
  }, [onNewConversation]);

  const acceptRequest = async (conversationId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/accept-request/${conversationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const acceptedRequest = messageRequests.find(req => req._id === conversationId);
        if (acceptedRequest) {
          setConversations(prev => [{ ...acceptedRequest, unreadCount: 0 }, ...prev]);
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
      return exists ? prev : [{ ...conversation, unreadCount: 0 }, ...prev];
    });
    onSelectConversation(conversation);
    setShowSearch(false);
  };


  const getUnreadMessageCount = (conversation) => {
    if (!user) return 0;
    
   
    if (conversation.unreadCount !== undefined && conversation.unreadCount !== null) {
      return conversation.unreadCount;
    }
    
   
    if (!conversation.lastMessage) return 0;
    
    const lastMessage = conversation.lastMessage;
    const isFromOtherUser = lastMessage.sender._id !== user._id;
    const isUnread = !lastMessage.readBy || !lastMessage.readBy.some(read => read.user === user._id);
    
    return (isFromOtherUser && isUnread) ? 1 : 0;
  };


  const hasUnreadMessages = (conversation) => {
    return getUnreadMessageCount(conversation) > 0;
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

  const handleConversationSelect = async (conversation) => {
  
    const currentUnreadCount = getUnreadMessageCount(conversation);
    if (currentUnreadCount > 0) {
    
      setConversations(prev => prev.map(conv => 
        conv._id === conversation._id 
          ? { ...conv, unreadCount: 0 }
          : conv
      ));
      try {
        await fetch(`${process.env.REACT_APP_API_URL}conversation/${conversation._id}/mark-read`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      } catch (error) {
        console.error(error);
      }
    }

    
    onSelectConversation(conversation);
  };

  const updateConversationOnNewMessage = useCallback((messageData) => {
    
    const messages = Array.isArray(messageData) ? messageData : [messageData];
    
    messages.forEach((messageItem) => {
      const message = messageItem.message || messageItem;
      
      if (message && message.conversation) {
        const conversationId = message.conversation;
        const newMessage = message;
        const isFromCurrentUser = newMessage.sender._id === user._id;
        
        
        setConversations(prev => {
          const conversationExists = prev.find(conv => conv._id === conversationId);
          
          if (conversationExists) {
            
            return prev.map(conv => {
              if (conv._id === conversationId) {
                const currentUnreadCount = conv.unreadCount || 0;
                
                
                const newUnreadCount = isFromCurrentUser ? 0 : currentUnreadCount + 1;
                
                return {
                  ...conv,
                  lastMessage: newMessage,
                  lastActivity: newMessage.createdAt,
                  unreadCount: newUnreadCount
                };
              }
              return conv;
            });
          } else {
          
            console.log(`Creating new conversation entry for ${conversationId}`);
            const otherParticipant = isFromCurrentUser 
              ? newMessage.sender
              : newMessage.sender;
          
            const initialUnreadCount = isFromCurrentUser ? 0 : 1;
            
            const newConversation = {
              _id: conversationId,
              participants: [user, otherParticipant],
              lastMessage: newMessage,
              lastActivity: newMessage.createdAt,
              unreadCount: initialUnreadCount,
              createdAt: new Date().toISOString()
            };
            
            return [newConversation, ...prev];
          }
        });

        setConversations(prev => {
          const conversationIndex = prev.findIndex(conv => conv._id === conversationId);
          if (conversationIndex > -1) {
            const updatedConversations = [...prev];
            const [conversation] = updatedConversations.splice(conversationIndex, 1);
            return [conversation, ...updatedConversations];
          }
          return prev;
        });
      }
    });
  }, [user]);

  const handleNewConversationFromSocket = useCallback((conversationData) => {
    
    const conversation = Array.isArray(conversationData) ? conversationData[0] : conversationData;
    
    if (conversation && conversation._id) {
      setConversations(prev => {
        const exists = prev.find(conv => conv._id === conversation._id);
        if (exists) {
          return prev;
        }

        return [{ ...conversation, unreadCount: 0 }, ...prev];
      });
    }
  }, []);

  const markConversationAsRead = useCallback((data) => {
    console.log('ChatList: Marking conversation as read:', data);
    
    const readDataArray = Array.isArray(data) ? data : [data];
    
    readDataArray.forEach((readData) => {
      if (readData.conversationId && readData.readBy === user._id) {
 
        setConversations(prev => prev.map(conv => 
          conv._id === readData.conversationId 
            ? { ...conv, unreadCount: 0 }
            : conv
        ));
      }
    });
  }, [user._id]);

 
  const handleTypingIndicator = useCallback((typingData) => {
    console.log('ChatList: Typing indicator:', typingData);
    
    const typingDataArray = Array.isArray(typingData) ? typingData : [typingData];
    
    typingDataArray.forEach((data) => {
      if (data.conversationId && data.userId !== user._id) {
      }
    });
  }, [user._id]);


  const handleStopTypingIndicator = useCallback((typingData) => {
    
    const typingDataArray = Array.isArray(typingData) ? typingData : [typingData];
    
    typingDataArray.forEach((data) => {
      if (data.conversationId && data.userId !== user._id) {
      }
    });
  }, [user._id]);


  useEffect(() => {
    if (!isConnected()) {
      return;
    }

    console.log('🎯 ChatList: Setting up socket listeners');
    
    const cleanupNewMessage = onNewMessage(updateConversationOnNewMessage);
  
    const cleanupMessagesRead = onMessagesRead(markConversationAsRead);
    
    const cleanupTyping = onTyping(handleTypingIndicator);
    
    const cleanupStopTyping = onStopTyping(handleStopTypingIndicator);

    return () => {
      cleanupNewMessage();
      cleanupMessagesRead();
      cleanupTyping();
      cleanupStopTyping();
    };
  }, [
    isConnected, 
    onNewMessage, 
    onMessagesRead, 
    onTyping,
    onStopTyping,
    updateConversationOnNewMessage, 
    markConversationAsRead,
    handleTypingIndicator,
    handleStopTypingIndicator
  ]);

  const ChatItem = ({ conversation, isRequest = false }) => {
    const otherParticipant = conversation.participants?.find(p => p._id !== user?._id);
    const unreadCount = getUnreadMessageCount(conversation);
    const hasUnread = unreadCount > 0;
    const lastMessagePreview = getLastMessagePreview(conversation);

    return (
      <div
        className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors ${
          hasUnread ? 'bg-blue-50 hover:bg-blue-100' : ''
        }`}
        onClick={() => !isRequest && handleConversationSelect(conversation)}
      >
        <div className="relative">
          <img
            src={otherParticipant?.pic || '/default-avatar.png'}
            alt={otherParticipant?.name}
            className="w-12 h-12 rounded-full object-cover"
          />
          {otherParticipant?.isOnline && !isRequest && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          )}
        </div>
        
        <div className="ml-3 flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h4 className={`font-semibold truncate ${hasUnread ? 'text-gray-900' : 'text-gray-700'}`}>
              {otherParticipant?.name}
            </h4>
            {conversation.lastMessage && (
              <span className={`text-xs whitespace-nowrap ml-2 ${
                hasUnread ? 'text-gray-700 font-medium' : 'text-gray-500'
              }`}>
                <TimeAgo date={conversation.lastActivity} />
              </span>
            )}
          </div>
          <p className={`text-sm truncate mt-1 ${
            hasUnread ? 'font-semibold text-gray-900' : 'text-gray-600'
          }`}>
            {lastMessagePreview}
          </p>
        </div>
        
        
        {hasUnread && (
          <div className="flex items-center justify-center ml-2">
            <div className="bg-blue-500 text-white text-xs font-semibold rounded-full min-w-5 h-5 flex items-center justify-center px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          </div>
        )}
        
        {isRequest && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              acceptRequest(conversation._id);
            }}
            className="ml-2 bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition-colors"
          >
            <FaCheckCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  };

  if (showSearch) {
    return (
      <ChatSearch 
        onStartConversation={handleSearchResult} 
        onClose={() => setShowSearch(false)}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            className={`flex-1 py-4 text-center font-medium transition-colors ${
              activeTab === 'chats'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('chats')}
          >
            <FaComment className="inline-block mr-2 mb-1" />
            Chats
            {conversations.some(conv => hasUnreadMessages(conv)) && (
              <span className="ml-1 bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                {conversations.filter(conv => hasUnreadMessages(conv)).length}
              </span>
            )}
          </button>
          <button
            className={`flex-1 py-4 text-center font-medium transition-colors ${
              activeTab === 'requests'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('requests')}
          >
            <FaUserPlus className="inline-block mr-2 mb-1" />
            Requests ({messageRequests.length})
          </button>
        </div>
      </div>

      <div className="p-4 border-b border-gray-200">
        <button
          onClick={() => setShowSearch(true)}
          className="w-full flex items-center justify-center space-x-2 bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors"
        >
          <FaSearch className="w-4 h-4" />
          <span>Search Users</span>
          <FaPlus className="w-4 h-4" />
        </button>
      </div>

      
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'chats' ? (
          conversations.length > 0 ? (
            conversations.map(conversation => (
              <ChatItem key={conversation._id} conversation={conversation} />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 px-4">
              <FaComment className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-900 mb-2">No conversations yet</p>
              <p className="text-sm text-gray-600 mb-4">Start chatting with people you know</p>
              <button
                onClick={() => setShowSearch(true)}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
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
            <div className="text-center py-8 text-gray-500 px-4">
              <FaUserPlus className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-900 mb-2">No message requests</p>
              <p className="text-sm text-gray-600">When someone messages you, it'll appear here</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ChatList;