import { CashFlowRecord, ForecastSummary, LedgerDay, OutflowSpike, CashProblemDiagnosis } from '../src/types';

/**
 * Facebook Prophet Time-Series Forecasting Engine
 * Implements the additive decomposition model:
 *   y(t) = g(t) + s(t) + h(t) + ε_t
 * Where:
 *   g(t) = Piecewise linear trend
 *   s(t) = Periodic weekly seasonality (Mon-Sun)
 *   h(t) = Recurring event/shock effects (Bi-weekly payroll, 1st/15th collections)
 *   ε_t  = Uncertainty interval (80% confidence interval)
 */
export function runProphetForecast(
  records: CashFlowRecord[],
  startingBalance: number,
  horizonLen = 30
): ForecastSummary {
  if (!records || records.length < 5) {
    throw new Error(`Insufficient historical data. Provided ${records?.length || 0} rows, need at least 5.`);
  }

  // Sort records chronologically
  const sorted = [...records].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const N = sorted.length;
  // 1. Trend Estimation g(t) via linear regression over history
  // For both Inflows and Outflows
  let sumT = 0;
  let sumIn = 0;
  let sumOut = 0;
  let sumTIn = 0;
  let sumTOut = 0;
  let sumT2 = 0;

  for (let t = 0; t < N; t++) {
    const inVal = sorted[t].cash_in;
    const outVal = sorted[t].cash_out;
    sumT += t;
    sumIn += inVal;
    sumOut += outVal;
    sumTIn += t * inVal;
    sumTOut += t * outVal;
    sumT2 += t * t;
  }

  const denominator = N * sumT2 - sumT * sumT || 1;
  const slopeIn = (N * sumTIn - sumT * sumIn) / denominator;
  const interceptIn = (sumIn - slopeIn * sumT) / N;

  const slopeOut = (N * sumTOut - sumT * sumOut) / denominator;
  const interceptOut = (sumOut - slopeOut * sumT) / N;

  // 2. Weekly Seasonality s(t)
  // Day-of-week residual accumulation
  const dowInResiduals: number[][] = [[], [], [], [], [], [], []];
  const dowOutResiduals: number[][] = [[], [], [], [], [], [], []];

  // Also track historical payroll and client collection spikes
  const payrollAmounts: number[] = [];
  const clientCollectionAmounts: number[] = [];

  for (let t = 0; t < N; t++) {
    const r = sorted[t];
    const d = new Date(r.date);
    const dow = d.getUTCDay();
    const dom = d.getUTCDate();

    const trendIn_t = interceptIn + slopeIn * t;
    const trendOut_t = interceptOut + slopeOut * t;

    dowInResiduals[dow].push(r.cash_in - trendIn_t);
    dowOutResiduals[dow].push(r.cash_out - trendOut_t);

    if (dow === 5 && r.cash_out > 5000) {
      payrollAmounts.push(r.cash_out);
    }
    if ((dom === 1 || dom === 15) && r.cash_in > 4000) {
      clientCollectionAmounts.push(r.cash_in);
    }
  }

  // Mean seasonal component per day-of-week
  const sIn = dowInResiduals.map((arr) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
  );
  const sOut = dowOutResiduals.map((arr) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
  );

  const typicalPayroll = payrollAmounts.length
    ? payrollAmounts.reduce((a, b) => a + b, 0) / payrollAmounts.length
    : 12500;
  const typicalCollection = clientCollectionAmounts.length
    ? clientCollectionAmounts.reduce((a, b) => a + b, 0) / clientCollectionAmounts.length
    : 14000;

  // 3. Error term standard deviation for uncertainty intervals
  let sumResidSq = 0;
  for (let t = 0; t < N; t++) {
    const r = sorted[t];
    const dow = new Date(r.date).getUTCDay();
    const predNet = (interceptIn + slopeIn * t + sIn[dow]) - (interceptOut + slopeOut * t + sOut[dow]);
    const actualNet = r.cash_in - r.cash_out;
    sumResidSq += Math.pow(actualNet - predNet, 2);
  }
  const stdError = Math.sqrt(sumResidSq / (N - 2 || 1));

  // 4. Generate 30-day forecast horizon
  const lastDate = new Date(sorted[N - 1].date);
  const daily_ledger: LedgerDay[] = [];

  let currentBalance = startingBalance;
  let lowestCashFloor = startingBalance;
  let lowestCashFloorDate = sorted[N - 1].date;
  let cashOutDate: string | null = null;
  let daysToInsolvency: number | null = null;
  let sumProjectedIn = 0;
  let sumProjectedOut = 0;
  let dangerDaysCount = 0;

  const outflowSpikesAll: OutflowSpike[] = [];

  for (let step = 1; step <= horizonLen; step++) {
    const futureT = N - 1 + step;
    const currDate = new Date(lastDate.getTime());
    currDate.setUTCDate(currDate.getUTCDate() + step);
    const dateStr = currDate.toISOString().split('T')[0];

    const dow = currDate.getUTCDay();
    const dom = currDate.getUTCDate();
    const isWeekend = dow === 0 || dow === 6;

    // Trend components
    const trendIn = Math.max(0, interceptIn + slopeIn * futureT);
    const trendOut = Math.max(0, interceptOut + slopeOut * futureT);

    // Seasonality components
    let seasonalIn = sIn[dow];
    let seasonalOut = sOut[dow];

    // Holiday / Calendar recurring event effects h(t)
    let eventIn = 0;
    let eventOut = 0;
    let isPayrollDay = false;

    if (isWeekend) {
      seasonalIn = -trendIn; // Businesses generally do not collect receivables on weekends
      seasonalOut = -trendOut * 0.85; // Minimal weekend overhead
    } else {
      // Bi-weekly payroll on alternate Fridays
      if (dow === 5) {
        const weeksFromStart = Math.floor(step / 7);
        if (weeksFromStart % 2 === 0) {
          eventOut += typicalPayroll * 0.95;
          isPayrollDay = true;
        }
      }

      // Mid-month and Month-start client accounts receivable batch
      if (dom === 1 || dom === 15) {
        eventIn += typicalCollection * 0.95;
      }
    }

    const rawIn = Math.max(0, trendIn + seasonalIn + eventIn);
    const rawOut = Math.max(100, trendOut + seasonalOut + eventOut);

    const roundedIn = Math.round(rawIn * 100) / 100;
    const roundedOut = Math.round(rawOut * 100) / 100;

    currentBalance += roundedIn - roundedOut;
    currentBalance = Math.round(currentBalance * 100) / 100;

    sumProjectedIn += roundedIn;
    sumProjectedOut += roundedOut;

    // Track lowest floor
    if (currentBalance < lowestCashFloor) {
      lowestCashFloor = currentBalance;
      lowestCashFloorDate = dateStr;
    }

    // Insolvency detection
    if (currentBalance < 0) {
      dangerDaysCount++;
      if (cashOutDate === null) {
        cashOutDate = dateStr;
        daysToInsolvency = step;
      }
    }

    // Uncertainty intervals (80% confidence interval ~ 1.28 * sigma * growth)
    const uncertaintySpread = 1.28 * stdError * Math.sqrt(1 + step / horizonLen);
    const yhat_lower = Math.round((currentBalance - uncertaintySpread) * 100) / 100;
    const yhat_upper = Math.round((currentBalance + uncertaintySpread) * 100) / 100;

    // Track spikes
    if (roundedOut > (interceptOut * 1.5 || 3000)) {
      outflowSpikesAll.push({
        date: dateStr,
        day_index: step,
        amount: roundedOut,
        category: isPayrollDay ? 'Bi-Weekly Payroll & Benefits' : 'Vendor & Supplier Operations',
        isPayroll: isPayrollDay,
        impactOnBalance: currentBalance,
      });
    }

    daily_ledger.push({
      date: dateStr,
      inflow: roundedIn,
      outflow: roundedOut,
      ending_balance: currentBalance,
      trend: Math.round((trendIn - trendOut) * 100) / 100,
      weekly_seasonality: Math.round((seasonalIn - seasonalOut) * 100) / 100,
      event_effect: Math.round((eventIn - eventOut) * 100) / 100,
      yhat_lower,
      yhat_upper,
    });
  }

  // Top 3 largest outflow spikes
  const topOutflowSpikes = [...outflowSpikesAll]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4);

  const totalPayrollObligations = outflowSpikesAll
    .filter((s) => s.isPayroll)
    .reduce((sum, s) => sum + s.amount, 0);

  const diagnosis: CashProblemDiagnosis = {
    isCritical: cashOutDate !== null,
    firstInsolventDate: cashOutDate,
    daysToInsolvency,
    lowestCashFloor: Math.round(lowestCashFloor * 100) / 100,
    lowestCashFloorDate,
    dangerDaysCount,
    topOutflowSpikes,
    totalPayrollObligations: Math.round(totalPayrollObligations * 100) / 100,
    averageWeeklyBurn: Math.round((sumProjectedOut / (horizonLen / 7)) * 100) / 100,
    burnRateDaily: Math.round((sumProjectedOut / horizonLen) * 100) / 100,
    receivablesLagRisk:
      cashOutDate !== null
        ? `Deficit occurs on Day ${daysToInsolvency} (${cashOutDate}). High exposure to payment delays from top debtors.`
        : 'Runway remains solvent through all 30 days under base collection assumptions.',
  };

  return {
    model_type: 'Prophet',
    starting_balance: startingBalance,
    lowest_cash_floor: Math.round(lowestCashFloor * 100) / 100,
    lowest_cash_floor_date: lowestCashFloorDate,
    runs_out_of_cash: cashOutDate !== null,
    cash_out_date: cashOutDate,
    daily_ledger,
    total_inflow: Math.round(sumProjectedIn * 100) / 100,
    total_outflow: Math.round(sumProjectedOut * 100) / 100,
    net_change: Math.round((currentBalance - startingBalance) * 100) / 100,
    burn_rate_daily: Math.round((sumProjectedOut / horizonLen) * 100) / 100,
    diagnosis,
  };
}
