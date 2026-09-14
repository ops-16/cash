import React, { useRef } from 'react';
import { Upload, DollarSign, Calendar, AlertTriangle, CheckCircle2, Play, RefreshCw } from 'lucide-react';
import { ForecastSummary } from '../types';

interface FinancialSettingsCardProps {
  startingBalance: number;
  setStartingBalance: (val: number) => void;
  fileName: string | null;
  recordCount: number;
  onFileUpload: (file: File) => void;
  onRunForecast: () => void;
  isLoading: boolean;
  forecastSummary: ForecastSummary | null;
}

export const FinancialSettingsCard: React.FC<FinancialSettingsCardProps> = ({
  startingBalance,
  setStartingBalance,
  fileName,
  recordCount,
  onFileUpload,
  onRunForecast,
  isLoading,
  forecastSummary,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isDeficit = forecastSummary?.runs_out_of_cash;

  return (
    <section className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between" id="financial-settings-card">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h2 className="text-base font-semibold text-slate-900">Financial Settings</h2>
          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            Context: 60d | Horizon: 30d
          </span>
        </div>

        {/* Starting Balance Input */}
        <div className="mb-4">
          <label htmlFor="startBalance" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Starting Balance ($)
          </label>
          <div className="relative rounded-lg shadow-2xs">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <DollarSign className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="number"
              id="startBalance"
              value={startingBalance}
              onChange={(e) => setStartingBalance(Number(e.target.value))}
              step="500"
              className="block w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
              placeholder="15000"
            />
          </div>
          <div className="flex gap-2 mt-2">
            {[10000, 15000, 25000, 50000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setStartingBalance(preset)}
                className={`text-xs px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                  startingBalance === preset
                    ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                ${preset / 1000}k
              </button>
            ))}
          </div>
        </div>

        {/* Historical CSV Upload */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="csvFile" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Upload Historical CSV (Optional)
            </label>
            <span className="text-[11px] text-slate-500">
              {recordCount > 0 ? `${recordCount} records loaded` : 'Using synthetic 90d'}
            </span>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-lg p-3 text-center cursor-pointer transition-colors bg-slate-50/60 hover:bg-blue-50/30"
          >
            <input
              ref={fileInputRef}
              type="file"
              id="csvFile"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Upload className="mx-auto h-5 w-5 text-slate-400 mb-1" />
            <p className="text-xs font-medium text-slate-700">
              {fileName ? fileName : 'Drop CSV here or click to browse'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Requires columns: <code className="text-slate-700">date, cash_in, cash_out</code>
            </p>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 italic">
            Defaults to generated 90-day synthetic CSV if blank
          </p>
        </div>

        {/* Run Button */}
        <button
          onClick={onRunForecast}
          id="forecastBtn"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Running TimesFM Model...</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4 fill-current" />
              <span>Run Prophet Forecast</span>
            </>
          )}
        </button>
      </div>

      {/* Metrics Summary (Matches requested ids) */}
      <div className="mt-5 pt-4 border-t border-slate-200">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Lowest Cash Floor
            </span>
            <span
              id="cashFloor"
              className={`text-lg font-bold tracking-tight block ${
                forecastSummary
                  ? forecastSummary.lowest_cash_floor < 0
                    ? 'text-red-600'
                    : 'text-slate-900'
                  : 'text-slate-400'
              }`}
            >
              {forecastSummary ? formatCurrency(forecastSummary.lowest_cash_floor) : '$0'}
            </span>
            {forecastSummary && (
              <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3" />
                {forecastSummary.lowest_cash_floor_date}
              </span>
            )}
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Status
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              {forecastSummary ? (
                isDeficit ? (
                  <>
                    <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                    <span
                      id="statusBadge"
                      className="text-xs font-bold text-red-600 tracking-tight leading-tight"
                    >
                      DEFICIT RISK: {forecastSummary.cash_out_date}
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span
                      id="statusBadge"
                      className="text-xs font-bold text-emerald-600 tracking-tight"
                    >
                      SURPLUS RUNWAY
                    </span>
                  </>
                )
              ) : (
                <span id="statusBadge" className="text-xs font-semibold text-slate-500">
                  Not Run
                </span>
              )}
            </div>
            {forecastSummary && (
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Net 30d: {forecastSummary.net_change && forecastSummary.net_change >= 0 ? '+' : ''}
                {formatCurrency(forecastSummary.net_change || 0)}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
