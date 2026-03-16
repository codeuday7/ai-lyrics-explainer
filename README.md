# 🎵 AI Lyrics Explainer

> **Decode any song's hidden meaning using AI.**  
> A full-stack web application with AI-powered lyric analysis, user authentication, public feed, and search. Features a robust **Multi-AI Fallback Architecture** utilizing Google Gemini and OpenRouter (Claude-3-Haiku).

[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-blue)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)](https://mongodb.com)
[![Gemini API](https://img.shields.io/badge/Google-Gemini-orange)](https://ai.google.dev)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-Claude_3-purple)](https://openrouter.ai)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## 🌟 Features

- 🤖 **Multi-AI Fallback Architecture** — Primary analysis powered by Google Gemini (1.5 Flash), with seamless automatic fallback to Claude-3-Haiku via OpenRouter ensuring 100% uptime against quota limits.
- 🎭 **5-Layer AI Analysis Breakdown**
  1. **Theme** — Core narrative and central concept
  2. **Emotional Tone** — Mood, atmosphere, and emotional progression
  3. **Verse Breakdown** — Line-by-line analysis of key sections
  4. **Hidden Meaning** — Metaphors, symbolism, and deeper interpretations
  5. **Overall Message** — Primary takeaway and artistic intent
- 🌍 **Multilanguage Support** — Analyze & translate lyrics in 40+ languages (Hindi, Spanish, French, Arabic, Japanese, Korean, Chinese, and more)
- 🌐 **Automatic Language Detection** — AI-powered language identification
- 🔐 **JWT Authentication** — Secure signup/login with bcrypt password hashing
- 💾 **Save Analyses** — Store decoded songs in MongoDB
- 🌐 **Public Feed** — Discover songs analyzed by the community
- 🔍 **Search** — Find explanations by song name or artist
- 📋 **Copy & Share** — Export or share your analyses instantly
- 🌙 **Dark Theme** — Premium glassmorphism UI with smooth animations
- 📱 **Mobile Responsive** — Fully responsive across all devices

---

## 🎭 5-Layer AI Analysis Breakdown

Each analysis is structured in 5 dimensions for comprehensive lyric understanding:

| Layer | Purpose | Example |
|-------|---------|---------|
| **Theme** | Identifies the central narrative and core concept | "Explore themes of identity, love, or social commentary" |
| **Emotional Tone** | Analyzes mood, atmosphere, and emotional evolution | "Melancholic verses transition to triumphant chorus" |
| **Verse Breakdown** | Line-by-line interpretation of key sections | "Opening verse establishes the protagonist's struggle..." |
| **Hidden Meaning** | Uncovers metaphors, symbolism, and deeper layers | "The rain symbolizes emotional cleansing and rebirth" |
| **Overall Message** | Synthesizes the artist's primary intent | "A meditation on resilience and self-acceptance" |

---

## 🌍 Multilanguage Support

Analyze and understand lyrics in **40+ supported languages**:

**Indian Languages:** Hindi, Telugu, Tamil, Kannada, Malayalam  
**European Languages:** English, Spanish, French, German, Italian, Portuguese, Russian, Polish, Dutch, Swedish, Norwegian, Danish, Finnish, Greek, Czech, Hungarian, Romanian, Bulgarian, Estonian, Irish, Icelandic, Lithuanian, Latvian, Slovak, Slovenian, Afrikaans, Ukrainian  
**Asian Languages:** Japanese, Korean, Chinese (Simplified & Traditional), Thai, Vietnamese, Indonesian, Arabic  
**More Languages:** Turkish, and others

### Multilanguage Features:
- ✅ **Automatic Language Detection** — AI detects your lyrics' language automatically
- ✅ **Intelligent Translation** — Translate lyrics and explanations to any supported language
- ✅ **Preserve Meaning** — Maintains poetic intent and cultural nuances during translation
- ✅ **Multilingual Feed** — Discover analyses from around the world

---

## 📋 Recent Updates

### Version 1.0.0 - March 2026
- ✨ **New:** Comprehensive 5-layer AI analysis breakdown
- ✨ **New:** Multilanguage support with 40+ languages
- ✨ **New:** Intelligent language detection for incoming lyrics
- ✨ **New:** Translation API integration
- ✨ **Enhanced:** Multi-AI fallback system (Gemini → Claude-3-Haiku)
- ✨ **Enhanced:** Public feed with global community analyses
- ✨ **Enhanced:** Advanced search capabilities (song, artist, language)
- 🐛 **Fixed:** JWT token validation edge cases
- 🐛 **Fixed:** CORS configuration for production deployment
- 📚 **Docs:** Complete API documentation and deployment guides

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS (Glassmorphism), Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| AI Pipeline | `gemini-1.5-flash` natively & `anthropic/claude-3-haiku` via OpenRouter (using Axios) |
| Language Processing | Gemini API for detection & translation |
| Auth | JWT + bcrypt |
| Deployment | Render (backend), Vercel (frontend) |

---

## 📁 Project Structure

```
ai-lyrics-explainer/
├── backend/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js    # Signup / Login logic
│   │   └── lyricsController.js  # Analyze / Save / Feed / Search
│   ├── middleware/
│   │   └── authMiddleware.js    # JWT protection
│   ├── models/
│   │   ├── User.js              # User schema
│   │   └── Explanation.js       # Analysis schema
│   ├── routes/
│   │   ├── authRoutes.js        # /api/auth/*
│   │   └── lyricsRoutes.js      # /api/lyrics/*
│   ├── services/
│   │   ├── aiService.js         # Multi-AI engine orchestrator (Gemini & OpenRouter)
│   │   └── languageService.js   # Language detection & translation (40+ languages)
│   ├── server.js                # Express entry point
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── index.html               # Landing page
    ├── login.html               # Auth (login + signup)
    ├── dashboard.html           # Lyrics analyzer
    ├── feed.html                # Public feed
    ├── css/
    │   └── style.css            # Full design system
    └── js/
        ├── auth.js              # Auth utilities (shared)
        ├── dashboard.js         # Analyzer logic
        └── feed.js              # Feed + search + modal
```

---

## ⚡ Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/ai-lyrics-explainer.git
cd ai-lyrics-explainer
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. MongoDB Atlas Setup

1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas) and create a free account
2. Create a new **Cluster** (free M0 tier)
3. Under **Database Access** → Add a database user with username + password
4. Under **Network Access** → Add `0.0.0.0/0` (allow all IPs)
5. Click **Connect** → **Compass** → Copy the connection string  
   Example: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/`

### 4. API Keys Setup (Gemini & OpenRouter)

**Gemini API:**
1. Go to [ai.google.dev](https://ai.google.dev) and sign in.
2. Click **Get API Key** → **Create API Key** and copy it.

**OpenRouter API (Fallback System):**
1. Go to [openrouter.ai](https://openrouter.ai) and sign in.
2. Generate an API Key in the settings panel and copy it.

### 5. Configure Environment Variables

```bash
# In the backend/ directory:
cp .env.example .env
```

Edit `backend/.env`:

```env
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/ai-lyrics-explainer
JWT_SECRET=your_super_secret_jwt_key_minimum_32_chars
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your_gemini_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 6. Run the Backend

```bash
cd backend
npm run dev      # Development (with nodemon)
# OR
npm start        # Production
```

Server runs at: **http://localhost:5000**

### 7. Run the Frontend

The frontend is **pure HTML/CSS/JS** — no build step needed!

**Option A: Open directly**
- Open `frontend/index.html` in your browser

**Option B: Live server (recommended)**
```bash
# Using VS Code Live Server extension, or:
npx serve frontend
# OR
npx http-server frontend -p 3000
```

Frontend runs at: **http://localhost:3000**

---

## 🌐 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### POST `/api/auth/signup`
Register a new user.

**Request Body:**
```json
{
  "username": "musiclover",
  "email": "user@example.com",
  "password": "mypassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully!",
  "token": "eyJhbGciOi...",
  "user": { "id": "...", "username": "musiclover", "email": "user@example.com" }
}
```

---

#### POST `/api/auth/login`
Login an existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "mypassword123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOi...",
  "user": { ... }
}
```

---

### Lyrics Endpoints

#### POST `/api/lyrics/analyze` 🔒 *Protected*
Analyze lyrics with Gemini AI.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "lyrics": "Is this the real life? Is this just fantasy?...",
  "songName": "Bohemian Rhapsody",
  "artist": "Queen"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "songName": "Bohemian Rhapsody",
    "artist": "Queen",
    "theme": "Existential crisis and acceptance of fate",
    "emotionalTone": "Dramatically melancholic with a defiant undercurrent",
    "verseBreakdown": ["The opening verse explores...", "The ballad section shifts..."],
    "hiddenMeaning": "The song uses a dramatic narrative...",
    "overallMessage": "The artist explores the human condition..."
  }
}
```

---

#### POST `/api/lyrics/save` 🔒 *Protected*
Save an explanation to the database.

**Headers:** `Authorization: Bearer <token>`

**Request Body:** Include all fields from the analyze response + `isPublic` (boolean).

---

#### GET `/api/lyrics/feed`
Get public feed of analyzed songs.

**Query params:** `?page=1&limit=12`

---

#### GET `/api/lyrics/search?song=`
Search by song name or artist.

**Query params:** `?song=Bohemian`

---

#### GET `/api/lyrics/my-explanations` 🔒 *Protected*
Get the authenticated user's saved explanations.

---

## 🧪 Testing with Postman

1. **Import Collection** — Create a new collection called "LyricsAI"
2. **Set Variables** — Set `base_url` = `http://localhost:5000/api` and `token` = (from login response)

**Test Flow:**
1. POST `{{base_url}}/auth/signup` → copy the `token`
2. POST `{{base_url}}/auth/login` → confirm login
3. POST `{{base_url}}/lyrics/analyze` with `Bearer {{token}}` header
4. POST `{{base_url}}/lyrics/save` with `Bearer {{token}}` header
5. GET `{{base_url}}/lyrics/feed`
6. GET `{{base_url}}/lyrics/search?song=Bohemian`

---

## 🚀 Deployment

### Backend → Render

1. Push your code to GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your GitHub repository
4. Set:
   - **Root directory:** `backend`
   - **Build command:** `npm install`
   - **Start command:** `npm start`
5. Add Environment Variables (same as `.env`):
   - `MONGO_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`, `NODE_ENV=production`
   - `FRONTEND_URL=https://your-frontend.vercel.app`
6. Deploy! Your API URL will be `https://your-app.onrender.com`

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repository
3. Set **Root directory:** `frontend`
4. No build command needed (static site)
5. **Important:** Update `API_BASE` in `frontend/js/auth.js`:
   ```javascript
   const API_BASE = 'https://your-app.onrender.com/api';
   ```
6. Deploy! Your app will be live at `https://your-app.vercel.app`

### GitHub Setup

```bash
git init
git add .
git commit -m "🎵 Initial commit: AI Lyrics Explainer"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ai-lyrics-explainer.git
git push -u origin main
```

> ⚠️ Add a `.gitignore` to exclude `.env` and `node_modules`

---

## 🔒 Security Notes

- Passwords are hashed with **bcrypt** (12 salt rounds)
- JWTs expire in **7 days** by default
- Protected routes validate Bearer tokens on every request
- CORS is configured — set `FRONTEND_URL` to your actual frontend domain in production

---

## 📄 License

MIT License — feel free to use, modify, and distribute.

---

## 👨‍💻 Author

Built with ❤️ using Google Gemini AI, Node.js, and vanilla JavaScript.

> *"Music gives a soul to the universe, wings to the mind, flight to the imagination, and life to everything." — Plato*
