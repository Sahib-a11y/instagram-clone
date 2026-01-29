import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const usePosts = () => {
  const { token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchPosts = useCallback(async (showRefreshLoader = false) => {
    if (showRefreshLoader) setRefreshing(true);
    else setLoading(true);

    setError(null);

    try {
      const baseUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/$/, '');
      const apiUrl = `${baseUrl}/allpost`;

      console.log('📄 Posts API URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📄 Posts response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📄 Posts response data:', data);
        setPosts(data.posts || []);
        setError(null);
      } else {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: 'Failed to parse error response' };
        }
        console.error('❌ Posts error:', errorData);
        setPosts([]);
        setError(errorData.error || 'Failed to fetch posts');
      }
    } catch (error) {
      console.error('❌ Posts network error:', error);
      setPosts([]);
      setError('Network error occurred');
    } finally {
      setLoading(false);
      if (showRefreshLoader) setRefreshing(false);
    }
  }, [token]);

  const refreshPosts = useCallback(() => {
    return fetchPosts(true);
  }, [fetchPosts]);

  const clearPosts = useCallback(() => {
    setPosts([]);
    setError(null);
  }, []);

  const addPost = useCallback((newPost) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
  }, []);

  const updatePost = useCallback((postId, updatedPost) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post._id === postId ? { ...post, ...updatedPost } : post
      )
    );
  }, []);

  const removePost = useCallback((postId) => {
    setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
  }, []);

  return {
    posts,
    loading,
    refreshing,
    error,
    fetchPosts,
    refreshPosts,
    clearPosts,
    addPost,
    updatePost,
    removePost
  };
};

export default usePosts;
