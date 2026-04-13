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
  
  // Basic Regex for Subject code: 3-4 letters, 3-4 digits, optional 1 letter
  const courseCodeRegex = /[A-Z]{3,4}\s?\d{3,4}[A-Z]?/;
  
  // Valid credits format in screenshots (usually ends in .0 or .5 or single digits)
  const validCredits = ["1.0", "1.5", "2.0", "3.0", "4.0", "5.0", "6.0", "20.0", "1", "2", "3", "4", "5", "6", "9", "20"];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const matchPos = line.search(courseCodeRegex);

    // Attempt to identify a subject Name row
    if (matchPos !== -1) {
      
      let textFromCode = line.substring(matchPos);
      
      // Stop the name explicitly when encountering any weird symbols like |, ~, (, or standalone numbers which means the name ended
      let cleanName = textFromCode;
      const stopMatch = textFromCode.match(/(\(|~|\||\d{2,}| Discipline | Foundation )/);
      if (stopMatch) {
        cleanName = textFromCode.substring(0, stopMatch.index).trim();
      } else {
        // Just general cleanup if no weird characters exist
        cleanName = cleanName.trim();
      }

      // Check if it's a lab (P at the end of code, or contains Lab/Practice)
      const codeMatch = textFromCode.match(courseCodeRegex);
      const code = codeMatch ? codeMatch[0] : "";
      const isLab = cleanName.toLowerCase().includes('lab') || cleanName.toLowerCase().includes('practice') || code.endsWith('P') || code.endsWith('L') === false && code.match(/[A-Z]+[0-9]+[PL]/);
      
      // For Credits constraint: "lowest no is credits of subect".
      // We will blindly sweep the next 6 lines. Whatever numeric valid point is located at the lowest vertical spot BEFORE hitting the next code is the Credit!
      let creditValue = 3; // Default fallback
      let lastFoundCredit = null;

      for (let j = 0; j <= 6 && (i + j) < lines.length; j++) {
        const checkLine = lines[i + j];
        // Break out immediately if we accidentally hit the next subject code entirely
        if (j > 0 && courseCodeRegex.test(checkLine)) break;
        
        // Scan tokens
        const tokens = checkLine.split(/\s+/);
        for (const token of tokens) {
          if (validCredits.includes(token)) {
            lastFoundCredit = parseFloat(token);
          }
        }
      }
      
      if (lastFoundCredit !== null) {
        creditValue = lastFoundCredit;
      }

      // Filter out duplicate identical basic names globally avoiding spam
      subjects.push({
        id: crypto.randomUUID(),
        name: cleanName,
        credits: creditValue,
        grade: 'S', // Default assumed grade
        type: isLab ? 'lab' : 'theory'
      });
    }
  }

  return subjects;
};
