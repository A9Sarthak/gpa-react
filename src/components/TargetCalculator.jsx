import React, { useState } from 'react';
import { Target, AlertCircle, CheckCircle2 } from 'lucide-react';
import './Calculator.css';

export default function TargetCalculator() {
  const [currentCredits, setCurrentCredits] = useState('');
  const [currentCGPA, setCurrentCGPA] = useState('');
  const [targetCGPA, setTargetCGPA] = useState('');
  const [nextSemCredits, setNextSemCredits] = useState('');

  const calculateRequiredGPA = () => {
    if (!currentCredits || !currentCGPA || !targetCGPA || !nextSemCredits) return null;
    
    const currCred = Number(currentCredits);
    const currCGPA = Number(currentCGPA);
    const tarCGPA = Number(targetCGPA);
    const nextCred = Number(nextSemCredits);

    if (currCred < 0 || currCGPA < 0 || tarCGPA < 0 || nextCred <= 0) return null;

    const currentTotalPoints = currCGPA * currCred;
    const requiredTotalPoints = tarCGPA * (currCred + nextCred);
    const requiredForNextSem = requiredTotalPoints - currentTotalPoints;
    let requiredGPA = requiredForNextSem / nextCred;

    // Cap minimum to 0 since negative GPA is not possible
    if (requiredGPA < 0) requiredGPA = 0;

    return requiredGPA.toFixed(2);
  };

  const requiredGPA = calculateRequiredGPA();
  
  const isImpossible = requiredGPA !== null && Number(requiredGPA) > 10;

  return (
    <div className="calculator-container animate-fade-in">
      <div className="cgpa-display glass-panel" style={{ display: 'flex', alignItems: 'center', padding: '32px 40px', position: 'relative', overflow: 'hidden' }}>
        <Target className="watermark-icon" size={120} style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.05 }} />
        
        <div style={{ flex: 1, zIndex: 1 }}>
          <h3 style={{ fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Required Next Sem GPA
          </h3>
          
          {requiredGPA === null ? (
            <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--text-muted)' }}>--</div>
          ) : isImpossible ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="cgpa-value" style={{ fontSize: '48px', fontWeight: '800', lineHeight: 1, color: 'var(--error)' }}>
                {requiredGPA}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: 'var(--error)', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={14} /> Impossible
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Max achievable is 10.0</span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="cgpa-value smooth-gradient-text" style={{ fontSize: '56px', fontWeight: '800', lineHeight: 1 }}>
                {requiredGPA}
              </div>
              <span style={{ color: 'var(--success)', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: '20px' }}>
                <CheckCircle2 size={16} /> Achievable
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '32px', marginTop: '24px' }}>
        <h2 style={{ marginBottom: '24px', fontSize: '20px' }}>Calculate your target</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Current Completed Credits</label>
            <input 
              type="number" 
              className="input-field" 
              placeholder="e.g. 60"
              min="0"
              value={currentCredits}
              onChange={(e) => setCurrentCredits(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Current CGPA</label>
            <input 
              type="number" 
              className="input-field" 
              placeholder="e.g. 7.5"
              step="0.01"
              min="0"
              max="10"
              value={currentCGPA}
              onChange={(e) => setCurrentCGPA(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Target Desired CGPA</label>
            <input 
              type="number" 
              className="input-field" 
              placeholder="e.g. 8.0"
              step="0.01"
              min="0"
              max="10"
              value={targetCGPA}
              onChange={(e) => setTargetCGPA(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Credits in Next Sem</label>
            <input 
              type="number" 
              className="input-field" 
              placeholder="e.g. 20"
              min="1"
              value={nextSemCredits}
              onChange={(e) => setNextSemCredits(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
