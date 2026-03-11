# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

The current implementation has a working foundation with fake auth, a dashboard listing all 12 document types, and the Mutual NDA creator with AI chat at `/dashboard/nda`. Document persistence (saving drafts) and real authentication are not yet implemented.

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

## Architecture Details

### Backend (`backend/app/`)

- **`main.py`**: FastAPI app, static file serving (catch-all for Next.js export), mounts `/_next`
- **`database.py`**: SQLite schema (`users`, `chat_sessions`, `chat_messages`), `get_db()` context manager (one connection per request)
- **`ai.py`**: LiteLLM call, `FieldsUpdate`/`AiTurn` Pydantic models for structured output, system prompt
- **`routers/nda_chat.py`**: NDA chat endpoints — hardcoded `doc_type='mutual_nda'`; `_DEFAULT_FIELDS` dict; `call_ai()` called synchronously (FastAPI runs sync routes in thread pool)
- **`routers/auth.py`**: Fake auth (any email works), `get_current_user_id` Depends for protected routes
- **`routers/catalog.py`**: Serves `catalog.json` and raw template Markdown; path traversal protected
- **`schemas.py`**: All Pydantic request/response models (`ChatSessionResponse`, `ChatTurnResponse`, etc.)

**DB schema** — `chat_sessions`: `id` (UUID PK), `user_id`, `doc_type`, `fields` (JSON), timestamps; `UNIQUE(user_id, doc_type)` — one session per user per doc type, designed for multi-doc expansion.

**AI pattern** — `call_ai(history, current_fields)` uses `response_format=AiTurn` for structured output; `0` is the "not yet answered" sentinel for integer term fields; `None` values in `FieldsUpdate` are no-ops (append-only merge).

### Frontend (`frontend/`)

- **`app/dashboard/page.tsx`**: Catalog grid; hardcodes `Mutual-NDA.md` as the only active doc
- **`app/dashboard/nda/page.tsx`**: Fetches `Mutual-NDA.md` template, passes to `NdaCreator`
- **`components/NdaCreator.tsx`**: State owner (`NdaFormValues`); split layout: chat (left `w-96`) + preview (right); PDF = `window.print()`
- **`components/NdaChat.tsx`**: Session lifecycle (GET/POST/DELETE), optimistic message append, `onFieldsChange` callback up
- **`components/NdaPreview.tsx`**: Renders cover page (JSX table) + standard terms (ReactMarkdown with `remarkGfm` + `rehypeRaw`)
- **`lib/templateUtils.ts`**: `NdaFormValues` type; `substituteStandardTerms()` replaces `<span class="coverpage_link">Key</span>` with `<strong>value</strong>`
- **`lib/ndaChatApi.ts`**: Typed wrappers for chat session endpoints
- **`lib/api.ts`**: Auth, catalog, template API wrappers; `getTemplate()` strips `templates/` prefix

**Template substitution** — Templates embed `<span class="coverpage_link">FieldName</span>` (and `<span class="keyterms_link">FieldName</span>` in other docs) as interpolation markers. `rehypeRaw` is required in ReactMarkdown to render these raw HTML spans.

**PDF export** — Pure CSS `@media print` in `globals.css`: hides `header` + `aside`, fills `main` to page. No PDF library needed.

**Auth pattern** — `AuthGuard` component blocks render until `GET /api/auth/me` succeeds; uses `onUser` callback to bubble up the user object.

### Tests (`backend/tests/`)

- `conftest.py`: Sets `DATABASE_URL` env var before app import (critical — `database.py` reads it at module load); `autouse` fixture truncates tables after each test
- AI mocked with `@patch("app.routers.nda_chat.call_ai")` — patch at import location, not definition

## Implementation Status

### Done (PL-3, PL-4, PL-5)

- **V1 foundation**: FastAPI backend, Next.js static export, SQLite, Docker, start/stop scripts
- **Routing**: `/login` → `/dashboard` → `/dashboard/nda`
- **Auth**: Fake login (any email/password), session cookie via `itsdangerous`, `AuthGuard` component
- **Dashboard**: Lists all 12 document types from `catalog.json`; Mutual NDA is the only active one
- **Mutual NDA creator**: AI chat + live preview + PDF export (print) at `/dashboard/nda`
- **AI chat**: LiteLLM → OpenRouter → `openai/gpt-oss-120b` (Cerebras inference), structured output (`AiTurn`/`FieldsUpdate`), server-side session storage in SQLite (`chat_sessions` + `chat_messages`)
- **Backend API**: `POST /api/auth/signup|signin|signout`, `GET /api/auth/me`, `GET /api/catalog`, `GET /api/templates/{filename}`, `GET|DELETE /api/nda-chat/session`, `POST /api/nda-chat/message`
- **Tests**: 22 backend tests

### Not yet implemented

- Real authentication (password hashing, secure cookies)
- All other document types (11 of 12 show "Coming Soon")
- Document persistence (saving drafts, history)
