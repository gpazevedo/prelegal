export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatSession {
  session_id: string;
  messages: ChatMessage[];
  fields: Record<string, unknown>;
}

export interface ChatTurnResponse {
  assistant_message: string;
  fields: Record<string, unknown>;
  is_complete: boolean;
}

export async function getOrCreateSession(): Promise<ChatSession> {
  const res = await fetch("/api/nda-chat/session", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to get session");
  return res.json();
}

export async function sendMessage(content: string): Promise<ChatTurnResponse> {
  const res = await fetch("/api/nda-chat/message", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error("Failed to send message");
  return res.json();
}

export async function resetSession(): Promise<void> {
  await fetch("/api/nda-chat/session", { method: "DELETE", credentials: "include" });
}
