import { useState, useCallback, useRef, useEffect } from 'react';
import { useSocket } from './useSocket';

export const useMessages = (conversationId, currentUser) => {
  const { sendMessage, onNewMessage, onMessagesRead } = useSocket();
  const [messages, setMessages] = useState([]);
  const [optimisticMessages, setOptimisticMessages] = useState(new Map());

  useEffect(() => {
    if (!conversationId) return;

    const handleNewMessage = (data) => {
      if (data.message && data.message.conversation === conversationId) {
        setMessages(prev => {
        
          const messageExists = prev.some(msg => msg._id === data.message._id);
          if (messageExists) return prev;

         
          if (data.tempId) {
            const optimisticExists = prev.some(msg => msg._id === data.tempId);
            if (optimisticExists) {
              return prev.map(msg => 
                msg._id === data.tempId ? { ...data.message } : msg
              );
            }
          }

          
          return [...prev, data.message];
        });

        
        if (data.tempId) {
          setOptimisticMessages(prev => {
            const newMap = new Map(prev);
            newMap.delete(data.tempId);
            return newMap;
          });
        }
      }
    };

    const cleanupNewMessage = onNewMessage(handleNewMessage);

    return cleanupNewMessage;
  }, [conversationId, onNewMessage]);

 
  useEffect(() => {
    if (!conversationId || !currentUser) return;

    const handleMessagesRead = (data) => {
      if (data.conversationId === conversationId) {
        setMessages(prev => prev.map(msg => {
         
          if (msg.sender._id === currentUser._id && data.readBy) {
            const alreadyRead = msg.readBy?.some(read => read.user === data.readBy);
            if (!alreadyRead) {
              return {
                ...msg,
                readBy: [...(msg.readBy || []), { 
                  user: data.readBy, 
                  readAt: data.readAt || new Date() 
                }]
              };
            }
          }
          return msg;
        }));
      }
    };

    const cleanupMessagesRead = onMessagesRead(handleMessagesRead);

    return cleanupMessagesRead;
  }, [conversationId, currentUser, onMessagesRead]);

 
  const sendMessageOptimistic = useCallback(async (content) => {
    if (!conversationId || !content.trim()) return null;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const tempMessage = {
      _id: tempId,
      content: content.trim(),
      sender: { 
        _id: currentUser._id, 
        name: currentUser.name, 
        pic: currentUser.pic 
      },
      conversation: conversationId,
      createdAt: new Date().toISOString(),
      readBy: [{ user: currentUser._id, readAt: new Date() }],
      isOptimistic: true
    };

   
    setMessages(prev => [...prev, tempMessage]);
    setOptimisticMessages(prev => new Map(prev.set(tempId, tempMessage)));

   
    const success = sendMessage('send_message', {
      conversationId,
      content: content.trim(),
      tempId
    });

    if (!success) {
      
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
      setOptimisticMessages(prev => {
        const newMap = new Map(prev);
        newMap.delete(tempId);
        return newMap;
      });
      return null;
    }

    return tempId;
  }, [conversationId, currentUser, sendMessage]);

 
  const markAsRead = useCallback(() => {
    if (!conversationId) return;

    sendMessage('mark_messages_read', { conversationId });
  }, [conversationId, sendMessage]);

 
  const setInitialMessages = useCallback((newMessages) => {
    setMessages(newMessages || []);
  }, []);

  
  const getMessageStatus = useCallback((message, otherParticipantId) => {
    if (!message) return 'unknown';
    if (message.isOptimistic) return 'sending';
    
    const isRead = message.readBy?.some(read => read.user === otherParticipantId);
    const isDelivered = message.readBy?.some(read => read.user !== currentUser._id);
    
    if (isRead) return 'read';
    if (isDelivered) return 'delivered';
    return 'sent';
  }, [currentUser]);

  return {
    
    messages,
    optimisticMessages: Array.from(optimisticMessages.values()),
    sendMessage: sendMessageOptimistic,
    markAsRead,
    setMessages: setInitialMessages,
    getMessageStatus
  };
};

export default useMessages;