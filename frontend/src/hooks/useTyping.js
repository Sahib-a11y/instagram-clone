import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from './useSocket';

export const useTyping = (conversationId, currentUserId) => {
  const { sendMessage, onTyping, onStopTyping } = useSocket();
  const [typingUsers, setTypingUsers] = useState(new Map());
  const typingTimeoutRef = useRef(null);
  const lastTypingTimeRef = useRef(0);

  
  useEffect(() => {
    if (!conversationId) return;

    const handleTyping = (data) => {
      if (data.conversationId === conversationId && data.userId !== currentUserId) {
        
        const now = Date.now();
        if (now - lastTypingTimeRef.current < 500) return;
        lastTypingTimeRef.current = now;

        setTypingUsers(prev => {
          const newMap = new Map(prev);
          newMap.set(data.userId, {
            userId: data.userId,
            userName: data.user?.name,
            timestamp: Date.now()
          });
          return newMap;
        });

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
          setTypingUsers(prev => {
            const newMap = new Map(prev);
            newMap.delete(data.userId);
            return newMap;
          });
        }, 3000);
      }
    };

    const handleStopTyping = (data) => {
      if (data.conversationId === conversationId && data.userId !== currentUserId) {
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          newMap.delete(data.userId);
          return newMap;
        });

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }
    };

    const cleanupTyping = onTyping(handleTyping);
    const cleanupStopTyping = onStopTyping(handleStopTyping);

    return () => {
      cleanupTyping();
      cleanupStopTyping();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId, currentUserId, onTyping, onStopTyping]);
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers(prev => {
        const newMap = new Map();
        for (const [userId, typingData] of prev) {
          if (now - typingData.timestamp < 3500) { 
            newMap.set(userId, typingData);
          }
        }
        return newMap;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);


  const startTyping = useCallback(() => {
    if (!conversationId) return;

    const now = Date.now();
    if (now - lastTypingTimeRef.current > 1000) {
      sendMessage('typing_start', { conversationId });
      lastTypingTimeRef.current = now;
    }
  }, [conversationId, sendMessage]);


  const stopTyping = useCallback(() => {
    if (!conversationId) return;
    sendMessage('typing_stop', { conversationId });
  }, [conversationId, sendMessage]);

  const getTypingDisplayText = useCallback(() => {
    if (typingUsers.size === 0) return null;
    
    const users = Array.from(typingUsers.values());
    
    if (users.length === 1) {
      return `${users[0].userName} is typing...`;
    } else if (users.length === 2) {
      return `${users[0].userName} and 1 other are typing...`;
    } else {
      return `${users[0].userName} and ${users.length - 1} others are typing...`;
    }
  }, [typingUsers]);

  const isUserTyping = useCallback((userId) => {
    return typingUsers.has(userId);
  }, [typingUsers]);

  const isTyping = typingUsers.size > 0;

  return {
    typingUsers: Array.from(typingUsers.values()),
    isTyping,
    typingDisplayText: getTypingDisplayText(),
    startTyping,
    stopTyping,
    isUserTyping,
    getTypingDisplayText
  };
};

export default useTyping;