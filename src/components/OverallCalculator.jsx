import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Award } from 'lucide-react';
import './Calculator.css';

export default function OverallCalculator({ initialData, onChange }) {
  // If no initial data, start with Sem 1
  const [semesters, setSemesters] = useState(
    initialData?.semesters || [{ id: crypto.randomUUID(), name: 'Sem 1', credits: 20, gpa: 9.0, isIncluded: true }]
  );

  const [isCompact, setIsCompact] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => setIsCompact(window.scrollY > 120);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const computeStats = () => {
    let totalCredits = 0;
    let totalWeightedPoints = 0;

    semesters.forEach(sem => {
      // Default isIncluded to true for older saves without the property
      if (sem.isIncluded !== false && sem.credits > 0 && sem.gpa >= 0) {
        totalCredits += Number(sem.credits);
        totalWeightedPoints += Number(sem.credits) * Number(sem.gpa);
      }
    });

    const cgpa = totalCredits === 0 ? "0.0000" : (totalWeightedPoints / totalCredits).toFixed(4);
    return { cgpa, totalCredits };
  };

  const { cgpa: currentOverallCgpa, totalCredits: overallCredits } = computeStats();

  useEffect(() => {
    onChange({
      semesters: semesters,
      computedOverallCgpa: currentOverallCgpa
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semesters, currentOverallCgpa]);

  const addSemester = () => {
    const nextSemNumber = semesters.length + 1;
    setSemesters([...semesters, { id: crypto.randomUUID(), name: `Sem ${nextSemNumber}`, credits: 20, gpa: 9.0, isIncluded: true }]);
  };

  const removeSemester = (id) => {
    setSemesters(semesters.filter(curr => curr.id !== id));
  };

  const updateSemester = (id, field, value) => {
    setSemesters(semesters.map(curr => curr.id === id ? { ...curr, [field]: value } : curr));
  };

  return (
    <div className="calculator-container animate-fade-in">
      <div className={`cgpa-display glass-panel ${isCompact ? 'is-compact' : ''}`}>
        <div className="display-content" style={{ flex: 1 }}>
          <h3 style={{ fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Overall Cumulative CGPA</h3>
          <div className="cgpa-value smooth-gradient-text" style={{ fontSize: '56px', fontWeight: '800', lineHeight: 1 }}>{currentOverallCgpa}</div>
        </div>

        <div className="divider" style={{ width: '1px', height: '80px', background: 'var(--border-color)', margin: '0 40px' }}></div>

        <div className="display-content" style={{ flex: 1 }}>
          <h3 style={{ fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Total Credits</h3>
          <div className="cgpa-value" style={{ fontSize: '56px', fontWeight: '800', lineHeight: 1, color: 'var(--text-main)' }}>{overallCredits}</div>
        </div>

        <Award size={64} className="display-icon" style={{ opacity: 0.1, marginLeft: 'auto' }} />
      </div>

      <div className="subject-section glass-panel">
        <div className="section-header">
          <h2>Past Semesters</h2>
          <button className="btn-secondary add-btn" onClick={addSemester}>
            <Plus size={16} /> Add Semester
          </button>
        </div>
        
        <div className="table-responsive">
          <table className="subjects-table">
            <thead>
              <tr>
                <th>Identifier</th>
                <th>Total Credits</th>
                <th>GPA Achieved</th>
                <th>Include</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {semesters.map((sem, index) => (
                <tr key={sem.id} className="animate-fade-in">
                  <td>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder={`Sem ${index + 1}`}
                      value={sem.name}
                      onChange={(e) => updateSemester(sem.id, 'name', e.target.value)}
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      className="input-field" 
                      min="0"
                      step="0.5"
                      value={sem.credits}
                      onChange={(e) => updateSemester(sem.id, 'credits', e.target.value)}
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      className="input-field" 
                      min="0"
                      max="10"
                      step="0.01"
                      value={sem.gpa}
                      onChange={(e) => updateSemester(sem.id, 'gpa', e.target.value)}
                    />
                  </td>
                  <td>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', height: '100%' }}>
                      <input 
                        type="checkbox"
                        checked={sem.isIncluded !== false}
                        onChange={(e) => updateSemester(sem.id, 'isIncluded', e.target.checked)}
                        style={{ width: '20px', height: '20px', accentColor: 'var(--accent-color)', cursor: 'pointer' }}
                      />
                    </label>
                  </td>
                  <td>
                    <button className="delete-btn" onClick={() => removeSemester(sem.id)}>
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {semesters.length === 0 && (
                <tr>
                  <td colSpan="5" className="empty-state">No semesters added.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
