export interface CashFlowRecord {
  date: string;
  cash_in: number;
  cash_out: number;
}

export interface LedgerDay {
  date: string;
  inflow: number;
  outflow: number;
  ending_balance: number;
  trend?: number;
  weekly_seasonality?: number;
  event_effect?: number;
  yhat_lower?: number;
  yhat_upper?: number;
}

export interface OutflowSpike {
  date: string;
  day_index: number;
  amount: number;
  category: string;
  isPayroll: boolean;
  impactOnBalance: number;
}

export interface CashProblemDiagnosis {
  isCritical: boolean;
  firstInsolventDate: string | null;
  daysToInsolvency: number | null;
  lowestCashFloor: number;
  lowestCashFloorDate: string;
  dangerDaysCount: number;
  topOutflowSpikes: OutflowSpike[];
  totalPayrollObligations: number;
  averageWeeklyBurn: number;
  burnRateDaily: number;
  receivablesLagRisk: string;
}

export interface ForecastSummary {
  model_type: 'Prophet';
  starting_balance: number;
  lowest_cash_floor: number;
  lowest_cash_floor_date: string;
  runs_out_of_cash: boolean;
  cash_out_date: string | null;
  daily_ledger: LedgerDay[];
  total_inflow: number;
  total_outflow: number;
  net_change: number;
  burn_rate_daily: number;
  diagnosis?: CashProblemDiagnosis;
}

export interface SimulationRequestPayload {
  scenario: string;
  forecast_summary: ForecastSummary;
}

export interface SimulationResponsePayload {
  scenario: string;
  advisor_recommendation: string;
  recommendation_badge?: 'APPROVE' | 'REJECT' | 'MODIFY' | 'CAUTION';
}

export interface ChatHistoryItem {
  role: 'user' | 'model';
  text: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
  badge?: 'APPROVE' | 'REJECT' | 'MODIFY' | 'CAUTION';
}
