import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';

export const useSocket = () => {
  const { token, user } = useAuth();
  const socketRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const eventListenersRef = useRef(new Map());

  useEffect(() => {
    if (token && user) {
      const currentEventListeners = eventListenersRef.current;

      const initializeSocket = () => {

        if (socketRef.current) {
          socketRef.current.removeAllListeners();
          socketRef.current.disconnect();
        }

        console.log('Initializing socket connection...');

        socketRef.current = io(process.env.REACT_APP_API_URL, {
          auth: {
            token: token
          },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: maxReconnectAttempts,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 20000
        });

        socketRef.current.on('connect', () => {
          console.log('Connected to server with ID:', socketRef.current.id);
          reconnectAttemptsRef.current = 0;
        });

        socketRef.current.on('disconnect', (reason) => {
          console.log('Disconnected from server:', reason);
        });

        socketRef.current.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          reconnectAttemptsRef.current += 1;

          if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
          }
        });

        socketRef.current.on('reconnect', (attempt) => {
          console.log(`Reconnected after ${attempt} attempts`);
        });

        socketRef.current.on('reconnect_error', (error) => {
          console.error('Reconnection error:', error);
        });

        socketRef.current.on('reconnect_failed', () => {
          console.error('Reconnection failed');
        });

        socketRef.current.onAny((event, ...args) => {
          console.log(`Socket event "${event}" received:`, args);
        });
      };

      initializeSocket();

      return () => {
        if (socketRef.current) {
          socketRef.current.removeAllListeners();
          socketRef.current.disconnect();
          socketRef.current = null;
        }
        currentEventListeners.clear();
      };
    }
  }, [token, user]);

  const joinConversation = useCallback((conversationId) => {
    if (socketRef.current?.connected && conversationId) {
      socketRef.current.emit('join_conversation', { conversationId });
    } else {
    }
  }, []);

  const leaveConversation = useCallback((conversationId) => {
    if (socketRef.current?.connected && conversationId) {
      socketRef.current.emit('leave_conversation', { conversationId });
    }
  }, []);

  const sendMessage = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
      return true;
    } else {
      return false;
    }
  }, []);

  const onNewMessage = useCallback((callback) => {
    if (socketRef.current) {
      const eventName = 'new_message';
      socketRef.current.on(eventName, callback);
      console.log('🎯 Registered new_message listener');
      
      
      const listenerId = `${eventName}_${Date.now()}`;
      eventListenersRef.current.set(listenerId, { event: eventName, callback });
      
      return () => {
        if (socketRef.current) {
          socketRef.current.off(eventName, callback);
          eventListenersRef.current.delete(listenerId);
        }
      };
    }
    return () => {};
  }, []);

  const onTyping = useCallback((callback) => {
    if (socketRef.current) {
      const eventName = 'user_typing';
      socketRef.current.on(eventName, callback);
      
      const listenerId = `${eventName}_${Date.now()}`;
      eventListenersRef.current.set(listenerId, { event: eventName, callback });
      
      return () => {
        if (socketRef.current) {
          socketRef.current.off(eventName, callback);
          eventListenersRef.current.delete(listenerId);
        }
      };
    }
    return () => {};
  }, []);

  const onStopTyping = useCallback((callback) => {
    if (socketRef.current) {
      const eventName = 'user_stop_typing';
      socketRef.current.on(eventName, callback);
      console.log('🎯 Registered user_stop_typing listener');
      
      const listenerId = `${eventName}_${Date.now()}`;
      eventListenersRef.current.set(listenerId, { event: eventName, callback });
      
      return () => {
        if (socketRef.current) {
          socketRef.current.off(eventName, callback);
          eventListenersRef.current.delete(listenerId);
        }
      };
    }
    return () => {};
  }, []);

  const onMessagesRead = useCallback((callback) => {
    if (socketRef.current) {
      const eventName = 'messages_read';
      socketRef.current.on(eventName, callback);

      
      const listenerId = `${eventName}_${Date.now()}`;
      eventListenersRef.current.set(listenerId, { event: eventName, callback });
      
      return () => {
        if (socketRef.current) {
          socketRef.current.off(eventName, callback);
          eventListenersRef.current.delete(listenerId);

        }
      };
    }
    return () => {};
  }, []);

  const onUserStatusChange = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.on('user_status_change', callback);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off('user_status_change', callback);
      }
    };
  }, []);

  const isConnected = useCallback(() => {
    return socketRef.current?.connected || false;
  }, []);

  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.connect();
    }
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
    isConnected,
    reconnect,
    getSocket
  };
};