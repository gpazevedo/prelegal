import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NdaCreator from "@/components/NdaCreator";

const STANDARD_TERMS =
  '# Standard Terms\n\n1. The <span class="coverpage_link">Purpose</span> governs this agreement.\n';

// Mock window.print (jsdom does not implement it)
const printMock = jest.fn();
Object.defineProperty(window, "print", { value: printMock, writable: true });

function renderCreator() {
  return render(<NdaCreator standardTerms={STANDARD_TERMS} />);
}

// ─── Layout ───────────────────────────────────────────────────────────────────

describe("NdaCreator — Layout", () => {
  it("renders the page heading", () => {
    renderCreator();
    expect(screen.getByText("Mutual NDA Creator")).toBeInTheDocument();
  });

  it("renders the subtitle", () => {
    renderCreator();
    expect(screen.getByText(/prelegal/i)).toBeInTheDocument();
  });

  it("renders the Download PDF button", () => {
    renderCreator();
    expect(screen.getByRole("button", { name: /download pdf/i })).toBeInTheDocument();
  });

  it("renders the form", () => {
    renderCreator();
    expect(screen.getByText("Agreement Details")).toBeInTheDocument();
  });

  it("renders the preview panel with nda-document", () => {
    renderCreator();
    expect(document.getElementById("nda-document")).toBeInTheDocument();
  });
});

// ─── Form → Preview integration ──────────────────────────────────────────────

describe("NdaCreator — Form to Preview integration", () => {
  it("preview updates when Purpose is changed", async () => {
    renderCreator();
    const textarea = screen.getByLabelText(/purpose/i);
    await userEvent.clear(textarea);
    await userEvent.type(textarea, "Testing live update");
    const markdown = screen.getByTestId("react-markdown");
    expect(markdown.textContent).toContain("Testing live update");
  });

  it("preview updates when Governing Law is changed", async () => {
    renderCreator();
    const input = screen.getByLabelText(/governing law/i);
    await userEvent.type(input, "Oregon");
    expect(screen.getByDisplayValue(/Oregon/)).toBeInTheDocument();
  });

  it("party company names appear as signature table headers after input", async () => {
    renderCreator();
    const p1 = document.getElementById("field-party1-company")!;
    const p2 = document.getElementById("field-party2-company")!;
    await userEvent.type(p1, "StartupA");
    await userEvent.type(p2, "StartupB");
    const headers = screen.getAllByRole("columnheader");
    expect(headers.some((h) => h.textContent?.includes("StartupA"))).toBe(true);
    expect(headers.some((h) => h.textContent?.includes("StartupB"))).toBe(true);
  });
});

// ─── Download PDF button ──────────────────────────────────────────────────────

describe("NdaCreator — Download PDF", () => {
  beforeEach(() => {
    printMock.mockClear();
  });

  it("calls window.print when Download PDF is clicked", () => {
    renderCreator();
    const button = screen.getByRole("button", { name: /download pdf/i });
    fireEvent.click(button);
    expect(printMock).toHaveBeenCalledTimes(1);
  });

  it("button is not disabled", () => {
    renderCreator();
    const button = screen.getByRole("button", { name: /download pdf/i });
    expect(button).not.toBeDisabled();
  });
});
