import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.database import init_db
from app.routers import auth, catalog

_BASE_DIR = Path(__file__).resolve().parent.parent.parent
_STATIC_DIR = Path(os.environ.get("STATIC_DIR", str(_BASE_DIR / "frontend" / "out")))


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(lifespan=lifespan)

app.include_router(auth.router)
app.include_router(catalog.router)

if _STATIC_DIR.exists():
    # Serve Next.js static assets (JS/CSS bundles)
    app.mount("/_next", StaticFiles(directory=_STATIC_DIR / "_next"), name="next-assets")

    @app.get("/{full_path:path}")
    async def serve_page(full_path: str) -> FileResponse:
        """Serve Next.js static-export pages, falling back to 404.html."""
        # Root path
        if not full_path:
            return FileResponse(_STATIC_DIR / "index.html")
        # Try exact file match (handles favicon, images, etc.)
        exact = (_STATIC_DIR / full_path).resolve()
        if str(exact).startswith(str(_STATIC_DIR)) and exact.is_file():
            return FileResponse(exact)
        # Try .html variant (e.g. /login → login.html)
        html_file = (_STATIC_DIR / (full_path + ".html")).resolve()
        if str(html_file).startswith(str(_STATIC_DIR)) and html_file.is_file():
            return FileResponse(html_file)
        # Serve 404
        not_found = _STATIC_DIR / "404.html"
        if not_found.exists():
            return FileResponse(not_found, status_code=404)
        return FileResponse(_STATIC_DIR / "index.html", status_code=404)
