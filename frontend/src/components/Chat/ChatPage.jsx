import React, { useState, useEffect } from 'react';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import { FaComments, FaTimes, FaSync } from 'react-icons/fa';

const ChatPage = ({ onNavigate, initialConversation }) => {
  const [selectedConversation, setSelectedConversation] = useState(initialConversation || null);
  const [showChatList, setShowChatList] = useState(!initialConversation);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [newConversation, setNewConversation] = useState(null);

  useEffect(() => {
    if (initialConversation) {
      setSelectedConversation(initialConversation);
      setShowChatList(false);
      
      setNewConversation(initialConversation);
    }
  }, [initialConversation]);

  const handleSelectConversation = (conversation) => {
    console.log('Conversation selected:', conversation);
    setSelectedConversation(conversation);
    setShowChatList(false);
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
    setShowChatList(true);
  };

  const handleConversationUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleNewConversation = (conversation) => {
    console.log('New conversation received:', conversation);
    setNewConversation(conversation);
    setSelectedConversation(conversation);
    setShowChatList(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <div className="flex space-x-3">
          <button
            onClick={handleRefresh}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
            title="Refresh conversations"
          >
            <FaSync className="w-5 h-5" />
          </button>
          <button
            onClick={() => onNavigate('home')}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        
        <div className={`lg:col-span-1 ${showChatList ? 'block' : 'hidden lg:block'}`}>
          <ChatList 
            onSelectConversation={handleSelectConversation} 
            onNavigate={onNavigate}
            refreshTrigger={refreshTrigger}
            onNewConversation={newConversation}
          />
        </div>

        <div className={`lg:col-span-2 ${!showChatList || selectedConversation ? 'block' : 'hidden lg:block'}`}>
          <ChatWindow 
            conversation={selectedConversation} 
            onBack={handleBackToList}
            onConversationUpdate={handleConversationUpdate}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;