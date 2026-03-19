import { useEffect, useRef, useCallback, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import getApiUrl from '../utils/api';

export const useSocket = () => {
  const { token, user } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!token || !user) return;

    // Socket.IO requires persistent connections — not supported on Vercel serverless
    // Skip connection in production Vercel environment
    const isVercel = window.location.hostname.includes('vercel.app') ||
                     process.env.REACT_APP_DISABLE_SOCKET === 'true';
    if (isVercel) {
      console.log('⚠️ Socket disabled: serverless environment detected');
      return;
    }

    try {
      // Disconnect existing socket if present
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      console.log('🔌 Connecting to socket URL:', getApiUrl('/'));

      // Create socket connection
      socketRef.current = io(getApiUrl('/'), {
        auth: {
          token: token.replace('Bearer ', '')
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      socketRef.current.on('connect', () => {
        console.log('🔗 Socket connected');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
        setIsConnected(false);

        // Auto-reconnect logic
        if (reason !== 'io server disconnect' && reason !== 'io client disconnect') {
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            const baseDelayMs = 2000;
            const delay = baseDelayMs * (2 ** reconnectAttemptsRef.current);

            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttemptsRef.current += 1;
              connect();
            }, delay);
          }
        }
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

    } catch (error) {
      console.error('Failed to create socket connection:', error);
    }
  }, [token, user]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('🔌 Disconnecting socket');
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    reconnectAttemptsRef.current = 0;
  }, []);

  const reconnect = useCallback(() => {
    console.log('🔄 Manual reconnect requested');
    disconnect();
    setTimeout(() => connect(), 1000);
  }, [connect, disconnect]);

  // Connect on mount when user is available
  useEffect(() => {
    if (user && token) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [user, token, connect, disconnect]);

  const joinConversation = useCallback((conversationId) => {
    if (socketRef.current && isConnected) {
      console.log('📥 Joining conversation:', conversationId);
      socketRef.current.emit('join_conversation', { conversationId });
      return true;
    }
    console.log('❌ Cannot join conversation: socket not connected');
    return false;
  }, [isConnected]);

  const leaveConversation = useCallback((conversationId) => {
    if (socketRef.current && isConnected) {
      console.log('📤 Leaving conversation:', conversationId);
      socketRef.current.emit('leave_conversation', { conversationId });
      return true;
    }
    console.log('❌ Cannot leave conversation: socket not connected');
    return false;
  }, [isConnected]);

  const sendMessage = useCallback((event, data) => {
    if (socketRef.current && isConnected) {
      console.log('📡 Sending socket message:', event, data);
      socketRef.current.emit(event, data);
      return true;
    }
    console.log('❌ Cannot send message: socket not connected');
    return false;
  }, [isConnected]);

  const onNewMessage = useCallback((callback) => {
    if (!socketRef.current) return () => {};

    const handler = (data) => {
      console.log('📨 New message received via socket:', data);
      console.log('Socket ID:', socketRef.current.id);
      console.log('Socket connected:', socketRef.current.connected);
      callback(data);
    };

    socketRef.current.on('new_message', handler);
    console.log('✅ Registered new_message listener');

    return () => {
      if (socketRef.current) {
        socketRef.current.off('new_message', handler);
        console.log('🧹 Unregistered new_message listener');
      }
    };
  }, [socketRef]);

  const onTyping = useCallback((callback) => {
    if (!socketRef.current) return () => {};

    const handler = (data) => {
      if (socketRef.current) {
        console.log('⌨️ Typing event received:', data);
        console.log('Socket ID:', socketRef.current.id);
        console.log('Socket connected:', socketRef.current.connected);
      }
      callback(data);
    };

    socketRef.current.on('user_typing', handler);
    console.log('✅ Registered user_typing listener');

    return () => {
      if (socketRef.current) {
        socketRef.current.off('user_typing', handler);
        console.log('🧹 Unregistered user_typing listener');
      }
    };
  }, []);

  const onStopTyping = useCallback((callback) => {
    if (!socketRef.current) return () => {};

    const handler = (data) => {
      console.log('🛑 Stop typing event received:', data);
      callback(data);
    };

    socketRef.current.on('user_stop_typing', handler);

    return () => {
      if (socketRef.current) {
        socketRef.current.off('user_stop_typing', handler);
      }
    };
  }, []);

  const onMessagesRead = useCallback((callback) => {
    if (!socketRef.current) return () => {};

    const handler = (data) => {
      console.log('📖 Messages read event received:', data);
      callback(data);
    };

    socketRef.current.on('messages_read', handler);

    return () => {
      if (socketRef.current) {
        socketRef.current.off('messages_read', handler);
      }
    };
  }, []);

  const onUserStatusChange = useCallback((callback) => {
    if (!socketRef.current) return () => {};

    const handler = (data) => {
      console.log('👤 User status change:', data);
      callback(data);
    };

    socketRef.current.on('user_status_change', handler);

    return () => {
      if (socketRef.current) {
        socketRef.current.off('user_status_change', handler);
      }
    };
  }, []);

  const on = useCallback((event, callback) => {
    if (!socketRef.current) return () => {};

    const handler = (data) => {
      console.log(`📡 Custom event '${event}' received:`, data);
      callback(data);
    };

    socketRef.current.on(event, handler);

    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, handler);
      }
    };
  }, []);

  const getSocket = useCallback(() => {
    return socketRef.current;
  }, []);

  return {
    joinConversation,
    leaveConversation,
    sendMessage,
    onNewMessage,
    onTyping,
    onStopTyping,
    onMessagesRead,
    onUserStatusChange,
    on,
    isConnected: () => isConnected,
    reconnect,
    getSocket
  };
};
