/**
 * Forwards a screenshot to the securely attached Backend VLM node for intelligent extraction.
 */
export const scanImageForSubjects = async (imageFile, onProgress) => {
  return new Promise((resolve, reject) => {
    if (onProgress) onProgress(10);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      if (onProgress) onProgress(40); // Image encoded
      
      try {
        // Base backend route assumes local proxy or defined environment backend. 
        // Vercel routes handle absolute paths natively.
        const backendEndpoint = '/api/scan-screenshot';
        
        const response = await fetch(backendEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: e.target.result,
            mimeType: imageFile.type
          })
        });
        
        if (onProgress) onProgress(80); // AI Thinking finished
        
        const resData = await response.json();
        
        if (!response.ok || !resData.success) {
           throw new Error(resData.error || "Internal Server Block during OCR");
        }
        
        const subjectsRaw = resData.data;
        const cachedCredits = JSON.parse(localStorage.getItem('userCreditCache') || '{}');
        
        const mappedSubjects = subjectsRaw.map(s => {
           let finalCredit = parseFloat(s.credits) || 3.0;
           const compName = s.name.trim().toLowerCase();
           
           // Reinforcing strict global constraints
           if (compName.includes('quantitative skill') || compName.includes('qualitative skill')) {
             finalCredit = 1.5;
           } else if (cachedCredits[compName] !== undefined && !isNaN(cachedCredits[compName])) {
             finalCredit = cachedCredits[compName];
           }
           
           return {
              id: crypto.randomUUID(),
              name: s.name.trim(),
              credits: finalCredit,
              grade: 'S',
              type: s.type === 'lab' ? 'lab' : 'theory'
           };
        });
        
        if (onProgress) onProgress(100);
        resolve(mappedSubjects);
        
      } catch (err) {
        console.error("VLM Error:", err);
        reject(err);
      }
    };
    
    reader.onerror = () => reject(new Error("Local File processing failed before AI injection."));
    reader.readAsDataURL(imageFile);
  });
};
