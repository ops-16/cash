import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, User, AlertCircle, CheckCircle2, XCircle, HelpCircle, Loader2 } from 'lucide-react';
import { ChatMessage, ForecastSummary } from '../types';

interface StrategySimulatorCardProps {
  messages: ChatMessage[];
  onSimulate: (scenario: string) => Promise<void>;
  isSimulating: boolean;
  forecastSummary: ForecastSummary | null;
}

const PRESET_SCENARIOS = [
  'What if sales drop 20% due to market slowdown?',
  'What if we secure a $10,000 credit line at day 10?',
  'What if client receivables are delayed by 14 days?',
  'Can we hire 2 engineers at $5,000/month starting next week?',
];

export const StrategySimulatorCard: React.FC<StrategySimulatorCardProps> = ({
  messages,
  onSimulate,
  isSimulating,
  forecastSummary,
}) => {
  const [inputValue, setInputValue] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isSimulating]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isSimulating) return;
    onSimulate(inputValue.trim());
    setInputValue('');
  };

  const handleSelectPreset = (preset: string) => {
    setInputValue(preset);
  };

  const renderBadge = (badge?: string) => {
    switch (badge) {
      case 'APPROVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            APPROVE
          </span>
        );
      case 'REJECT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3 h-3 text-rose-600" />
            REJECT
          </span>
        );
      case 'MODIFY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            MODIFY
          </span>
        );
      case 'CAUTION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <HelpCircle className="w-3 h-3 text-amber-600" />
            CAUTION
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <section className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs" id="strategy-simulator-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 mb-4 gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Bot className="w-4 h-4 text-blue-600" />
            AI Strategy Simulator
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Test "what-if" strategic SME decisions against the 30-day runway forecast using Gemini
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
            Gemini CFO Advisor
          </span>
        </div>
      </div>

      {/* Preset scenario prompt chips */}
      <div className="mb-3">
        <span className="text-[11px] font-semibold text-slate-500 block mb-1.5 uppercase tracking-wider">
          Suggested Scenarios:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_SCENARIOS.map((scenario, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPreset(scenario)}
              className="text-xs px-2.5 py-1 rounded-md bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 transition-colors text-left cursor-pointer"
            >
              {scenario}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Box Container (id="chatBox") */}
      <div
        id="chatBox"
        ref={chatContainerRef}
        className="chat-box h-[280px] overflow-y-auto border border-slate-200 rounded-lg p-3.5 bg-slate-50/70 mb-3 space-y-3"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400">
            <Sparkles className="w-8 h-8 text-blue-400/80 mb-2" />
            <p className="text-xs font-semibold text-slate-700">No Simulations Executed</p>
            <p className="text-[11px] text-slate-500 max-w-sm mt-1">
              Enter a what-if scenario below (e.g. sales drops, delayed client receivables, equipment purchase, or credit lines) to receive executive CFO recommendations.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`msg p-3.5 rounded-lg text-sm ${
                msg.role === 'user'
                  ? 'user bg-blue-50 border border-blue-100 text-blue-950 ml-6'
                  : 'ai bg-white border border-slate-200 shadow-2xs text-slate-800 mr-6'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-200/50">
                <div className="flex items-center gap-1.5">
                  {msg.role === 'user' ? (
                    <>
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                        <User className="w-3 h-3" />
                      </div>
                      <strong className="text-xs font-semibold text-blue-900">You</strong>
                    </>
                  ) : (
                    <>
                      <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">
                        <Bot className="w-3 h-3 text-blue-400" />
                      </div>
                      <strong className="text-xs font-semibold text-slate-900">AI CFO Advisor</strong>
                      <span className="text-[10px] text-slate-500 font-normal">(Gemini 3.8 Flash)</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {msg.badge && renderBadge(msg.badge)}
                  <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                </div>
              </div>

              <div className="whitespace-pre-wrap leading-relaxed text-xs text-slate-800">
                {msg.content}
              </div>
            </div>
          ))
        )}

        {isSimulating && (
          <div className="msg ai p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs mr-6 flex items-center gap-3">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
            <span className="text-xs text-slate-600 font-medium">
              Gemini AI CFO is evaluating runway impacts and strategic risk...
            </span>
          </div>
        )}
      </div>

      {/* Input row (id="scenarioInput", button with "Simulate Scenario") */}
      <form onSubmit={handleSubmit} className="chat-input-row flex gap-2">
        <input
          type="text"
          id="scenarioInput"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="e.g., What if sales drop 20% or we secure a $10,000 credit line?"
          disabled={isSimulating}
          className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isSimulating || !inputValue.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
        >
          {isSimulating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          <span>Simulate Scenario</span>
        </button>
      </form>

      {!forecastSummary && (
        <p className="text-[11px] text-amber-600 mt-2 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          Tip: Run the TimesFM forecast first to provide liquidity metrics to the AI CFO.
        </p>
      )}
    </section>
  );
};
