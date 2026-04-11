import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';

// Main app router that consumes auth
const AppRouter = () => {
  const { currentUser } = useAuth();
  
  // Available views: 'landing', 'auth', 'dashboard'
  // If currentUser dynamically appears (log in), we force them to dashboard in useEffect.
  const [currentView, setCurrentView] = useState('landing');

  useEffect(() => {
    if (currentUser) {
      setCurrentView('dashboard');
    } else if (currentView === 'dashboard') {
      // If they logged out while on dashboard
      setCurrentView('landing');
    }
  }, [currentUser]);

  const renderView = () => {
    if (currentView === 'landing') return <LandingPage setView={setCurrentView} />;
    if (currentView === 'auth') return <AuthScreen />;
    if (currentView === 'dashboard') return <Dashboard />;
    return <LandingPage setView={setCurrentView} />;
  };

  return (
    <>
      <Navbar currentView={currentView} setView={setCurrentView} />
      {renderView()}
    </>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
