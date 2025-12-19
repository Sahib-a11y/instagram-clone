  import React, { createContext, useContext, useReducer, useEffect } from 'react';

  const initialState = {
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: false,
    loading: true,
    error: null
  };

  const AUTH_ACTIONS = {
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAIL: 'LOGIN_FAIL',
    LOGOUT: 'LOGOUT',
    REGISTER_SUCCESS: 'REGISTER_SUCCESS',
    REGISTER_FAIL: 'REGISTER_FAIL',
    USER_LOADED: 'USER_LOADED',
    AUTH_ERROR: 'AUTH_ERROR',
    CLEAR_ERROR: 'CLEAR_ERROR',
    SET_LOADING: 'SET_LOADING'
  };
  const authReducer = (state, action) => {
    switch (action.type) {
      case AUTH_ACTIONS.USER_LOADED:
        return {
          ...state,
          isAuthenticated: true,
          user: action.payload,
          loading: false,
          error: null
        };

      case AUTH_ACTIONS.LOGIN_SUCCESS:
      case AUTH_ACTIONS.REGISTER_SUCCESS:
        localStorage.setItem('token', action.payload.token);
        return {
          ...state,
          token: action.payload.token,
          user: action.payload.user,
          isAuthenticated: true,
          loading: false,
          error: null
        };

      case AUTH_ACTIONS.LOGIN_FAIL:
      case AUTH_ACTIONS.REGISTER_FAIL:
      case AUTH_ACTIONS.AUTH_ERROR:
        localStorage.removeItem('token');
        return {
          ...state,
          token: null,
          user: null,
          isAuthenticated: false,
          loading: false,
          error: action.payload
        };

      case AUTH_ACTIONS.LOGOUT:
        localStorage.removeItem('token');
        return {
          ...state,
          token: null,
          user: null,
          isAuthenticated: false,
          loading: false,
          error: null
        };

      case AUTH_ACTIONS.CLEAR_ERROR:
        return {
          ...state,
          error: null
        };

      case AUTH_ACTIONS.SET_LOADING:
        return {
          ...state,
          loading: action.payload
        };

      default:
        return state;
    }
  };


  const AuthContext = createContext();


  export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    const API_BASE = process.env.REACT_APP_API_URL?.replace(/\/+$/,"")
    useEffect(() => {
      const loadUser = async () => {
        const token = localStorage.getItem('token');
        
        if (token) {
          try {
            const response = await fetch(`${API_BASE}/profile`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            if (response.ok) {
              const userData = await response.json();
              dispatch({
                type: AUTH_ACTIONS.USER_LOADED,
                payload: userData.user
              });
            } else {
              dispatch({ type: AUTH_ACTIONS.AUTH_ERROR });
            }
          } catch (error) {
            console.error('Load user error:', error);
            dispatch({ 
              type: AUTH_ACTIONS.AUTH_ERROR,
              payload: 'Failed to load user'
            });
          }
        } else {
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        }
      };

      loadUser();
    }, [API_BASE]);

    const login = async (email, password) => {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      try {
        console.log('API URL:',`${process.env.REACT_APP_API_URL}signin`);
        const response = await fetch(`${API_BASE}/signin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: {
              token: data.token,
              user: data.user
            }
          });
          return { success: true };
        } else {
          dispatch({
            type: AUTH_ACTIONS.LOGIN_FAIL,
            payload: data.error || 'Login failed'
          });
          return { success: false, error: data.error };
        }
      } catch (error) {
        console.error('Login error:', error);
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAIL,
          payload: 'Network error occurred'
        });
        return { success: false, error: 'Network error occurred' };
      }
    };


    const register = async (name, email, password) => {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      try {
        const response = await fetch(`${API_BASE}/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok) {
          dispatch({
            type: AUTH_ACTIONS.REGISTER_SUCCESS,
            payload: {
              token: data.token,
              user: data.user
            }
          });
          return { success: true };
        } else {
          dispatch({
            type: AUTH_ACTIONS.REGISTER_FAIL,
            payload: data.error || 'Registration failed'
          });
          return { success: false, error: data.error };
        }
      } catch (error) {
        console.error('Register error:', error);
        dispatch({
          type: AUTH_ACTIONS.REGISTER_FAIL,
          payload: 'Network error occurred'
        });
        return { success: false, error: 'Network error occurred' };
      }
    };

    const logout = () => {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    };

    const clearError = () => {
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
    };

    const updateUser = (userData) => {
      dispatch({
        type: AUTH_ACTIONS.USER_LOADED,
        payload: userData
      });
    };

    const value = {
      user: state.user,
      token: state.token,
      isAuthenticated: state.isAuthenticated,
      loading: state.loading,
      error: state.error,
      login,
      register,
      logout,
      clearError,
      updateUser
    };

    return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    );
  };

  export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
      throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
  };

  export default AuthContext;