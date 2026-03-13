"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChatMessage,
  getOrCreateDocSession,
  resetDocSession,
  sendDocMessage,
} from "@/lib/docChatApi";
import { DocFields } from "@/lib/docUtils";

interface DocChatProps {
  docSlug: string;
  docName: string;
  onFieldsChange: (fields: Partial<DocFields>) => void;
}

export default function DocChat({ docSlug, docName, onFieldsChange }: DocChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getOrCreateDocSession(docSlug)
      .then((session) => {
        setMessages(session.messages);
        onFieldsChange(session.fields as Partial<DocFields>);
      })
      .catch(() => setError("Failed to load chat session. Please refresh."));
  }, [docSlug, onFieldsChange]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading || complete) return;

    setInput("");
    setSendError(null);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const turn = await sendDocMessage(docSlug, text);
      setMessages((prev) => [...prev, { role: "assistant", content: turn.assistant_message }]);
      onFieldsChange(turn.fields as Partial<DocFields>);
      if (turn.is_complete) setComplete(true);
    } catch {
      setMessages((prev) => prev.slice(0, -1));
      setSendError("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    try {
      await resetDocSession(docSlug);
      setComplete(false);
      setMessages([]);
      const session = await getOrCreateDocSession(docSlug);
      setMessages(session.messages);
      onFieldsChange(session.fields as Partial<DocFields>);
    } catch {
      setError("Failed to reset session. Please refresh.");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (error) {
    return (
      <div className="flex flex-col h-full items-center justify-center px-6 text-center">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <span className="text-sm font-semibold" style={{ color: "var(--color-dark-navy)" }}>
          AI Assistant
        </span>
        <button
          onClick={handleReset}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          title="Start over"
        >
          Start over
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                msg.role === "user" ? "text-white" : "bg-gray-100 text-gray-800"
              }`}
              style={
                msg.role === "user" ? { backgroundColor: "var(--color-blue-primary)" } : undefined
              }
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-2 text-sm text-gray-500 italic">
              Thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-gray-200 px-4 py-3">
        {sendError && (
          <p className="text-xs text-red-500 mb-2">{sendError}</p>
        )}
        {complete ? (
          <p className="text-xs text-center text-gray-500">
            {docName} complete — download the PDF above.
          </p>
        ) : (
          <div className="flex gap-2 items-end">
            <textarea
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": "var(--color-blue-primary)" } as React.CSSProperties}
              rows={2}
              placeholder="Type your reply…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="flex-shrink-0 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50 transition-opacity"
              style={{ backgroundColor: "var(--color-purple-secondary)" }}
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
