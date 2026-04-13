import Tesseract from 'tesseract.js';

/**
 * Extracts subjects and credits from an uploaded semester screenshot natively in browser.
 * Uses a heuristic state-machine approach tuned for standard tabular grade sheets.
 */
export const scanImageForSubjects = async (imageFile, onProgress) => {
  try {
    const worker = await Tesseract.createWorker("eng", 1, {
      logger: m => {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress(Math.round(m.progress * 100));
        } else if (onProgress && m.status && m.status.includes('loading')) {
          onProgress(10); // Show some progress for loading
        }
      }
    });
    
    const { data: { text } } = await worker.recognize(imageFile);
    await worker.terminate();

    return parseHeuristic(text);
  } catch (error) {
    console.error("OCR Scan Error:", error);
    throw error;
  }
};

const parseHeuristic = (rawText) => {
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const subjects = [];
  
  // Vit/Standard common Course Regex (e.g., BITE304L, CSE1001, MTH202)
  const courseCodeRegex = /[A-Z]{3,4}\s?\d{3,4}[A-Z]?/;
  
  // Acceptable exact-match credits list typical in screenshots 
  // We accommodate decimal strings returning from OCR like "3.0", "1.5", etc.
  const validCredits = ["1.0", "1.5", "2.0", "3.0", "4.0", "5.0", "6.0", "9.0", "20.0", "1", "2", "3", "4", "5", "6", "9", "20"];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Attempt to identify a subject Name row
    // Look for course code pattern OR lines that have " - " commonly denoting "CODE - SubjectName"
    if (courseCodeRegex.test(line) || line.includes(" - ")) {
      
      // Clean up course name (Remove noisy prefixes like 'General (Semester)' if OCR mashed it)
      let cleanName = line.replace(/^(General|MOOC|Elective|Core).*?(Semester\)|Core|Elective)/i, '').trim();
      
      // Find the credits
      let creditValue = 3; // Default fallback 
      let foundCredit = false;

      // Scan the immediate next 5 lines looking for a standalone credit valid string.
      // Often tabular formats put credits under/after structural blocks.
      for (let j = 1; j <= 5 && (i + j) < lines.length; j++) {
        const checkLine = lines[i + j].replace(/\s+/g, ''); // strip spaces
        
        if (validCredits.includes(checkLine)) {
          creditValue = parseFloat(checkLine);
          foundCredit = true;
          break; // Stop at first valid credit found below the subject
        }
        
        // Sometimes OCR will mash the credit directly horizontally: "BITE304L Web Tech 3.0"
        const tokens = lines[i + j].split(' ');
        for (const token of tokens) {
          if (validCredits.includes(token)) {
            creditValue = parseFloat(token);
            foundCredit = true;
            break;
          }
        }
        if(foundCredit) break;
      }
      
      // If we couldn't find it vertically, double check horizontally inline with the subject name
      if (!foundCredit) {
        const tokens = line.split(' ');
        for (const token of tokens) {
          if (validCredits.includes(token)) {
            creditValue = parseFloat(token);
            break;
          }
        }
      }

      // Check if it's a lab (Lab / Practice usually have lower credits, or explicitly say Lab)
      const isLab = cleanName.toLowerCase().includes('lab') || cleanName.toLowerCase().includes('practice') || (cleanName.match(/[A-Z]+[0-9]+[PL]/) && !cleanName.match(/[A-Z]+[0-9]+[L]/));

      // Append struct
      subjects.push({
        id: crypto.randomUUID(),
        name: cleanName,
        credits: creditValue,
        grade: 'S', // Default assumed A/S grade to allow immediate calculation
        type: isLab ? 'lab' : 'theory'
      });
      
      // Fast-forward i to avoid scanning the metadata of this class as a new class
      i += 3;
    }
  }

  // Fallback: If no strong strict codes were found, but we find lots of lines meeting standard thresholds,
  // we could implement more generic scanning, but VIT-style regex handles 90% of structural screenshots well.
  
  return subjects;
};
