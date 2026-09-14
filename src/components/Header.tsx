import React from 'react';
import {
  TrendingUp,
  Sparkles,
  FileSpreadsheet,
  ShieldCheck,
  Search,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'investigator' | 'chatbot';
  setActiveTab: (tab: 'investigator' | 'chatbot') => void;
  onLoadSampleData: () => void;
  hasGeminiKey?: boolean;
  hasCriticalDeficit?: boolean;
  messageCount?: number;
  fastapiConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onLoadSampleData,
  hasGeminiKey = true,
  hasCriticalDeficit = false,
  messageCount = 0,
  fastapiConnected = false,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-sm sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Brand & Title */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Prophet Cash Flow Forecaster
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <Sparkles className="w-2.5 h-2.5 text-blue-600" />
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Facebook Prophet Additive Model • 30-Day Liquidity Diagnostics • AI CFO Advisor
            </p>
          </div>
        </div>

        {/* Screen / View Navigation Tabs */}
        <div className="flex items-center gap-2">
          <nav className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
            <button
              id="tab-investigator-btn"
              onClick={() => setActiveTab('investigator')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'investigator'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Cash Problem Investigator</span>
              {hasCriticalDeficit && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Critical cash deficit detected" />
              )}
            </button>

            <button
              id="tab-chatbot-btn"
              onClick={() => setActiveTab('chatbot')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'chatbot'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>AI CFO Chatbot</span>
              {messageCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-700 font-mono">
                  {messageCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {fastapiConnected ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>FastAPI Connected</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg border border-slate-200" title="FastAPI fallback active; start FastAPI on port 8000 for direct Python bridge">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <span>Prophet Engine Active</span>
            </div>
          )}

          <button
            onClick={onLoadSampleData}
            id="load-sample-dataset-btn"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Reload default 90-day synthetic dataset"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Sample Data</span>
          </button>

          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Gemini Connected</span>
          </div>
        </div>
      </div>
    </header>
  );
};
