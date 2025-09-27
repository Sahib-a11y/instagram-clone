import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import LoadingSpinner from '../common/LoadingSpinner';
import TimeAgo from '../common/TimeAgo';
import { FaPaperPlane, FaArrowLeft, FaEllipsisV, FaComments, FaCheck, FaCheckDouble, FaCircle, FaWifi, FaExclamationTriangle } from 'react-icons/fa';

const ChatWindow = ({ conversation, onBack, onConversationUpdate }) => {
  const { token, user } = useAuth();
  const { 
    joinConversation, 
    leaveConversation, 
    sendMessage: sendSocketMessage, 
    onNewMessage, 
    onTyping, 
    onStopTyping,
    onMessagesRead,
    onUserStatusChange,
    isConnected 
  } = useSocket();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const conversationIdRef = useRef(null);
  const lastTypingTimeRef = useRef(0);

  const otherParticipant = conversation?.participants?.find(
    p => p._id !== user?._id
  );

  useEffect(() => {}, [conversation, isConnected, user, otherParticipant]);

  const fetchMessages = async () => {
    if (!conversation) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}conversation/${conversation._id}/messages?limit=100`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        
      }
    } catch (error) {
      console.error('Fetch messages error:', error);
    }
    setLoading(false);
  };

  const markMessagesAsRead = async () => {
    if (!conversation || !isConnected()) return;

    try {      
      sendSocketMessage('mark_messages_read', {
        conversationId: conversation._id
      });

    } catch (error) {
      console.error('Mark read error:', error);
    }
  };

  
  const isMessageRead = (message) => {
    if (!message || !message.readBy || !Array.isArray(message.readBy)) return false;
    
    
    return message.readBy.some(read => 
      read.user === otherParticipant?._id
    );
  };

  const isMessageDelivered = (message) => {
    if (!message || !message.readBy || !Array.isArray(message.readBy)) return false;
    
    
    if (message.sender._id === user._id) {
      return message.readBy.some(read => 
        read.user !== user._id
      );
    }
    
    
    return message.readBy.some(read => read.user === user._id);
  };

  const getMessageStatus = (message) => {
    if (message.isOptimistic) return 'sending';
    if (isMessageRead(message)) return 'read'; 
    if (isMessageDelivered(message)) return 'delivered'; 
    return 'sent'; 
  };

  
  const handleNewMessage = useRef((data) => {  
    if (data.message && data.message.conversation === conversation?._id) {
      
      setMessages(prev => {
        const messageExists = prev.some(msg => msg._id === data.message._id);
        
        if (messageExists) {
          return prev;
        }

        if (data.tempId) {
          const optimisticMessageExists = prev.some(msg => msg._id === data.tempId);
          
          if (optimisticMessageExists) {
            const updatedMessages = prev.map(msg => 
              msg._id === data.tempId ? { ...data.message } : msg
            );
            return updatedMessages;
          }
        }
        if (data.message.sender._id === user._id) {
          
        } else {
          setTimeout(() => {
            markMessagesAsRead();
          }, 100);
        }
        
        const newMessages = [...prev, data.message];
        return newMessages;
      });
      
      if (onConversationUpdate) onConversationUpdate();
      
      setTimeout(() => {
        scrollToBottom();
      }, 100);
      
    } else {
      console.log('Message not for current conversation or missing data');
      console.log('Conversation match:', data.message?.conversation === conversation?._id);
    }
  });

  const handleMessageRead = useRef((data) => {
    
    if (data.conversationId === conversation?._id) {
      setMessages(prev => prev.map(msg => {
        
        if (msg.sender._id === user._id && data.readBy === otherParticipant?._id) {
        
          const alreadyRead = msg.readBy.some(read => read.user === data.readBy);
          if (!alreadyRead) {
            return {
              ...msg,
              readBy: [...msg.readBy, { user: data.readBy, readAt: data.readAt || new Date() }]
            };
          }
        }
        return msg;
      }));
    }
  });

  const handleTyping = useRef((data) => {
    
    // Prevent rapid typing events
    const now = Date.now();
    if (now - lastTypingTimeRef.current < 500) {
      return;
    }
    lastTypingTimeRef.current = now;

    if (data.conversationId === conversation?._id && data.userId !== user?._id) {
      console.log(data.user?.name);
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
  });

  const handleStopTyping = useRef((data) => {
    if (data.conversationId === conversation?._id && data.userId !== user?._id) {
      setIsTyping(false);
      setTypingUser(null);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  });

  const handleUserStatusChange = useRef((data) => {
  });

  useEffect(() => {
    
    const updateHandlers = () => {
      handleNewMessage.current = (data) => {
        if (data.message && data.message.conversation === conversation?._id) {
          setMessages(prev => {
            const messageExists = prev.some(msg => msg._id === data.message._id);
            
            if (messageExists) {
              return prev;
            }

            if (data.tempId) {
              const optimisticMessageExists = prev.some(msg => msg._id === data.tempId);
              if (optimisticMessageExists) {
                const updatedMessages = prev.map(msg => 
                  msg._id === data.tempId ? { ...data.message } : msg
                );
                return updatedMessages;
              }
            }

            const newMessages = [...prev, data.message];            
            if (data.message.sender._id !== user._id) {
              setTimeout(() => markMessagesAsRead(), 100);
            }
            
            return newMessages;
          });
          
          if (onConversationUpdate) onConversationUpdate();
          setTimeout(() => scrollToBottom(), 100);
        }
      };

      handleMessageRead.current = (data) => {
        
        if (data.conversationId === conversation?._id) {
          setMessages(prev => prev.map(msg => {
            if (msg.sender._id === user._id && data.readBy === otherParticipant?._id) {
              const alreadyRead = msg.readBy.some(read => read.user === data.readBy);
              if (!alreadyRead) {
                console.log(`✅ UPDATING message ${msg._id} as READ by ${data.readBy}`);
                return {
                  ...msg,
                  readBy: [...msg.readBy, { user: data.readBy, readAt: data.readAt || new Date() }]
                };
              }
            }
            return msg;
          }));
        }
      };

      handleTyping.current = (data) => {
        
        const now = Date.now();
        if (now - lastTypingTimeRef.current < 500) return;
        lastTypingTimeRef.current = now;

        if (data.conversationId === conversation?._id && data.userId !== user?._id) {
          setIsTyping(true);
          setTypingUser(data.user);
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 5000);
        }
      };

      handleStopTyping.current = (data) => {
        if (data.conversationId === conversation?._id && data.userId !== user?._id) {
          setIsTyping(false);
          setTypingUser(null);
          clearTimeout(typingTimeoutRef.current);
        }
      };

      handleUserStatusChange.current = (data) => {
      };
    };

    updateHandlers();
  }, [conversation, user, otherParticipant]);

  useEffect(() => {
    if (conversation) {
      if (conversationIdRef.current !== conversation._id) {
        setMessages([]);
        conversationIdRef.current = conversation._id;
      }
      fetchMessages();
      joinConversation(conversation._id);

      const cleanupNewMessage = onNewMessage((data) => {
        handleNewMessage.current(data);
      });
      const cleanupTyping = onTyping((data) => {
        handleTyping.current(data);
      });
      const cleanupStopTyping = onStopTyping((data) => {
        handleStopTyping.current(data);
      });
      const cleanupMessagesRead = onMessagesRead((data) => {
        handleMessageRead.current(data);
      });
      const cleanupUserStatusChange = onUserStatusChange((data) => {
        handleUserStatusChange.current(data);
      });

      return () => {
        leaveConversation(conversation._id);
        cleanupNewMessage();
        cleanupTyping();
        cleanupStopTyping();
        cleanupMessagesRead();
        cleanupUserStatusChange();
        
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      };
    }
  }, [conversation]);

  useEffect(() => {
    if (conversation && messages.length > 0) {
      setTimeout(() => {
        markMessagesAsRead();
      }, 500);
    }
  }, [conversation]);

  useEffect(() => {
    const handleFocus = () => {
      if (conversation && document.visibilityState === 'visible') {
        markMessagesAsRead();
      }
    };

    document.addEventListener('visibilitychange', handleFocus);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('focus', handleFocus);
    };
  }, [conversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation) return;

    setSending(true);
    
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const tempMessage = {
      _id: tempId,
      content: newMessage.trim(),
      sender: { _id: user._id, name: user.name, pic: user.pic },
      createdAt: new Date().toISOString(),
      readBy: [{ user: user._id, readAt: new Date() }], // Mark as read by sender only
      isOptimistic: true
    };
    
    setMessages(prev => {
      const newMessages = [...prev, tempMessage];
      return newMessages;
    });
    setNewMessage('');

    try {
      console.log('🔌 Sending message via socket:', {
        conversationId: conversation._id,
        content: newMessage.trim(),
        tempId: tempId
      });

      const success = sendSocketMessage('send_message', {
        conversationId: conversation._id,
        content: newMessage.trim(),
        tempId: tempId
      });

      if (!success) {
        throw new Error('Socket not connected');
      }
      sendSocketMessage('typing_stop', { conversationId: conversation._id });

      setTimeout(() => {
        setMessages(prev => {
          const messageStillOptimistic = prev.some(msg => msg._id === tempId && msg.isOptimistic);
          if (messageStillOptimistic) {
            const filteredMessages = prev.filter(msg => msg._id !== tempId);
            return filteredMessages;
          }
          return prev;
        });
      }, 5000);

    } catch (error) {
      console.error('Send message error:', error);
      setMessages(prev => {
        const filteredMessages = prev.filter(msg => msg._id !== tempId);
        console.log('Messages after error removal:', filteredMessages.length);
        return filteredMessages;
      });
    }
    setSending(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    const now = Date.now();
    if (now - lastTypingTimeRef.current > 1000) {
      sendSocketMessage('typing_start', { 
        conversationId: conversation._id 
      });
      lastTypingTimeRef.current = now;
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendSocketMessage('typing_stop', { conversationId: conversation._id });
    }, 2000);
  };

  const handleInputBlur = () => {
    sendSocketMessage('typing_stop', { conversationId: conversation._id });
  };


  useEffect(() => {
    if (messages.length > 0) {
      messages.forEach((msg, index) => {
        if (msg.sender._id === user._id) {
          console.log(`My message ${index + 1}:`, {
            content: msg.content,
            status: getMessageStatus(msg),
            readBy: msg.readBy.map(r => r.user)
          });
        }
      });
    }
  }, [messages]);
  const handleManualRefresh = () => {
    fetchMessages();
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


       //Connection Status Indicator 
      <div className={`flex items-center justify-between px-4 py-2 text-xs font-medium ${
        isConnected() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        <div className="flex items-center">
          {isConnected() ? (
            <>
              <FaWifi className="w-3 h-3 mr-1" />
              <span>Connected to chat</span>
            </>
          ) : (
            <>
              <FaExclamationTriangle className="w-3 h-3 mr-1" />
              <span>Disconnected - reconnecting...</span>
            </>
          )}
        </div>
        <button 
          onClick={handleManualRefresh}
          className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
        >
          Refresh
        </button>
      </div>

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

      // Messages 
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
                    {message.isOptimistic && ' (Sending...)'}
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
                        {getMessageStatus(message) === 'sending' && <LoadingSpinner size="xs" />}
                        {getMessageStatus(message) === 'sent' && <FaCheck className="text-gray-400" title="Sent" />}
                        {getMessageStatus(message) === 'delivered' && (
                          <FaCheckDouble className="text-gray-400" title="Delivered" />
                        )}
                        {getMessageStatus(message) === 'read' && (
                          <FaCheckDouble className="text-blue-500" title="Read" />
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

      //Message Input 
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
            onClick={sendMessage}
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