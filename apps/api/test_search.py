from duckduckgo_search import DDGS
import json

try:
    print("Testing DDGS...")
    results = DDGS().text("US immigration H-1B1 guide", max_results=2)
    print(json.dumps(results, indent=2))
except Exception as e:
    print(f"Error: {e}")
