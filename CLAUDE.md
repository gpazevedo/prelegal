# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

The current implementation has a working foundation with fake auth (any email/password accepted), a dashboard listing all 12 document types, and the Mutual NDA creator behind the login wall. AI chat, document persistence, and real authentication are not yet implemented.

## Development process

When instructed to build a feature:

1. Use your Atlassian tools to read the feature instructions from Jira
2. Develop the feature - do not skip any step from the feature-dev 7 step process
3. Thoroughly test the feature with unit tests and integration tests and fix any issues
4. Submit a PR using your github tools

## AI design

When writing code to make calls to LLMs, use your Cerebras skill to use LiteLLM via OpenRouter to the `openrouter/openai/gpt-oss-120b` model with Cerebras as the inference provider. You should use Structured Outputs so that you can interpret the results and populate fields in the legal document.

There is an OPENROUTER_API_KEY in the .env file in the project root.

## Technical design

The entire project is packaged into a Docker container.
The backend is in `backend/`, a uv project using FastAPI. API routes are prefixed `/api/`.
The frontend is in `frontend/`, built as a Next.js static export (`output: "export"`) and served by FastAPI at `/`.
The database uses SQLite (`data/prelegal.db`), created from scratch each container start. Users table stores email + created_at (no password — fake auth for now).
Session management uses signed cookies via `itsdangerous` (`SECRET_KEY` env var).
There are scripts in `scripts/` for:

```bash
# Mac
scripts/start-mac.sh    # Start
scripts/stop-mac.sh     # Stop

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```
Backend available at http://localhost:8000

## Color Scheme

- Accent Yellow: `#ecad0a`
- Blue Primary: `#209dd7`
- Purple Secondary: `#753991` (submit buttons)
- Dark Navy: `#032147` (headings)
- Gray Text: `#888888`

## Implementation Status

### Done (PL-3, PL-4)
- **V1 foundation**: FastAPI backend, Next.js static export, SQLite, Docker, start/stop scripts
- **Routing**: `/login` → `/dashboard` → `/dashboard/nda`
- **Auth**: Fake login (any email/password), session cookie via `itsdangerous`, `AuthGuard` component
- **Dashboard**: Lists all 12 document types from `catalog.json`; Mutual NDA is the only active one
- **Mutual NDA creator**: Form + live preview + PDF export (print) at `/dashboard/nda`
- **Backend API**: `POST /api/auth/signup|signin|signout`, `GET /api/auth/me`, `GET /api/catalog`, `GET /api/templates/{filename}`
- **Tests**: 12 backend tests, 95 frontend tests

### Not yet implemented
- Real authentication (password hashing, secure cookies)
- AI chat for filling document fields
- All other document types (11 of 12 show "Coming Soon")
- Document persistence (saving drafts, history)
