import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

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
