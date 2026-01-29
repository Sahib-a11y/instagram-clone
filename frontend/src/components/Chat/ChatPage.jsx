import React, { useState, useEffect } from 'react';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import { FaComments, FaTimes, FaSync } from 'react-icons/fa';

const ChatPage = ({ onNavigate, initialConversation, onSelectConversation, onBackFromChat }) => {
  const [selectedConversation, setSelectedConversation] = useState(initialConversation || null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    if (onSelectConversation) {
      onSelectConversation(conversation);
    }
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
    if (onBackFromChat) {
      onBackFromChat();
    }
  };

  const handleConversationUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCloseChat = () => {
    if (selectedConversation) {
      handleBackToList();
    } else {
      onNavigate('home');
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center">
          {selectedConversation && (
            <button
              onClick={handleBackToList}
              className="lg:hidden flex items-center text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-50 transition-colors mr-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h1 className="text-xl font-bold text-gray-900">
            {selectedConversation ? 'Chat' : 'Messages'}
          </h1>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleRefresh}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-50 transition-colors"
            title="Refresh conversations"
          >
            <FaSync className="w-5 h-5" />
          </button>
          <button
            onClick={handleCloseChat}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-50 transition-colors"
            title="Close"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
      </div>

      
      <div className="flex-1 flex overflow-hidden">

        <div className={`${!selectedConversation ? 'flex' : 'hidden'} lg:flex lg:w-96 border-r border-gray-200`}>
          <div className="flex-1 flex flex-col">
            <ChatList 
              onSelectConversation={handleSelectConversation} 
              refreshTrigger={refreshTrigger}
              onNewConversation={newConversation}
            />
          </div>
        </div>

        {/* Chat Window */}
        <div className={`${selectedConversation ? 'flex' : 'hidden'} lg:flex flex-1`}>
          {selectedConversation ? (
            <div className="flex-1 flex flex-col">
              <ChatWindow 
                conversation={selectedConversation} 
                onBack={handleBackToList}
                onConversationUpdate={handleConversationUpdate}
              />
            </div>
          ) : (
            <div className="flex-1 hidden lg:flex items-center justify-center bg-gray-50">
              <div className="text-center text-gray-500">
                <FaComments className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium text-gray-900">Select a conversation</p>
                <p className="text-sm text-gray-600">Choose a chat from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;