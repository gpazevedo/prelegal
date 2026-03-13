export interface User {
  id: number;
  email: string;
}

export interface CatalogItem {
  name: string;
  description: string;
  filename: string;
}

export interface SessionSummary {
  session_id: string;
  doc_type: string;
  doc_name: string;
  updated_at: string;
  fields: Record<string, unknown>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export async function signIn(email: string, password: string): Promise<User> {
  const res = await fetch("/api/auth/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new ApiError(res.status, "Sign in failed");
  return res.json();
}

export async function signUp(email: string, password: string): Promise<User> {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new ApiError(res.status, "Sign up failed");
  return res.json();
}

export async function signOut(): Promise<void> {
  await fetch("/api/auth/signout", { method: "POST", credentials: "include" });
}

export async function getMe(): Promise<User | null> {
  const res = await fetch("/api/auth/me", { credentials: "include" });
  if (!res.ok) return null;
  return res.json();
}

export async function getCatalog(): Promise<CatalogItem[]> {
  const res = await fetch("/api/catalog", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load catalog");
  return res.json();
}

export async function getTemplate(filename: string): Promise<string> {
  const basename = filename.replace(/^templates\//, "");
  const res = await fetch(`/api/templates/${basename}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to load template");
  const data = await res.json();
  return data.content;
}

export async function getSessions(): Promise<SessionSummary[]> {
  const res = await fetch("/api/sessions", { credentials: "include" });
  if (!res.ok) throw new ApiError(res.status, "Failed to load sessions");
  return res.json();
}

export async function getSessionById(sessionId: string): Promise<SessionSummary | null> {
  const res = await fetch(`/api/sessions/${sessionId}`, { credentials: "include" });
  if (!res.ok) return null;
  return res.json();
}
