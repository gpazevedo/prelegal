import {
  escapeHtml,
  formatDate,
  getDefaultDocFields,
  getDocRoute,
  substituteTemplate,
  SLUG_TO_TEMPLATE,
  DOC_NAMES,
  DocFields,
} from "@/lib/docUtils";

function makeFields(overrides: Partial<DocFields> = {}): DocFields {
  return { ...getDefaultDocFields(), ...overrides };
}

// ─── getDefaultDocFields ──────────────────────────────────────────────────────

describe("getDefaultDocFields()", () => {
  it("returns all 18 fields as empty strings", () => {
    const fields = getDefaultDocFields();
    for (const value of Object.values(fields)) {
      expect(value).toBe("");
    }
    expect(Object.keys(fields)).toHaveLength(18);
  });

  it("effectiveDate defaults to empty string", () => {
    expect(getDefaultDocFields().effectiveDate).toBe("");
  });
});

// ─── escapeHtml ───────────────────────────────────────────────────────────────

describe("escapeHtml()", () => {
  it("escapes ampersand", () => {
    expect(escapeHtml("A & B")).toBe("A &amp; B");
  });

  it("escapes less-than", () => {
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
  });

  it("escapes greater-than", () => {
    expect(escapeHtml("x > y")).toBe("x &gt; y");
  });

  it("escapes double quotes", () => {
    expect(escapeHtml('say "hi"')).toBe("say &quot;hi&quot;");
  });

  it("escapes single quotes", () => {
    expect(escapeHtml("it's fine")).toBe("it&#x27;s fine");
  });

  it("escapes all dangerous characters together", () => {
    const result = escapeHtml(`<script>alert('XSS & "fun"')</script>`);
    expect(result).not.toContain("<");
    expect(result).not.toContain(">");
    expect(result).not.toContain("'");
    expect(result).not.toContain('"');
    expect(result).not.toContain("&script");
  });

  it("leaves plain text unchanged", () => {
    expect(escapeHtml("hello world")).toBe("hello world");
  });
});

// ─── substituteTemplate ───────────────────────────────────────────────────────

describe("substituteTemplate()", () => {
  it("replaces keyterms_link span with field value in <strong>", () => {
    const t = 'Governed by <span class="keyterms_link">Governing Law</span>.';
    const result = substituteTemplate(t, makeFields({ governingLaw: "Delaware" }));
    expect(result).toContain("<strong>Delaware</strong>");
    expect(result).not.toContain('class="keyterms_link"');
  });

  it("replaces coverpage_link span with field value in <strong>", () => {
    const t = 'Purpose: <span class="coverpage_link">Purpose</span>.';
    const result = substituteTemplate(t, makeFields({ purpose: "Testing" }));
    expect(result).toContain("<strong>Testing</strong>");
    expect(result).not.toContain('class="coverpage_link"');
  });

  it("falls back to [Key] placeholder when field is empty", () => {
    const t = '<span class="keyterms_link">Governing Law</span>';
    const result = substituteTemplate(t, makeFields({ governingLaw: "" }));
    expect(result).toContain("[Governing Law]");
  });

  it("falls back to [Key] placeholder for unknown span label", () => {
    const t = '<span class="keyterms_link">UnknownField</span>';
    const result = substituteTemplate(t, makeFields());
    expect(result).toContain("[UnknownField]");
  });

  it("maps 'Provider' alias to providerCompany", () => {
    const t = '<span class="keyterms_link">Provider</span>';
    const result = substituteTemplate(t, makeFields({ providerCompany: "Acme Inc" }));
    expect(result).toContain("<strong>Acme Inc</strong>");
  });

  it("maps \"Provider's\" alias to providerCompany", () => {
    const t = '<span class="keyterms_link">Provider\'s</span>';
    const result = substituteTemplate(t, makeFields({ providerCompany: "Acme Inc" }));
    expect(result).toContain("<strong>Acme Inc</strong>");
  });

  it("maps 'Partner' alias to customerCompany", () => {
    const t = '<span class="keyterms_link">Partner</span>';
    const result = substituteTemplate(t, makeFields({ customerCompany: "Beta Ltd" }));
    expect(result).toContain("<strong>Beta Ltd</strong>");
  });

  it("maps \"Partner's\" alias to customerCompany", () => {
    const t = '<span class="keyterms_link">Partner\'s</span>';
    const result = substituteTemplate(t, makeFields({ customerCompany: "Beta Ltd" }));
    expect(result).toContain("<strong>Beta Ltd</strong>");
  });

  it("maps 'Chosen Courts' alias to jurisdiction", () => {
    const t = '<span class="keyterms_link">Chosen Courts</span>';
    const result = substituteTemplate(t, makeFields({ jurisdiction: "Delaware courts" }));
    expect(result).toContain("<strong>Delaware courts</strong>");
  });

  it("formats Effective Date as human-readable date", () => {
    const t = '<span class="keyterms_link">Effective Date</span>';
    const result = substituteTemplate(t, makeFields({ effectiveDate: "2025-06-15" }));
    expect(result).toContain("June 15, 2025");
  });

  it("falls back to [Effective Date] when effectiveDate is empty", () => {
    const t = '<span class="keyterms_link">Effective Date</span>';
    const result = substituteTemplate(t, makeFields({ effectiveDate: "" }));
    expect(result).toContain("[Effective Date]");
  });

  it("escapes HTML in field values to prevent XSS", () => {
    const t = '<span class="keyterms_link">Governing Law</span>';
    const result = substituteTemplate(t, makeFields({ governingLaw: "<script>alert(1)</script>" }));
    expect(result).not.toContain("<script>");
    expect(result).toContain("&lt;script&gt;");
  });

  it("replaces multiple occurrences of the same key", () => {
    const t =
      '<span class="keyterms_link">Governing Law</span> and again <span class="keyterms_link">Governing Law</span>';
    const result = substituteTemplate(t, makeFields({ governingLaw: "Texas" }));
    const matches = (result.match(/Texas/g) || []).length;
    expect(matches).toBe(2);
  });

  it("leaves non-keyterms/coverpage spans untouched", () => {
    const t = '<span class="header_2">Section</span>';
    const result = substituteTemplate(t, makeFields());
    expect(result).toBe(t);
  });

  it("does not mutate the original template string", () => {
    const original = '<span class="keyterms_link">Purpose</span>';
    const copy = original;
    substituteTemplate(original, makeFields({ purpose: "test" }));
    expect(original).toBe(copy);
  });
});

// ─── getDocRoute ──────────────────────────────────────────────────────────────

describe("getDocRoute()", () => {
  it("routes Mutual-NDA.md to /dashboard/nda", () => {
    expect(getDocRoute("templates/Mutual-NDA.md")).toBe("/dashboard/nda");
  });

  it("routes Mutual-NDA-coverpage.md to /dashboard/nda", () => {
    expect(getDocRoute("templates/Mutual-NDA-coverpage.md")).toBe("/dashboard/nda");
  });

  it("routes CSA.md to /dashboard/doc/csa", () => {
    expect(getDocRoute("templates/CSA.md")).toBe("/dashboard/doc/csa");
  });

  it("routes BAA.md to /dashboard/doc/baa", () => {
    expect(getDocRoute("templates/BAA.md")).toBe("/dashboard/doc/baa");
  });

  it("routes design-partner-agreement.md to correct slug", () => {
    expect(getDocRoute("templates/design-partner-agreement.md")).toBe(
      "/dashboard/doc/design-partner-agreement"
    );
  });

  it("lowercases the slug", () => {
    expect(getDocRoute("templates/Software-License-Agreement.md")).toBe(
      "/dashboard/doc/software-license-agreement"
    );
  });
});

// ─── SLUG_TO_TEMPLATE and DOC_NAMES completeness ──────────────────────────────

describe("SLUG_TO_TEMPLATE and DOC_NAMES", () => {
  const EXPECTED_SLUGS = [
    "ai-addendum",
    "baa",
    "csa",
    "design-partner-agreement",
    "dpa",
    "partnership-agreement",
    "pilot-agreement",
    "psa",
    "sla",
    "software-license-agreement",
  ];

  it("SLUG_TO_TEMPLATE has all 10 expected slugs", () => {
    for (const slug of EXPECTED_SLUGS) {
      expect(SLUG_TO_TEMPLATE).toHaveProperty(slug);
    }
  });

  it("DOC_NAMES has all 10 expected slugs", () => {
    for (const slug of EXPECTED_SLUGS) {
      expect(DOC_NAMES).toHaveProperty(slug);
    }
  });

  it("SLUG_TO_TEMPLATE values are non-empty strings ending in .md", () => {
    for (const template of Object.values(SLUG_TO_TEMPLATE)) {
      expect(template.endsWith(".md")).toBe(true);
    }
  });

  it("DOC_NAMES values are non-empty strings", () => {
    for (const name of Object.values(DOC_NAMES)) {
      expect(name.length).toBeGreaterThan(0);
    }
  });
});
