# 🚀 HackPortal — AI-Powered Hackathon Management Portal

A production-ready full-stack application for managing hackathon projects with RAG-powered AI chat, real-time analytics, and a premium dark-mode UI.

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Tailwind CSS + React Router v6 + Zustand |
| Backend | FastAPI + Motor (async MongoDB) |
| Database | MongoDB 7 |
| Cache / Sessions | Redis 7 |
| Auth | JWT (access 15min, refresh 7d in httpOnly cookie) |
| AI / RAG | Google Gemini / OpenAI GPT-4o + FAISS + all-MiniLM-L6-v2 |
| Infra | Docker Compose |

---

## 📁 Project Structure

```
times_grp/
├── docker-compose.yml
├── .env                    # Local dev (copy from .env.example)
├── .env.example
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── seed.py             # Populate DB with sample data
│   └── app/
│       ├── main.py         # FastAPI entry point
│       ├── config.py       # Settings from env
│       ├── database.py     # Motor async MongoDB
│       ├── redis_client.py # Cache / rate-limit / sessions
│       ├── models/
│       │   ├── user.py
│       │   └── project.py
│       ├── middleware/
│       │   ├── auth_middleware.py
│       │   └── rate_limiter.py
│       ├── routes/
│       │   ├── auth.py
│       │   ├── projects.py
│       │   ├── analytics.py
│       │   └── genai.py
│       └── services/
│           ├── auth_service.py
│           ├── project_service.py
│           ├── analytics_service.py
│           └── genai_service.py
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── api/
        │   └── axiosClient.js
        ├── stores/
        │   ├── authStore.js
        │   ├── projectStore.js
        │   └── chatStore.js
        ├── components/
        │   ├── Navbar.jsx
        │   ├── Layout.jsx
        │   ├── Badge.jsx
        │   ├── StatCard.jsx
        │   ├── ProjectCard.jsx
        │   ├── ChatBubble.jsx
        │   └── Skeleton.jsx
        └── pages/
            ├── Dashboard.jsx
            ├── Login.jsx
            ├── ProjectsList.jsx
            ├── ProjectDetail.jsx
            └── GenAIChat.jsx
```

---

## ⚡ Quick Start

### Option A — Docker Compose (Recommended)

```bash
# 1. Clone and copy env
cp .env.example .env
# Edit .env and add your GOOGLE_API_KEY or OPENAI_API_KEY

# 2. Start all services
docker compose up --build

# 3. Seed sample data (in another terminal)
docker compose exec backend python seed.py
```

Visit: **http://localhost:3000**

---

### Option B — Local Development

**Prerequisites:** Python 3.11+, Node 20+, MongoDB, Redis running locally.

#### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux

pip install -r requirements.txt

# Copy and configure env (use localhost for MONGO_HOST, REDIS_HOST)
cp ../.env.example ../.env

# Seed sample data
python seed.py

# Start API server
uvicorn app.main:app --reload --port 8000
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit: **http://localhost:3000**

---

## 🔑 API Endpoints

### Auth `/api/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | No | Register new user |
| POST | `/login` | No | Login (rate: 5/min/IP) |
| POST | `/refresh` | Cookie | Refresh access token |
| POST | `/logout` | Cookie | Logout + clear session |
| GET | `/me` | Bearer | Get current user |

### Projects `/api/projects`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | No | List with filters + pagination |
| GET | `/domains` | No | All distinct domains |
| GET | `/tech-stacks` | No | All distinct tech stacks |
| GET | `/{id}` | No | Get single project |
| POST | `/` | Bearer | Create project |
| PUT | `/{id}` | Bearer | Update own project |
| DELETE | `/{id}` | Bearer | Delete own project |

**Filter params:** `search`, `domain` (comma-sep), `tech_stack` (comma-sep), `award` (winner,runner_up,none), `page`, `per_page`

### Analytics `/api/analytics`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/dashboard` | No | Stats (cached 60s) |

### GenAI `/api/genai`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/chat` | Bearer | SSE streaming RAG chat (10/min) |
| GET | `/suggestions` | Bearer | Suggested questions |
| POST | `/rebuild-index` | Bearer | Rebuild FAISS index |

---

## 🤖 GenAI / RAG Pipeline

1. **Indexing** — On startup, all projects are embedded with `all-MiniLM-L6-v2` into a FAISS `IndexFlatIP` (cosine similarity with normalized vectors). Index is saved to disk.
2. **Query** — User query is embedded and searched against FAISS top-5.
3. **Threshold** — If similarity score ≥ 0.35, project context is added to the prompt. Below threshold → general LLM response.
4. **Streaming** — Gemini/GPT-4o streams the response as SSE events (`chunk`, `sources`, `done`, `error`).
5. **Rate limit** — 10 requests/min per user via Redis sliding-window counter.

---

## 🛡️ Rate Limits

| Endpoint | Limit | Identifier |
|----------|-------|------------|
| POST `/auth/login` | 5/min | IP address |
| All `/projects/*` | 60/min | User ID |
| POST `/genai/chat` | 10/min | User ID |

---

## 🔐 Auth Flow

```
Register/Login ──► Access Token (JWT, 15min, in memory)
                ──► Refresh Token (JWT, 7d, httpOnly cookie)
                ──► Redis session: session:{user_id}:{session_id}

Access Token expired ──► Auto-refresh via interceptor
Refresh Token expired ──► Redirect to /login
Logout ──► Delete Redis session + clear cookie
```

---

## 🌍 Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGO_USER/PASSWORD/HOST/PORT/DB` | MongoDB connection |
| `REDIS_HOST/PORT/PASSWORD` | Redis connection |
| `JWT_SECRET_KEY` | JWT signing secret (change in prod!) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT access token TTL (default: 15) |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token TTL (default: 7) |
| `GOOGLE_API_KEY` | Google Gemini API key |
| `OPENAI_API_KEY` | OpenAI API key (used if `LLM_PROVIDER=openai`) |
| `LLM_PROVIDER` | `gemini` or `openai` |
| `EMBEDDING_MODEL` | SentenceTransformer model name |
| `SIMILARITY_THRESHOLD` | RAG similarity cutoff (0–1) |

---

## 🎨 Design System

- **Primary:** Indigo (`#6366f1`)
- **Winner badge:** Amber
- **Runner-up badge:** Slate
- **Background:** Slate 950 (`#020617`)
- **Cards:** Glassmorphism (`bg-slate-900/60 backdrop-blur-xl`)
- **Font:** Inter (body) + JetBrains Mono (code)
- **Mode:** Dark-first (Tailwind `dark:` classes)

---

## 📦 Seed Data

The seed script inserts **10 realistic projects** across domains:
- Sustainability, Healthcare, Manufacturing, Education, FinTech
- Emergency Services, Accessibility, Agriculture, Developer Tools, Blockchain

And **3 sample users** (password: `password123`):
- `alice@hackathon.io`
- `bob@hackathon.io`
- `carol@hackathon.io`

```bash
# Backend running locally:
cd backend && python seed.py

# Via Docker:
docker compose exec backend python seed.py
```
