from pydantic import BaseModel


class AuthRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    email: str


class CatalogItem(BaseModel):
    name: str
    description: str
    filename: str


class TemplateResponse(BaseModel):
    content: str
