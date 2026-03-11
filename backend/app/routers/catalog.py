import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.schemas import CatalogItem, TemplateResponse

router = APIRouter(prefix="/api")

_BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
_CATALOG_PATH = _BASE_DIR / "catalog.json"
_TEMPLATES_DIR = _BASE_DIR / "templates"


@router.get("/catalog", response_model=list[CatalogItem])
def catalog():
    """Return all document types from catalog.json."""
    return json.loads(_CATALOG_PATH.read_text())


@router.get("/templates/{filename:path}", response_model=TemplateResponse)
def template(filename: str):
    """Return the raw markdown content of a template file."""
    target = (_TEMPLATES_DIR / filename).resolve()
    if not str(target).startswith(str(_TEMPLATES_DIR.resolve())):
        raise HTTPException(status_code=400, detail="Invalid filename")
    if not target.exists():
        raise HTTPException(status_code=404, detail="Template not found")
    return TemplateResponse(content=target.read_text())
