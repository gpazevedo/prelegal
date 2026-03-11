export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface DocChatSession {
  session_id: string;
  messages: ChatMessage[];
  fields: Record<string, string>;
}

export interface DocChatTurn {
  assistant_message: string;
  fields: Record<string, string>;
  is_complete: boolean;
}

export async function getOrCreateDocSession(docSlug: string): Promise<DocChatSession> {
  const res = await fetch(`/api/doc-chat/${docSlug}/session`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to get session");
  return res.json();
}

export async function sendDocMessage(docSlug: string, content: string): Promise<DocChatTurn> {
  const res = await fetch(`/api/doc-chat/${docSlug}/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error("Failed to send message");
  return res.json();
}

export async function resetDocSession(docSlug: string): Promise<void> {
  await fetch(`/api/doc-chat/${docSlug}/session`, { method: "DELETE", credentials: "include" });
}
