import os
import sys
import webbrowser

# Ensure the root directory and fastapi_backend are in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

try:
    import uvicorn
except ImportError:
    print("\n[ERROR] 'uvicorn' is not installed in your Python environment.")
    print("Please install requirements first by running:")
    print("    pip install -r requirements.txt\n")
    sys.exit(1)

if __name__ == "__main__":
    port = 8000
    host = "127.0.0.1"
    url = f"http://{host}:{port}"
    
    print("=" * 60)
    print("  Prophet Cash Flow Forecaster & AI CFO (Local Server)")
    print("=" * 60)
    print(f"  * Web Application: {url}")
    print(f"  * API Docs (Swagger): {url}/docs")
    print("=" * 60)
    print("Starting server... Press CTRL+C to stop.")
    
    # Optionally open browser automatically
    try:
        webbrowser.open(url)
    except Exception:
        pass

    uvicorn.run("app.main:app", host=host, port=port, reload=True)
