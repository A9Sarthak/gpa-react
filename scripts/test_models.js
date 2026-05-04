import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

async function listModels() {
  try {
     const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
     const data = await res.json();
     console.log(data.models.map(m => m.name).join("\n"));
  } catch (err) {
    console.error(err);
  }
}
listModels();
