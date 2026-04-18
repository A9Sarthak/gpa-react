/**
 * Forwards a screenshot to the securely attached Backend VLM node for intelligent extraction.
 */
export const scanImageForSubjects = async (imageFile, onProgress) => {
  if (onProgress) onProgress(10);

  // Convert file to base64
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(imageFile);
  });

  if (onProgress) onProgress(30);

  // Send to backend
  const backendEndpoint = '/api/scan-screenshot';
  
  let response;
  try {
    response = await fetch(backendEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: base64,
        mimeType: imageFile.type
      })
    });
  } catch (networkErr) {
    throw new Error("Network error: Could not reach the server. Make sure backend is running. " + networkErr.message);
  }

  if (onProgress) onProgress(80);

  let resData;
  try {
    resData = await response.json();
  } catch (parseErr) {
    throw new Error("Server returned invalid response (not JSON). Status: " + response.status);
  }

  if (!response.ok || !resData.success) {
    throw new Error(resData.error || "Server error during scan. Status: " + response.status);
  }

  let subjectsRaw = resData.data;
  // LLM formatting safety fallback
  if (!Array.isArray(subjectsRaw)) {
    if (subjectsRaw && Array.isArray(subjectsRaw.subjects)) subjectsRaw = subjectsRaw.subjects;
    else if (subjectsRaw && Array.isArray(subjectsRaw.data)) subjectsRaw = subjectsRaw.data;
    else subjectsRaw = [];
  }

  const cachedCredits = JSON.parse(localStorage.getItem('userCreditCache') || '{}');

  const mappedSubjects = subjectsRaw.map(s => {
    let finalCredit = parseFloat(s.credits) || 3.0;
    const compName = (s.name || "").trim().toLowerCase();

    // Reinforcing strict global constraints
    if (compName.includes('quantitative skill') || compName.includes('qualitative skill')) {
      finalCredit = 1.5;
    } else if (cachedCredits[compName] !== undefined && !isNaN(cachedCredits[compName])) {
      finalCredit = cachedCredits[compName];
    }

    return {
      id: crypto.randomUUID(),
      name: (s.name || "").trim(),
      credits: finalCredit,
      grade: 'S',
      type: s.type === 'lab' ? 'lab' : 'theory'
    };
  });

  if (onProgress) onProgress(100);
  return mappedSubjects;
};
