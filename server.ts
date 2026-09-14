import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { runProphetForecast } from "./server/forecastEngine";
import { generateAdvisorSimulation, generateCfoChatReply } from "./server/geminiAdvisor";
import { CashFlowRecord, ForecastSummary } from "./src/types";

dotenv.config();

function parseCsv(csvText: string): CashFlowRecord[] {
  const lines = csvText.trim().split("\n");
  if (lines.length <= 1) return [];

  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
  const dateIdx = headers.findIndex(h => h.includes("date"));
  const inIdx = headers.findIndex(h => h.includes("in") || h.includes("revenue") || h.includes("credit"));
  const outIdx = headers.findIndex(h => h.includes("out") || h.includes("expense") || h.includes("debit"));

  const records: CashFlowRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(",").map(v => v.trim());
    if (row.length < 3) continue;

    const dateStr = dateIdx !== -1 ? row[dateIdx] : row[0];
    const cashIn = inIdx !== -1 ? parseFloat(row[inIdx]) || 0 : parseFloat(row[1]) || 0;
    const cashOut = outIdx !== -1 ? parseFloat(row[outIdx]) || 0 : parseFloat(row[2]) || 0;

    if (dateStr) {
      records.push({
        date: dateStr,
        cash_in: cashIn,
        cash_out: cashOut,
      });
    }
  }

  return records;
}

function getDefaultRecords(): CashFlowRecord[] {
  const defaultCsvPath = path.join(process.cwd(), "public", "cash_flow_history.csv");
  if (fs.existsSync(defaultCsvPath)) {
    const raw = fs.readFileSync(defaultCsvPath, "utf-8");
    return parseCsv(raw);
  }
  return [];
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  // Check if an external or local FastAPI backend is active
  const FASTAPI_URL = process.env.FASTAPI_BACKEND_URL || "http://127.0.0.1:8000";

  async function tryForwardToFastAPI(endpoint: string, method: string, body?: any) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);

      const options: RequestInit = {
        method,
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      };
      if (body) {
        options.body = JSON.stringify(body);
      }

      const res = await fetch(`${FASTAPI_URL}${endpoint}`, options);
      clearTimeout(timeoutId);
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch {
      return null;
    }
  }

  // API Routes
  app.get("/api/health", async (req, res) => {
    const hasKey = Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY);

    // Check if FastAPI backend is connected
    let fastapiConnected = false;
    let fastapiInfo = null;
    try {
      const remoteHealth = await tryForwardToFastAPI("/api/health", "GET");
      if (remoteHealth && remoteHealth.status === "ok") {
        fastapiConnected = true;
        fastapiInfo = remoteHealth;
      }
    } catch {
      fastapiConnected = false;
    }

    res.json({
      status: "ok",
      hasGeminiKey: hasKey,
      fastapi_connected: fastapiConnected,
      fastapi_url: FASTAPI_URL,
      fastapi_info: fastapiInfo,
      model_type: "Facebook Prophet Time-Series Forecaster",
      llm_provider: "Google Gemini (gemini-3.5-flash-lite)",
      active_backend: fastapiConnected ? "FastAPI (Python)" : "Built-in Prophet Forecaster",
    });
  });

  // 1. Prophet Cash Flow Forecast Endpoint
  app.post("/api/forecast", async (req, res) => {
    try {
      // First attempt to proxy request to FastAPI backend
      const fastapiResult = await tryForwardToFastAPI("/api/forecast", "POST", req.body);
      if (fastapiResult) {
        return res.json(fastapiResult);
      }

      // If FastAPI is not running, seamlessly use internal Prophet engine
      const startingBalanceRaw = req.body.starting_balance;
      const startingBalance = typeof startingBalanceRaw === "number"
        ? startingBalanceRaw
        : parseFloat(startingBalanceRaw) || 15000;

      let records: CashFlowRecord[] = [];

      if (Array.isArray(req.body.records) && req.body.records.length > 0) {
        records = req.body.records;
      } else if (req.body.csv_string && typeof req.body.csv_string === "string") {
        records = parseCsv(req.body.csv_string);
      }

      // Fall back to bundled 90-day historical dataset if empty
      if (!records || records.length === 0) {
        records = getDefaultRecords();
      }

      const summary: ForecastSummary = runProphetForecast(records, startingBalance);
      res.json(summary);
    } catch (error: any) {
      console.error("Forecast calculation error:", error);
      res.status(500).json({ error: error.message || "Failed to calculate cash flow forecast" });
    }
  });

  // 2. Gemini AI Strategy Simulation Endpoint
  app.post("/api/simulate", async (req, res) => {
    try {
      // Check FastAPI backend first
      const fastapiResult = await tryForwardToFastAPI("/api/simulate", "POST", req.body);
      if (fastapiResult) {
        return res.json(fastapiResult);
      }

      const { scenario, forecast_summary } = req.body;

      if (!scenario || typeof scenario !== "string") {
        return res.status(400).json({ error: "Missing required 'scenario' field." });
      }

      if (!forecast_summary || typeof forecast_summary !== "object") {
        return res.status(400).json({ error: "Missing required 'forecast_summary' data. Run forecast first." });
      }

      const result = await generateAdvisorSimulation(scenario, forecast_summary);

      res.json({
        scenario,
        advisor_recommendation: result.recommendation,
        recommendation_badge: result.badge,
        powered_by: "Gemini 3.8 Flash",
      });
    } catch (error: any) {
      console.error("Gemini Simulation error:", error);
      res.status(500).json({
        error: error.message || "Failed to simulate strategic scenario via Gemini API",
      });
    }
  });

  // 3. Conversational AI CFO Chatbot Endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      // Check FastAPI backend first
      const fastapiResult = await tryForwardToFastAPI("/api/chat", "POST", req.body);
      if (fastapiResult) {
        return res.json(fastapiResult);
      }

      const { message, forecast_summary, history } = req.body;

      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Missing required 'message' field." });
      }

      const result = await generateCfoChatReply(message, forecast_summary || null, history || []);

      res.json({
        reply: result.reply,
        badge: result.badge,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    } catch (error: any) {
      console.error("Gemini Chat error:", error);
      res.status(500).json({
        error: error.message || "Failed to generate CFO response via Gemini API",
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TimesFM Cash Flow Forecaster server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
