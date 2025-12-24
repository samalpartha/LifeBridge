import google.generativeai as genai
import os

api_key = os.environ.get("GOOGLE_API_KEY")
if not api_key:
    # Try reading from .env manually if not in env
    try:
        with open(".env", "r") as f:
            for line in f:
                if line.startswith("GOOGLE_API_KEY="):
                    api_key = line.strip().split("=", 1)[1]
                    break
    except:
        pass

print(f"Key found: {api_key[:5]}..." if api_key else "Key NOT found")

genai.configure(api_key=api_key)

print("Listing models...")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")
except Exception as e:
    print(f"Error: {e}")
