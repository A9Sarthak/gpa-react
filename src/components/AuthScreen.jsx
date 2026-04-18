import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, LogIn, UserPlus, User, Eye, EyeOff } from 'lucide-react';
import './AuthScreen.css'; // Let's define some specific scoped CSS here or just use scoped classes

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const { login, signup, loginAsGuest } = useAuth();
  const navigate = useNavigate();

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
      else navigate('/dashboard');
    } else {
      const res = await signup(normalizedUsername, password);
      if (!res.success) setError(res.error);
      else navigate('/dashboard');
    }
  };

  const handleGuestLogin = () => {
    loginAsGuest();
    navigate('/dashboard');
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="glass-panel auth-card">
        <div className="auth-header">
          <div className="icon-wrapper">
            <GraduationCap size={40} className="text-accent" />
          </div>
          <h1>Grade<span className="smooth-gradient-text">vity</span></h1>
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
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button" 
                className="pwd-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary auth-submit">
            {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
            {isLogin ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-divider">
          <span>or continue with</span>
        </div>

        <button 
          className="btn-secondary guest-btn" 
          onClick={handleGuestLogin}
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
