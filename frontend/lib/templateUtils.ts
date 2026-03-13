import { formatDate, escapeHtml } from "@/lib/docUtils";

export { formatDate };

export interface NdaFormValues {
  purpose: string;
  effectiveDate: string;
  mndaTermType: "expires" | "perpetual";
  mndaTermMonths: number;
  confidentialityTermType: "months" | "perpetual";
  confidentialityTermMonths: number;
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
    mndaTermMonths: 12,
    confidentialityTermType: "months",
    confidentialityTermMonths: 12,
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

export function getMndaTermText(values: NdaFormValues): string {
  if (values.mndaTermType === "expires") {
    const months = Math.max(1, values.mndaTermMonths);
    return `${months} month${months !== 1 ? "s" : ""} from Effective Date`;
  }
  return "until terminated in accordance with the terms of the MNDA";
}

export function getConfidentialityTermText(values: NdaFormValues): string {
  if (values.confidentialityTermType === "months") {
    const months = Math.max(1, values.confidentialityTermMonths);
    return `${months} month${months !== 1 ? "s" : ""} from Effective Date`;
  }
  return "in perpetuity";
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
