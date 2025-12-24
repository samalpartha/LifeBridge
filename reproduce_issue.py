import requests
import json

API_BASE = "http://localhost:8000"

def list_docs():
    r = requests.get(f"{API_BASE}/documents")
    print(f"List Code: {r.status_code}")
    docs = r.json()
    print(f"Docs count: {len(docs)}")
    return docs

print("--- Initial List ---")
docs = list_docs()
if not docs:
    print("No docs to delete.")
    exit(0)

target_id = docs[0]['id']
print(f"--- Deleting {target_id} ---")
r_del = requests.delete(f"{API_BASE}/documents/{target_id}")
print(f"Delete Code: {r_del.status_code}")
print(f"Delete Resp: {r_del.text}")

print("--- Post-Delete List ---")
docs_after = list_docs()

found = any(d['id'] == target_id for d in docs_after)
if found:
    print("FAILURE: Document resurfaced!")
else:
    print("SUCCESS: Document remained deleted.")
