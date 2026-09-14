import { GoogleGenAI } from "@google/genai";
import { ForecastSummary, ChatHistoryItem } from "../src/types";

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY (or GOOGLE_GENERATIVE_AI_API_KEY) is not configured in the environment.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

export async function generateAdvisorSimulation(
  scenario: string,
  forecastSummary: ForecastSummary
): Promise<{ recommendation: string; badge?: 'APPROVE' | 'REJECT' | 'MODIFY' | 'CAUTION' }> {
  const ai = getGeminiClient();

  const diagnosis = forecastSummary.diagnosis;
  const prompt = `You are a Senior Fractional CFO advising an SME executive on a 30-day Prophet time-series cash flow forecast.

Prophet 30-Day Financial State:
- Model: Prophet Additive Time-Series Decomposition (Trend, Seasonality, Recurring Payroll/Collections)
- Starting Cash: $${forecastSummary.starting_balance.toLocaleString()}
- Lowest Cash Floor: $${forecastSummary.lowest_cash_floor.toLocaleString()} (projected on ${forecastSummary.lowest_cash_floor_date})
- Deficit Status: ${forecastSummary.runs_out_of_cash ? `CRITICAL - Runs out of cash on Day ${diagnosis?.daysToInsolvency || 'N/A'} (${forecastSummary.cash_out_date})` : "SOLVENT - Positive runway maintained across 30 days"}
- Total 30d Projected Inflow: $${forecastSummary.total_inflow.toLocaleString()}
- Total 30d Projected Outflow: $${forecastSummary.total_outflow.toLocaleString()}
- Total Payroll Obligations: $${(diagnosis?.totalPayrollObligations || 0).toLocaleString()}
- Average Daily Burn: $${forecastSummary.burn_rate_daily.toLocaleString()}/day

The founder asks:
"${scenario}"

Provide a direct, high-impact CFO advisory evaluation strictly in this 3-part format:

1. Recommendation: [APPROVE, REJECT, or MODIFY]
State an executive 1-2 sentence verdict.

2. Impact Analysis:
- Analyze liquidity impact, runway impact, and cash floor buffer.
- Identify specific timing hazards (such as payroll cycles or payment lag).

3. Action Steps:
- Step 1: Immediate risk mitigation or capital adjustment.
- Step 2: Operational execution or vendor/client negotiation.
- Step 3: Trigger metric to monitor daily.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents: prompt,
    config: {
      temperature: 0.2,
    },
  });

  const recommendationText = response.text || "No recommendation generated.";

  let badge: 'APPROVE' | 'REJECT' | 'MODIFY' | 'CAUTION' = 'MODIFY';
  const upper = recommendationText.toUpperCase();
  if (upper.includes("RECOMMENDATION: APPROVE") || upper.includes("[APPROVE]")) {
    badge = 'APPROVE';
  } else if (upper.includes("RECOMMENDATION: REJECT") || upper.includes("[REJECT]")) {
    badge = 'REJECT';
  } else if (upper.includes("RECOMMENDATION: MODIFY") || upper.includes("[MODIFY]")) {
    badge = 'MODIFY';
  } else if (upper.includes("CAUTION")) {
    badge = 'CAUTION';
  }

  return {
    recommendation: recommendationText,
    badge,
  };
}

export async function generateCfoChatReply(
  userMessage: string,
  forecastSummary: ForecastSummary | null,
  history: ChatHistoryItem[] = []
): Promise<{ reply: string; badge?: 'APPROVE' | 'REJECT' | 'MODIFY' | 'CAUTION' }> {
  const ai = getGeminiClient();

  const financialContext = forecastSummary
    ? `
Current 30-Day Prophet Cash Forecast Context:
- Starting Balance: $${forecastSummary.starting_balance.toLocaleString()}
- 30-Day Lowest Cash Floor: $${forecastSummary.lowest_cash_floor.toLocaleString()} on ${forecastSummary.lowest_cash_floor_date}
- Solvency State: ${forecastSummary.runs_out_of_cash ? `CRITICAL DEFICIT on ${forecastSummary.cash_out_date}` : "Positive Runway (Safe)"}
- Total 30-Day Inflow: $${forecastSummary.total_inflow.toLocaleString()}
- Total 30-Day Outflow: $${forecastSummary.total_outflow.toLocaleString()}
- Daily Burn: $${forecastSummary.burn_rate_daily.toLocaleString()}/day
- Top Outflow Spikes: ${forecastSummary.diagnosis?.topOutflowSpikes.map(s => `${s.date}: $${s.amount.toLocaleString()} (${s.category})`).join(', ') || 'None recorded'}
`
    : "Note: The user has not run the forecast yet; default baseline SME figures apply ($15k starting cash).";

  const systemInstruction = `You are a Fractional CFO AI Advisor.
Your objective: Assist the business owner in solving cash flow issues, managing working capital, preparing for payroll spikes, and optimizing receivables/payables.
Always give direct, actionable, practical advice formatted with clear Markdown headers, bold highlights, and bullet points.
If the question is a proposal or strategic expenditure, include an executive badge indication (**APPROVE**, **REJECT**, or **MODIFY**) with your rationale.
${financialContext}`;

  // Build prompt with conversation history
  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  for (const h of history.slice(-6)) {
    contents.push({
      role: h.role === 'model' ? 'model' : 'user',
      parts: [{ text: h.text }],
    });
  }

  contents.push({
    role: 'user',
    parts: [{ text: `${systemInstruction}\n\nUser Question:\n${userMessage}` }],
  });

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents,
    config: {
      temperature: 0.3,
    },
  });

  const reply = response.text || "I was unable to generate a response. Please check your forecast data.";

  let badge: 'APPROVE' | 'REJECT' | 'MODIFY' | 'CAUTION' | undefined;
  const upper = reply.toUpperCase();
  if (upper.includes("**APPROVE**") || upper.includes("[APPROVE]")) {
    badge = 'APPROVE';
  } else if (upper.includes("**REJECT**") || upper.includes("[REJECT]")) {
    badge = 'REJECT';
  } else if (upper.includes("**MODIFY**") || upper.includes("[MODIFY]")) {
    badge = 'MODIFY';
  } else if (upper.includes("**CAUTION**") || upper.includes("[CAUTION]")) {
    badge = 'CAUTION';
  }

  return { reply, badge };
}
