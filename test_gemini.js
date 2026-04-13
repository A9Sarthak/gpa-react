import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

async function testGemini() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    
    console.log("Key:", process.env.GEMINI_API_KEY.substring(0, 10) + "...");
    
    const prompt = `You are a strict data extractor. Analyze this tabular screenshot of university subject registrations.
Extract each registered course's Basic Name and its assigned Credits (which is always the bottom-most number in the vertical LTPJC matrix or explicitly shown on the same line if single).
Also, identify if it's a lab (contains words like "Lab", "Practice" or code ending in 'P').
Do NOT include course codes (like BITE304L) in the name. Just the plain name. Make sure it is capitalized correctly.
Respond ONLY with a JSON array of objects. Like this:
[{"name": "Web Technologies", "credits": 3.0, "type": "theory"}, {"name": "Software Engineering Lab", "credits": 1.0, "type": "lab"}]`;

    // Let's just create a dummy "blank" image payload for testing or read a small existing icon if no image available.
    // Wait, let's just test with a trivial image.
    const dummyImage = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: dummyImage.toString("base64"),
          mimeType: "image/png"
        }
      }
    ]);
    
    let jsonStr = result.response.text();
    console.log("Raw Response:\n", jsonStr);
    
    jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
    const subjects = JSON.parse(jsonStr);
    
    console.log("Parsed Array:\n", subjects);
  } catch (err) {
    console.error("Gemini Error:", err);
  }
}
testGemini();
