# Prelegal

AI-powered legal document drafting platform. Users register, chat with an AI assistant to fill in document details, preview the rendered document live, and download it as a PDF.

## Features

- **12 document types** — Mutual NDA, CSA, DPA, BAA, PSA, SLA, and more
- **AI chat** — conversational form-filling via OpenRouter (GPT-o1/Cerebras)
- **Live preview** — document renders in real time as fields are filled
- **Document history** — signed-in users can view and resume all prior drafts
- **PDF export** — `window.print()` with CSS `@media print`
- **Auth** — email + password (PBKDF2-SHA256), signed session cookies

> **Note:** The database is temporary and resets on each container restart.
> Documents are draft only and subject to legal review.

## Running

Requires Docker. Copy `.env.example` to `.env` and set `OPENROUTER_API_KEY`.

```bash
# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Mac
scripts/start-mac.sh
scripts/stop-mac.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```

App runs at `http://localhost:8000`.

## Development

**Backend** (FastAPI, Python 3.14, uv):
```bash
cd backend
uv run uvicorn app.main:app --reload
uv run pytest
```

**Frontend** (Next.js 16, static export):
```bash
cd frontend
npm install
npm run dev   # dev server at :3000
npm run build # static export to out/
npm test
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI, SQLite, itsdangerous |
| Frontend | Next.js 16 (static export), Tailwind CSS |
| AI | LiteLLM → OpenRouter → `openai/gpt-oss-120b` (Cerebras) |
| Container | Docker Compose |
