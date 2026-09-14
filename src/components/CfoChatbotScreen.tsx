import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Bot,
  Send,
  User,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Loader2,
  Trash2,
  DollarSign,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { ChatMessage, ForecastSummary } from '../types';

interface CfoChatbotScreenProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isThinking: boolean;
  forecastSummary: ForecastSummary | null;
  onClearChat: () => void;
  initialPrompt?: string | null;
  onClearInitialPrompt?: () => void;
  hasGeminiKey?: boolean;
}

const STRATEGY_CHIPS = [
  'How can we avoid the cash deficit without taking expensive debt?',
  'Can we afford to hire an engineer at $5,000/month starting next week?',
  'What happens if our top client delays invoice payment by 14 days?',
  'Draft a professional 14-day payment plan email for our main vendor.',
  'Should we offer clients a 2% early-pay discount to accelerate cash?',
  'Evaluate securing a $10,000 line of credit at 8% APR for working capital.',
];

export const CfoChatbotScreen: React.FC<CfoChatbotScreenProps> = ({
  messages,
  onSendMessage,
  isThinking,
  forecastSummary,
  onClearChat,
  initialPrompt,
  onClearInitialPrompt,
  hasGeminiKey = true,
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // If navigated here with an initial prompt
  useEffect(() => {
    if (initialPrompt) {
      setInputValue(initialPrompt);
      if (onClearInitialPrompt) onClearInitialPrompt();
      inputRef.current?.focus();
    }
  }, [initialPrompt, onClearInitialPrompt]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isThinking) return;
    onSendMessage(inputValue.trim());
    setInputValue('');
  };

  const handleChipClick = (chip: string) => {
    setInputValue(chip);
    inputRef.current?.focus();
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
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[580px] bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Pinned Financial Context Bar */}
      <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">AI CFO Strategic Advisor</h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/20 text-blue-300 border border-blue-400/30">
                <Sparkles className="w-2.5 h-2.5" />
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Anchored with live 30-day Prophet time-series financial metrics
            </p>
          </div>
        </div>

        {/* Live Context Pills */}
        <div className="flex items-center gap-2 text-xs">
          {forecastSummary ? (
            <>
              <div className="bg-slate-800/90 px-2.5 py-1 rounded-md border border-slate-700 flex items-center gap-1.5">
                <DollarSign className="w-3 h-3 text-blue-400" />
                <span className="text-slate-400">Starting:</span>
                <span className="font-mono font-bold">${forecastSummary.starting_balance.toLocaleString()}</span>
              </div>
              <div className={`px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${
                forecastSummary.lowest_cash_floor < 0
                  ? 'bg-rose-950/60 border-rose-700 text-rose-300'
                  : 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
              }`}>
                {forecastSummary.lowest_cash_floor < 0 ? (
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                ) : (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                )}
                <span>Floor:</span>
                <span className="font-mono font-bold">${forecastSummary.lowest_cash_floor.toLocaleString()}</span>
              </div>
              <div className="bg-slate-800/90 px-2.5 py-1 rounded-md border border-slate-700 hidden sm:flex items-center gap-1.5">
                <TrendingDown className="w-3 h-3 text-amber-400" />
                <span className="text-slate-400">Burn:</span>
                <span className="font-mono font-bold">${forecastSummary.burn_rate_daily.toLocaleString()}/day</span>
              </div>
            </>
          ) : (
            <div className="text-xs text-amber-300 bg-amber-950/50 px-2.5 py-1 rounded border border-amber-800/60 flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3" />
              <span>No Forecast Data Loaded</span>
            </div>
          )}

          {messages.length > 0 && (
            <button
              onClick={onClearChat}
              title="Clear chat history"
              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors ml-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Chat Messages Scrollable Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/60">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-lg mx-auto text-slate-500">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-3 shadow-2xs">
              <Bot className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Meet Your AI Fractional CFO</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              I analyze your Prophet forecast to evaluate strategic decisions, working capital adjustments, hiring feasibility, and debt timing. Ask any financial question or choose a prompt below.
            </p>

            {/* Starter chips */}
            <div className="w-full space-y-1.5 text-left">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Suggested Financial Prompts:
              </span>
              {STRATEGY_CHIPS.slice(0, 4).map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChipClick(chip)}
                  className="w-full text-xs text-left p-2.5 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-slate-700 hover:text-blue-700 transition-colors flex items-center justify-between group cursor-pointer shadow-2xs"
                >
                  <span>{chip}</span>
                  <Sparkles className="w-3 h-3 text-slate-300 group-hover:text-blue-500 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${msg.role === 'user' ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
            >
              {msg.role === 'ai' && (
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Bot className="w-4 h-4 text-blue-400" />
                </div>
              )}

              <div
                className={`rounded-xl p-4 text-xs leading-relaxed max-w-2xl shadow-2xs ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white font-medium'
                    : 'bg-white text-slate-800 border border-slate-200/80'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-2 pb-1.5 border-b border-black/5 dark:border-white/10">
                  <span className={`text-[11px] font-bold ${msg.role === 'user' ? 'text-blue-100' : 'text-slate-900'}`}>
                    {msg.role === 'user' ? 'You' : 'AI CFO Advisor'}
                  </span>
                  <div className="flex items-center gap-2">
                    {msg.badge && renderBadge(msg.badge)}
                    <span className={`text-[10px] ${msg.role === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                      {msg.timestamp}
                    </span>
                  </div>
                </div>

                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="markdown-body space-y-2 prose prose-slate max-w-none text-xs">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {isThinking && (
          <div className="flex gap-3 max-w-md mr-auto">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-blue-400" />
            </div>
            <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-2xs flex items-center gap-2.5 text-xs text-slate-600">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>Analyzing Prophet forecast and drafting CFO recommendation...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Chips Bar */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-200/80 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
          Quick Ask:
        </span>
        {STRATEGY_CHIPS.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleChipClick(chip)}
            className="px-2.5 py-1 rounded-md bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 text-[11px] whitespace-nowrap transition-colors cursor-pointer shadow-2xs"
          >
            {chip.slice(0, 38)}...
          </button>
        ))}
      </div>

      {/* Chat Input Bar */}
      <div className="p-4 bg-white border-t border-slate-200 shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask your AI CFO anything (e.g., 'How can we avoid the Day 14 payroll deficit?')"
            disabled={isThinking}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isThinking || !inputValue.trim()}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            {isThinking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>Send</span>
          </button>
        </form>

        <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
          <span>Powered by Gemini 3.8 Flash via Google GenAI SDK</span>
          <span>Tip: Shift+Enter or Enter to send</span>
        </div>
      </div>
    </div>
  );
};
