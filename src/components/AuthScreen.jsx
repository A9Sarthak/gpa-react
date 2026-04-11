import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, LogIn, UserPlus, User } from 'lucide-react';
import './AuthScreen.css'; // Let's define some specific scoped CSS here or just use scoped classes

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { login, signup, loginAsGuest } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password) {
      setError('Please enter both username and password');
      return;
    }

    const normalizedUsername = username.trim().toLowerCase();
    
    if (isLogin) {
      const res = await login(normalizedUsername, password);
      if (!res.success) setError(res.error);
    } else {
      const res = await signup(normalizedUsername, password);
      if (!res.success) setError(res.error);
    }
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="glass-panel auth-card">
        <div className="auth-header">
          <div className="icon-wrapper">
            <GraduationCap size={40} className="text-accent" />
          </div>
          <h1>GPA <span className="smooth-gradient-text">Calculator</span></h1>
          <p className="subtitle">{isLogin ? 'Welcome back! Log in to continue.' : 'Create an account to start tracking.'}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              className="input-field"
              placeholder="e.g. sarthak"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary auth-submit">
            {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
            {isLogin ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button 
          className="btn-secondary guest-btn" 
          onClick={loginAsGuest}
          type="button"
        >
          <User size={18} />
          Continue as Guest
        </button>

        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button 
              className="toggle-mode-btn" 
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
