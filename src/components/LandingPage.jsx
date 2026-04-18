import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Cloud, Shield, Calculator, LayoutDashboard } from 'lucide-react';
import './LandingPage.css';
import MetaballBackground from './MetaballBackground';
import { SpotlightCard, MagneticButton } from './Spotlight';

export default function LandingPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // Treat guests as logged out for the sake of the landing page UI
  const isRealUser = currentUser && currentUser !== 'guest';

  return (
    <>
      <MetaballBackground />
      <div className="landing-container animate-fade-in">
        
        {/* Hero Section */}
        <header className="hero-section">
          <div className="hero-badge">Now Cloud-Powered 🚀</div>
          <h1 className="hero-title">
            {isRealUser ? (
              <>Welcome back, <br /><span className="smooth-gradient-text">{currentUser} 👋</span></>
            ) : (
              <>The Modern Way to Track Your <br /><span className="smooth-gradient-text">Academic Progress</span></>
            )}
          </h1>
          <p className="hero-subtitle">
            {isRealUser 
              ? "Ready to update your grades or view your cumulative progress? Your dashboard is just a click away."
              : "Calculate your Semester and Cumulative GPAs instantly. Built beautifully for students perfectly matching standard university grading scales."
            }
          </p>
          
          <div className="hero-actions">
            {isRealUser ? (
              <MagneticButton
                className="btn-primary hero-btn"
                onClick={() => navigate('/dashboard')}
                strength={0.35}
                maxShift={12}
              >
                Go to Dashboard <LayoutDashboard size={18} style={{ marginLeft: '8px' }} />
              </MagneticButton>
            ) : (
              <MagneticButton
                className="btn-primary hero-btn"
                onClick={() => navigate('/login')}
                strength={0.35}
                maxShift={12}
              >
                Get Started Now <ArrowRight size={18} style={{ marginLeft: '8px' }} />
              </MagneticButton>
            )}
          </div>
        </header>

        {/* Feature Cards Section */}
        <section className="features-section">
          <SpotlightCard className="glass-panel feature-card">
            <div className="feature-icon"><Calculator size={32} /></div>
            <h3>Accurate Calculation</h3>
            <p>Splits subjects cleanly into Theory and Labs. Follows official S to F credit-based paradigms to provide flawless 4-decimal precision.</p>
          </SpotlightCard>

          <SpotlightCard className="glass-panel feature-card">
            <div className="feature-icon"><Cloud size={32} /></div>
            <h3>Cloud Synced</h3>
            <p>Your data isn't trapped on your desktop. We save your grade history securely to a global MongoDB database seamlessly under your account.</p>
          </SpotlightCard>

          <SpotlightCard className="glass-panel feature-card">
            <div className="feature-icon"><Shield size={32} /></div>
            <h3>Local Guest Mode</h3>
            <p>Don't want to make an account? No problem. Use our instant Guest Mode to generate a fast calculation completely offline directly within your browser.</p>
          </SpotlightCard>
        </section>

      </div>
    </>
  );
}
