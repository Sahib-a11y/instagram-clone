import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const useUserProfile = () => {
  const { token } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [canViewPosts, setCanViewPosts] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  const fetchUserProfile = useCallback(async (userId) => {
    if (!userId || !token) {
      setError('User ID or token not provided');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const apiUrl = `${baseUrl}/user/${userId}`;

      console.log('👤 Profile API URL:', apiUrl);
      console.log('👤 Profile userId:', userId);

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('👤 Profile response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('👤 Profile response data:', data);

        setUserProfile(data.result);
        setPosts(data.posts || []);
        setCanViewPosts(data.canViewPosts !== false);
        setIsFollowing(data.isFollowing || false);
        setError(null);
        return true;
      } else {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: 'Failed to parse error response' };
        }
        console.error('❌ Profile error:', errorData);
        setError(errorData.msg || 'Failed to fetch user profile');
        return false;
      }
    } catch (error) {
      console.error('❌ Profile network error:', error);
      setError('Network error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const refreshProfile = useCallback((userId) => {
    return fetchUserProfile(userId);
  }, [fetchUserProfile]);

  const clearProfile = useCallback(() => {
    setUserProfile(null);
    setPosts([]);
    setError(null);
    setCanViewPosts(true);
    setIsFollowing(false);
  }, []);

  return {
    userProfile,
    posts,
    loading,
    error,
    canViewPosts,
    isFollowing,
    fetchUserProfile,
    refreshProfile,
    clearProfile
  };
};

export default useUserProfile;
