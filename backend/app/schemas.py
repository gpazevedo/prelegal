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


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatSendRequest(BaseModel):
    content: str


class ChatSessionResponse(BaseModel):
    session_id: str
    messages: list[ChatMessage]
    fields: dict


class ChatTurnResponse(BaseModel):
    assistant_message: str
    fields: dict
    is_complete: bool
