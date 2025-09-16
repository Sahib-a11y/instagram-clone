import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoadingSpinner from './components/common/LoadingSpinner';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';



const AppRouter = () => {
  const { isAuthenticated, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedUserId, setSelectedUserId] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  // Nf
  const navigate = (page, userId = null) => {
    setCurrentPage(page);
    if (userId) setSelectedUserId(userId);
  };

  //current page ko render kree gaa
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
        return (
          <Layout onNavigate={navigate}>
            <Profile onNavigate={navigate} />
          </Layout>
        );
      case 'userProfile':
        return (
          <Layout onNavigate={navigate}>
            <UserProfile userId={selectedUserId} onNavigate={navigate} />
          </Layout>
        );
      default:
        return (
          <Layout onNavigate={navigate}>
            <Home onNavigate={navigate} />
          </Layout>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderPage()}
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