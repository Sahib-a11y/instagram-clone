import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import LoadingSpinner from '../common/LoadingSpinner';
import TimeAgo from '../common/TimeAgo';
import { FaPaperPlane, FaArrowLeft, FaEllipsisV, FaComments, FaCheck, FaCheckDouble, FaCircle } from 'react-icons/fa';

const ChatWindow = ({ conversation, onBack, onConversationUpdate }) => {
  const { token, user } = useAuth();
  const { joinConversation, leaveConversation, sendMessage: sendSocketMessage, onNewMessage, onTyping, onStopTyping } = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const conversationIdRef = useRef(null);
  const optimisticMessagesRef = useRef(new Set()); // Track optimistic message IDs

  const otherParticipant = conversation?.participants?.find(
    p => p._id !== user?._id
  );

  const fetchMessages = async () => {
    if (!conversation) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/conversation/${conversation._id}/messages?limit=100`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Filter out any messages that match optimistic ones
        const serverMessages = data.messages || [];
        
        // Remove any optimistic messages that have been confirmed by server
        const filteredMessages = serverMessages.filter(serverMsg => 
          !Array.from(optimisticMessagesRef.current).some(optimisticId => 
            optimisticId.includes(serverMsg.content) // Match by content
          )
        );
        
        setMessages(filteredMessages);
        markMessagesAsRead();
      }
    } catch (error) {
      console.error('Fetch messages error:', error);
    }
    setLoading(false);
  };

  const markMessagesAsRead = async () => {
    if (!conversation) return;

    try {
      await fetch(`${process.env.REACT_APP_API_URL}/conversation/${conversation._id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Mark read error:', error);
    }
  };

  useEffect(() => {
    // Clear optimistic messages tracking when conversation changes
    optimisticMessagesRef.current.clear();
    
    if (conversationIdRef.current !== conversation?._id) {
      setMessages([]);
      conversationIdRef.current = conversation?._id;
    }

    if (conversation) {
      fetchMessages();
      joinConversation(conversation._id);
      
      const handleNewMessage = (data) => {
        if (data.message.conversation === conversation._id) {
          setMessages(prev => {
            // Check if this message matches any optimistic message
            const isOptimisticMatch = Array.from(optimisticMessagesRef.current).some(optimisticId => 
              optimisticId.includes(data.message.content)
            );

            // Remove from optimistic tracking if it's a match
            if (isOptimisticMatch) {
              optimisticMessagesRef.current.delete(data.tempId);
            }

            // Check for exact duplicates
            const exactDuplicate = prev.some(msg => msg._id === data.message._id);
            
            if (exactDuplicate) {
              return prev;
            }

            // If it's an optimistic message replacement
            if (data.tempId) {
              return prev.map(msg =>
                msg._id === data.tempId ? {...data.message} : msg
              );
            }

            // Add new message
            return [...prev, data.message];
          });
          
          markMessagesAsRead();
          if (onConversationUpdate) onConversationUpdate();
        }
      };

      const handleTyping = (data) => {
        if (data.conversationId === conversation._id && data.userId !== user._id) {
          setIsTyping(true);
          setTypingUser(data.user);
          
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          
          typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            setTypingUser(null);
          }, 3000);
        }
      };

      const handleStopTyping = (data) => {
        if (data.conversationId === conversation._id && data.userId !== user._id) {
          setIsTyping(false);
          setTypingUser(null);
          
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
        }
      };

      const cleanupNewMessage = onNewMessage(handleNewMessage);
      const cleanupTyping = onTyping(handleTyping);
      const cleanupStopTyping = onStopTyping(handleStopTyping);

      return () => {
        leaveConversation(conversation._id);
        
        if (cleanupNewMessage) cleanupNewMessage();
        if (cleanupTyping) cleanupTyping();
        if (cleanupStopTyping) cleanupStopTyping();
        
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      };
    }
  }, [conversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTyping = () => {
    if (conversation) {
      sendSocketMessage('typing_start', { conversationId: conversation._id });
    }
  };

  const handleStopTyping = () => {
    if (conversation) {
      sendSocketMessage('typing_stop', { conversationId: conversation._id });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation) return;

    setSending(true);
    
    const tempId = `optimistic-${Date.now()}-${newMessage.trim().substring(0, 10)}`;
    const tempMessage = {
      _id: tempId,
      content: newMessage.trim(),
      sender: { _id: user._id, name: user.name, pic: user.pic },
      createdAt: new Date().toISOString(),
      readBy: [],
      isOptimistic: true
    };

    // Track this optimistic message
    optimisticMessagesRef.current.add(tempId);

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    handleStopTyping();

    try {
      // Socket for real time message
      sendSocketMessage('send_message', {
        conversationId: conversation._id,
        content: newMessage.trim(),
        tempId: tempId
      });

      // API call to save message
      const response = await fetch(`${process.env.REACT_APP_API_URL}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          conversationId: conversation._id,
          content: newMessage.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Remove optimistic message after successful API call (socket should handle replacement)
      setTimeout(() => {
        setMessages(prev => prev.filter(msg => msg._id !== tempId));
        optimisticMessagesRef.current.delete(tempId);
      }, 5000);

    } catch (error) {
      console.error('Send message error:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
      optimisticMessagesRef.current.delete(tempId);
    }
    setSending(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleStopTyping();
      sendMessage();
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    handleTyping();
  };

  const handleInputBlur = () => {
    handleStopTyping();
  };

  const isMessageRead = (message) => {
    if (!message || !message.readBy || !Array.isArray(message.readBy)) return false;
    return message.readBy.some(read => read.user === otherParticipant?._id);
  };

  const isMessageSeen = (message) => {
    return message && message.readBy && Array.isArray(message.readBy) && message.readBy.length > 0;
  };

  if (!conversation) {
    return (
      <div className="flex flex-col h-full bg-white rounded-lg shadow-md">
        <div className="flex items-center p-4 border-b border-gray-200 bg-white rounded-t-lg">
          <button
            onClick={onBack}
            className="mr-3 p-2 hover:bg-gray-100 rounded-full"
          >
            <FaArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Select a conversation</h3>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center text-gray-500">
            <FaComments className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p>Select a conversation to start chatting</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-gray-200 bg-white rounded-t-lg">
        <button
          onClick={onBack}
          className="mr-3 p-2 hover:bg-gray-100 rounded-full lg:hidden"
        >
          <FaArrowLeft className="w-5 h-5" />
        </button>
        <div className="relative">
          <img
            src={otherParticipant?.pic || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1YjmQy7iBycLxXrdwvrl38TG9G_LxSHC1eg&s'}
            alt={otherParticipant?.name}
            className="w-10 h-10 rounded-full object-cover mr-3"
          />
          {otherParticipant?.isOnline && (
            <FaCircle className="absolute bottom-0 right-2 w-3 h-3 text-green-500 bg-white rounded-full" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{otherParticipant?.name || 'Unknown User'}</h3>
          <p className="text-sm text-gray-500">
            {otherParticipant?.isOnline ? (
              <span className="text-green-500">Online</span>
            ) : (
              <span>Last seen <TimeAgo date={otherParticipant?.lastActive} /></span>
            )}
          </p>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-full">
          <FaEllipsisV className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <LoadingSpinner size="md" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No messages yet</p>
            <p className="text-sm">Start a conversation by sending a message</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message._id}
                className={`flex ${message.sender._id === user._id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative ${
                    message.sender._id === user._id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  } ${message.isOptimistic ? 'opacity-80' : ''}`}
                >
                  <p className={`text-sm ${message.sender._id === user._id ? 'text-white' : 'text-gray-900'}`}>
                    {message.content}
                  </p>
                  <div className="flex items-center justify-end mt-1 space-x-2">
                    <span
                      className={`text-xs ${
                        message.sender._id === user._id ? 'text-blue-200' : 'text-gray-500'
                      }`}
                    >
                      <TimeAgo date={message.createdAt} />
                    </span>
                    {message.sender._id === user._id && (
                      <span className="text-xs">
                        {isMessageSeen(message) ? (
                          <FaCheckDouble className="text-blue-200" title="Seen" />
                        ) : isMessageRead(message) ? (
                          <FaCheckDouble className="text-gray-400" title="Delivered" />
                        ) : (
                          <FaCheck className="text-gray-400" title="Sent" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && typingUser && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-900 border border-gray-200 px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <span className="text-xs text-gray-500">{typingUser.name} is typing...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
        <div className="flex space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            onBlur={handleInputBlur}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
            disabled={sending}
          />
          <button
            onClick={() => {
              handleStopTyping();
              sendMessage();
            }}
            disabled={!newMessage.trim() || sending}
            className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <LoadingSpinner size="sm" />
            ) : (
              <FaPaperPlane className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;