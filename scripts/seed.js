import fs from 'fs';

const theorySubjects = [
  { id: crypto.randomUUID(), name: 'Digital Logic and Microprocessors', credits: 3, grade: 'S' },
  { id: crypto.randomUUID(), name: 'Database Systems', credits: 3, grade: 'S' },
  { id: crypto.randomUUID(), name: 'Web Technologies', credits: 3, grade: 'S' },
  { id: crypto.randomUUID(), name: 'Software Engineering', credits: 3, grade: 'S' },
  { id: crypto.randomUUID(), name: 'Probability and Statistics', credits: 3, grade: 'S' },
  { id: crypto.randomUUID(), name: 'Quantitative Skills Practice II', credits: 1.5, grade: 'S' },
  { id: crypto.randomUUID(), name: 'Education for Sustainable Development (MOOC)', credits: 3, grade: 'S' }
];

const labSubjects = [
  { id: crypto.randomUUID(), name: 'Digital Logic Lab', credits: 1, grade: 'S' },
  { id: crypto.randomUUID(), name: 'Database Lab', credits: 1, grade: 'S' },
  { id: crypto.randomUUID(), name: 'Web Technologies Lab', credits: 1, grade: 'S' },
  { id: crypto.randomUUID(), name: 'Software Engineering Lab', credits: 1, grade: 'S' },
  { id: crypto.randomUUID(), name: 'Probability and Statistics Lab', credits: 1, grade: 'S' }
];

async function setup() {
  const username = 'sarthaka9';
  const password = 'kumbh@411046';

  console.log('1. Re-saving explicit payload...');

  // Calculate CGPA so it's pre-populated
  let totalCredits = 0;
  let totalPoints = 0;
  [...theorySubjects, ...labSubjects].forEach(sub => {
    totalCredits += sub.credits;
    totalPoints += sub.credits * 10;
  });
  const cgpa = (totalPoints / totalCredits).toFixed(4);

  const data = {
    semester: {
      theory: theorySubjects,
      lab: labSubjects,
      computedSemCgpa: cgpa
    },
    overall: null
  };

  const res = await fetch('http://localhost:5000/api/data/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, data })
  });

  if (!res.ok) {
    console.error('Save failed:', await res.text());
  } else {
    console.log('Data saved successfully!');
  }
}

setup();
