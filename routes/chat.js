const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'mybuddy_secret_2024';

// Middleware to verify JWT
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

router.post('/message', verifyToken, async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return res.status(500).json({ error: 'Gemini API key not configured. Please set GEMINI_API_KEY in environment variables.' });
    }

    // Build conversation history for Gemini
    const systemInstruction = `You are MY BUDDY, a friendly and intelligent AI assistant. Your personality is warm, helpful, and encouraging. You can:
- Chat about daily life, hobbies, and casual topics in a friendly way
- Help solve aptitude questions (math, reasoning, verbal, quantitative)
- Answer subject-related questions (science, history, geography, literature, etc.)
- Help with competitive programming (algorithms, data structures, code optimization, debugging)
- Perform small tasks like calculations, unit conversions, setting reminders, brainstorming ideas, writing drafts
- Explain complex concepts in simple language
Always be positive, clear, and concise. For code problems, provide well-commented solutions. For aptitude problems, show step-by-step working. Address the user as a friend.`;

    // Build contents array for Gemini
    const contents = [];
    if (history && Array.isArray(history)) {
      for (const msg of history.slice(-20)) { // last 20 messages for context
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      }
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await fetch(
     `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents,
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      }
    );

    if (!response.ok) {
      const errData = await response.json();
      console.error('Gemini API error:', errData);
      return res.status(500).json({ error: errData.error?.message || 'Failed to get response from AI' });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.status(500).json({ error: 'No response from AI' });

    res.json({ success: true, response: text });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

module.exports = router;
