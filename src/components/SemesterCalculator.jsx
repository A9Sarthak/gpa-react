import React, { useState, useEffect } from 'react';
import { Plus, Trash2, FileOutput, UploadCloud, Loader2 } from 'lucide-react';
import { scanImageForSubjects } from '../utils/ocrParser';
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

export default function SemesterCalculator({ initialData, overallData, onChange, onAddToCGPA }) {
  const [theorySubjects, setTheorySubjects] = useState(initialData?.theory || DEFAULT_THEORY);
  const [labSubjects, setLabSubjects] = useState(initialData?.lab || DEFAULT_LAB);
  
  // Sticky minimal header scroll state
  const [isCompact, setIsCompact] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsCompact(prev => {
        if (window.scrollY > 120) return true;
        if (window.scrollY < 40) return false;
        return prev;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // OCR State
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    try {
      setIsScanning(true);
      setScanProgress(0);
      
      let allExtractedSubjects = [];
      const numFiles = files.length;

      for (let i = 0; i < numFiles; i++) {
        const file = files[i];
        const extracted = await scanImageForSubjects(file, (progress) => {
          // Weight the progress bar strictly across multiple files seamlessly!
          setScanProgress(Math.round(((i * 100) + progress) / numFiles));
        });
        allExtractedSubjects.push(...extracted);
      }
      
      if (allExtractedSubjects.length > 0) {
        // Remove empty default rows if they exist untouched before merging real ones!
        let currentTheory = theorySubjects.length === 5 && theorySubjects[0].name === '' ? [] : [...theorySubjects];
        let currentLabs = labSubjects.length === 3 && labSubjects[0].name === '' ? [] : [...labSubjects];

        const existingNames = new Set([...currentTheory, ...currentLabs].map(s => s.name.trim().toLowerCase()));

        const uniqueNewTheory = [];
        const uniqueNewLabs = [];

        // Distribute and block pure identical duplicates automatically!
        allExtractedSubjects.forEach(s => {
          const compName = s.name.trim().toLowerCase();
          if (!existingNames.has(compName)) {
            existingNames.add(compName);
            if (s.type === 'theory') uniqueNewTheory.push(s);
            else uniqueNewLabs.push(s);
          }
        });

        setTheorySubjects([...currentTheory, ...uniqueNewTheory]);
        setLabSubjects([...currentLabs, ...uniqueNewLabs]);
      } else {
        alert("Could not detect any clear subjects or credits. Please ensure the screenshot contains formal core course codes and distinct credits clearly.");
      }
    } catch (err) {
      alert("Error scanning image: " + err.message);
    } finally {
      setIsScanning(false);
      setScanProgress(0);
      // Reset input unconditionally
      e.target.value = null;
    }
  };

  const computeStats = () => {
    let semesterCredits = 0;
    let semesterPoints = 0;

    const allSubjects = [...theorySubjects, ...labSubjects];
    
    allSubjects.forEach(sub => {
      if (sub.credits > 0 && Object.keys(GRADE_POINTS).includes(sub.grade)) {
        semesterCredits += Number(sub.credits);
        semesterPoints += Number(sub.credits) * GRADE_POINTS[sub.grade];
      }
    });

    const cgpa = semesterCredits === 0 ? "0.0000" : (semesterPoints / semesterCredits).toFixed(4);

    // Project CGPA using past semesters
    let pastCredits = 0;
    let pastPoints = 0;

    if (overallData && Array.isArray(overallData.semesters)) {
      overallData.semesters.forEach(sem => {
        if (sem.isIncluded !== false && sem.credits > 0 && sem.gpa >= 0) {
          pastCredits += Number(sem.credits);
          pastPoints += Number(sem.credits) * Number(sem.gpa);
        }
      });
    }

    let projectedCgpa = null;
    const totalCredits = semesterCredits + pastCredits;
    const totalPoints = semesterPoints + pastPoints;

    if (totalCredits > 0 && pastCredits > 0) {
      projectedCgpa = (totalPoints / totalCredits).toFixed(4);
    }
    
    // Return unified statistics object
    return { 
      cgpa, 
      totalCredits: semesterCredits, 
      projectedCgpa 
    };
  };

  const { cgpa: currentCgpa, totalCredits: currentCredits, projectedCgpa } = computeStats();

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
    
    // Auto-Learning cache hook for AI OCR Scanner
    if (field === 'credits') {
      const subject = list.find(curr => curr.id === id);
      if (subject && subject.name && subject.name.trim().length > 0) {
        const cached = JSON.parse(localStorage.getItem('userCreditCache') || '{}');
        cached[subject.name.trim().toLowerCase()] = Number(value);
        localStorage.setItem('userCreditCache', JSON.stringify(cached));
      }
    }
    
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
                    <input 
                      type="number"
                      className="input-field" 
                      list="credits-options"
                      min="0"
                      step="0.5"
                      value={sub.credits}
                      onChange={(e) => updateSubject(type, sub.id, 'credits', e.target.value ? Number(e.target.value) : "")}
                      placeholder="Credits"
                      style={{ padding: '8px' }}
                    />
                  </td>
                  <td style={{ minWidth: '150px' }}>
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
      <div className="dashboard-sub-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Semester Configuration</h2>
        
        <div style={{ position: 'relative' }}>
          <input 
            type="file" 
            id="ocr-upload" 
            accept="image/*" 
            multiple
            style={{ display: 'none' }} 
            onChange={handleImageUpload}
            disabled={isScanning}
          />
          <label 
            htmlFor="ocr-upload" 
            className="btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: isScanning ? 'not-allowed' : 'pointer', background: isScanning ? 'var(--bg-secondary)' : '', border: '1px dashed var(--accent-color)' }}
          >
            {isScanning ? (
              <>
                <Loader2 size={18} className="animate-spin text-accent" /> 
                <span className="text-accent">Scanning ({scanProgress}%)</span>
              </>
            ) : (
              <>
                <UploadCloud size={18} className="text-accent" /> 
                Auto-Fill from Screenshot
              </>
            )}
          </label>
        </div>
      </div>

      <div className={`cgpa-display glass-panel ${isCompact ? 'is-compact' : ''}`}>
        <div className="display-content" style={{ flex: 1 }}>
          <h3 style={{ fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Semester GPA</h3>
          <div className="cgpa-value smooth-gradient-text" style={{ fontSize: '56px', fontWeight: '800', lineHeight: 1 }}>{currentCgpa}</div>
        </div>

        {projectedCgpa !== null && (
          <>
            <div className="divider" style={{ width: '1px', height: '80px', background: 'var(--border-color)', margin: '0 20px' }}></div>
            <div className="display-content" style={{ flex: 1 }}>
              <h3 style={{ fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Live Overall CGPA</h3>
              <div className="cgpa-value" style={{ fontSize: '48px', fontWeight: '800', lineHeight: 1, color: 'var(--accent-hover)' }}>{projectedCgpa}</div>
            </div>
          </>
        )}

        <div className="divider" style={{ width: '1px', height: '80px', background: 'var(--border-color)', margin: projectedCgpa ? '0 20px' : '0 40px' }}></div>

        <div className="display-content" style={{ flex: 1 }}>
          <h3 style={{ fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Total Credits</h3>
          <div className="cgpa-value" style={{ fontSize: '48px', fontWeight: '800', lineHeight: 1, color: 'var(--text-main)' }}>{currentCredits}</div>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px', zIndex: 10 }}>
          <FileOutput size={48} className="display-icon" style={{ opacity: 0.1, position: 'absolute', right: '40px', transition: 'all 0.4s ease' }} />
          {onAddToCGPA && (
            <button 
              className="btn-primary cgpa-add-btn" 
              style={{ fontSize: '14px', padding: isCompact ? '8px 12px' : '10px 20px', transition: 'padding 0.4s ease' }}
              onClick={() => onAddToCGPA(currentCredits, currentCgpa)}
            >
              <Plus size={16} /> {!isCompact && 'Add to CGPA'}
            </button>
          )}
        </div>
      </div>

      {renderSubjectTable('theory', theorySubjects)}
      {renderSubjectTable('lab', labSubjects)}
      
      <datalist id="credits-options">
        {[1, 1.5, 2, 3, 4, 5, 6, 9, 20].map(c => (
          <option key={c} value={c} />
        ))}
      </datalist>
    </div>
  );
}
