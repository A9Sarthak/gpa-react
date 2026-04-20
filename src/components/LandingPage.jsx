import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Cloud, Shield, Calculator, LayoutDashboard, BarChart3, Sparkles } from 'lucide-react';
import './LandingPage.css';
import MetaballBackground from './MetaballBackground';
import { SpotlightCard, MagneticButton } from './Spotlight';

// Component for sub-pixel localized text brightening
// Component for sub-pixel localized text brightening
const InteractiveText = ({ children, as: Component = 'div', className = '' }) => {
  const ref = React.useRef(null);
  
  const onMove = React.useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--y', `${e.clientY - rect.top}px`);
    el.style.setProperty('--spot-op', '1');
    window.dispatchEvent(new CustomEvent('ui-hover-focus', { detail: { active: true } }));
  }, []);

  const onLeave = React.useCallback(() => {
    ref.current?.style.setProperty('--spot-op', '0');
    window.dispatchEvent(new CustomEvent('ui-hover-focus', { detail: { active: false } }));
  }, []);

  return (
    <Component 
      className={`interactive-text-container ${className}`} 
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <div className="interactive-text-base">
        {children}
      </div>
      <div className="interactive-text-glow" aria-hidden="true" style={{ userSelect: 'none' }}>
        {children}
      </div>
    </Component>
  );
};

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
          <InteractiveText className="hero-text-block">
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
          </InteractiveText>
          
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
            <h3>Flawless Calculation</h3>
            <p>Splits subjects cleanly into Theory and Labs. Follows official S to F credit-based paradigms to provide perfect precision.</p>
          </SpotlightCard>

          <SpotlightCard className="glass-panel feature-card">
            <div className="feature-icon"><BarChart3 size={32} /></div>
            <h3>Gradevity Analytics</h3>
            <p>Track your academic trajectory over time. Our dynamic dashboard provides charting to visualize your semester-over-semester progress.</p>
          </SpotlightCard>

          <SpotlightCard className="glass-panel feature-card">
            <div className="feature-icon"><Sparkles size={32} /></div>
            <h3>Premium Interface</h3>
            <p>Experience a state-of-the-art cinematic dark mode aesthetic, featuring fluid physics and engineered specifically to reduce eye strain.</p>
          </SpotlightCard>

          <SpotlightCard className="glass-panel feature-card">
            <div className="feature-icon"><Cloud size={32} /></div>
            <h3>Cloud Synced Securely</h3>
            <p>Your academic data isn't trapped on your device. We save your grade history securely to a global MongoDB database seamlessly linked to your account.</p>
          </SpotlightCard>

          <SpotlightCard className="glass-panel feature-card">
            <div className="feature-icon"><Shield size={32} /></div>
            <h3>Instant Guest Mode</h3>
            <p>Use our fast calculation engine completely offline. Process your grades directly within your browser cache—no account creation required.</p>
          </SpotlightCard>
        </section>

      </div>
    </>
  );
}
