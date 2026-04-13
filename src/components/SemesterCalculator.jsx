import React, { useState, useEffect } from 'react';
import { Plus, Trash2, FileOutput } from 'lucide-react';
import './Calculator.css';

// VIT Grading System
const GRADE_POINTS = {
  S: 10,
  A: 9,
  B: 8,
  C: 7,
  D: 6,
  E: 5,
  F: 0,
  N: 0
};

const DEFAULT_THEORY = Array.from({ length: 5 }, () => ({ id: crypto.randomUUID(), name: '', credits: 3, grade: 'S' }));
const DEFAULT_LAB = Array.from({ length: 3 }, () => ({ id: crypto.randomUUID(), name: '', credits: 1, grade: 'S' }));

export default function SemesterCalculator({ initialData, onChange, onAddToCGPA }) {
  const [theorySubjects, setTheorySubjects] = useState(initialData?.theory || DEFAULT_THEORY);
  const [labSubjects, setLabSubjects] = useState(initialData?.lab || DEFAULT_LAB);

  const computeStats = () => {
    let totalCredits = 0;
    let totalPoints = 0;

    const allSubjects = [...theorySubjects, ...labSubjects];
    
    allSubjects.forEach(sub => {
      // Validate inputs
      if (sub.credits > 0 && Object.keys(GRADE_POINTS).includes(sub.grade)) {
        totalCredits += Number(sub.credits);
        totalPoints += Number(sub.credits) * GRADE_POINTS[sub.grade];
      }
    });

    const cgpa = totalCredits === 0 ? "0.0000" : (totalPoints / totalCredits).toFixed(4);
    return { cgpa, totalCredits };
  };

  const { cgpa: currentCgpa, totalCredits: currentCredits } = computeStats();

  // Notify parent of changes
  useEffect(() => {
    onChange({
      theory: theorySubjects,
      lab: labSubjects,
      computedSemCgpa: currentCgpa
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theorySubjects, labSubjects, currentCgpa]);

  const addSubject = (type) => {
    const defaultSub = { id: crypto.randomUUID(), name: '', credits: type === 'theory' ? 3 : 1, grade: 'S' };
    if (type === 'theory') setTheorySubjects([...theorySubjects, defaultSub]);
    else setLabSubjects([...labSubjects, defaultSub]);
  };

  const removeSubject = (type, id) => {
    if (type === 'theory') setTheorySubjects(theorySubjects.filter(curr => curr.id !== id));
    else setLabSubjects(labSubjects.filter(curr => curr.id !== id));
  };

  const updateSubject = (type, id, field, value) => {
    const list = type === 'theory' ? theorySubjects : labSubjects;
    const setList = type === 'theory' ? setTheorySubjects : setLabSubjects;
    
    setList(list.map(curr => curr.id === id ? { ...curr, [field]: value } : curr));
  };

  const renderSubjectTable = (type, subjects) => {
    return (
      <div className="subject-section glass-panel">
        <div className="section-header">
          <h2>{type === 'theory' ? 'Theory Subjects' : 'Lab Subjects'}</h2>
          <button className="btn-secondary add-btn" onClick={() => addSubject(type)}>
            <Plus size={16} /> Add Subject
          </button>
        </div>
        
        <div className="table-responsive">
          <table className="subjects-table">
            <thead>
              <tr>
                <th>Subject Name (Optional)</th>
                <th>Credits</th>
                <th>Grade</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((sub, index) => (
                <tr key={sub.id} className="animate-fade-in">
                  <td>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder={`${type === 'theory' ? 'Theory' : 'Lab'} Sub ${index + 1}`}
                      value={sub.name}
                      onChange={(e) => updateSubject(type, sub.id, 'name', e.target.value)}
                    />
                  </td>
                  <td>
                    <select 
                      className="input-field" 
                      value={sub.credits}
                      onChange={(e) => updateSubject(type, sub.id, 'credits', Number(e.target.value))}
                    >
                      {[1, 1.5, 2, 3, 4, 5, 20].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select 
                      className="input-field" 
                      value={sub.grade}
                      onChange={(e) => updateSubject(type, sub.id, 'grade', e.target.value)}
                    >
                      {Object.keys(GRADE_POINTS).map(g => (
                        <option key={g} value={g}>{g} ({GRADE_POINTS[g]})</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button className="delete-btn" onClick={() => removeSubject(type, sub.id)}>
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {subjects.length === 0 && (
                <tr>
                  <td colSpan="4" className="empty-state">No subjects added.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="calculator-container animate-fade-in">
      <div className="cgpa-display glass-panel" style={{ display: 'flex', alignItems: 'center', padding: '32px 40px' }}>
        <div className="display-content" style={{ flex: 1 }}>
          <h3 style={{ fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Semester CGPA</h3>
          <div className="cgpa-value smooth-gradient-text" style={{ fontSize: '56px', fontWeight: '800', lineHeight: 1 }}>{currentCgpa}</div>
        </div>

        <div style={{ width: '1px', height: '80px', background: 'var(--border-color)', margin: '0 40px' }}></div>

        <div className="display-content" style={{ flex: 1 }}>
          <h3 style={{ fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Total Credits</h3>
          <div className="cgpa-value" style={{ fontSize: '56px', fontWeight: '800', lineHeight: 1, color: 'var(--text-main)' }}>{currentCredits}</div>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px', zIndex: 10 }}>
          <FileOutput size={48} className="display-icon" style={{ opacity: 0.1, position: 'absolute', right: '40px' }} />
          {onAddToCGPA && (
            <button 
              className="btn-primary" 
              style={{ fontSize: '14px', padding: '10px 20px' }}
              onClick={() => onAddToCGPA(currentCredits, currentCgpa)}
            >
              <Plus size={16} /> Add to CGPA
            </button>
          )}
        </div>
      </div>

      {renderSubjectTable('theory', theorySubjects)}
      {renderSubjectTable('lab', labSubjects)}
    </div>
  );
}
