# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

All 12 document types are active. The Mutual NDA has a dedicated creator at `/dashboard/nda`. All other 10 document types share a generic creator at `/dashboard/doc/[slug]`. Document persistence (saving drafts) and real authentication are not yet implemented.

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
- **`ai.py`**: Two AI entry points:
  - `call_ai(history, current_fields)` — NDA-specific; `FieldsUpdate`/`AiTurn` structured output; `0` sentinel for unanswered integer month fields
  - `call_generic_ai(history, current_fields, doc_config)` — generic; `GenericFieldsUpdate`/`GenericAiTurn` structured output; 18 string fields all optional
  - `None` values in `FieldsUpdate`/`GenericFieldsUpdate` are no-ops (preserve existing); `""` explicitly clears a field
- **`doc_config.py`**: `DocConfig` dataclass registry for all 10 non-NDA doc types; `DEFAULT_FIELDS` (18 string fields); `get_config(slug)`, `get_default_fields()`
- **`routers/nda_chat.py`**: NDA chat endpoints — `doc_type='mutual_nda'`; `mndaTermMonths`/`confidentialityTermMonths` (months, not years); history strips leading assistant message before AI call
- **`routers/doc_chat.py`**: Generic parameterized chat at `/api/doc-chat/{doc_slug}/`; same session pattern as NDA; uses `call_generic_ai` + `DocConfig`
- **`routers/auth.py`**: Fake auth (any email works), `get_current_user_id` Depends for protected routes
- **`routers/catalog.py`**: Serves `catalog.json` and raw template Markdown; path traversal protected
- **`schemas.py`**: All Pydantic request/response models (`ChatSessionResponse`, `ChatTurnResponse`, etc.)

**DB schema** — `chat_sessions`: `id` (UUID PK), `user_id`, `doc_type`, `fields` (JSON), timestamps; `UNIQUE(user_id, doc_type)` — one session per user per doc type.

**API routes** — `POST /api/auth/signup|signin|signout`, `GET /api/auth/me`, `GET /api/catalog`, `GET /api/templates/{filename}`, `GET|POST|DELETE /api/nda-chat/session|message`, `GET|POST|DELETE /api/doc-chat/{slug}/session|message`

### Frontend (`frontend/`)

- **`app/dashboard/page.tsx`**: Catalog grid; all 12 cards active; routes via `getDocRoute(filename)` (NDA → `/dashboard/nda`, others → `/dashboard/doc/{slug}`)
- **`app/dashboard/nda/page.tsx`**: Fetches `Mutual-NDA.md` template, passes to `NdaCreator`
- **`app/dashboard/doc/[slug]/page.tsx`**: Server component with `generateStaticParams()` from `SLUG_TO_TEMPLATE`; renders `DocSlugClient`
- **`app/dashboard/doc/[slug]/DocSlugClient.tsx`**: Client component; `AuthGuard` + fetches template + renders `DocCreator`
- **`components/NdaCreator.tsx`**: State owner (`NdaFormValues`); split layout: chat (left `w-96`) + preview (right); PDF = `window.print()`
- **`components/DocCreator.tsx`**: Generic equivalent of `NdaCreator`; state owner (`DocFields`); same split layout
- **`components/NdaChat.tsx`**: NDA-specific session lifecycle, optimistic message append, `onFieldsChange` callback
- **`components/DocChat.tsx`**: Generic equivalent of `NdaChat`; uses `docChatApi.ts`; separates fatal `error` (session load) from transient `sendError` (send failure shown inline, rolls back optimistic message)
- **`components/NdaPreview.tsx`**: Renders NDA cover page (JSX table) + standard terms (ReactMarkdown with `remarkGfm` + `rehypeRaw`)
- **`components/DocPreview.tsx`**: Generic cover page (Provider/Customer columns + conditional key fields) + template body via ReactMarkdown
- **`lib/templateUtils.ts`**: `NdaFormValues` type; `substituteStandardTerms()`; `mndaTermMonths`/`confidentialityTermMonths` (months); imports `formatDate`/`escapeHtml` from `docUtils.ts`
- **`lib/docUtils.ts`**: `DocFields` type (18 string fields); `substituteTemplate()` replaces both `keyterms_link` and `coverpage_link` spans; `FIELD_MAP` aliases (Provider, Provider's, Partner, Chosen Courts, etc.); `SLUG_TO_TEMPLATE`, `DOC_NAMES`, `getDocRoute()`; canonical `formatDate()` and `escapeHtml()`
- **`lib/ndaChatApi.ts`**: Typed wrappers for NDA chat session endpoints
- **`lib/docChatApi.ts`**: Typed wrappers for generic doc chat endpoints (`/api/doc-chat/{slug}/`)
- **`lib/api.ts`**: Auth, catalog, template API wrappers; `getTemplate()` strips `templates/` prefix

**Template substitution** — Templates embed `<span class="coverpage_link">FieldName</span>` or `<span class="keyterms_link">FieldName</span>` as interpolation markers. `rehypeRaw` is required in ReactMarkdown to render these raw HTML spans. Values are HTML-escaped before insertion.

**`generateStaticParams` constraint** — Next.js 16 requires `generateStaticParams` in a server component. Dynamic routes use a server component shell (`page.tsx`) + a separate `"use client"` component (`DocSlugClient.tsx`).

**PDF export** — Pure CSS `@media print` in `globals.css`: hides `header` + `aside`, fills `main` to page. No PDF library needed.

**Auth pattern** — `AuthGuard` component blocks render until `GET /api/auth/me` succeeds; uses `onUser` callback to bubble up the user object.

### Tests (`backend/tests/`)

- `conftest.py`: Sets `DATABASE_URL` env var before app import (critical — `database.py` reads it at module load); `autouse` fixture truncates tables after each test
- AI mocked with `@patch("app.routers.nda_chat.call_ai")` or `@patch("app.routers.doc_chat.call_generic_ai")` — patch at import location, not definition
- Frontend: `scrollIntoView` not implemented in jsdom — mock with `window.HTMLElement.prototype.scrollIntoView = jest.fn()` in any test that renders a chat component

## Implementation Status

### Done (PL-3, PL-4, PL-5, PL-6)

- **V1 foundation**: FastAPI backend, Next.js static export, SQLite, Docker, start/stop scripts
- **Routing**: `/login` → `/dashboard` → `/dashboard/nda` or `/dashboard/doc/[slug]`
- **Auth**: Fake login (any email/password), session cookie via `itsdangerous`, `AuthGuard` component
- **Dashboard**: All 12 document types active; routes to appropriate creator via `getDocRoute()`
- **Mutual NDA creator**: AI chat + live preview + PDF export at `/dashboard/nda`
- **Generic doc creator**: AI chat + live preview + PDF export for all 10 other doc types at `/dashboard/doc/[slug]`
- **AI chat**: LiteLLM → OpenRouter → `openai/gpt-oss-120b` (Cerebras inference), structured output, server-side session per user per doc type in SQLite
- **Backend API**: `POST /api/auth/signup|signin|signout`, `GET /api/auth/me`, `GET /api/catalog`, `GET /api/templates/{filename}`, `GET|POST|DELETE /api/nda-chat/session|message`, `GET|POST|DELETE /api/doc-chat/{slug}/session|message`
- **Tests**: 37 backend tests, 171 frontend tests (10 pre-existing NdaCreator failures due to jsdom `scrollIntoView` — not caused by this codebase)

### Not yet implemented

- Real authentication (password hashing, secure cookies)
- Document persistence (saving drafts, history)
- NDA migration to generic doc system (NDA still uses its own dedicated components/router)
