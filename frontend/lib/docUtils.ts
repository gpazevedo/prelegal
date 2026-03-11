export interface DocFields {
  effectiveDate: string;
  governingLaw: string;
  jurisdiction: string;
  term: string;
  fees: string;
  purpose: string;
  providerCompany: string;
  providerName: string;
  providerTitle: string;
  providerAddress: string;
  providerDate: string;
  customerCompany: string;
  customerName: string;
  customerTitle: string;
  customerAddress: string;
  customerDate: string;
  productName: string;
  noticeAddress: string;
}

export function getDefaultDocFields(): DocFields {
  return {
    effectiveDate: "",
    governingLaw: "",
    jurisdiction: "",
    term: "",
    fees: "",
    purpose: "",
    providerCompany: "",
    providerName: "",
    providerTitle: "",
    providerAddress: "",
    providerDate: "",
    customerCompany: "",
    customerName: "",
    customerTitle: "",
    customerAddress: "",
    customerDate: "",
    productName: "",
    noticeAddress: "",
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

// Maps template span labels to doc field values
const FIELD_MAP: Record<string, (f: DocFields) => string> = {
  Provider: (f) => f.providerCompany,
  "Provider's": (f) => f.providerCompany,
  Customer: (f) => f.customerCompany,
  "Customer's": (f) => f.customerCompany,
  Partner: (f) => f.customerCompany,
  "Partner's": (f) => f.customerCompany,
  "Effective Date": (f) => (f.effectiveDate ? formatDate(f.effectiveDate) : ""),
  "Governing Law": (f) => f.governingLaw,
  "Chosen Courts": (f) => f.jurisdiction,
  Jurisdiction: (f) => f.jurisdiction,
  Term: (f) => f.term,
  Fees: (f) => f.fees,
  Purpose: (f) => f.purpose,
  "Notice Address": (f) => f.noticeAddress,
};

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/** Replace keyterms_link and coverpage_link spans with field values. */
export function substituteTemplate(template: string, fields: DocFields): string {
  return template.replace(
    /<span class="(?:keyterms_link|coverpage_link)">([^<]+)<\/span>/g,
    (_, key) => {
      const getter = FIELD_MAP[key.trim()];
      const value = getter ? getter(fields) : "";
      return value
        ? `<strong>${escapeHtml(value)}</strong>`
        : `<strong>[${key}]</strong>`;
    }
  );
}

// Maps doc slug to template basename
export const SLUG_TO_TEMPLATE: Record<string, string> = {
  "ai-addendum": "AI-Addendum.md",
  baa: "BAA.md",
  csa: "CSA.md",
  "design-partner-agreement": "design-partner-agreement.md",
  dpa: "DPA.md",
  "partnership-agreement": "Partnership-Agreement.md",
  "pilot-agreement": "Pilot-Agreement.md",
  psa: "psa.md",
  sla: "sla.md",
  "software-license-agreement": "Software-License-Agreement.md",
};

export const DOC_NAMES: Record<string, string> = {
  "ai-addendum": "AI Addendum",
  baa: "Business Associate Agreement",
  csa: "Cloud Service Agreement",
  "design-partner-agreement": "Design Partner Agreement",
  dpa: "Data Processing Agreement",
  "partnership-agreement": "Partnership Agreement",
  "pilot-agreement": "Pilot Agreement",
  psa: "Professional Services Agreement",
  sla: "Service Level Agreement",
  "software-license-agreement": "Software License Agreement",
};

// Derive route from catalog item filename
export function getDocRoute(filename: string): string {
  const ndaFiles = ["templates/Mutual-NDA.md", "templates/Mutual-NDA-coverpage.md"];
  if (ndaFiles.includes(filename)) return "/dashboard/nda";
  const basename = filename.replace(/^templates\//, "").replace(/\.md$/, "");
  return `/dashboard/doc/${basename.toLowerCase()}`;
}
