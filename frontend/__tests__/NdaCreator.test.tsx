import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import NdaCreator from "@/components/NdaCreator";

const STANDARD_TERMS =
  '# Standard Terms\n\n1. The <span class="coverpage_link">Purpose</span> governs this agreement.\n';

// Mock window.print (jsdom does not implement it)
const printMock = jest.fn();
Object.defineProperty(window, "print", { value: printMock, writable: true });

// Mock ndaChatApi (NdaChat makes API calls on mount)
jest.mock("@/lib/ndaChatApi");
import { getOrCreateSession } from "@/lib/ndaChatApi";
const mockGetSession = getOrCreateSession as jest.MockedFunction<typeof getOrCreateSession>;

const DEFAULT_SESSION = {
  session_id: "sess-1",
  messages: [{ role: "assistant" as const, content: "Hi! What is the purpose of this agreement?" }],
  fields: {},
};

// Mock router (NdaCreator uses useRouter for back navigation)
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

function renderCreator() {
  return render(<NdaCreator standardTerms={STANDARD_TERMS} />);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetSession.mockResolvedValue(DEFAULT_SESSION);
});

// ─── Layout ───────────────────────────────────────────────────────────────────

describe("NdaCreator — Layout", () => {
  it("renders the page heading", () => {
    renderCreator();
    expect(screen.getByText("Mutual NDA Creator")).toBeInTheDocument();
  });

  it("renders the Download PDF button", () => {
    renderCreator();
    expect(screen.getByRole("button", { name: /download pdf/i })).toBeInTheDocument();
  });

  it("renders the back to dashboard button", () => {
    renderCreator();
    expect(screen.getByRole("button", { name: /back to dashboard/i })).toBeInTheDocument();
  });

  it("renders the preview panel with nda-document", () => {
    renderCreator();
    expect(document.getElementById("nda-document")).toBeInTheDocument();
  });

  it("renders the draft disclaimer", () => {
    renderCreator();
    expect(screen.getByText(/draft document/i)).toBeInTheDocument();
  });
});

// ─── Navigation ───────────────────────────────────────────────────────────────

describe("NdaCreator — Navigation", () => {
  it("back button navigates to dashboard", () => {
    renderCreator();
    const backBtn = screen.getByRole("button", { name: /back to dashboard/i });
    fireEvent.click(backBtn);
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });
});

// ─── Download PDF ─────────────────────────────────────────────────────────────

describe("NdaCreator — Download PDF", () => {
  beforeEach(() => {
    printMock.mockClear();
  });

  it("calls window.print when Download PDF is clicked", () => {
    renderCreator();
    fireEvent.click(screen.getByRole("button", { name: /download pdf/i }));
    expect(printMock).toHaveBeenCalledTimes(1);
  });

  it("Download PDF button is not disabled", () => {
    renderCreator();
    expect(screen.getByRole("button", { name: /download pdf/i })).not.toBeDisabled();
  });
});
