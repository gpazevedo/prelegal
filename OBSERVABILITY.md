# Observability

## Logs

Container logs stream to stdout/stderr. View with:

```bash
docker compose logs -f
docker compose logs backend -f
docker compose logs frontend -f   # (static files only, minimal output)
```

FastAPI logs each request with method, path, and status code. AI call errors are propagated as HTTP 500s with detail messages.

## Health Check

```bash
curl http://localhost:8000/api/catalog
```

Returns the 12-item document catalog if the backend is up and the database is initialised.

## Database Inspection

The SQLite database lives at `data/prelegal.db` (mounted into the container). Inspect it directly:

```bash
sqlite3 data/prelegal.db

# Useful queries
.tables
SELECT id, email, created_at FROM users;
SELECT id, doc_type, updated_at FROM chat_sessions;
SELECT session_id, role, content FROM chat_messages ORDER BY created_at DESC LIMIT 20;
```

> The DB is wiped and recreated on each container start.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/signup` | Register (email + password, min 6 chars) |
| POST | `/api/auth/signin` | Sign in |
| POST | `/api/auth/signout` | Clear session cookie |
| GET | `/api/auth/me` | Current user |
| GET | `/api/catalog` | List all 12 document types |
| GET | `/api/templates/{filename}` | Fetch raw template Markdown |
| GET | `/api/sessions` | List all sessions for current user |
| GET | `/api/sessions/{id}` | Get session by ID |
| GET | `/api/nda-chat/session` | Get/create NDA session |
| POST | `/api/nda-chat/message` | Send NDA chat message |
| DELETE | `/api/nda-chat/session` | Reset NDA session |
| GET | `/api/doc-chat/{slug}/session` | Get/create generic doc session |
| POST | `/api/doc-chat/{slug}/message` | Send generic doc chat message |
| DELETE | `/api/doc-chat/{slug}/session` | Reset generic doc session |

## Common Issues

**401 on all routes after restart** — The database is recreated on restart, so all user accounts and sessions are lost. Re-register.

**AI responses time out** — Check `OPENROUTER_API_KEY` in `.env`. Verify the key is valid at openrouter.ai.

**Frontend 404 on page refresh** — The FastAPI catch-all serves the Next.js static export. If `frontend/out/` is missing, rebuild: `cd frontend && npm run build`.

**`password_hash` column missing** — If running an old DB (pre-PL-7), `init_db()` applies the migration automatically via `ALTER TABLE`.
