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
  
  // Valid credits format in screenshots (Only decimals to aggressively prevent grabbing Row Numbers like '5', '6' from the far left column)
  const validCredits = ["1.0", "1.5", "2.0", "2.5", "3.0", "3.5", "4.0", "4.5", "5.0", "6.0", "9.0", "20.0"];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const matchPos = line.search(courseCodeRegex);

    // Attempt to identify a subject Name row
    if (matchPos !== -1) {
      
      const codeMatch = line.match(courseCodeRegex);
      const code = codeMatch ? codeMatch[0] : "";
      
      // Start capturing the name explicitly AFTER the course code so we don't accidentally truncate ourselves!
      let textFromCode = line.substring(matchPos + code.length).trim();
      
      if (textFromCode.startsWith('-')) {
        textFromCode = textFromCode.substring(1).trim();
      }
      
      // Stop the name explicitly when encountering course metadata columns (numbers, structural keywords)
      let cleanName = textFromCode;
      const stopMatch = textFromCode.match(/(\(|~|\||\d| Discipline | Foundation | Core | Regular | Engineering )/i);
      if (stopMatch) {
        cleanName = textFromCode.substring(0, stopMatch.index).trim();
      } else {
        cleanName = cleanName.trim();
      }

      // Check if it's a lab (P at the end of code, or contains Lab/Practice)
      const isLab = cleanName.toLowerCase().includes('lab') || cleanName.toLowerCase().includes('practice') || code.endsWith('P') || (code.endsWith('L') === false && code.match(/[A-Z]+[0-9]+[PL]/));
      
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
