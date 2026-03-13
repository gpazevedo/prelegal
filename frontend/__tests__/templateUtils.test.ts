import {
  getDefaultFormValues,
  getMndaTermText,
  getConfidentialityTermText,
  substituteStandardTerms,
  NdaFormValues,
} from "@/lib/templateUtils";

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeValues(overrides: Partial<NdaFormValues> = {}): NdaFormValues {
  return { ...getDefaultFormValues(), ...overrides };
}

// ─── getDefaultFormValues() ───────────────────────────────────────────────────────

describe("getDefaultFormValues()", () => {
  it("has a non-empty purpose", () => {
    expect(getDefaultFormValues().purpose.length).toBeGreaterThan(0);
  });

  it("effectiveDate is today in YYYY-MM-DD format", () => {
    const today = new Date().toISOString().split("T")[0];
    expect(getDefaultFormValues().effectiveDate).toBe(today);
  });

  it("defaults to expires mndaTermType with 12 months", () => {
    expect(getDefaultFormValues().mndaTermType).toBe("expires");
    expect(getDefaultFormValues().mndaTermMonths).toBe(12);
  });

  it("defaults to months confidentialityTermType with 12 months", () => {
    expect(getDefaultFormValues().confidentialityTermType).toBe("months");
    expect(getDefaultFormValues().confidentialityTermMonths).toBe(12);
  });

  it("all party fields default to empty strings", () => {
    const partyFields: (keyof NdaFormValues)[] = [
      "party1Company", "party1Name", "party1Title", "party1Address", "party1Date",
      "party2Company", "party2Name", "party2Title", "party2Address", "party2Date",
    ];
    for (const field of partyFields) {
      expect(getDefaultFormValues()[field]).toBe("");
    }
  });
});

// ─── getMndaTermText ─────────────────────────────────────────────────────────

describe("getMndaTermText", () => {
  it("returns singular '1 month' for mndaTermMonths=1", () => {
    const result = getMndaTermText(makeValues({ mndaTermType: "expires", mndaTermMonths: 1 }));
    expect(result).toBe("1 month from Effective Date");
  });

  it("returns plural '2 months' for mndaTermMonths=2", () => {
    const result = getMndaTermText(makeValues({ mndaTermType: "expires", mndaTermMonths: 2 }));
    expect(result).toBe("2 months from Effective Date");
  });

  it("returns perpetual text when mndaTermType is perpetual", () => {
    const result = getMndaTermText(makeValues({ mndaTermType: "perpetual" }));
    expect(result).toContain("terminated");
  });

  it("ignores mndaTermMonths when type is perpetual", () => {
    const result = getMndaTermText(makeValues({ mndaTermType: "perpetual", mndaTermMonths: 5 }));
    expect(result).not.toContain("5");
  });

  it("handles large month values", () => {
    const result = getMndaTermText(makeValues({ mndaTermType: "expires", mndaTermMonths: 24 }));
    expect(result).toBe("24 months from Effective Date");
  });
});

// ─── getConfidentialityTermText ──────────────────────────────────────────────

describe("getConfidentialityTermText", () => {
  it("returns singular '1 month' for confidentialityTermMonths=1", () => {
    const result = getConfidentialityTermText(
      makeValues({ confidentialityTermType: "months", confidentialityTermMonths: 1 })
    );
    expect(result).toBe("1 month from Effective Date");
  });

  it("returns plural '3 months' for confidentialityTermMonths=3", () => {
    const result = getConfidentialityTermText(
      makeValues({ confidentialityTermType: "months", confidentialityTermMonths: 3 })
    );
    expect(result).toBe("3 months from Effective Date");
  });

  it("returns 'in perpetuity' when type is perpetual", () => {
    const result = getConfidentialityTermText(
      makeValues({ confidentialityTermType: "perpetual" })
    );
    expect(result).toBe("in perpetuity");
  });

  it("ignores confidentialityTermMonths when type is perpetual", () => {
    const result = getConfidentialityTermText(
      makeValues({ confidentialityTermType: "perpetual", confidentialityTermMonths: 99 })
    );
    expect(result).not.toContain("99");
  });
});

// ─── substituteStandardTerms ─────────────────────────────────────────────────

describe("substituteStandardTerms", () => {
  const TEMPLATE = [
    'The <span class="coverpage_link">Purpose</span> of this agreement.',
    'Effective as of <span class="coverpage_link">Effective Date</span>.',
    'This MNDA has a term of <span class="coverpage_link">MNDA Term</span>.',
    'Confidentiality lasts for the <span class="coverpage_link">Term of Confidentiality</span>.',
    'Governed by <span class="coverpage_link">Governing Law</span>.',
    'Jurisdiction is <span class="coverpage_link">Jurisdiction</span>.',
  ].join("\n");

  it("replaces Purpose with the form value", () => {
    const result = substituteStandardTerms(
      TEMPLATE,
      makeValues({ purpose: "Exploring a potential partnership" })
    );
    expect(result).toContain("Exploring a potential partnership");
    expect(result).not.toContain('class="coverpage_link"');
  });

  it("replaces Effective Date with a human-readable date", () => {
    const result = substituteStandardTerms(
      TEMPLATE,
      makeValues({ effectiveDate: "2025-06-15" })
    );
    expect(result).toContain("June 15, 2025");
  });

  it("replaces MNDA Term with computed text (expires)", () => {
    const result = substituteStandardTerms(
      TEMPLATE,
      makeValues({ mndaTermType: "expires", mndaTermMonths: 24 })
    );
    expect(result).toContain("24 months from Effective Date");
  });

  it("replaces MNDA Term with perpetual text", () => {
    const result = substituteStandardTerms(
      TEMPLATE,
      makeValues({ mndaTermType: "perpetual" })
    );
    expect(result).toContain("terminated");
  });

  it("replaces Term of Confidentiality with computed months text", () => {
    const result = substituteStandardTerms(
      TEMPLATE,
      makeValues({ confidentialityTermType: "months", confidentialityTermMonths: 36 })
    );
    expect(result).toContain("36 months from Effective Date");
  });

  it("replaces Term of Confidentiality with 'in perpetuity'", () => {
    const result = substituteStandardTerms(
      TEMPLATE,
      makeValues({ confidentialityTermType: "perpetual" })
    );
    expect(result).toContain("in perpetuity");
  });

  it("replaces Governing Law", () => {
    const result = substituteStandardTerms(
      TEMPLATE,
      makeValues({ governingLaw: "Delaware" })
    );
    expect(result).toContain("Delaware");
  });

  it("replaces Jurisdiction", () => {
    const result = substituteStandardTerms(
      TEMPLATE,
      makeValues({ jurisdiction: "courts in New Castle, DE" })
    );
    expect(result).toContain("courts in New Castle, DE");
  });

  it("wraps substituted values in <strong> tags", () => {
    const result = substituteStandardTerms(
      TEMPLATE,
      makeValues({ governingLaw: "California" })
    );
    expect(result).toContain("<strong>California</strong>");
  });

  it("falls back to placeholder when Purpose is empty", () => {
    const result = substituteStandardTerms(TEMPLATE, makeValues({ purpose: "" }));
    expect(result).toContain("[Purpose]");
  });

  it("falls back to placeholder when Governing Law is empty", () => {
    const result = substituteStandardTerms(TEMPLATE, makeValues({ governingLaw: "" }));
    expect(result).toContain("[Governing Law]");
  });

  it("falls back to placeholder when Jurisdiction is empty", () => {
    const result = substituteStandardTerms(TEMPLATE, makeValues({ jurisdiction: "" }));
    expect(result).toContain("[Jurisdiction]");
  });

  it("falls back to placeholder when Effective Date is empty", () => {
    const result = substituteStandardTerms(TEMPLATE, makeValues({ effectiveDate: "" }));
    expect(result).toContain("[Effective Date]");
  });

  it("leaves non-coverpage spans untouched", () => {
    const withOtherSpan = '<span class="header_2">Section</span> text.';
    const result = substituteStandardTerms(withOtherSpan, makeValues());
    expect(result).toBe(withOtherSpan);
  });

  it("replaces multiple occurrences of the same key", () => {
    const repeated =
      'The <span class="coverpage_link">Governing Law</span> governs. ' +
      'Under <span class="coverpage_link">Governing Law</span> courts apply.';
    const result = substituteStandardTerms(
      repeated,
      makeValues({ governingLaw: "Texas" })
    );
    const matches = (result.match(/Texas/g) || []).length;
    expect(matches).toBe(2);
  });

  it("does not mutate the original template string", () => {
    const original = 'See <span class="coverpage_link">Purpose</span>.';
    const copy = original;
    substituteStandardTerms(original, makeValues({ purpose: "testing" }));
    expect(original).toBe(copy);
  });

  it("handles unknown coverpage_link keys gracefully", () => {
    const withUnknown = '<span class="coverpage_link">UnknownField</span>';
    const result = substituteStandardTerms(withUnknown, makeValues());
    expect(result).toContain("[UnknownField]");
  });
});
