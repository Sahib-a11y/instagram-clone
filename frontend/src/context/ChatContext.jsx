import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';
import io from 'socket.io-client';

// Initial State
const initialState = {
  socket: null,
  conversations: [],
  activeChat: null,
  messages: {},
  onlineUsers: new Set(),
  typingUsers: {},
  unreadCounts: {},
  loading: false,
  error: null
};

// Action Types
const CHAT_ACTIONS = {
  SET_SOCKET: 'SET_SOCKET',
  SET_CONVERSATIONS: 'SET_CONVERSATIONS',
  SET_ACTIVE_CHAT: 'SET_ACTIVE_CHAT',
  SET_MESSAGES: 'SET_MESSAGES',
  ADD_MESSAGE: 'ADD_MESSAGE',
  UPDATE_MESSAGE_STATUS: 'UPDATE_MESSAGE_STATUS',
  SET_ONLINE_USERS: 'SET_ONLINE_USERS',
  SET_TYPING: 'SET_TYPING',
  SET_UNREAD_COUNT: 'SET_UNREAD_COUNT',
  MARK_MESSAGES_READ: 'MARK_MESSAGES_READ',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR'
};

// Reducer
const chatReducer = (state, action) => {
  switch (action.type) {
    case CHAT_ACTIONS.SET_SOCKET:
      return { ...state, socket: action.payload };

    case CHAT_ACTIONS.SET_CONVERSATIONS:
      return { ...state, conversations: action.payload };

    case CHAT_ACTIONS.SET_ACTIVE_CHAT:
      return { ...state, activeChat: action.payload };

    case CHAT_ACTIONS.SET_MESSAGES:
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.conversationId]: action.payload.messages
        }
      };

    case CHAT_ACTIONS.ADD_MESSAGE:
      const { conversationId, message } = action.payload;
      return {
        ...state,
        messages: {
          ...state.messages,
          [conversationId]: [
            ...(state.messages[conversationId] || []),
            message
          ]
        }
      };

    case CHAT_ACTIONS.UPDATE_MESSAGE_STATUS:
      const { messageId, status } = action.payload;
      return {
        ...state,
        messages: Object.keys(state.messages).reduce((acc, convId) => {
          acc[convId] = state.messages[convId].map(msg =>
            msg._id === messageId ? { ...msg, status } : msg
          );
          return acc;
        }, {})
      };

    case CHAT_ACTIONS.SET_ONLINE_USERS:
      return { ...state, onlineUsers: new Set(action.payload) };

    case CHAT_ACTIONS.SET_TYPING:
      return {
        ...state,
        typingUsers: {
          ...state.typingUsers,
          [action.payload.conversationId]: action.payload.isTyping 
            ? action.payload.userId 
            : null
        }
      };

    case CHAT_ACTIONS.SET_UNREAD_COUNT:
      return {
        ...state,
        unreadCounts: {
          ...state.unreadCounts,
          [action.payload.conversationId]: action.payload.count
        }
      };

    case CHAT_ACTIONS.MARK_MESSAGES_READ:
      const updatedMessages = { ...state.messages };
      if (updatedMessages[action.payload]) {
        updatedMessages[action.payload] = updatedMessages[action.payload].map(msg => ({
          ...msg,
          status: msg.status === 'delivered' ? 'read' : msg.status
        }));
      }
      return {
        ...state,
        messages: updatedMessages,
        unreadCounts: {
          ...state.unreadCounts,
          [action.payload]: 0
        }
      };

    case CHAT_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };

    case CHAT_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };

    default:
      return state;
  }
};

// Create Context
const ChatContext = createContext();

// Chat Provider Component
export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { user, token, isAuthenticated } = useAuth();

  // Initialize Socket Connection
  useEffect(() => {
    if (isAuthenticated && user && token && !state.socket) {
      const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        auth: { token }
      });

      socket.on('connect', () => {
        console.log('✅ Socket connected');
        dispatch({ type: CHAT_ACTIONS.SET_SOCKET, payload: socket });
        
        // Join user's room
        socket.emit('user_online', user._id);
      });

      socket.on('online_users', (users) => {
        dispatch({ type: CHAT_ACTIONS.SET_ONLINE_USERS, payload: users });
      });

      socket.on('new_message', (message) => {
        dispatch({
          type: CHAT_ACTIONS.ADD_MESSAGE,
          payload: {
            conversationId: message.conversation,
            message
          }
        });
        
        // Update unread count if not active chat
        if (state.activeChat !== message.conversation) {
          dispatch({
            type: CHAT_ACTIONS.SET_UNREAD_COUNT,
            payload: {
              conversationId: message.conversation,
              count: (state.unreadCounts[message.conversation] || 0) + 1
            }
          });
        }
      });

      socket.on('message_status_updated', ({ messageId, status }) => {
        dispatch({
          type: CHAT_ACTIONS.UPDATE_MESSAGE_STATUS,
          payload: { messageId, status }
        });
      });

      socket.on('user_typing', ({ conversationId, userId, isTyping }) => {
        if (userId !== user._id) {
          dispatch({
            type: CHAT_ACTIONS.SET_TYPING,
            payload: { conversationId, userId, isTyping }
          });
        }
      });

      socket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [isAuthenticated, user, token]);

  // Fetch Conversations
  const fetchConversations = async () => {
    dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: true });
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/chat/conversations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        dispatch({ type: CHAT_ACTIONS.SET_CONVERSATIONS, payload: data.conversations });
      }
    } catch (error) {
      console.error('Fetch conversations error:', error);
      dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: 'Failed to load conversations' });
    }
    
    dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: false });
  };

  // Fetch Messages
  const fetchMessages = async (conversationId) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/chat/messages/${conversationId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        dispatch({
          type: CHAT_ACTIONS.SET_MESSAGES,
          payload: { conversationId, messages: data.messages }
        });
      }
    } catch (error) {
      console.error('Fetch messages error:', error);
    }
  };

  // Send Message
  const sendMessage = async (recipientId, content, type = 'text') => {
    if (!content.trim()) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ recipientId, content, type })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add message locally (will be confirmed via socket)
        dispatch({
          type: CHAT_ACTIONS.ADD_MESSAGE,
          payload: {
            conversationId: data.message.conversation,
            message: data.message
          }
        });

        return data.message;
      }
    } catch (error) {
      console.error('Send message error:', error);
      return null;
    }
  };

  // Start Conversation
  const startConversation = async (userId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/chat/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        const data = await response.json();
        return data.conversation;
      }
    } catch (error) {
      console.error('Start conversation error:', error);
    }
    return null;
  };

  // Mark Messages as Read
  const markMessagesAsRead = async (conversationId) => {
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/chat/read/${conversationId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      dispatch({
        type: CHAT_ACTIONS.MARK_MESSAGES_READ,
        payload: conversationId
      });
    } catch (error) {
      console.error('Mark messages as read error:', error);
    }
  };

  // Send Typing Indicator
  const sendTyping = (conversationId, isTyping) => {
    if (state.socket) {
      state.socket.emit('typing', { conversationId, isTyping });
    }
  };

  // Set Active Chat
  const setActiveChat = (conversationId) => {
    dispatch({ type: CHAT_ACTIONS.SET_ACTIVE_CHAT, payload: conversationId });
    
    if (conversationId) {
      // Mark messages as read when opening chat
      markMessagesAsRead(conversationId);
      
      // Fetch messages if not already loaded
      if (!state.messages[conversationId]) {
        fetchMessages(conversationId);
      }
    }
  };

  const value = {
    ...state,
    fetchConversations,
    fetchMessages,
    sendMessage,
    startConversation,
    markMessagesAsRead,
    sendTyping,
    setActiveChat
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

// Custom hook to use chat context
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export default ChatContext;