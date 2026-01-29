import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const useUserSuggestions = () => {
  const { token } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSuggestions = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const apiUrl = `${baseUrl}/suggestions`;

      console.log('💡 Suggestions API URL:', apiUrl);

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('💡 Suggestions response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('💡 Suggestions response data:', data);
        setSuggestions(data.suggestions || []);
        setError(null);
      } else {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: 'Failed to parse error response' };
        }
        console.error('❌ Suggestions error:', errorData);
        setSuggestions([]);
        setError(errorData.error || 'Failed to load suggestions');
      }
    } catch (error) {
      console.error('❌ Suggestions network error:', error);
      setSuggestions([]);
      setError('Network error occurred');
    }
    setLoading(false);
  }, [token]);

  const refreshSuggestions = useCallback(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
  }, []);

  // Auto-fetch suggestions when token is available
  useEffect(() => {
    if (token) {
      fetchSuggestions();
    }
  }, [fetchSuggestions, token]);

  return {
    suggestions,
    loading,
    error,
    fetchSuggestions,
    refreshSuggestions,
    clearSuggestions
  };
};

export default useUserSuggestions;
