# MY BUDDY - AI Assistant

A full-stack AI chat assistant powered by Google Gemini (FREE API — no payment needed).

---

## 🚀 HOW TO DEPLOY ON RENDER

### Step 1: Get Your FREE Gemini API Key
1. Go to: https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key (it's completely free, no credit card needed)

### Step 2: Push to GitHub
1. Create a new GitHub repository
2. Upload all these project files to it
3. Make sure `.env` is NOT uploaded (it's in .gitignore)

### Step 3: Deploy on Render
1. Go to https://render.com and sign up (free)
2. Click "New +" → **Choose: "Web Service"** ← THIS IS THE SERVICE TO SELECT
3. Connect your GitHub repository
4. Fill in the settings:
   - **Name**: my-buddy-ai (or anything you like)
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

### Step 4: Set Environment Variables on Render
In your Render service dashboard → "Environment" tab, add:
```
GEMINI_API_KEY = paste_your_gemini_api_key_here
JWT_SECRET     = any_random_string_like_mybuddy2024xyz
```

### Step 5: Deploy!
Click "Create Web Service" — Render will build and deploy automatically.
Your site will be live at: `https://your-app-name.onrender.com`

---

## 💻 LOCAL DEVELOPMENT

1. Copy `.env.example` to `.env`
2. Add your Gemini API key in `.env`
3. Run:
```bash
npm install
npm start
```
4. Open: http://localhost:3000

---

## 🔧 PROJECT STRUCTURE

```
mybuddy/
├── server.js          # Express server
├── package.json       # Dependencies
├── .env.example       # Environment template
├── routes/
│   ├── auth.js        # Login / Register API
│   └── chat.js        # Chat API (calls Gemini)
└── public/
    ├── index.html     # Full app UI
    ├── style.css      # Dark mode styles
    └── app.js         # Frontend logic
```

---

## ✨ FEATURES

- 🔐 User accounts (register/login with JWT auth)
- 💬 Chat about daily topics
- 🧮 Aptitude & math problem solving
- 📚 Subject question answering
- 💻 Competitive programming help
- 🌙 Dark mode UI
- 📱 Mobile responsive

---

Made by Rohan Dutta
