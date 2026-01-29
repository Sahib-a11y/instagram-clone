import { useCallback } from 'react';

// Note: Socket.IO disabled for Vercel serverless deployment
// Real-time features will use polling instead of WebSockets
export const useSocket = () => {
  // Mock socket functions for compatibility
  const joinConversation = useCallback((conversationId) => {
    console.log('Socket disabled: join_conversation', conversationId);
  }, []);

  const leaveConversation = useCallback((conversationId) => {
    console.log('Socket disabled: leave_conversation', conversationId);
  }, []);

  const sendMessage = useCallback((event, data) => {
    console.log('Socket disabled: send_message', { event, data });
    // Return false to indicate message wasn't sent via socket
    return false;
  }, []);

  const onNewMessage = useCallback((callback) => {
    // No-op for serverless deployment
    return () => {};
  }, []);

  const onTyping = useCallback((callback) => {
    // No-op for serverless deployment
    return () => {};
  }, []);

  const onStopTyping = useCallback((callback) => {
    // No-op for serverless deployment
    return () => {};
  }, []);

  const onMessagesRead = useCallback((callback) => {
    // No-op for serverless deployment
    return () => {};
  }, []);

  const onUserStatusChange = useCallback((callback) => {
    // No-op for serverless deployment
    return () => {};
  }, []);

  const isConnected = useCallback(() => {
    return false; // Always return false for serverless
  }, []);

  const reconnect = useCallback(() => {
    console.log('Socket disabled: reconnect not available');
  }, []);

  const getSocket = useCallback(() => {
    return null; // No socket available
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
