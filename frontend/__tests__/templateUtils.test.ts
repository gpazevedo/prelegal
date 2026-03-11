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

  it("defaults to expires mndaTermType with 1 year", () => {
    expect(getDefaultFormValues().mndaTermType).toBe("expires");
    expect(getDefaultFormValues().mndaTermYears).toBe(1);
  });

  it("defaults to years confidentialityTermType with 1 year", () => {
    expect(getDefaultFormValues().confidentialityTermType).toBe("years");
    expect(getDefaultFormValues().confidentialityTermYears).toBe(1);
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
  it("returns singular '1 year' for mndaTermYears=1", () => {
    const result = getMndaTermText(makeValues({ mndaTermType: "expires", mndaTermYears: 1 }));
    expect(result).toBe("1 year from Effective Date");
  });

  it("returns plural '2 years' for mndaTermYears=2", () => {
    const result = getMndaTermText(makeValues({ mndaTermType: "expires", mndaTermYears: 2 }));
    expect(result).toBe("2 years from Effective Date");
  });

  it("returns perpetual text when mndaTermType is perpetual", () => {
    const result = getMndaTermText(makeValues({ mndaTermType: "perpetual" }));
    expect(result).toContain("terminated");
  });

  it("ignores mndaTermYears when type is perpetual", () => {
    const result = getMndaTermText(makeValues({ mndaTermType: "perpetual", mndaTermYears: 5 }));
    expect(result).not.toContain("5");
  });

  it("handles large year values", () => {
    const result = getMndaTermText(makeValues({ mndaTermType: "expires", mndaTermYears: 10 }));
    expect(result).toBe("10 years from Effective Date");
  });
});

// ─── getConfidentialityTermText ──────────────────────────────────────────────

describe("getConfidentialityTermText", () => {
  it("returns singular '1 year' for confidentialityTermYears=1", () => {
    const result = getConfidentialityTermText(
      makeValues({ confidentialityTermType: "years", confidentialityTermYears: 1 })
    );
    expect(result).toBe("1 year from Effective Date");
  });

  it("returns plural '3 years' for confidentialityTermYears=3", () => {
    const result = getConfidentialityTermText(
      makeValues({ confidentialityTermType: "years", confidentialityTermYears: 3 })
    );
    expect(result).toBe("3 years from Effective Date");
  });

  it("returns 'in perpetuity' when type is perpetual", () => {
    const result = getConfidentialityTermText(
      makeValues({ confidentialityTermType: "perpetual" })
    );
    expect(result).toBe("in perpetuity");
  });

  it("ignores confidentialityTermYears when type is perpetual", () => {
    const result = getConfidentialityTermText(
      makeValues({ confidentialityTermType: "perpetual", confidentialityTermYears: 99 })
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
      makeValues({ mndaTermType: "expires", mndaTermYears: 2 })
    );
    expect(result).toContain("2 years from Effective Date");
  });

  it("replaces MNDA Term with perpetual text", () => {
    const result = substituteStandardTerms(
      TEMPLATE,
      makeValues({ mndaTermType: "perpetual" })
    );
    expect(result).toContain("terminated");
  });

  it("replaces Term of Confidentiality with computed years text", () => {
    const result = substituteStandardTerms(
      TEMPLATE,
      makeValues({ confidentialityTermType: "years", confidentialityTermYears: 3 })
    );
    expect(result).toContain("3 years from Effective Date");
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
