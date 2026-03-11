import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DocChat from "@/components/DocChat";

// jsdom does not implement scrollIntoView
window.HTMLElement.prototype.scrollIntoView = jest.fn();

// Mock the API module
jest.mock("@/lib/docChatApi");
import {
  getOrCreateDocSession,
  sendDocMessage,
  resetDocSession,
} from "@/lib/docChatApi";

const mockGetSession = getOrCreateDocSession as jest.MockedFunction<typeof getOrCreateDocSession>;
const mockSend = sendDocMessage as jest.MockedFunction<typeof sendDocMessage>;
const mockReset = resetDocSession as jest.MockedFunction<typeof resetDocSession>;

const DEFAULT_SESSION = {
  session_id: "sess-1",
  messages: [{ role: "assistant" as const, content: "Hi! What is the provider name?" }],
  fields: { providerCompany: "" },
};

function renderChat(onFieldsChange = jest.fn()) {
  return render(
    <DocChat docSlug="csa" docName="Cloud Service Agreement" onFieldsChange={onFieldsChange} />
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetSession.mockResolvedValue(DEFAULT_SESSION);
  mockSend.mockResolvedValue({
    assistant_message: "What is the customer name?",
    fields: { providerCompany: "Acme Corp" },
    is_complete: false,
  });
  mockReset.mockResolvedValue();
});

// ─── Session Load ─────────────────────────────────────────────────────────────

describe("DocChat — Session Load", () => {
  it("displays the initial greeting from the session", async () => {
    renderChat();
    expect(await screen.findByText("Hi! What is the provider name?")).toBeInTheDocument();
  });

  it("calls onFieldsChange with session fields on load", async () => {
    const onFieldsChange = jest.fn();
    renderChat(onFieldsChange);
    await waitFor(() => expect(onFieldsChange).toHaveBeenCalledWith({ providerCompany: "" }));
  });

  it("shows error state when session load fails", async () => {
    mockGetSession.mockRejectedValue(new Error("Network error"));
    renderChat();
    expect(await screen.findByText(/failed to load chat session/i)).toBeInTheDocument();
  });

  it("hides input when session load fails", async () => {
    mockGetSession.mockRejectedValue(new Error("Network error"));
    renderChat();
    await screen.findByText(/failed to load chat session/i);
    expect(screen.queryByPlaceholderText(/type your reply/i)).not.toBeInTheDocument();
  });
});

// ─── Sending Messages ─────────────────────────────────────────────────────────

describe("DocChat — Sending Messages", () => {
  it("sends a message when Send button is clicked", async () => {
    renderChat();
    await screen.findByText("Hi! What is the provider name?");

    await userEvent.type(screen.getByPlaceholderText(/type your reply/i), "Acme Corp");
    await userEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => expect(mockSend).toHaveBeenCalledWith("csa", "Acme Corp"));
  });

  it("sends a message on Enter keypress", async () => {
    renderChat();
    await screen.findByText("Hi! What is the provider name?");

    const input = screen.getByPlaceholderText(/type your reply/i);
    await userEvent.type(input, "Acme Corp{Enter}");

    await waitFor(() => expect(mockSend).toHaveBeenCalledWith("csa", "Acme Corp"));
  });

  it("displays the assistant reply after sending", async () => {
    renderChat();
    await screen.findByText("Hi! What is the provider name?");

    await userEvent.type(screen.getByPlaceholderText(/type your reply/i), "Acme Corp");
    await userEvent.click(screen.getByRole("button", { name: /send/i }));

    expect(await screen.findByText("What is the customer name?")).toBeInTheDocument();
  });

  it("calls onFieldsChange with updated fields after send", async () => {
    const onFieldsChange = jest.fn();
    renderChat(onFieldsChange);
    await screen.findByText("Hi! What is the provider name?");

    await userEvent.type(screen.getByPlaceholderText(/type your reply/i), "Acme Corp");
    await userEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() =>
      expect(onFieldsChange).toHaveBeenCalledWith({ providerCompany: "Acme Corp" })
    );
  });

  it("clears the input after sending", async () => {
    renderChat();
    await screen.findByText("Hi! What is the provider name?");

    const input = screen.getByPlaceholderText(/type your reply/i);
    await userEvent.type(input, "Hello");
    await userEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => expect(input).toHaveValue(""));
  });

  it("Send button is disabled when input is empty", async () => {
    renderChat();
    await screen.findByText("Hi! What is the provider name?");
    expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
  });

  it("does not send when input is only whitespace", async () => {
    renderChat();
    await screen.findByText("Hi! What is the provider name?");

    await userEvent.type(screen.getByPlaceholderText(/type your reply/i), "   ");
    await userEvent.click(screen.getByRole("button", { name: /send/i }));

    expect(mockSend).not.toHaveBeenCalled();
  });
});

// ─── Send Error ───────────────────────────────────────────────────────────────

describe("DocChat — Send Error", () => {
  it("shows inline sendError message when send fails", async () => {
    mockSend.mockRejectedValue(new Error("Server error"));
    renderChat();
    await screen.findByText("Hi! What is the provider name?");

    await userEvent.type(screen.getByPlaceholderText(/type your reply/i), "Oops");
    await userEvent.click(screen.getByRole("button", { name: /send/i }));

    expect(await screen.findByText(/failed to send message/i)).toBeInTheDocument();
  });

  it("chat UI stays intact after send error", async () => {
    mockSend.mockRejectedValue(new Error("Server error"));
    renderChat();
    await screen.findByText("Hi! What is the provider name?");

    await userEvent.type(screen.getByPlaceholderText(/type your reply/i), "Oops");
    await userEvent.click(screen.getByRole("button", { name: /send/i }));

    await screen.findByText(/failed to send message/i);
    expect(screen.getByPlaceholderText(/type your reply/i)).toBeInTheDocument();
  });

  it("rolls back the optimistic user message on send failure", async () => {
    mockSend.mockRejectedValue(new Error("Server error"));
    renderChat();
    await screen.findByText("Hi! What is the provider name?");

    await userEvent.type(screen.getByPlaceholderText(/type your reply/i), "Rollback test");
    await userEvent.click(screen.getByRole("button", { name: /send/i }));

    await screen.findByText(/failed to send message/i);
    expect(screen.queryByText("Rollback test")).not.toBeInTheDocument();
  });
});

// ─── Completion ───────────────────────────────────────────────────────────────

describe("DocChat — Completion", () => {
  it("shows completion message when is_complete is true", async () => {
    mockSend.mockResolvedValue({
      assistant_message: "All done!",
      fields: {},
      is_complete: true,
    });
    renderChat();
    await screen.findByText("Hi! What is the provider name?");

    await userEvent.type(screen.getByPlaceholderText(/type your reply/i), "Final answer");
    await userEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() =>
      expect(screen.queryByPlaceholderText(/type your reply/i)).not.toBeInTheDocument()
    );
    expect(screen.getByText(/cloud service agreement complete/i)).toBeInTheDocument();
  });
});

// ─── Start Over ───────────────────────────────────────────────────────────────

describe("DocChat — Start Over", () => {
  it("renders a Start over button", async () => {
    renderChat();
    await screen.findByText("Hi! What is the provider name?");
    expect(screen.getByRole("button", { name: /start over/i })).toBeInTheDocument();
  });

  it("calls resetDocSession and reloads session when Start over is clicked", async () => {
    const newSession = {
      session_id: "sess-2",
      messages: [{ role: "assistant" as const, content: "Fresh start!" }],
      fields: {},
    };
    mockGetSession.mockResolvedValueOnce(DEFAULT_SESSION).mockResolvedValueOnce(newSession);

    renderChat();
    await screen.findByText("Hi! What is the provider name?");

    await userEvent.click(screen.getByRole("button", { name: /start over/i }));

    await waitFor(() => expect(mockReset).toHaveBeenCalledWith("csa"));
    expect(await screen.findByText("Fresh start!")).toBeInTheDocument();
  });
});
