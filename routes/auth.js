const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const path = require('path');

// Initialize DB
const db = new Database(path.join(__dirname, '../users.db'));
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const JWT_SECRET = process.env.JWT_SECRET || 'mybuddy_secret_2024';

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ error: 'All fields are required' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)');
    stmt.run(username.trim(), email.trim().toLowerCase(), hashedPassword);

    const user = db.prepare('SELECT id, username, email FROM users WHERE email = ?').get(email.trim().toLowerCase());
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ success: true, token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify token
router.post('/verify', (req, res) => {
  try {
    const { token } = req.body;
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, user: { userId: decoded.userId, username: decoded.username } });
  } catch {
    res.json({ valid: false });
  }
});

module.exports = router;
