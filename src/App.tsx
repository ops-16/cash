import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { CashProblemInvestigator } from './components/CashProblemInvestigator';
import { CfoChatbotScreen } from './components/CfoChatbotScreen';
import { LedgerModal } from './components/LedgerModal';
import { CashFlowRecord, ForecastSummary, ChatMessage, ChatHistoryItem } from './types';
import { AlertCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'investigator' | 'chatbot'>('investigator');
  const [startingBalance, setStartingBalance] = useState<number>(15000);
  const [fileName, setFileName] = useState<string | null>(null);
  const [records, setRecords] = useState<CashFlowRecord[]>([]);
  const [recordCount, setRecordCount] = useState<number>(0);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [forecastSummary, setForecastSummary] = useState<ForecastSummary | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState<boolean>(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(true);
  const [fastapiConnected, setFastapiConnected] = useState<boolean>(false);
  const [initialChatPrompt, setInitialChatPrompt] = useState<string | null>(null);

  // Parse raw CSV text
  const parseCsvText = (csvText: string): CashFlowRecord[] => {
    const lines = csvText.trim().split('\n');
    if (lines.length <= 1) return [];

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const dateIdx = headers.findIndex((h) => h.includes('date'));
    const inIdx = headers.findIndex(
      (h) => h.includes('in') || h.includes('revenue') || h.includes('credit')
    );
    const outIdx = headers.findIndex(
      (h) => h.includes('out') || h.includes('expense') || h.includes('debit')
    );

    const parsed: CashFlowRecord[] = [];
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map((v) => v.trim());
      if (row.length < 3) continue;

      const dateStr = dateIdx !== -1 ? row[dateIdx] : row[0];
      const cashIn = inIdx !== -1 ? parseFloat(row[inIdx]) || 0 : parseFloat(row[1]) || 0;
      const cashOut = outIdx !== -1 ? parseFloat(row[outIdx]) || 0 : parseFloat(row[2]) || 0;

      if (dateStr) {
        parsed.push({
          date: dateStr,
          cash_in: cashIn,
          cash_out: cashOut,
        });
      }
    }
    return parsed;
  };

  // Run forecast API call with Facebook Prophet engine
  const executeForecast = useCallback(
    async (balanceToUse: number, datasetRecords?: CashFlowRecord[]) => {
      setIsLoading(true);
      setErrorBanner(null);

      try {
        const payload: { starting_balance: number; records?: CashFlowRecord[] } = {
          starting_balance: balanceToUse,
        };

        const activeRecords = datasetRecords || records;
        if (activeRecords.length > 0) {
          payload.records = activeRecords;
        }

        const res = await fetch('/api/forecast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Forecast failed (${res.status})`);
        }

        const data: ForecastSummary = await res.json();
        setForecastSummary(data);
      } catch (err: any) {
        console.error('Forecast error:', err);
        setErrorBanner(err.message || 'Failed to execute Prophet cash flow forecast.');
      } finally {
        setIsLoading(false);
      }
    },
    [records]
  );

  // Load sample dataset
  const loadSampleDataset = useCallback(async () => {
    try {
      const response = await fetch('/cash_flow_history.csv');
      if (!response.ok) throw new Error('Could not fetch sample CSV');
      const text = await response.text();
      const parsed = parseCsvText(text);
      setRecords(parsed);
      setRecordCount(parsed.length);
      setFileName('cash_flow_history.csv (Sample 90 Days)');
      // Auto run Prophet forecast on initial load
      executeForecast(startingBalance, parsed);
    } catch (err: any) {
      console.warn('Could not load sample CSV automatically:', err);
      executeForecast(startingBalance);
    }
  }, [executeForecast, startingBalance]);

  // Initial load & health check
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setHasGeminiKey(Boolean(data.hasGeminiKey));
        setFastapiConnected(Boolean(data.fastapi_connected));
      })
      .catch((err) => console.warn('Health check error:', err));

    loadSampleDataset();
  }, [loadSampleDataset]);

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = parseCsvText(text);
      if (parsed.length === 0) {
        setErrorBanner('Uploaded file contained no valid date/cash_in/cash_out records.');
        return;
      }
      setRecords(parsed);
      setRecordCount(parsed.length);
      setFileName(file.name);
      setErrorBanner(null);

      // Re-run forecast with uploaded dataset
      executeForecast(startingBalance, parsed);
    } catch (err: any) {
      setErrorBanner(`Error reading CSV: ${err.message}`);
    }
  };

  // Send message to AI CFO Chatbot
  const handleSendMessage = async (text: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);
    setErrorBanner(null);

    // Format chat history for Gemini API
    const historyPayload: ChatHistoryItem[] = messages.map((m) => ({
      role: m.role === 'ai' ? 'model' : 'user',
      text: m.content,
    }));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          forecast_summary: forecastSummary,
          history: historyPayload,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Chat request failed (${res.status})`);
      }

      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        content: data.reply,
        badge: data.badge,
        timestamp: data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        role: 'ai',
        content: `Error consulting AI CFO: ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        badge: 'CAUTION',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  // Switch to Chat Screen from Investigator with pre-filled question
  const handleSwitchToChat = (prompt?: string) => {
    if (prompt) {
      setInitialChatPrompt(prompt);
    }
    setActiveTab('chatbot');
  };

  const hasCriticalDeficit = Boolean(forecastSummary?.runs_out_of_cash);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLoadSampleData={loadSampleDataset}
        hasGeminiKey={hasGeminiKey}
        hasCriticalDeficit={hasCriticalDeficit}
        messageCount={messages.length}
        fastapiConnected={fastapiConnected}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5">
        {/* Error notification banner */}
        {errorBanner && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorBanner}</span>
            </div>
            <button
              onClick={() => setErrorBanner(null)}
              className="text-rose-600 hover:text-rose-800 font-bold ml-3 cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {/* Screen 1: Cash Problem Investigator */}
        {activeTab === 'investigator' && (
          <CashProblemInvestigator
            startingBalance={startingBalance}
            setStartingBalance={(val) => {
              setStartingBalance(val);
              executeForecast(val);
            }}
            fileName={fileName}
            recordCount={recordCount}
            onFileUpload={handleFileUpload}
            onRunForecast={() => executeForecast(startingBalance)}
            isLoading={isLoading}
            forecastSummary={forecastSummary}
            onOpenLedger={() => setIsLedgerModalOpen(true)}
            onSwitchToChat={handleSwitchToChat}
          />
        )}

        {/* Screen 2: Dedicated AI CFO Chatbot Screen */}
        {activeTab === 'chatbot' && (
          <CfoChatbotScreen
            messages={messages}
            onSendMessage={handleSendMessage}
            isThinking={isThinking}
            forecastSummary={forecastSummary}
            onClearChat={() => setMessages([])}
            initialPrompt={initialChatPrompt}
            onClearInitialPrompt={() => setInitialChatPrompt(null)}
            hasGeminiKey={hasGeminiKey}
          />
        )}
      </main>

      {/* 30-Day Daily Ledger Table Modal */}
      {forecastSummary && (
        <LedgerModal
          isOpen={isLedgerModalOpen}
          onClose={() => setIsLedgerModalOpen(false)}
          ledger={forecastSummary.daily_ledger}
          startingBalance={forecastSummary.starting_balance}
        />
      )}
    </div>
  );
}
