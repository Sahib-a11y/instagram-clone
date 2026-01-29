import React, { useState, useEffect } from 'react';
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
  const [hideNav, setHideNav] = useState(false);

  
  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentPage('home');
      setSelectedUserId(null);
      setSelectedConversation(null);
      setHideNav(false);
    }
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  
  const navigate = (page, data = null) => {
    console.log('Navigating to:', page, data);

    setCurrentPage(page);

    if(page !== currentPage) {
      setSelectedUserId(null)
      setSelectedConversation(null)
    }
    setCurrentPage(page)

    if (page === 'userProfile') {
      setSelectedUserId(data);
      setHideNav(false);
    } else if (page === 'chat') {
      if (data?.conversation) {
        setSelectedConversation(data.conversation);
        setHideNav(true);
      } else {
        setSelectedConversation(null);
        setHideNav(false);
      }
    } else {
      setSelectedUserId(null);
      setSelectedConversation(null);
      setHideNav(false);
    }
  };


  const handleSelectConversation = (conversation) => {
    console.log('Conversation selected in AppRouter:', conversation);
    setSelectedConversation(conversation);
    setHideNav(true); 
  };

 
  const handleBackFromChat = () => {
    console.log('Back from chat window');
    setSelectedConversation(null);
    setHideNav(false); 
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
        return (
          <ChatPage 
            onNavigate={navigate} 
            initialConversation={selectedConversation}
            onSelectConversation={handleSelectConversation}
            onBackFromChat={handleBackFromChat}
          />
        );
      default:
        return <Home onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {isAuthenticated ? (
        <Layout 
          onNavigate={navigate} 
          activeTab={getActiveTab()} 
          hideNav={hideNav}
        >
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