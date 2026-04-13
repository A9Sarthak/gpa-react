import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { GraduationCap, Sun, Moon, LogIn, LogOut } from 'lucide-react';
import './Navbar.css';

export default function Navbar({ currentView, setView }) {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogoClick = () => {
    setView('landing');
  };

  const handleLogout = () => {
    logout();
    setView('landing');
  };

  return (
    <nav className="global-navbar glass-panel">
      <div className="navbar-container">
        <div className="nav-brand-clickable" onClick={handleLogoClick}>
          <GraduationCap size={32} className="text-accent" />
          <span className="brand-text">GPA <span className="smooth-gradient-text">Calc</span></span>
        </div>

        <div className="nav-actions-group">
          <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle Theme">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {currentUser ? (
            <div className="auth-actions-logged-in">
              <div className="avatar-small" title={currentUser}>
                {currentUser !== 'guest' ? currentUser.charAt(0).toUpperCase() : 'G'}
              </div>
              <button className="btn-secondary btn-nav-logout" onClick={handleLogout}>
                <LogOut size={16} /> <span className="hide-mobile">Log out</span>
              </button>
            </div>
          ) : (
            <div className="auth-actions-logged-out">
              {currentView !== 'auth' && (
                <button className="btn-primary" onClick={() => setView('auth')}>
                  <LogIn size={18} /> Sign In
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
