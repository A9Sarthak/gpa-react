import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

import MetaballBackground from './components/MetaballBackground';

// Layout wrapper to easily include Navbar and global background on all pages
const AppLayout = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  return (
    <>
      {isLandingPage && <MetaballBackground />}
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthScreen />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        {/* Render landing page for unknown routes */}
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppLayout />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
