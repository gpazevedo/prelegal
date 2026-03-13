import json
import os
from typing import Optional

from litellm import completion
from pydantic import BaseModel

MODEL = "openrouter/openai/gpt-oss-120b"
_EXTRA_BODY = {"provider": {"order": ["Cerebras"]}}

_SYSTEM_PROMPT = """You are a legal assistant helping a user complete a Mutual NDA (Non-Disclosure Agreement).
Collect all required fields through friendly conversation.

Required fields:
- purpose: How confidential information may be used
- effectiveDate: Effective date (YYYY-MM-DD)
- mndaTermType: "expires" or "perpetual"
- mndaTermMonths: If expires, number of months (integer)
- confidentialityTermType: "months" or "perpetual"
- confidentialityTermMonths: If months, number of months (integer)
- governingLaw: State for governing law (e.g. "Delaware")
- jurisdiction: Jurisdiction for disputes (e.g. "courts in New Castle, DE")
- party1Company, party1Name, party1Title, party1Address, party1Date: Party 1 details
- party2Company, party2Name, party2Title, party2Address, party2Date: Party 2 details

Current field values:
{fields_json}

Instructions:
1. Ask for one or a few related missing fields at a time
2. Set fields_update with values extracted from the user's latest message
3. Set next_question to your next question, or null if all fields are complete
4. Set is_complete to true only when ALL required fields have values
5. Be conversational and friendly; briefly explain legal terms when needed
6. Remind user about YYYY-MM-DD date format if they provide dates in other formats"""


class FieldsUpdate(BaseModel):
    purpose: Optional[str] = None
    effectiveDate: Optional[str] = None
    mndaTermType: Optional[str] = None
    mndaTermMonths: Optional[int] = None
    confidentialityTermType: Optional[str] = None
    confidentialityTermMonths: Optional[int] = None
    governingLaw: Optional[str] = None
    jurisdiction: Optional[str] = None
    party1Company: Optional[str] = None
    party1Name: Optional[str] = None
    party1Title: Optional[str] = None
    party1Address: Optional[str] = None
    party1Date: Optional[str] = None
    party2Company: Optional[str] = None
    party2Name: Optional[str] = None
    party2Title: Optional[str] = None
    party2Address: Optional[str] = None
    party2Date: Optional[str] = None


class AiTurn(BaseModel):
    next_question: Optional[str] = None
    fields_update: FieldsUpdate
    is_complete: bool = False


_GENERIC_SYSTEM_PROMPT = """You are a legal assistant helping a user complete a {doc_name}.
Collect all required fields through friendly conversation.

Required fields:
{fields_description}

Current field values:
{fields_json}

Instructions:
1. Ask for one or a few related missing fields at a time
2. Set fields_update with values extracted from the user's latest message
3. Set next_question to your next question, or null if all fields are complete
4. Set is_complete to true only when ALL required fields have values
5. Be conversational and friendly; briefly explain legal terms when needed
6. Remind user about YYYY-MM-DD date format for date fields
7. If the user asks for a document type we don't support, explain that we only support:
   AI Addendum, Business Associate Agreement, Cloud Service Agreement, Design Partner Agreement,
   Data Processing Agreement, Mutual NDA, Partnership Agreement, Pilot Agreement,
   Professional Services Agreement, Service Level Agreement, and Software License Agreement —
   then offer the closest match"""


class GenericFieldsUpdate(BaseModel):
    effectiveDate: Optional[str] = None
    governingLaw: Optional[str] = None
    jurisdiction: Optional[str] = None
    term: Optional[str] = None
    fees: Optional[str] = None
    purpose: Optional[str] = None
    providerCompany: Optional[str] = None
    providerName: Optional[str] = None
    providerTitle: Optional[str] = None
    providerAddress: Optional[str] = None
    providerDate: Optional[str] = None
    customerCompany: Optional[str] = None
    customerName: Optional[str] = None
    customerTitle: Optional[str] = None
    customerAddress: Optional[str] = None
    customerDate: Optional[str] = None
    productName: Optional[str] = None
    noticeAddress: Optional[str] = None


class GenericAiTurn(BaseModel):
    next_question: Optional[str] = None
    fields_update: GenericFieldsUpdate
    is_complete: bool = False


def call_generic_ai(history: list[dict], current_fields: dict, doc_config) -> GenericAiTurn:
    """Call the AI for a generic document type with per-doc field definitions."""
    filled = {k: v for k, v in current_fields.items() if v not in (None, "")}
    system_content = _GENERIC_SYSTEM_PROMPT.format(
        doc_name=doc_config.name,
        fields_description=doc_config.fields_description,
        fields_json=json.dumps(filled, indent=2),
    )
    response = completion(
        model=MODEL,
        messages=[{"role": "system", "content": system_content}, *history],
        response_format=GenericAiTurn,
        extra_body=_EXTRA_BODY,
    )
    return GenericAiTurn.model_validate_json(response.choices[0].message.content)


def call_ai(history: list[dict], current_fields: dict) -> AiTurn:
    """Call the AI with conversation history and return structured response."""
    # 0 is the "not yet answered" sentinel for mndaTermYears / confidentialityTermYears
    filled = {k: v for k, v in current_fields.items() if v not in (None, "", 0)}
    system_content = _SYSTEM_PROMPT.format(fields_json=json.dumps(filled, indent=2))

    response = completion(
        model=MODEL,
        messages=[{"role": "system", "content": system_content}, *history],
        response_format=AiTurn,
        extra_body=_EXTRA_BODY,
    )
    return AiTurn.model_validate_json(response.choices[0].message.content)
