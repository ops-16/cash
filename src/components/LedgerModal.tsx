import React, { useState } from 'react';
import { X, Download, ArrowUpRight, ArrowDownRight, Search } from 'lucide-react';
import { LedgerDay } from '../types';

interface LedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  ledger: LedgerDay[];
  startingBalance: number;
}

export const LedgerModal: React.FC<LedgerModalProps> = ({
  isOpen,
  onClose,
  ledger,
  startingBalance,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filtered = ledger.filter((item) =>
    item.date.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCsv = () => {
    const headers = ['Date', 'Projected Inflow ($)', 'Projected Outflow ($)', 'Ending Balance ($)'];
    const rows = ledger.map((d) => [
      d.date,
      d.inflow.toFixed(2),
      d.outflow.toFixed(2),
      d.ending_balance.toFixed(2),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `prophet_forecast_ledger_30d.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-base font-bold text-slate-900">30-Day Daily Forecast Ledger</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Day-by-day projected cash movements starting at ${startingBalance.toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Export CSV
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="px-6 py-3 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by date (YYYY-MM-DD)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto px-6 py-2">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-white border-b border-slate-200 text-slate-600 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5">Date</th>
                <th className="py-2.5 text-right">Inflow ($)</th>
                <th className="py-2.5 text-right">Outflow ($)</th>
                <th className="py-2.5 text-right">Net Daily ($)</th>
                <th className="py-2.5 text-right">Ending Balance ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filtered.map((day, idx) => {
                const net = Math.round((day.inflow - day.outflow) * 100) / 100;
                const isNegative = day.ending_balance < 0;
                return (
                  <tr key={idx} className={`hover:bg-slate-50/80 ${isNegative ? 'bg-rose-50/40' : ''}`}>
                    <td className="py-2.5 text-slate-900 font-sans font-medium">{day.date}</td>
                    <td className="py-2.5 text-right text-emerald-600">
                      +{day.inflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 text-right text-rose-600">
                      -{day.outflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`py-2.5 text-right font-semibold ${net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {net >= 0 ? '+' : ''}
                      {net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td
                      className={`py-2.5 text-right font-bold ${
                        isNegative ? 'text-red-600' : 'text-slate-900'
                      }`}
                    >
                      ${day.ending_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex justify-between items-center">
          <span>Showing {filtered.length} of {ledger.length} days</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
