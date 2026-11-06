# CodeArena — LeetCode-style coding practice

A dark-themed coding practice website with:
- Problems list and difficulty/search filters
- Monaco code editor
- Python, Java, and C language choices
- Multiple-choice questions (Python, Java, C) next to the coding problems
- Points (Easy 10, Medium 20, Hard 30), day streaks, and a leaderboard stored in SQLite (`backend/codearena.db`, created on first run)
- Daily challenges: one question per difficulty level, changing each day
- Run sample test and Submit against hidden tests
- FastAPI backend that calls Judge0 for sandboxed execution

This is an educational prototype, not an exact copy of LeetCode's branding or internal judge. The starter problem format uses stdin/stdout for reliability across languages. LeetCode-style function signatures and hidden harnesses can be added next.

## Requirements
- Node.js 20+ and npm
- Python 3.10+
- Internet access for Judge0 execution

## 1. Start the backend (Windows PowerShell)
Open a terminal in the project folder:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn main:app --reload --port 8000
```

If PowerShell blocks activation, run:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

The API will be at http://localhost:8000 and its interactive docs at http://localhost:8000/docs.

## 2. Start the frontend
Open a second terminal in the project folder:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL Vite prints, usually http://localhost:5173.

## 3. Test it
1. Select **Sum of Two Integers**.
2. Keep Python selected.
3. Click **Run** to execute the sample input.
4. Click **Submit** to run all public and hidden test cases.
5. Click **Log in** (top right), then **Create an account** (name, email, password of 8+ characters), so submissions earn points, then open **Daily**, **Progress** and **Leaderboard** from the top bar.
6. Try a multiple-choice question: they are listed under the problems, marked MC.

## Judge0 configuration
The backend defaults to `https://ce.judge0.com`. Public-host availability, quotas, network access, and supported languages can change. If that endpoint is unavailable, set `JUDGE0_API_URL` to a Judge0 instance you control or a provider endpoint. If your provider requires a key, configure `JUDGE0_API_KEY` and `JUDGE0_AUTH_HEADER` in `backend/.env` (see `.env.example`).

Do not put Judge0 credentials in frontend code or commit `.env`.

## Project structure
```text
leetcode_style_prototype/
  backend/
    main.py
    requirements.txt
    .env.example
  frontend/
    index.html
    package.json
    vite.config.js
    src/
      main.jsx
      App.jsx
      styles.css
```

## Important before public deployment
This is a prototype. Accounts use email and password (PBKDF2-hashed) with 30-day login sessions stored in SQLite. Before exposing it publicly, also add HTTPS, email verification, password reset, request rate limits, quotas, logging, CSRF/CORS policy for your deployed domains, and abuse monitoring. Keep execution in Judge0 or another sandbox; never run arbitrary submitted code directly on your own server.
