import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';

export const useSocket = () => {
  const { token, user } = useAuth();
  const socketRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (token && user) {
      const initializeSocket = () => {
        
        if (socketRef.current) {
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
          console.log('Connected to server');
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
      };

      initializeSocket();

      return () => {
        if (socketRef.current) {
          console.log('Cleaning up socket connection');
          socketRef.current.removeAllListeners();
          socketRef.current.disconnect();
        }
      };
    }
  }, [token, user]);

  const joinConversation = useCallback((conversationId) => {
    if (socketRef.current?.connected && conversationId) {
      socketRef.current.emit('join_conversation', conversationId);
      console.log(`Joining conversation: ${conversationId}`);
    } else {
      console.warn('Socket not connected, cannot join conversation');
    }
  }, []);

  const leaveConversation = useCallback((conversationId) => {
    if (socketRef.current?.connected && conversationId) {
      socketRef.current.emit('leave_conversation', conversationId);
      console.log(`Leaving conversation: ${conversationId}`);
    }
  }, []);

  const sendMessage = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      console.log(`Sending ${event}:`, data);
      socketRef.current.emit(event, data);
      return true;
    } else {
      console.error('Socket not connected, cannot send message');
      return false;
    }
  }, []);

  
  const onNewMessage = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.on('new_message', callback);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off('new_message', callback);
      }
    };
  }, []);

  const onTyping = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.on('user_typing', callback);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off('user_typing', callback);
      }
    };
  }, []);

  const onStopTyping = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.on('user_stop_typing', callback);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off('user_stop_typing', callback);
      }
    };
  }, []);

  const onMessagesRead = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.on('messages_read', callback);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off('messages_read', callback);
      }
    };
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

  const offNewMessage = useCallback((callback) => {
  if (socketRef.current) {
    socketRef.current.off('new_message', callback);
  }
}, []);

const offTyping = useCallback((callback) => {
  if (socketRef.current) {
    socketRef.current.off('user_typing', callback);
  }
}, []);

const offStopTyping = useCallback((callback) => {
  if (socketRef.current) {
    socketRef.current.off('user_stop_typing', callback);
  }
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
    offNewMessage,
    offTyping,
    offStopTyping
  };
};