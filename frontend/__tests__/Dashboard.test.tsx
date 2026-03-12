import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

// Mock API calls
jest.mock("@/lib/api");
import { getMe, getCatalog, getSessions } from "@/lib/api";
const mockGetMe = getMe as jest.MockedFunction<typeof getMe>;
const mockGetCatalog = getCatalog as jest.MockedFunction<typeof getCatalog>;
const mockGetSessions = getSessions as jest.MockedFunction<typeof getSessions>;

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

import DashboardPage from "@/app/dashboard/page";

const MOCK_USER = { id: 1, email: "user@test.com" };
const MOCK_CATALOG = [
  { name: "Mutual NDA", description: "A mutual NDA.", filename: "templates/Mutual-NDA.md" },
  { name: "Cloud Service Agreement", description: "CSA desc.", filename: "templates/CSA.md" },
];
const MOCK_SESSION = {
  session_id: "abc-123",
  doc_type: "csa",
  doc_name: "Cloud Service Agreement (CSA)",
  updated_at: "2026-03-10 14:00:00",
  fields: { providerCompany: "Acme", customerCompany: "Corp" },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetMe.mockResolvedValue(MOCK_USER);
  mockGetCatalog.mockResolvedValue(MOCK_CATALOG);
  mockGetSessions.mockResolvedValue([]);
});

describe("Dashboard — Templates section", () => {
  it("shows document template cards after loading", async () => {
    render(<DashboardPage />);
    expect(await screen.findByText("Mutual NDA")).toBeInTheDocument();
    expect(screen.getByText("Cloud Service Agreement")).toBeInTheDocument();
  });

  it("shows the Prelegal brand name", async () => {
    render(<DashboardPage />);
    await waitFor(() => expect(mockGetMe).toHaveBeenCalled());
    expect(screen.getAllByText("Prelegal").length).toBeGreaterThan(0);
  });
});

describe("Dashboard — My Documents section", () => {
  it("does not show My Documents section when no sessions", async () => {
    render(<DashboardPage />);
    await waitFor(() => expect(mockGetSessions).toHaveBeenCalled());
    expect(screen.queryByText("My Documents")).not.toBeInTheDocument();
  });

  it("shows My Documents section when sessions exist", async () => {
    mockGetSessions.mockResolvedValue([MOCK_SESSION]);
    render(<DashboardPage />);
    expect(await screen.findByText("My Documents")).toBeInTheDocument();
    expect(screen.getByText("Cloud Service Agreement (CSA)")).toBeInTheDocument();
  });

  it("shows provider and customer company in session card", async () => {
    mockGetSessions.mockResolvedValue([MOCK_SESSION]);
    render(<DashboardPage />);
    await screen.findByText("My Documents");
    expect(screen.getByText(/Acme/)).toBeInTheDocument();
    expect(screen.getByText(/Corp/)).toBeInTheDocument();
  });

  it("shows View and Edit buttons for each session", async () => {
    mockGetSessions.mockResolvedValue([MOCK_SESSION]);
    render(<DashboardPage />);
    await screen.findByText("My Documents");
    expect(screen.getByRole("button", { name: /view/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
  });
});
