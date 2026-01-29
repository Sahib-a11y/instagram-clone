import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const useFollow = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);

  const followUser = async (userId) => {
    if (!userId || !token) {
      throw new Error('User ID or token not provided');
    }

    setLoading(true);
    try {
      const baseUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/$/, '');
      const apiUrl = `${baseUrl}/follow`;

      console.log('➕ Follow API URL:', apiUrl);
      console.log('➕ Follow userId:', userId);

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          followId: userId
        })
      });

      console.log('➕ Follow response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('➕ Follow response data:', data);
        return data;
      } else {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: 'Failed to parse error response' };
        }
        console.error('❌ Follow error:', errorData);
        throw new Error(errorData.error || errorData.msg || 'Failed to follow user');
      }
    } catch (error) {
      console.error('❌ Follow network error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const unfollowUser = async (userId) => {
    if (!userId || !token) {
      throw new Error('User ID or token not provided');
    }

    setLoading(true);
    try {
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const apiUrl = `${baseUrl}/unfollow`;

      console.log('➖ Unfollow API URL:', apiUrl);
      console.log('➖ Unfollow userId:', userId);

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          UnfollowId: userId
        })
      });

      console.log('➖ Unfollow response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('➖ Unfollow response data:', data);
        return data;
      } else {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: 'Failed to parse error response' };
        }
        console.error('❌ Unfollow error:', errorData);
        throw new Error(errorData.error || errorData.msg || 'Failed to unfollow user');
      }
    } catch (error) {
      console.error('❌ Unfollow network error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    followUser,
    unfollowUser,
    loading
  };
};

export default useFollow;
