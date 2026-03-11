import React from "react";
import { render, screen } from "@testing-library/react";
import NdaPreview from "@/components/NdaPreview";
import { getDefaultFormValues, NdaFormValues } from "@/lib/templateUtils";

const STANDARD_TERMS = `# Standard Terms

1. **Introduction**. This MNDA allows disclosure for the <span class="coverpage_link">Purpose</span>.

2. **Term**. This MNDA commences on the <span class="coverpage_link">Effective Date</span> and expires at the end of the <span class="coverpage_link">MNDA Term</span>.

3. **Confidentiality**. Obligations survive for the <span class="coverpage_link">Term of Confidentiality</span>.

4. **Governing Law**. Governed by the laws of the State of <span class="coverpage_link">Governing Law</span>.

5. **Jurisdiction**. Courts located in <span class="coverpage_link">Jurisdiction</span>.
`;

function makeValues(overrides: Partial<NdaFormValues> = {}): NdaFormValues {
  return { ...getDefaultFormValues(), ...overrides };
}

function renderPreview(overrides: Partial<NdaFormValues> = {}) {
  return render(
    <NdaPreview standardTerms={STANDARD_TERMS} values={makeValues(overrides)} />
  );
}

// ─── Cover Page ───────────────────────────────────────────────────────────────

describe("NdaPreview — Cover Page", () => {
  it("renders the document title", () => {
    renderPreview();
    expect(
      screen.getByRole("heading", { name: /mutual non-disclosure agreement/i })
    ).toBeInTheDocument();
  });

  it("renders the purpose value", () => {
    renderPreview({ purpose: "Exploring a joint venture" });
    expect(screen.getByText("Exploring a joint venture")).toBeInTheDocument();
  });

  it("renders '[Not provided]' placeholder when purpose is empty", () => {
    renderPreview({ purpose: "" });
    expect(screen.getAllByText(/not provided/i).length).toBeGreaterThan(0);
  });

  it("renders a formatted effective date", () => {
    renderPreview({ effectiveDate: "2025-06-15" });
    expect(screen.getByText("June 15, 2025")).toBeInTheDocument();
  });

  it("renders '[Not provided]' when effective date is empty", () => {
    renderPreview({ effectiveDate: "" });
    expect(screen.getAllByText(/not provided/i).length).toBeGreaterThan(0);
  });

  it("renders MNDA Term expiry text", () => {
    renderPreview({ mndaTermType: "expires", mndaTermMonths: 2 });
    // "Expires" appears in the cover page row; use getAllByText since it may also appear in standard terms
    expect(screen.getAllByText(/expires/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText("2 months from Effective Date").length).toBeGreaterThan(0);
  });

  it("renders MNDA Term perpetual text", () => {
    renderPreview({ mndaTermType: "perpetual" });
    expect(
      screen.getByText(/continues until terminated/i)
    ).toBeInTheDocument();
  });

  it("renders Term of Confidentiality years", () => {
    renderPreview({ confidentialityTermType: "months", confidentialityTermMonths: 3 });
    // Text appears in both the cover page <strong> and in the markdown mock
    expect(screen.getAllByText(/3 months from Effective Date/i).length).toBeGreaterThan(0);
  });

  it("renders Term of Confidentiality perpetual", () => {
    renderPreview({ confidentialityTermType: "perpetual" });
    expect(screen.getAllByText(/in perpetuity/i).length).toBeGreaterThan(0);
  });

  it("renders governing law value", () => {
    renderPreview({ governingLaw: "Delaware" });
    expect(screen.getAllByText(/Delaware/i).length).toBeGreaterThan(0);
  });

  it("renders jurisdiction value", () => {
    renderPreview({ jurisdiction: "courts in New Castle, DE" });
    expect(screen.getAllByText(/courts in New Castle, DE/i).length).toBeGreaterThan(0);
  });

  it("renders '[Not provided]' for empty governing law", () => {
    renderPreview({ governingLaw: "" });
    expect(screen.getAllByText(/not provided/i).length).toBeGreaterThan(0);
  });
});

// ─── Signature Table ──────────────────────────────────────────────────────────

describe("NdaPreview — Signature Table", () => {
  it("renders party company names as column headers", () => {
    renderPreview({ party1Company: "Acme Corp", party2Company: "Widget Ltd" });
    // Company name appears in both the table header <th> and the body <td>
    expect(screen.getAllByText("Acme Corp").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Widget Ltd").length).toBeGreaterThan(0);
    // Verify it appears specifically in a <th>
    const headers = screen.getAllByRole("columnheader");
    expect(headers.some((h) => h.textContent === "Acme Corp")).toBe(true);
    expect(headers.some((h) => h.textContent === "Widget Ltd")).toBe(true);
  });

  it("renders fallback 'PARTY 1' / 'PARTY 2' when companies are empty", () => {
    renderPreview({ party1Company: "", party2Company: "" });
    expect(screen.getByText("PARTY 1")).toBeInTheDocument();
    expect(screen.getByText("PARTY 2")).toBeInTheDocument();
  });

  it("renders /s/ signature line when party name is provided", () => {
    renderPreview({ party1Name: "Alice Johnson" });
    expect(screen.getByText("/s/ Alice Johnson")).toBeInTheDocument();
  });

  it("renders party names in Print Name row", () => {
    renderPreview({ party1Name: "Alice Johnson", party2Name: "Bob Smith" });
    const names = screen.getAllByText("Alice Johnson");
    expect(names.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Bob Smith")).toBeInTheDocument();
  });

  it("renders party titles", () => {
    renderPreview({ party1Title: "CEO", party2Title: "CTO" });
    expect(screen.getByText("CEO")).toBeInTheDocument();
    expect(screen.getByText("CTO")).toBeInTheDocument();
  });

  it("renders party addresses", () => {
    renderPreview({
      party1Address: "alice@acme.com",
      party2Address: "bob@widget.com",
    });
    expect(screen.getByText("alice@acme.com")).toBeInTheDocument();
    expect(screen.getByText("bob@widget.com")).toBeInTheDocument();
  });

  it("renders formatted party dates", () => {
    renderPreview({ party1Date: "2025-06-01", party2Date: "2025-06-02" });
    expect(screen.getByText("June 1, 2025")).toBeInTheDocument();
    expect(screen.getByText("June 2, 2025")).toBeInTheDocument();
  });

  it("renders all signature table row labels", () => {
    renderPreview();
    const labels = ["Signature", "Print Name", "Title", "Company", "Notice Address", "Date"];
    for (const label of labels) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });
});

// ─── Standard Terms ───────────────────────────────────────────────────────────

describe("NdaPreview — Standard Terms", () => {
  it("renders the standard terms section", () => {
    renderPreview();
    // The mock renders children as-is; check for substituted content
    expect(screen.getByTestId("react-markdown")).toBeInTheDocument();
  });

  it("passes substituted content to ReactMarkdown (no raw spans)", () => {
    renderPreview({ governingLaw: "Texas" });
    const markdownEl = screen.getByTestId("react-markdown");
    expect(markdownEl.textContent).not.toContain('class="coverpage_link"');
    expect(markdownEl.textContent).toContain("Texas");
  });

  it("substitutes Purpose in standard terms", () => {
    renderPreview({ purpose: "Evaluating a merger" });
    const markdownEl = screen.getByTestId("react-markdown");
    expect(markdownEl.textContent).toContain("Evaluating a merger");
  });

  it("uses [Purpose] fallback in standard terms when purpose is empty", () => {
    renderPreview({ purpose: "" });
    const markdownEl = screen.getByTestId("react-markdown");
    expect(markdownEl.textContent).toContain("[Purpose]");
  });

  it("renders the nda-document container element", () => {
    renderPreview();
    expect(document.getElementById("nda-document")).toBeInTheDocument();
  });
});

// ─── CC Attribution ───────────────────────────────────────────────────────────

describe("NdaPreview — Attribution", () => {
  it("renders CC BY 4.0 attribution link", () => {
    renderPreview();
    const links = screen.getAllByRole("link", { name: /cc by 4\.0/i });
    expect(links.length).toBeGreaterThan(0);
  });

  it("renders link to commonpaper.com", () => {
    renderPreview();
    const links = screen.getAllByRole("link");
    const cpLink = links.find((l) =>
      l.getAttribute("href")?.includes("commonpaper.com")
    );
    expect(cpLink).toBeDefined();
  });
});
