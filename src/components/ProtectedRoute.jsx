import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { currentUser, isLoading } = useAuth();

  // If AuthContext handles an initial loading state, we can return null or a spinner
  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-main)' }}>Loading session...</div>;
  }

  if (!currentUser) {
    // Redirect to login if unauthenticated
    return <Navigate to="/login" replace />;
  }

  // Support both wrapper pattern and outlet pattern
  return children ? children : <Outlet />;
}
