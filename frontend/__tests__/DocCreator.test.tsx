import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import DocCreator from "@/components/DocCreator";

const TEMPLATE = '# Agreement\n\nThis governs <span class="keyterms_link">Provider</span>.\n';

const printMock = jest.fn();
Object.defineProperty(window, "print", { value: printMock, writable: true });

jest.mock("@/lib/docChatApi");
import { getOrCreateDocSession } from "@/lib/docChatApi";
const mockGetSession = getOrCreateDocSession as jest.MockedFunction<typeof getOrCreateDocSession>;

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

const DEFAULT_SESSION = {
  session_id: "sess-1",
  messages: [{ role: "assistant" as const, content: "Hi! What is the provider name?" }],
  fields: { providerCompany: "" },
};

function renderCreator() {
  return render(<DocCreator docSlug="csa" docName="Cloud Service Agreement" template={TEMPLATE} />);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetSession.mockResolvedValue(DEFAULT_SESSION);
});

describe("DocCreator — Layout", () => {
  it("renders the doc name heading", () => {
    renderCreator();
    expect(screen.getAllByText("Cloud Service Agreement").length).toBeGreaterThan(0);
  });

  it("renders the Download PDF button", () => {
    renderCreator();
    expect(screen.getByRole("button", { name: /download pdf/i })).toBeInTheDocument();
  });

  it("renders the back to dashboard button", () => {
    renderCreator();
    expect(screen.getByRole("button", { name: /back to dashboard/i })).toBeInTheDocument();
  });

  it("renders the draft disclaimer", () => {
    renderCreator();
    expect(screen.getByText(/draft document/i)).toBeInTheDocument();
  });
});

describe("DocCreator — Navigation", () => {
  it("back button navigates to dashboard", () => {
    renderCreator();
    fireEvent.click(screen.getByRole("button", { name: /back to dashboard/i }));
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });
});

describe("DocCreator — Download PDF", () => {
  beforeEach(() => printMock.mockClear());

  it("calls window.print when Download PDF is clicked", () => {
    renderCreator();
    fireEvent.click(screen.getByRole("button", { name: /download pdf/i }));
    expect(printMock).toHaveBeenCalledTimes(1);
  });
});
