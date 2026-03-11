"""Registry of document type configurations for the generic doc chat system."""
from dataclasses import dataclass


@dataclass
class DocConfig:
    slug: str
    name: str
    template_file: str  # basename only, e.g. "CSA.md"
    greeting: str
    fields_description: str  # injected into the AI system prompt


_SIGNATORY_FIELDS = (
    "- providerName, providerTitle, providerAddress, providerDate: Provider signatory details\n"
    "- customerName, customerTitle, customerAddress, customerDate: Customer signatory details"
)

# Fields used by every doc type
DEFAULT_FIELDS: dict = {
    "effectiveDate": "",
    "governingLaw": "",
    "jurisdiction": "",
    "term": "",
    "fees": "",
    "purpose": "",
    "providerCompany": "",
    "providerName": "",
    "providerTitle": "",
    "providerAddress": "",
    "providerDate": "",
    "customerCompany": "",
    "customerName": "",
    "customerTitle": "",
    "customerAddress": "",
    "customerDate": "",
    "productName": "",
    "noticeAddress": "",
}

_CONFIGS: dict[str, DocConfig] = {
    "ai-addendum": DocConfig(
        slug="ai-addendum",
        name="AI Addendum",
        template_file="AI-Addendum.md",
        greeting=(
            "Hi! I'll help you put together an AI Addendum — supplemental terms governing "
            "AI/ML features in a SaaS product. Let's start — what is the name of the SaaS provider company?"
        ),
        fields_description=(
            "- providerCompany: Name of the SaaS provider\n"
            "- customerCompany: Name of the customer company\n"
            f"{_SIGNATORY_FIELDS}\n"
            "- effectiveDate: Effective date (YYYY-MM-DD)\n"
            "- purpose: Description of the AI/ML features and their permitted use\n"
            "- governingLaw: Governing law state (e.g. \"Delaware\")\n"
            "- jurisdiction: Jurisdiction for disputes"
        ),
    ),
    "baa": DocConfig(
        slug="baa",
        name="Business Associate Agreement (BAA)",
        template_file="BAA.md",
        greeting=(
            "Hi! I'll help you put together a Business Associate Agreement (BAA) — "
            "a HIPAA-compliant agreement governing the handling of Protected Health Information. "
            "Let's start — what is the name of the covered entity (the healthcare organization)?"
        ),
        fields_description=(
            "- customerCompany: Name of the covered entity (healthcare organization)\n"
            "- providerCompany: Name of the business associate (the vendor/service provider)\n"
            "- providerName, providerTitle, providerAddress, providerDate: Business associate signatory details\n"
            "- customerName, customerTitle, customerAddress, customerDate: Covered entity signatory details\n"
            "- effectiveDate: BAA effective date (YYYY-MM-DD)\n"
            "- governingLaw: Governing law state\n"
            "- jurisdiction: Jurisdiction for disputes"
        ),
    ),
    "csa": DocConfig(
        slug="csa",
        name="Cloud Service Agreement (CSA)",
        template_file="CSA.md",
        greeting=(
            "Hi! I'll help you put together a Cloud Service Agreement. "
            "This covers SaaS subscription terms, customer obligations, fees, and more. "
            "Let's start — what is the name of the cloud service provider?"
        ),
        fields_description=(
            "- providerCompany: Name of the cloud service provider\n"
            "- customerCompany: Name of the customer company\n"
            f"{_SIGNATORY_FIELDS}\n"
            "- effectiveDate: Effective date (YYYY-MM-DD)\n"
            "- productName: Name of the cloud service or product\n"
            "- term: Subscription period (e.g. \"1 year\", \"month-to-month\")\n"
            "- fees: Subscription fees (e.g. \"$500/month\" or \"as specified in Order Form\")\n"
            "- governingLaw: Governing law state\n"
            "- jurisdiction: Jurisdiction for disputes"
        ),
    ),
    "design-partner-agreement": DocConfig(
        slug="design-partner-agreement",
        name="Design Partner Agreement",
        template_file="design-partner-agreement.md",
        greeting=(
            "Hi! I'll help you put together a Design Partner Agreement — for early-access beta "
            "partnerships where a partner provides feedback in exchange for product access. "
            "Let's start — what is the name of the provider (the company offering the product)?"
        ),
        fields_description=(
            "- providerCompany: Name of the provider (product company)\n"
            "- customerCompany: Name of the design partner company\n"
            "- providerName, providerTitle, providerAddress, providerDate: Provider signatory details\n"
            "- customerName, customerTitle, customerAddress, customerDate: Partner signatory details\n"
            "- effectiveDate: Effective date (YYYY-MM-DD)\n"
            "- productName: Name of the product being tested\n"
            "- term: Duration of the design partner program (e.g. \"6 months\")\n"
            "- fees: Fees if any (e.g. \"none\" or \"$1,000/month\")\n"
            "- purpose: Description of the program goals and feedback expectations\n"
            "- governingLaw: Governing law state\n"
            "- jurisdiction: Jurisdiction for disputes"
        ),
    ),
    "dpa": DocConfig(
        slug="dpa",
        name="Data Processing Agreement (DPA)",
        template_file="DPA.md",
        greeting=(
            "Hi! I'll help you put together a Data Processing Agreement (DPA) — "
            "a GDPR-focused agreement governing how a provider processes personal data on behalf of a customer. "
            "Let's start — what is the name of the data controller (the customer)?"
        ),
        fields_description=(
            "- customerCompany: Name of the data controller (the customer)\n"
            "- providerCompany: Name of the data processor (the provider/vendor)\n"
            "- providerName, providerTitle, providerAddress, providerDate: Data processor signatory details\n"
            "- customerName, customerTitle, customerAddress, customerDate: Data controller signatory details\n"
            "- effectiveDate: Effective date (YYYY-MM-DD)\n"
            "- purpose: Nature and purpose of data processing\n"
            "- term: Duration of processing\n"
            "- governingLaw: Governing law jurisdiction (EU member state or other)\n"
            "- jurisdiction: Jurisdiction for disputes"
        ),
    ),
    "partnership-agreement": DocConfig(
        slug="partnership-agreement",
        name="Partnership Agreement",
        template_file="Partnership-Agreement.md",
        greeting=(
            "Hi! I'll help you put together a Partnership Agreement — governing a commercial "
            "partnership between two companies. Let's start — what is the name of the first company (Provider)?"
        ),
        fields_description=(
            "- providerCompany: Name of the first company (Provider)\n"
            "- customerCompany: Name of the partner company\n"
            "- providerName, providerTitle, providerAddress, providerDate: Provider signatory details\n"
            "- customerName, customerTitle, customerAddress, customerDate: Partner signatory details\n"
            "- effectiveDate: Effective date (YYYY-MM-DD)\n"
            "- purpose: Purpose and scope of the partnership\n"
            "- term: Duration of the partnership\n"
            "- fees: Revenue sharing or referral fee arrangement (if any)\n"
            "- governingLaw: Governing law state\n"
            "- jurisdiction: Jurisdiction for disputes"
        ),
    ),
    "pilot-agreement": DocConfig(
        slug="pilot-agreement",
        name="Pilot Agreement",
        template_file="Pilot-Agreement.md",
        greeting=(
            "Hi! I'll help you put together a Pilot Agreement — for a time-limited product evaluation. "
            "Let's start — what is the name of the provider (the company offering the product for evaluation)?"
        ),
        fields_description=(
            "- providerCompany: Name of the provider\n"
            "- customerCompany: Name of the customer doing the evaluation\n"
            f"{_SIGNATORY_FIELDS}\n"
            "- effectiveDate: Effective date (YYYY-MM-DD)\n"
            "- productName: Name of the product being evaluated\n"
            "- term: Pilot period duration (e.g. \"30 days\", \"3 months\")\n"
            "- fees: Pilot fee (typically \"none\" or \"$0\")\n"
            "- governingLaw: Governing law state\n"
            "- jurisdiction: Jurisdiction for disputes"
        ),
    ),
    "psa": DocConfig(
        slug="psa",
        name="Professional Services Agreement (PSA)",
        template_file="psa.md",
        greeting=(
            "Hi! I'll help you put together a Professional Services Agreement. "
            "This governs the delivery of consulting or professional services. "
            "Let's start — what is the name of the services provider?"
        ),
        fields_description=(
            "- providerCompany: Name of the services provider\n"
            "- customerCompany: Name of the customer\n"
            f"{_SIGNATORY_FIELDS}\n"
            "- effectiveDate: Effective date (YYYY-MM-DD)\n"
            "- purpose: Description of services to be delivered\n"
            "- term: Agreement term (e.g. \"1 year\")\n"
            "- fees: Service fees (e.g. \"$200/hour\" or \"$10,000 fixed\")\n"
            "- governingLaw: Governing law state\n"
            "- jurisdiction: Jurisdiction for disputes"
        ),
    ),
    "sla": DocConfig(
        slug="sla",
        name="Service Level Agreement (SLA)",
        template_file="sla.md",
        greeting=(
            "Hi! I'll help you put together a Service Level Agreement. "
            "This defines cloud service uptime commitments and remedies. "
            "Let's start — what is the name of the cloud service provider?"
        ),
        fields_description=(
            "- providerCompany: Name of the cloud service provider\n"
            "- customerCompany: Name of the customer\n"
            f"{_SIGNATORY_FIELDS}\n"
            "- effectiveDate: Effective date (YYYY-MM-DD)\n"
            "- purpose: Target uptime commitment (e.g. \"99.9% monthly uptime\")\n"
            "- term: Agreement term (e.g. \"1 year\")\n"
            "- fees: Service credit terms (e.g. \"10% monthly fee credit per excess downtime hour\")\n"
            "- governingLaw: Governing law state\n"
            "- jurisdiction: Jurisdiction for disputes"
        ),
    ),
    "software-license-agreement": DocConfig(
        slug="software-license-agreement",
        name="Software License Agreement",
        template_file="Software-License-Agreement.md",
        greeting=(
            "Hi! I'll help you put together a Software License Agreement for on-premise software. "
            "Let's start — what is the name of the licensor (the company providing the software)?"
        ),
        fields_description=(
            "- providerCompany: Name of the software licensor\n"
            "- customerCompany: Name of the licensee (customer)\n"
            "- providerName, providerTitle, providerAddress, providerDate: Licensor signatory details\n"
            "- customerName, customerTitle, customerAddress, customerDate: Licensee signatory details\n"
            "- effectiveDate: Effective date (YYYY-MM-DD)\n"
            "- productName: Name of the software product\n"
            "- term: License term (e.g. \"perpetual\" or \"1 year\")\n"
            "- fees: License fees (e.g. \"$5,000 one-time\" or \"$1,000/year\")\n"
            "- governingLaw: Governing law state\n"
            "- jurisdiction: Jurisdiction for disputes"
        ),
    ),
}


def get_config(slug: str) -> DocConfig | None:
    return _CONFIGS.get(slug)


def get_default_fields() -> dict:
    return {**DEFAULT_FIELDS}
