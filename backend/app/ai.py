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
- mndaTermYears: If expires, number of years (integer)
- confidentialityTermType: "years" or "perpetual"
- confidentialityTermYears: If years, number of years (integer)
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
    mndaTermYears: Optional[int] = None
    confidentialityTermType: Optional[str] = None
    confidentialityTermYears: Optional[int] = None
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
