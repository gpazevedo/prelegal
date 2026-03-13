import React from "react";
import { render, screen } from "@testing-library/react";
import DocPreview from "@/components/DocPreview";
import { getDefaultDocFields, DocFields } from "@/lib/docUtils";

const TEMPLATE = `# Agreement

Provider is <span class="keyterms_link">Provider</span>.
Customer is <span class="keyterms_link">Customer</span>.
Governing law: <span class="keyterms_link">Governing Law</span>.
`;

function makeFields(overrides: Partial<DocFields> = {}): DocFields {
  return { ...getDefaultDocFields(), ...overrides };
}

function renderPreview(overrides: Partial<DocFields> = {}, docName = "Test Agreement") {
  return render(
    <DocPreview docName={docName} template={TEMPLATE} fields={makeFields(overrides)} />
  );
}

// ─── Cover Page ───────────────────────────────────────────────────────────────

describe("DocPreview — Cover Page", () => {
  it("renders the document name as heading", () => {
    renderPreview({}, "Cloud Service Agreement");
    expect(screen.getByRole("heading", { name: "Cloud Service Agreement" })).toBeInTheDocument();
  });

  it("renders the subtitle", () => {
    renderPreview();
    expect(screen.getByText(/prelegal/i)).toBeInTheDocument();
  });

  it("shows Effective Date row when set", () => {
    renderPreview({ effectiveDate: "2025-06-15" });
    expect(screen.getByText("Effective Date")).toBeInTheDocument();
    expect(screen.getByText("June 15, 2025")).toBeInTheDocument();
  });

  it("hides Effective Date row when empty", () => {
    renderPreview({ effectiveDate: "" });
    expect(screen.queryByText("Effective Date")).not.toBeInTheDocument();
  });

  it("shows Product / Service row when set", () => {
    renderPreview({ productName: "MyCloud Pro" });
    expect(screen.getByText("Product / Service")).toBeInTheDocument();
    expect(screen.getByText("MyCloud Pro")).toBeInTheDocument();
  });

  it("hides Product / Service row when empty", () => {
    renderPreview({ productName: "" });
    expect(screen.queryByText("Product / Service")).not.toBeInTheDocument();
  });

  it("shows Purpose row when set", () => {
    renderPreview({ purpose: "Evaluate the product" });
    expect(screen.getByText("Purpose")).toBeInTheDocument();
    expect(screen.getByText("Evaluate the product")).toBeInTheDocument();
  });

  it("hides Purpose row when empty", () => {
    renderPreview({ purpose: "" });
    expect(screen.queryByText("Purpose")).not.toBeInTheDocument();
  });

  it("shows Term row when set", () => {
    renderPreview({ term: "1 year" });
    expect(screen.getByText("Term")).toBeInTheDocument();
    expect(screen.getByText("1 year")).toBeInTheDocument();
  });

  it("shows Fees row when set", () => {
    renderPreview({ fees: "$500/month" });
    expect(screen.getByText("Fees")).toBeInTheDocument();
    expect(screen.getByText("$500/month")).toBeInTheDocument();
  });

  it("shows Governing Law row when set", () => {
    renderPreview({ governingLaw: "Delaware" });
    expect(screen.getByText("Governing Law")).toBeInTheDocument();
    expect(screen.getAllByText("Delaware").length).toBeGreaterThan(0);
  });

  it("shows Jurisdiction row when set", () => {
    renderPreview({ jurisdiction: "courts in New Castle, DE" });
    expect(screen.getByText("Jurisdiction")).toBeInTheDocument();
    expect(screen.getAllByText(/courts in New Castle/i).length).toBeGreaterThan(0);
  });
});

// ─── Signature Table ──────────────────────────────────────────────────────────

describe("DocPreview — Signature Table", () => {
  it("renders providerCompany as column header", () => {
    renderPreview({ providerCompany: "Acme Inc" });
    const headers = screen.getAllByRole("columnheader");
    expect(headers.some((h) => h.textContent?.includes("Acme Inc"))).toBe(true);
  });

  it("renders customerCompany as column header", () => {
    renderPreview({ customerCompany: "Beta Ltd" });
    const headers = screen.getAllByRole("columnheader");
    expect(headers.some((h) => h.textContent?.includes("Beta Ltd"))).toBe(true);
  });

  it("falls back to 'Provider' when providerCompany is empty", () => {
    renderPreview({ providerCompany: "" });
    const headers = screen.getAllByRole("columnheader");
    expect(headers.some((h) => h.textContent === "Provider")).toBe(true);
  });

  it("falls back to 'Customer / Partner' when customerCompany is empty", () => {
    renderPreview({ customerCompany: "" });
    const headers = screen.getAllByRole("columnheader");
    expect(headers.some((h) => h.textContent === "Customer / Partner")).toBe(true);
  });

  it("renders provider and customer names in Print Name row", () => {
    renderPreview({ providerName: "Alice Smith", customerName: "Bob Jones" });
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
  });

  it("renders titles", () => {
    renderPreview({ providerTitle: "CEO", customerTitle: "CTO" });
    expect(screen.getByText("CEO")).toBeInTheDocument();
    expect(screen.getByText("CTO")).toBeInTheDocument();
  });

  it("renders addresses", () => {
    renderPreview({ providerAddress: "alice@acme.com", customerAddress: "bob@beta.com" });
    expect(screen.getByText("alice@acme.com")).toBeInTheDocument();
    expect(screen.getByText("bob@beta.com")).toBeInTheDocument();
  });

  it("renders formatted provider and customer dates", () => {
    renderPreview({ providerDate: "2025-01-15", customerDate: "2025-02-20" });
    expect(screen.getByText("January 15, 2025")).toBeInTheDocument();
    expect(screen.getByText("February 20, 2025")).toBeInTheDocument();
  });

  it("renders all signature row labels", () => {
    renderPreview();
    for (const label of ["Signature", "Print Name", "Title", "Address", "Date"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });
});

// ─── Standard Terms Body ──────────────────────────────────────────────────────

describe("DocPreview — Standard Terms", () => {
  it("renders the react-markdown container", () => {
    renderPreview();
    expect(screen.getByTestId("react-markdown")).toBeInTheDocument();
  });

  it("substitutes field values into the template body", () => {
    renderPreview({ providerCompany: "Acme Corp", governingLaw: "Oregon" });
    const markdown = screen.getByTestId("react-markdown");
    expect(markdown.textContent).toContain("Acme Corp");
    expect(markdown.textContent).toContain("Oregon");
  });

  it("does not pass raw coverpage_link spans to ReactMarkdown", () => {
    renderPreview({ governingLaw: "Texas" });
    const markdown = screen.getByTestId("react-markdown");
    expect(markdown.textContent).not.toContain('class="keyterms_link"');
  });

  it("uses [Governing Law] placeholder when governingLaw is empty", () => {
    renderPreview({ governingLaw: "" });
    const markdown = screen.getByTestId("react-markdown");
    expect(markdown.textContent).toContain("[Governing Law]");
  });
});
