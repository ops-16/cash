# FastAPI Backend for Prophet Cash Flow Forecaster & Gemini AI CFO

This folder provides the complete **FastAPI** Python backend implementation.

### Architecture:
- **Web Framework**: FastAPI (`uvicorn[standard]`, `pydantic`)
- **Forecasting Engine**: Facebook Prophet (`prophet`, `pandas`, `numpy`) with additive time-series decomposition ($g(t) + s(t) + h(t) + \epsilon_t$)
- **AI CFO Advisory**: Google Gemini (`google-genai` SDK with `gemini-2.5-flash`)
- **Diagnostic Engine**: Liquidity bottleneck detection, bi-weekly payroll spikes, and 30-day runway deficit warnings.

---

### How to Run 100% with Python (No npm required!):

Because the frontend is pre-built into static assets (`dist/`), **FastAPI can serve both the frontend UI and the backend APIs simultaneously without needing Node.js or npm installed at all!**

1. **Open your terminal and navigate to the project directory:**
   ```bash
   cd fastapi_backend
   ```

2. **Create and activate a Python virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate    # On Windows: venv\Scripts\activate
   ```

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set your Gemini API Key:**
   ```bash
   export GEMINI_API_KEY="your_api_key_here"   # On Windows: set GEMINI_API_KEY="your_api_key_here"
   ```

5. **Launch the FastAPI application:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

6. **Open in Browser:**
   - **Full Application UI**: Open `http://localhost:8000` (Directly served by FastAPI!)
   - **Interactive API Docs (Swagger)**: Open `http://localhost:8000/docs`


### API Endpoints:
- `GET /api/health`: Service status, Prophet status, and Gemini API key check.
- `POST /api/forecast`: 30-day Prophet time-series cash flow forecasting and deficit diagnosis.
- `POST /api/simulate`: Strategic proposal evaluation with APPROVE / REJECT / MODIFY badges.
- `POST /api/chat`: Multi-turn conversational CFO advisory with live financial context.
