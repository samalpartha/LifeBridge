import asyncio
import httpx

async def test_search():
    base_url = "http://localhost:8000"
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # 1. Test Name Search
        print("\n--- Testing Name Search: 'Smith Law' ---")
        try:
            resp = await client.get(f"{base_url}/attorneys/search", params={"query": "Smith Law"})
            if resp.status_code == 200:
                data = resp.json()
                results = data.get("results", [])
                print(f"Found {len(results)} results")
                for r in results[:1]:
                    print(f"Name: {r.get('name')}")
                    print(f"Firm: {r.get('firm')}")
                    print(f"Email: {r.get('email')}")
                    print(f"Phone: {r.get('phone')}")
            else:
                print(f"Error: {resp.text}")
        except Exception as e:
            print(f"Failed: {e}")

        # 2. Test ZIP Search (Regression)
        print("\n--- Testing ZIP Search: '90210' ---")
        try:
            resp = await client.get(f"{base_url}/attorneys/search", params={"zip": "90210"})
            if resp.status_code == 200:
                print(f"Success. Location: {resp.json().get('location_city')}")
            else:
                print(f"Error: {resp.text}")
        except Exception as e:
            print(f"Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_search())
