import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoadingSpinner from './components/common/LoadingSpinner';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import ChatPage from './components/Chat/ChatPage';

const AppRouter = () => {
  const { isAuthenticated, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  // Navigation function
  const navigate = (page, data = null) => {
    setCurrentPage(page);
    
    if (data) {
      if (data.userId) {
        setSelectedUserId(data.userId);
      }
      if (data.conversation) {
        setSelectedConversation(data.conversation);
      }
    } else {
      
      setSelectedUserId(null);
      setSelectedConversation(null);
    }
  };

  
  const getActiveTab = () => {
    switch (currentPage) {
      case 'profile':
      case 'userProfile':
        return 'profile';
      case 'chat':
        return 'chat';
      default:
        return 'home';
    }
  };

  
  const renderPage = () => {
    if (!isAuthenticated) {
      switch (currentPage) {
        case 'register':
          return <Register onNavigate={navigate} />;
        default:
          return <Login onNavigate={navigate} />;
      }
    }

    switch (currentPage) {
      case 'profile':
        return <Profile onNavigate={navigate} />;
      case 'userProfile':
        return <UserProfile userId={selectedUserId} onNavigate={navigate} />;
      case 'chat':
        return <ChatPage onNavigate={navigate} initialConversation={selectedConversation} />;
      default:
        return <Home onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {isAuthenticated ? (
        <Layout onNavigate={navigate} activeTab={getActiveTab()}>
          {renderPage()}
        </Layout>
      ) : (
        renderPage()
      )}
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
};

export default App;