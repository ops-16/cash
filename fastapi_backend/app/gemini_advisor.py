import os
from typing import List, Optional, Dict, Any
from google import genai
from .prophet_engine import ForecastSummary

def get_gemini_client():
    api_key = os.environ.get("GOOGLE_GENERATIVE_AI_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY (or GOOGLE_GENERATIVE_AI_API_KEY) is not set in environment.")
    return genai.Client(api_key=api_key)


def run_cfo_simulation(scenario: str, summary: ForecastSummary) -> Dict[str, Any]:
    client = get_gemini_client()

    diag = summary.diagnosis
    prompt = f"""You are a Senior Fractional CFO advising an SME executive on a 30-day Prophet time-series cash flow forecast.

Financial Context:
- Model: Prophet Additive Decomposition
- Starting Cash: ${summary.starting_balance:,.2f}
- 30-Day Lowest Floor: ${summary.lowest_cash_floor:,.2f} on {summary.lowest_cash_floor_date}
- Solvency State: {'CRITICAL DEFICIT on ' + str(summary.cash_out_date) if summary.runs_out_of_cash else 'SOLVENT - Positive runway'}
- Total Projected Inflow: ${summary.total_inflow:,.2f}
- Total Projected Outflow: ${summary.total_outflow:,.2f}
- Total Payroll Obligations: ${diag.totalPayrollObligations:,.2f}
- Average Daily Burn: ${summary.burn_rate_daily:,.2f}/day

Scenario Proposed by Founder:
"{scenario}"

Provide an executive CFO evaluation strictly in this 3-part format:

1. Recommendation: [APPROVE, REJECT, or MODIFY]
State an executive 1-2 sentence verdict.

2. Impact Analysis:
- Analyze liquidity impact, runway impact, and cash floor buffer.
- Identify specific timing hazards (payroll cycles or payment lag).

3. Action Steps:
- Step 1: Immediate risk mitigation.
- Step 2: Vendor/client terms adjustment.
- Step 3: Daily metric to monitor."""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    text = response.text or "No recommendation generated."
    badge = "MODIFY"
    upper = text.upper()
    if "RECOMMENDATION: APPROVE" in upper or "[APPROVE]" in upper:
        badge = "APPROVE"
    elif "RECOMMENDATION: REJECT" in upper or "[REJECT]" in upper:
        badge = "REJECT"
    elif "RECOMMENDATION: MODIFY" in upper or "[MODIFY]" in upper:
        badge = "MODIFY"

    return {"recommendation": text, "badge": badge}


def run_cfo_chat(message: str, summary: Optional[ForecastSummary], history: List[Dict[str, str]] = []) -> Dict[str, Any]:
    client = get_gemini_client()

    context = ""
    if summary:
        context = f"""Current Financial State from Prophet:
- Starting Cash: ${summary.starting_balance:,.2f}
- Lowest Cash Floor: ${summary.lowest_cash_floor:,.2f} on {summary.lowest_cash_floor_date}
- Solvency: {'CRITICAL DEFICIT on ' + str(summary.cash_out_date) if summary.runs_out_of_cash else 'SOLVENT'}
- Daily Burn: ${summary.burn_rate_daily:,.2f}/day"""
    else:
        context = "Default baseline SME figures apply ($15,000 starting cash)."

    system_prompt = f"""You are an expert Fractional CFO AI Advisor.
Help the business owner navigate cash flow bottlenecks, working capital management, payroll crunches, and collections.
Always give direct, actionable, practical financial advice formatted with clear Markdown headers and bullet points.
If the question is a business proposal, include an executive badge (**APPROVE**, **REJECT**, or **MODIFY**).

{context}"""

    prompt = f"{system_prompt}\n\nUser Question: {message}"

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    reply = response.text or "Unable to generate response."
    badge = None
    upper = reply.upper()
    if "**APPROVE**" in upper or "[APPROVE]" in upper:
        badge = "APPROVE"
    elif "**REJECT**" in upper or "[REJECT]" in upper:
        badge = "REJECT"
    elif "**MODIFY**" in upper or "[MODIFY]" in upper:
        badge = "MODIFY"
    elif "**CAUTION**" in upper or "[CAUTION]" in upper:
        badge = "CAUTION"

    return {"reply": reply, "badge": badge}
