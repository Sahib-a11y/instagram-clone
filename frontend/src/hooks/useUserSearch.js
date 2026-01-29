import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const useUserSearch = () => {
  const { token } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchUsers = useCallback(async (query) => {
    if (query.trim().length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const baseUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/$/, '');
      const apiUrl = `${baseUrl}/search?query=${encodeURIComponent(query)}`;

      console.log('🔍 Search API URL:', apiUrl);
      console.log('🔍 Search token exists:', !!token);

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 Search response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Search response data:', data);
        setResults(data.users || []);
        setError(null);
      } else {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: 'Failed to parse error response' };
        }
        console.error('❌ Search error:', errorData);
        setResults([]);
        setError(errorData.error || 'Search failed');
      }
    } catch (error) {
      console.error('❌ Search network error:', error);
      setResults([]);
      setError('Network error occurred');
    }
    setLoading(false);
  }, [token]);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    searchUsers,
    clearResults
  };
};

export default useUserSearch;
