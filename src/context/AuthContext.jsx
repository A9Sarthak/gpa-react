import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000');
// Replaced useLocalStorage with useState for most user state
  const [currentUser, setCurrentUser] = useLocalStorage('current_user', null);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user data when user changes
  useEffect(() => {
    if (currentUser === 'guest') {
      const gData = localStorage.getItem('user_data_guest');
      setUserData(gData ? JSON.parse(gData) : null);
      setIsLoading(false);
    } else if (currentUser) {
      // Backend fetch
      setIsLoading(true);
      fetch(`${API_URL}/api/data/load/${currentUser}`, { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setUserData(data.data);
          } else {
            console.error("Failed to load user data from cloud");
          }
        })
        .catch(err => console.error(err))
        .finally(() => setIsLoading(false));
    } else {
      setUserData(null);
      setIsLoading(false);
    }
  }, [currentUser]);

  const login = async (username, password) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(username);
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch(err) {
      return { success: false, error: 'Cannot connect to server.' };
    }
  };

  const signup = async (username, password) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(username);
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch(err) {
      return { success: false, error: 'Cannot connect to server.' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setUserData(null);
  };

  const loginAsGuest = () => {
    setCurrentUser('guest');
  };

  const saveUserData = async (data) => {
    if (!currentUser) return;
    
    if (currentUser === 'guest') {
      localStorage.setItem('user_data_guest', JSON.stringify(data));
      setUserData(data);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/data/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser, data })
      });
      const json = await res.json();
      if (json.success) setUserData(json.data);
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, signup, logout, loginAsGuest, userData, saveUserData, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
