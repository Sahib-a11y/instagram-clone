import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import LoadingSpinner from '../common/LoadingSpinner';
import TimeAgo from '../common/TimeAgo';
import getApiUrl from '../../utils/api';
import { FaPaperPlane, FaArrowLeft, FaComments, FaCheck, FaCheckDouble, FaCircle, FaExclamationTriangle } from 'react-icons/fa';

const ChatWindow = ({ conversation, onBack, onConversationUpdate, onToggleFooter }) => {
  const { token, user } = useAuth();
  const {
    joinConversation,
    leaveConversation,
    sendMessage: sendSocketMessage,
    onNewMessage,
    onTyping,
    onStopTyping,
    onMessagesRead,
    isConnected,
    reconnect
  } = useSocket();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  // const [conversationMessages, setConversationMessages] = useState({});
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const stopTypingTimeoutRef = useRef(null);
  const conversationIdRef = useRef(null);
  const lastTypingTimeRef = useRef(0);
  const inputRef = useRef(null);
  const isMountedRef = useRef(true);
  const shouldScrollRef = useRef(true);
  const lastSentTypingRef = useRef('');
  const lastConversationUpdateRef = useRef(0); // NEW: Track last update time
  const hasFetchedRef = useRef(false); // Prevent multiple fetches

  // Use refs for socket handlers to prevent useEffect re-runs
  const handleNewMessageRef = useRef();
  // const handleTypingRef = useRef();
  // const handleStopTypingRef = useRef();
  // const handleMessageReadRef = useRef();

  const otherParticipant = conversation?.participants?.find(
    p => p._id !== user?._id
  );

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearTimeout(typingTimeoutRef.current);
      clearTimeout(stopTypingTimeoutRef.current);
    };
  }, []);

  // Debug socket connection
  useEffect(() => {
    console.log('🔌 ChatWindow: Socket connected?', isConnected());
    console.log('👤 ChatWindow: User:', user?._id);
    console.log('💬 ChatWindow: Conversation:', conversation?._id);
  }, [isConnected, user, conversation]);

  useEffect(() => {
    if (conversation && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 300);
    }
  }, [conversation]);

  // Reset fetch flag when conversation changes
  useEffect(() => {
    hasFetchedRef.current = false;
  }, [conversation?._id]);

  const fetchMessages = useCallback(async () => {
    if (!conversation || !isMountedRef.current) return;

    // Prevent multiple fetches for the same conversation
    if (hasFetchedRef.current === conversation._id) {
      console.log('⚠️ Messages already fetched for this conversation, skipping');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        getApiUrl(`/conversation/${conversation._id}/messages?limit=100`),
        {
          headers:
           {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (isMountedRef.current) {
          setMessages(data.messages || []);
          hasFetchedRef.current = conversation._id; // Mark as fetched
        }
      }
    } catch (error) {
      console.error('Fetch messages error:', error);
    }
    if (isMountedRef.current) {
      setLoading(false);
    }
  }, [conversation, token]);

  const markMessagesAsRead = useCallback(async () => {
    if (!conversation) return;

    try {
      const response = await fetch(getApiUrl(`/conversation/${conversation._id}/read`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        console.log('Messages marked as read');
      }
    } catch (error) {
      console.error('Mark read error:', error);
    }
  }, [conversation, token]);

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

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current && isMountedRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Check scroll position
  const checkScrollPosition = useCallback(() => {
    const messagesContainer = messagesEndRef.current?.parentElement;
    if (!messagesContainer) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    shouldScrollRef.current = distanceFromBottom <= 100;
  }, []);

  // Typing functions
  const sendStopTyping = useCallback(() => {
    if (!conversationIdRef.current || !isConnected()) return;
    
    if (lastSentTypingRef.current === 'stop') return;
    
    console.log('🛑 Sending stop typing');
    const success = sendSocketMessage('typing_stop', { 
      conversationId: conversationIdRef.current,
      userId: user._id
    });
    
    if (success) {
      lastSentTypingRef.current = 'stop';
    }
    
    if (stopTypingTimeoutRef.current) {
      clearTimeout(stopTypingTimeoutRef.current);
      stopTypingTimeoutRef.current = null;
    }
  }, [sendSocketMessage, user._id, isConnected]);

  const sendStartTyping = useCallback(() => {
    if (!conversationIdRef.current || !isConnected()) return;
    
    if (lastSentTypingRef.current === 'start') return;
    
    const now = Date.now();
    if (now - lastTypingTimeRef.current > 1000) {
      console.log('⌨️ Sending typing start');
      const success = sendSocketMessage('typing_start', { 
        conversationId: conversationIdRef.current,
        userId: user._id,
        user: { 
          _id: user._id, 
          name: user.name, 
          pic: user.pic 
        }
      });
      
      if (success) {
        lastSentTypingRef.current = 'start';
        lastTypingTimeRef.current = now;
      }
    }
  }, [sendSocketMessage, user._id, user.name, user.pic, isConnected]);

  // FIXED: Message handler with debounced conversation updates
  const handleNewMessage = useCallback((data) => {
    console.log('📨 New message received:', data);
    console.log('Current conversationId:', conversationIdRef.current);
    console.log('Message conversation:', data?.message?.conversation);

    if (!isMountedRef.current) return;

    const messageData = Array.isArray(data) ? data[0] : data;

    console.log('Message data:', messageData);

    if (messageData.message && messageData.message.conversation === conversationIdRef.current) {
      console.log('✅ Adding message to UI');

      setMessages(prev => {
        const messageExists = prev.some(msg => msg._id === messageData.message._id);

        if (messageExists) {
          console.log('⚠️ Message already exists, skipping');
          return prev;
        }

        // Replace optimistic message
        if (messageData.tempId) {
          console.log('🔄 Replacing optimistic message with tempId:', messageData.tempId);
          const updatedMessages = prev.map(msg =>
            msg._id === messageData.tempId ? { ...messageData.message } : msg
          );

          if (updatedMessages.some(msg => msg._id === messageData.message._id)) {
            console.log('✅ Optimistic message replaced');

            // Don't trigger conversation update for optimistic message replacements
            // This prevents unnecessary parent re-renders
            return updatedMessages;
          }
        }

        // Add new message
        console.log('➕ Adding new message to chat');
        const newMessages = [...prev, messageData.message];
        if (messageData.message.sender._id !== user._id) {
          console.log('📖 Marking messages as read');
          setTimeout(() => {
            markMessagesAsRead();
          }, 100);
        }

        return newMessages;
      });

      // FIXED: Only trigger conversation update for actual NEW messages (not from current user)
      // and use debouncing to prevent multiple rapid updates
      const now = Date.now();
      const shouldUpdate = messageData.message.sender._id !== user._id &&
                          now - lastConversationUpdateRef.current > 2000; // 2 second cooldown

      if (shouldUpdate && onConversationUpdate) {
        console.log('🔄 Triggering conversation update (new incoming message)');
        lastConversationUpdateRef.current = now;

        // Use setTimeout to prevent blocking and allow UI to update first
        setTimeout(() => {
          if (isMountedRef.current) {
            onConversationUpdate();
          }
        }, 100);
      }

      setTimeout(scrollToBottom, 100);
    } else {
      console.log('❌ Message not for current conversation');
    }
  }, [user._id, onConversationUpdate, markMessagesAsRead, scrollToBottom]);

  // Assign to ref to prevent useEffect re-runs
  handleNewMessageRef.current = handleNewMessage;

  const handleMessageRead = useCallback((data) => {
    console.log('📖 Message read receipt data:', data);
    
    if (!isMountedRef.current) return;
    
    const readDataArray = Array.isArray(data) ? data : [data];
    
    readDataArray.forEach((readData) => {
      if (readData.conversationId === conversationIdRef.current) {
        console.log('✅ Processing read receipt for conversation:', readData.conversationId);
        
        setMessages(prev => prev.map(msg => {
          if (msg.sender._id === user._id && readData.readBy === otherParticipant?._id) {
            const alreadyRead = msg.readBy?.some(read => read.user === readData.readBy);
            if (!alreadyRead) {
              console.log(`✅ UPDATING message ${msg._id} as READ by ${readData.readBy}`);
              return {
                ...msg,
                readBy: [...(msg.readBy || []), { 
                  user: readData.readBy, 
                  readAt: readData.readAt || new Date().toISOString() 
                }]
              };
            }
          }
          return msg;
        }));
      }
    });
  }, [user._id, otherParticipant?._id]);

  const handleTyping = useCallback((data) => {
    console.log('⌨️ TYPING EVENT RECEIVED:', data);
    console.log('Current conversationId:', conversationIdRef.current);
    console.log('Current user._id:', user?._id);

    if (!isMountedRef.current) return;

    const typingData = Array.isArray(data) ? data[0] : data;

    console.log('Typing data conversationId:', typingData.conversationId);
    console.log('Typing data userId:', typingData.userId);

    if (typingData.conversationId === conversationIdRef.current && typingData.userId !== user?._id) {
      console.log('✅ SHOWING TYPING INDICATOR for user:', typingData.user?.name);
      setIsTyping(true);
      setTypingUser(typingData.user);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          console.log('⏰ Hiding typing indicator (timeout)');
          setIsTyping(false);
          setTypingUser(null);
        }
      }, 3000);
    } else {
      console.log('❌ Not showing typing indicator - condition not met');
    }
  }, [user?._id]);

  const handleStopTyping = useCallback((data) => {
    console.log('🛑 STOP TYPING EVENT RECEIVED:', data);
    
    if (!isMountedRef.current) return;
    
    const stopTypingData = Array.isArray(data) ? data[0] : data;
    
    if (stopTypingData.conversationId === conversationIdRef.current && stopTypingData.userId !== user?._id) {
      console.log('✅ HIDING TYPING INDICATOR');
      setIsTyping(false);
      setTypingUser(null);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  }, [user?._id]);

  // Socket setup - only depend on conversation._id to prevent multiple runs
  useEffect(() => {
    if (conversation?._id && isMountedRef.current) {
      console.log('🎯 Setting up socket for conversation:', conversation._id);

      conversationIdRef.current = conversation._id;

      fetchMessages();

      const cleanupNewMessage = onNewMessage(handleNewMessageRef.current);
      const cleanupTyping = onTyping(handleTyping);
      const cleanupStopTyping = onStopTyping(handleStopTyping);
      const cleanupMessagesRead = onMessagesRead(handleMessageRead);

      console.log('✅ Socket listeners registered');

      const joinIfConnected = () => {
        if (isConnected()) {
          console.log('🔗 Socket connected, joining conversation');
          joinConversation(conversation._id);
        }
      };

      joinIfConnected();

      const connectionCheckInterval = setInterval(() => {
        if (isConnected() && conversationIdRef.current === conversation._id) {
          console.log('🔗 Socket now connected, joining conversation');
          joinConversation(conversation._id);
          clearInterval(connectionCheckInterval);
        }
      }, 1000);

      // Test socket connection
      const testInterval = setInterval(() => {
        if (isConnected()) {
          console.log('🔄 Socket test - connected, conversation:', conversationIdRef.current);
        } else {
          console.log('❌ Socket test - disconnected');
        }
      }, 5000);

      return () => {
        console.log('🧹 Cleaning up socket listeners for conversation:', conversation._id);
        clearInterval(connectionCheckInterval);
        clearInterval(testInterval);
        leaveConversation(conversation._id);
        cleanupNewMessage();
        cleanupTyping();
        cleanupStopTyping();
        cleanupMessagesRead();

        clearTimeout(typingTimeoutRef.current);
        clearTimeout(stopTypingTimeoutRef.current);

        if (isMountedRef.current) {
          setIsTyping(false);
          setTypingUser(null);
        }
      };
    }
  }, [conversation?._id, isConnected, joinConversation, leaveConversation, onNewMessage, onTyping, onStopTyping, onMessagesRead, handleNewMessageRef, handleTyping, handleStopTyping, handleMessageRead, user._id, user.name, user.pic, fetchMessages]);

  // Mark messages as read when conversation changes
  useEffect(() => {
    if (conversation && messages.length > 0 && isMountedRef.current) {
      setTimeout(markMessagesAsRead, 500);
    }
  }, [conversation?._id, messages.length, markMessagesAsRead]);

  // Scroll to bottom when messages or typing state changes
  useEffect(() => {
    if (isMountedRef.current) {
      scrollToBottom();
    }
  }, [messages, isTyping, scrollToBottom]);

  // Add scroll event listener
  useEffect(() => {
    const messagesContainer = messagesEndRef.current?.parentElement;
    if (messagesContainer) {
      messagesContainer.addEventListener('scroll', checkScrollPosition);
      return () => {
        messagesContainer.removeEventListener('scroll', checkScrollPosition);
      };
    }
  }, [checkScrollPosition]);

  // Send message function
  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation || !isMountedRef.current) return;

    setSending(true);

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const tempMessage = {
      _id: tempId,
      content: newMessage.trim(),
      sender: { _id: user._id, name: user.name, pic: user.pic },
      createdAt: new Date().toISOString(),
      readBy: [{ user: user._id, readAt: new Date().toISOString() }],
      isOptimistic: true
    };

    // Add optimistic message
    console.log('➕ Adding optimistic message with tempId:', tempId);
    setMessages(prev => [...prev, tempMessage]);
    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      // Try to send via socket first
      if (isConnected()) {
        console.log('📡 Sending message via Socket.IO:', {
          conversationId: conversation._id,
          content: messageContent,
          tempId: tempId
        });

        const socketSuccess = sendSocketMessage('send_message', {
          conversationId: conversation._id,
          content: messageContent,
          tempId: tempId
        });

        if (socketSuccess) {
          console.log('✅ Message sent via socket');
          const timeoutId = setTimeout(() => {
            if (isMountedRef.current) {
              setSending(false);
              setMessages((prevMessages) => {
                const updatedMessages = [...prevMessages];
                const messageIndex = updatedMessages.findIndex(msg => msg.tempId === tempId);
                if (messageIndex !== -1) {
                  updatedMessages[messageIndex] = {
                    ...updatedMessages[messageIndex],
                    isOptimistic: false,
                    error: true
                  };
                }
                return updatedMessages;
              });
            }
          }, 15000); // 15 seconds timeout

          const clearOptimisticTimeout = () => clearTimeout(timeoutId);
          onNewMessage((newMessage) => {
            if (newMessage.tempId === tempId) {
              clearOptimisticTimeout();
              handleNewMessageRef.current(newMessage); // Use existing ref for message handling
            }
          });

          sendStopTyping();
          if (isMountedRef.current) {
            setSending(false);
          }
          return;
        }
      }

      // Fallback to HTTP API
      console.log('📡 Sending message via HTTP API (fallback):', {
        conversationId: conversation._id,
        content: messageContent,
        tempId: tempId
      });

      const response = await fetch(getApiUrl('/message'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          conversationId: conversation._id,
          content: messageContent
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Message sent successfully via HTTP:', data.message);

        // Replace optimistic message with real message
        setMessages(prev => prev.map(msg =>
          msg._id === tempId ? { ...data.message, isOptimistic: false } : msg
        ));

        // Trigger conversation update for the chat list
        if (onConversationUpdate) {
          setTimeout(() => {
            if (isMountedRef.current) {
              onConversationUpdate();
            }
          }, 100);
        }
      } else {
        throw new Error('Failed to send message');
      }

      sendStopTyping();

    } catch (error) {
      console.error('Send message error:', error);
      if (isMountedRef.current) {
        setMessages(prev => prev.filter(msg => msg._id !== tempId));
      }
    }
    if (isMountedRef.current) {
      setSending(false);
    }
  };

  // Input handler
  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setNewMessage(value);
    
    if (!conversation) return;

    if (stopTypingTimeoutRef.current) {
      clearTimeout(stopTypingTimeoutRef.current);
    }

    if (value.trim()) {
      stopTypingTimeoutRef.current = setTimeout(() => {
        sendStartTyping();
        
        stopTypingTimeoutRef.current = setTimeout(() => {
          console.log('⏰ User stopped typing (inactivity), sending typing_stop');
          sendStopTyping();
        }, 2000);
      }, 100);
    } else {
      console.log('⌨️ Input empty, sending typing_stop');
      sendStopTyping();
    }
  }, [conversation, sendStartTyping, sendStopTyping]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleManualRefresh = () => {
    fetchMessages();
  };

  const handleInputFocus = () => {
    if (onToggleFooter) {
      onToggleFooter(true);
    }
  };

  const handleInputBlur = () => {
    sendStopTyping();
    
    if (!newMessage.trim() && onToggleFooter) {
      onToggleFooter(false);
    }
  };

  // Rest of the component remains the same...
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
      {/* Connection Status Indicator */}
      {!isConnected() && (
        <div className="flex items-center justify-between px-4 py-2 text-xs font-medium bg-red-100 text-red-800">
          <div className="flex items-center">
            <FaExclamationTriangle className="w-3 h-3 mr-1" />
            <span>Disconnected - reconnecting...</span>
          </div>
          <button 
            onClick={handleManualRefresh}
            className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
          >
            Refresh
          </button>
        </div>
      )}

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
            {isTyping ? (
              <span className="text-blue-500 animate-pulse">
                {typingUser?.name || 'Someone'} is typing...
              </span>
            ) : otherParticipant?.isOnline ? (
              <span className="text-green-500">Online</span>
            ) : (
              <span>Last seen <TimeAgo date={otherParticipant?.lastActive} /></span>
            )}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50" onScroll={checkScrollPosition}>
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
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-900 border border-gray-200 px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {typingUser?.name || 'Someone'} is typing...
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input - ALWAYS VISIBLE */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="flex space-x-3">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
            disabled={sending}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {sending ? <LoadingSpinner size="sm" /> : <FaPaperPlane className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ChatWindow);