export interface NdaFormValues {
  purpose: string;
  effectiveDate: string;
  mndaTermType: "expires" | "perpetual";
  mndaTermYears: number;
  confidentialityTermType: "years" | "perpetual";
  confidentialityTermYears: number;
  governingLaw: string;
  jurisdiction: string;
  party1Company: string;
  party1Name: string;
  party1Title: string;
  party1Address: string;
  party1Date: string;
  party2Company: string;
  party2Name: string;
  party2Title: string;
  party2Address: string;
  party2Date: string;
}

// Computed at call time so tests and server-side renders get today's date.
export function getDefaultFormValues(): NdaFormValues {
  return {
    purpose: "Evaluating whether to enter into a business relationship with the other party.",
    effectiveDate: new Date().toISOString().split("T")[0],
    mndaTermType: "expires",
    mndaTermYears: 1,
    confidentialityTermType: "years",
    confidentialityTermYears: 1,
    governingLaw: "",
    jurisdiction: "",
    party1Company: "",
    party1Name: "",
    party1Title: "",
    party1Address: "",
    party1Date: "",
    party2Company: "",
    party2Name: "",
    party2Title: "",
    party2Address: "",
    party2Date: "",
  };
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getMndaTermText(values: NdaFormValues): string {
  if (values.mndaTermType === "expires") {
    const years = Math.max(1, values.mndaTermYears);
    return `${years} year${years !== 1 ? "s" : ""} from Effective Date`;
  }
  return "until terminated in accordance with the terms of the MNDA";
}

export function getConfidentialityTermText(values: NdaFormValues): string {
  if (values.confidentialityTermType === "years") {
    const years = Math.max(1, values.confidentialityTermYears);
    return `${years} year${years !== 1 ? "s" : ""} from Effective Date`;
  }
  return "in perpetuity";
}

// Escapes a plain-text user value so it is safe to embed inside HTML.
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export function substituteStandardTerms(template: string, values: NdaFormValues): string {
  const substitutions: Record<string, string> = {
    Purpose: values.purpose ? escapeHtml(values.purpose) : "[Purpose]",
    "Effective Date": values.effectiveDate
      ? formatDate(values.effectiveDate)
      : "[Effective Date]",
    "MNDA Term": getMndaTermText(values),
    "Term of Confidentiality": getConfidentialityTermText(values),
    "Governing Law": values.governingLaw ? escapeHtml(values.governingLaw) : "[Governing Law]",
    Jurisdiction: values.jurisdiction ? escapeHtml(values.jurisdiction) : "[Jurisdiction]",
  };

  return template.replace(
    /<span class="coverpage_link">([^<]+)<\/span>/g,
    (_, key) => {
      const value = substitutions[key.trim()];
      return value !== undefined
        ? `<strong>${value}</strong>`
        : `<strong>[${key}]</strong>`;
    }
  );
}
