import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { ForecastSummary } from '../types';
import { Layers, ArrowDownRight, ArrowUpRight, Table, Activity } from 'lucide-react';

interface RunwayChartCardProps {
  forecastSummary: ForecastSummary | null;
  onOpenLedger: () => void;
}

export const RunwayChartCard: React.FC<RunwayChartCardProps> = ({
  forecastSummary,
  onOpenLedger,
}) => {
  const [viewMode, setViewMode] = useState<'balance' | 'flows'>('balance');

  const formatCurrency = (val: number) => {
    if (Math.abs(val) >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (Math.abs(val) >= 1000) return `$${(val / 1000).toFixed(0)}k`;
    return `$${val}`;
  };

  const chartData = forecastSummary?.daily_ledger.map((item) => ({
    date: item.date.slice(5), // MM-DD
    fullDate: item.date,
    balance: item.ending_balance,
    inflow: item.inflow,
    outflow: item.outflow,
    net: Math.round((item.inflow - item.outflow) * 100) / 100,
  })) || [];

  const minBalance = chartData.length ? Math.min(...chartData.map((d) => d.balance)) : 0;
  const maxBalance = chartData.length ? Math.max(...chartData.map((d) => d.balance)) : 20000;
  const yDomainMin = minBalance < 0 ? Math.floor(minBalance * 1.15) : 0;
  const yDomainMax = Math.ceil(maxBalance * 1.1);

  return (
    <section className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between" id="runway-chart-card">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              30-Day Prophet Forecast Runway
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Prophet additive model trajectory across 30 daily horizon steps with 80% confidence band
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('balance')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  viewMode === 'balance'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Runway Balance
              </button>
              <button
                type="button"
                onClick={() => setViewMode('flows')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  viewMode === 'flows'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Daily In/Out
              </button>
            </div>

            {forecastSummary && (
              <button
                type="button"
                onClick={onOpenLedger}
                id="view-daily-ledger-btn"
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <Table className="w-3.5 h-3.5 text-slate-600" />
                <span>Daily Ledger</span>
              </button>
            )}
          </div>
        </div>

        {/* Chart area */}
        <div className="h-[280px] w-full" id="runwayChart">
          {!forecastSummary ? (
            <div className="h-full flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50 p-6 text-center">
              <Layers className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-700">No Forecast Generated Yet</p>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Configure starting cash balance and click "Run TimesFM Forecast" to compute the 30-day runway projection.
              </p>
            </div>
          ) : viewMode === 'balance' ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="deficitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  domain={[yDomainMin, yDomainMax]}
                  tickFormatter={formatCurrency}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white rounded-lg p-3 text-xs shadow-lg border border-slate-700">
                          <p className="font-semibold text-slate-200 mb-1">{data.fullDate}</p>
                          <div className="space-y-1">
                            <p className="flex justify-between gap-4">
                              <span className="text-slate-400">Cash Runway:</span>
                              <span className={`font-mono font-bold ${data.balance < 0 ? 'text-red-400' : 'text-blue-300'}`}>
                                ${data.balance.toLocaleString()}
                              </span>
                            </p>
                            <p className="flex justify-between gap-4">
                              <span className="text-emerald-400 flex items-center gap-1">
                                <ArrowUpRight className="w-3 h-3" /> Inflow:
                              </span>
                              <span className="font-mono">${data.inflow.toLocaleString()}</span>
                            </p>
                            <p className="flex justify-between gap-4">
                              <span className="text-rose-400 flex items-center gap-1">
                                <ArrowDownRight className="w-3 h-3" /> Outflow:
                              </span>
                              <span className="font-mono">${data.outflow.toLocaleString()}</span>
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine
                  y={0}
                  stroke="#ef4444"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  label={{
                    value: 'Cash Zero Line',
                    position: 'insideBottomLeft',
                    fill: '#ef4444',
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="balance"
                  name="Cash Runway ($)"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#balanceGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  tickFormatter={formatCurrency}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white rounded-lg p-3 text-xs shadow-lg border border-slate-700">
                          <p className="font-semibold text-slate-200 mb-1">{data.fullDate}</p>
                          <div className="space-y-1">
                            <p className="flex justify-between gap-4 text-emerald-300">
                              <span>Inflow:</span>
                              <span className="font-mono font-semibold">${data.inflow.toLocaleString()}</span>
                            </p>
                            <p className="flex justify-between gap-4 text-rose-300">
                              <span>Outflow:</span>
                              <span className="font-mono font-semibold">${data.outflow.toLocaleString()}</span>
                            </p>
                            <p className="flex justify-between gap-4 text-slate-300 border-t border-slate-700 pt-1 mt-1">
                              <span>Ending Balance:</span>
                              <span className="font-mono font-bold">${data.balance.toLocaleString()}</span>
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
                <Bar dataKey="inflow" name="Inflow ($)" fill="#10b981" radius={[2, 2, 0, 0]} />
                <Bar dataKey="outflow" name="Outflow ($)" fill="#f43f5e" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Trajectory stats footer */}
      {forecastSummary && (
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
          <div className="p-2 rounded bg-slate-50">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">Total 30d Inflows</span>
            <span className="text-xs font-bold text-emerald-700 font-mono">
              +${(forecastSummary.total_inflow || 0).toLocaleString()}
            </span>
          </div>
          <div className="p-2 rounded bg-slate-50">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">Total 30d Outflows</span>
            <span className="text-xs font-bold text-rose-700 font-mono">
              -${(forecastSummary.total_outflow || 0).toLocaleString()}
            </span>
          </div>
          <div className="p-2 rounded bg-slate-50">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">Daily Burn Avg</span>
            <span className="text-xs font-bold text-slate-800 font-mono">
              ${(forecastSummary.burn_rate_daily || 0).toLocaleString()}/day
            </span>
          </div>
        </div>
      )}
    </section>
  );
};
