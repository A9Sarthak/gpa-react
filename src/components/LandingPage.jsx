import React from 'react';
import { ArrowRight, Cloud, Shield, Calculator } from 'lucide-react';
import './LandingPage.css';

export default function LandingPage({ setView }) {
  return (
    <div className="landing-container animate-fade-in">
      
      {/* Hero Section */}
      <header className="hero-section">
        <div className="hero-badge">Now Cloud-Powered 🚀</div>
        <h1 className="hero-title">
          The Modern Way to Track Your <br />
          <span className="smooth-gradient-text">Academic Progress</span>
        </h1>
        <p className="hero-subtitle">
          Calculate your Semester and Cumulative GPAs instantly. 
          Built beautifully for students perfectly matching standard university grading scales.
        </p>
        
        <div className="hero-actions">
          <button className="btn-primary hero-btn" onClick={() => setView('auth')}>
            Get Started Now <ArrowRight size={18} />
          </button>
        </div>
      </header>

      {/* Feature Cards Section */}
      <section className="features-section">
        <div className="glass-panel feature-card">
          <div className="feature-icon"><Calculator size={32} /></div>
          <h3>Accurate Calculation</h3>
          <p>Splits subjects cleanly into Theory and Labs. Follows official S to F credit-based paradigms to provide flawless 4-decimal precision.</p>
        </div>

        <div className="glass-panel feature-card">
          <div className="feature-icon"><Cloud size={32} /></div>
          <h3>Cloud Synced</h3>
          <p>Your data isn't trapped on your desktop. We save your grade history securely to a global MongoDB database seamlessly under your account.</p>
        </div>

        <div className="glass-panel feature-card">
          <div className="feature-icon"><Shield size={32} /></div>
          <h3>Local Guest Mode</h3>
          <p>Don't want to make an account? No problem. Use our instant Guest Mode to generate a fast calculation completely offline directly within your browser.</p>
        </div>
      </section>

    </div>
  );
}
