import React, { useState } from 'react';
import { FinancialSettingsCard } from './FinancialSettingsCard';
import { RunwayChartCard } from './RunwayChartCard';
import { ForecastSummary, CashFlowRecord } from '../types';
import {
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sliders,
  DollarSign,
  TrendingDown,
  Clock,
  ArrowRight,
  Sparkles,
  Info,
  Layers,
} from 'lucide-react';

interface CashProblemInvestigatorProps {
  startingBalance: number;
  setStartingBalance: (val: number) => void;
  fileName: string | null;
  recordCount: number;
  onFileUpload: (file: File) => void;
  onRunForecast: () => void;
  isLoading: boolean;
  forecastSummary: ForecastSummary | null;
  onOpenLedger: () => void;
  onSwitchToChat: (initialPrompt?: string) => void;
}

export const CashProblemInvestigator: React.FC<CashProblemInvestigatorProps> = ({
  startingBalance,
  setStartingBalance,
  fileName,
  recordCount,
  onFileUpload,
  onRunForecast,
  isLoading,
  forecastSummary,
  onOpenLedger,
  onSwitchToChat,
}) => {
  // Sensitivity levers state
  const [expenseDelayDays, setExpenseDelayDays] = useState<number>(0);
  const [receivablesBoostPct, setReceivablesBoostPct] = useState<number>(0);
  const [emergencyCredit, setEmergencyCredit] = useState<number>(0);

  const diagnosis = forecastSummary?.diagnosis;

  // Calculate adjusted metrics based on sensitivity levers
  const baseFloor = forecastSummary?.lowest_cash_floor ?? startingBalance;
  const totalInflow = forecastSummary?.total_inflow ?? 0;
  const inflowBoostAmount = (totalInflow * receivablesBoostPct) / 100;
  const adjustedFloor = baseFloor + emergencyCredit + inflowBoostAmount + (expenseDelayDays * 450);
  const adjustedIsSolvent = adjustedFloor >= 0;

  return (
    <div className="space-y-6">
      {/* Top Section: Settings & Prophet Forecast Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <FinancialSettingsCard
            startingBalance={startingBalance}
            setStartingBalance={setStartingBalance}
            fileName={fileName}
            recordCount={recordCount}
            onFileUpload={onFileUpload}
            onRunForecast={onRunForecast}
            isLoading={isLoading}
            forecastSummary={forecastSummary}
          />
        </div>

        <div className="lg:col-span-2">
          <RunwayChartCard
            forecastSummary={forecastSummary}
            onOpenLedger={onOpenLedger}
          />
        </div>
      </div>

      {/* Deep-Dive Problem Diagnostics Dashboard */}
      {forecastSummary && diagnosis && (
        <div className="space-y-6">
          {/* Section Heading */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className={`w-5 h-5 ${diagnosis.isCritical ? 'text-rose-600' : 'text-emerald-600'}`} />
                Cash Problem Diagnostics &amp; Root Cause Analysis
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Prophet model decomposition reveals liquidity bottlenecks, payroll pressure, and payment lag vulnerabilities
              </p>
            </div>

            <button
              type="button"
              onClick={() => onSwitchToChat(
                diagnosis.isCritical
                  ? `How can we fix the deficit on ${diagnosis.firstInsolventDate} where our cash floor reaches $${diagnosis.lowestCashFloor}?`
                  : `Our 30-day runway is positive with a floor of $${diagnosis.lowestCashFloor}. What working capital improvements do you suggest?`
              )}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Ask CFO About These Issues</span>
            </button>
          </div>

          {/* Critical Deficit Diagnostic Banner */}
          <div className={`p-4 rounded-xl border ${
            diagnosis.isCritical
              ? 'bg-rose-50/70 border-rose-200 text-rose-900'
              : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${diagnosis.isCritical ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {diagnosis.isCritical ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold">
                    {diagnosis.isCritical
                      ? `Critical Cash Deficit Detected on Day ${diagnosis.daysToInsolvency} (${diagnosis.firstInsolventDate})`
                      : 'Healthy Liquidity Runway — No Projected Insolvency'}
                  </h3>
                  <p className="text-xs mt-1 text-slate-600 max-w-2xl leading-relaxed">
                    {diagnosis.isCritical
                      ? `Prophet forecasting predicts cash balance dropping to $${diagnosis.lowestCashFloor.toLocaleString()} on ${diagnosis.lowestCashFloorDate}. Primary driver: Bi-weekly payroll obligations of $${diagnosis.totalPayrollObligations.toLocaleString()} colliding with receivables collection lag.`
                      : `The 30-day Prophet forecast projects a safe minimum cash floor of $${diagnosis.lowestCashFloor.toLocaleString()} on ${diagnosis.lowestCashFloorDate}. All operational and payroll obligations are covered under current projections.`}
                  </p>
                </div>
              </div>

              {/* Stat highlights */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="bg-white/80 backdrop-blur-xs px-3 py-2 rounded-lg border border-slate-200/60 text-center min-w-[100px]">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">Lowest Floor</span>
                  <span className={`text-sm font-bold font-mono ${diagnosis.lowestCashFloor < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                    ${diagnosis.lowestCashFloor.toLocaleString()}
                  </span>
                </div>
                <div className="bg-white/80 backdrop-blur-xs px-3 py-2 rounded-lg border border-slate-200/60 text-center min-w-[100px]">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">Danger Days</span>
                  <span className={`text-sm font-bold font-mono ${diagnosis.dangerDaysCount > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {diagnosis.dangerDaysCount} {diagnosis.dangerDaysCount === 1 ? 'day' : 'days'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Two-Column Diagnostic Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Column A: Top Outflow Spikes & Cash Leaks */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                  <h3 className="text-sm font-bold text-slate-900">Highest Cash Outflow Spikes</h3>
                </div>
                <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono">
                  Top 4 Events
                </span>
              </div>

              <div className="space-y-3">
                {diagnosis.topOutflowSpikes.length === 0 ? (
                  <p className="text-xs text-slate-500">No abnormal outflow spikes detected in this forecast window.</p>
                ) : (
                  diagnosis.topOutflowSpikes.map((spike, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                          spike.isPayroll ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-900">{spike.category}</span>
                            {spike.isPayroll && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                Payroll
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            <span>Day {spike.day_index} ({spike.date})</span>
                            <span>•</span>
                            <span>Projected balance: <strong className={spike.impactOnBalance < 0 ? 'text-rose-600' : 'text-slate-700'}>${spike.impactOnBalance.toLocaleString()}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-bold font-mono text-rose-700 block">
                          -${spike.amount.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400">Single day outflow</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Obligation metrics */}
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100">
                <div className="p-2.5 rounded-lg bg-slate-50/70 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Payroll Obligations</span>
                  <span className="text-xs font-bold font-mono text-slate-900">
                    ${diagnosis.totalPayrollObligations.toLocaleString()}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50/70 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Average Weekly Burn</span>
                  <span className="text-xs font-bold font-mono text-slate-900">
                    ${diagnosis.averageWeeklyBurn.toLocaleString()}/wk
                  </span>
                </div>
              </div>
            </div>

            {/* Column B: Interactive Sensitivity Levers (Stress Testing) */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">Interactive Sensitivity Levers</h3>
                  </div>
                  <span className="text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-semibold border border-blue-100">
                    Real-Time Stress Test
                  </span>
                </div>

                <p className="text-xs text-slate-500 mb-4">
                  Adjust operational levers to see how quickly you can bridge the cash gap without taking permanent dilution.
                </p>

                <div className="space-y-4">
                  {/* Lever 1: Delay Supplier Expenses */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        Delay Non-Critical Payables
                      </label>
                      <span className="text-xs font-bold font-mono text-blue-700">
                        {expenseDelayDays} days delay (+${(expenseDelayDays * 450).toLocaleString()})
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="14"
                      step="1"
                      value={expenseDelayDays}
                      onChange={(e) => setExpenseDelayDays(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>0 days</span>
                      <span>7 days</span>
                      <span>14 days</span>
                    </div>
                  </div>

                  {/* Lever 2: Accelerate Receivables */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                        Accelerate Client Invoicing (2% Early Pay Discount)
                      </label>
                      <span className="text-xs font-bold font-mono text-emerald-700">
                        +{receivablesBoostPct}% cash (+${Math.round(inflowBoostAmount).toLocaleString()})
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="5"
                      value={receivablesBoostPct}
                      onChange={(e) => setReceivablesBoostPct(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>Standard terms</span>
                      <span>+10% collected</span>
                      <span>+20% accelerated</span>
                    </div>
                  </div>

                  {/* Lever 3: Emergency Working Capital Injection */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-slate-500" />
                        Emergency Credit Line / Bridge Capital
                      </label>
                      <span className="text-xs font-bold font-mono text-indigo-700">
                        +${emergencyCredit.toLocaleString()}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="25000"
                      step="2500"
                      value={emergencyCredit}
                      onChange={(e) => setEmergencyCredit(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>$0</span>
                      <span>$10,000</span>
                      <span>$25,000</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stress-Test Result Outcome */}
              <div className="mt-5 p-3.5 rounded-lg border bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Simulated Adjusted Floor</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-base font-bold font-mono ${adjustedIsSolvent ? 'text-emerald-700' : 'text-rose-600'}`}>
                      ${Math.round(adjustedFloor).toLocaleString()}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                      adjustedIsSolvent ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {adjustedIsSolvent ? 'Solvent' : 'Deficit Persists'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const prompt = `Based on sensitivity testing, if we delay payables by ${expenseDelayDays} days, accelerate collections by ${receivablesBoostPct}%, and take a $${emergencyCredit} credit line, our cash floor moves to $${Math.round(adjustedFloor)}. What is your CFO evaluation of this plan?`;
                    onSwitchToChat(prompt);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <span>Evaluate in Chat</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
