import asyncio
import httpx

async def test_search(zip_code):
    print(f"Testing Gemini Search for ZIP: {zip_code}")
    base_url = "http://localhost:8000"
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.get(f"{base_url}/attorneys/search", params={"zip": zip_code})
            print(f"Status: {resp.status_code}")
            if resp.status_code == 200:
                data = resp.json()
                print(f"Location: {data.get('location_city')}, {data.get('location_state')}")
                results = data.get("results", [])
                print(f"Found {len(results)} results")
                for r in results[:5]:
                    print(f" - {r.get('name')} | {r.get('firm')} | Src: {r.get('source')}")
            else:
                print(f"Error: {resp.text}")
        except Exception as e:
            print(f"Connection Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_search("94103")) # San Francisco
