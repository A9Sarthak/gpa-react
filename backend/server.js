import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import User from './models/User.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ------------------------------
// MongoDB Connection
// ------------------------------
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gpa_calculator';

console.log('Connecting to MongoDB...');
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Backend!'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));


// ------------------------------
// Routes
// ------------------------------

// Screenshot Scanner Route (Gemini OCR)
app.post('/api/scan-screenshot', async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) return res.status(400).json({ error: "Missing image" });
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "No Gemini Key Configured. Please configure standard environments to utilize this tool!" });
    }
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `You are a strict data extractor. Analyze this tabular screenshot of university subject registrations.
Extract each registered course's Basic Name and its assigned Credits (which is always the bottom-most number in the vertical LTPJC matrix or explicitly shown on the same line if single).
Also, identify if it's a lab (contains words like "Lab", "Practice" or code ending in 'P').
Do NOT include course codes (like BITE304L) in the name. Just the plain name. Make sure it is capitalized correctly.
Respond ONLY with a JSON array of objects. Like this:
[{"name": "Web Technologies", "credits": 3.0, "type": "theory"}, {"name": "Software Engineering Lab", "credits": 1.0, "type": "lab"}]`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64.split(',')[1] || imageBase64,
          mimeType: mimeType || "image/jpeg"
        }
      }
    ]);
    
    let jsonStr = result.response.text();
    jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Parse strictly to validate
    const subjects = JSON.parse(jsonStr);
    
    res.json({ success: true, data: subjects });
  } catch (err) {
    console.error("Gemini AI failed: ", err);
    res.status(500).json({ error: "Gemini Vision completely failed to decode formatting: " + err.message });
  }
});

// Signup Route
app.post('/api/auth/signup', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required.' });

  try {
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) return res.status(400).json({ error: 'Username already taken.' });

    const newUser = new User({ username, password });
    await newUser.save();
    
    res.json({ success: true, message: 'Account created successfully.', gpaData: newUser.gpaData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during signup.' });
  }
});

// Login Route
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required.' });

  try {
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'User not found. Please sign up.' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Incorrect password.' });

    res.json({ success: true, message: 'Logged in successfully.', gpaData: user.gpaData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// Load User Data Route
app.get('/api/data/load/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    res.json({ success: true, data: user.gpaData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load data.' });
  }
});

// Save User Data Route
app.post('/api/data/save', async (req, res) => {
  const { username, data } = req.body;
  if (!username || !data) return res.status(400).json({ error: 'Username and data are required.' });

  try {
    const user = await User.findOneAndUpdate(
      { username: username.toLowerCase() },
      { $set: { gpaData: data } },
      { new: true }
    );
    
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ success: true, message: 'Data saved successfully.', data: user.gpaData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save data.' });
  }
});

// Start Server (only if not on Vercel)
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

export default app;
