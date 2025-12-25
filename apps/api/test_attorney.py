import asyncio
import httpx

async def test_search(zip_code):
    print(f"Testing ZIP: {zip_code}")
    async with httpx.AsyncClient() as client:
        # 1. ZIP
        zip_url = f"https://api.zippopotam.us/us/{zip_code}"
        print(f"Fetching {zip_url}...")
        zip_resp = await client.get(zip_url)
        print(f"ZIP Status: {zip_resp.status_code}")
        if zip_resp.status_code != 200:
            print("ZIP Failed")
            return

        zip_data = zip_resp.json()
        place = zip_data.get("places", [{}])[0]
        city = place.get("place name")
        state = place.get("state abbreviation")
        print(f"Location: {city}, {state}")

        # 2. CourtListener v3
        cl_url = "https://www.courtlistener.com/api/rest/v3/people/"
        params = {
            "attorney": "true", # lowercase might matter
            "q": f"immigration {state}", # Try a broader query
        }
        print(f"Fetching CL {cl_url} with params {params}...")
        cl_resp = await client.get(cl_url, params=params)
        print(f"CL Status: {cl_resp.status_code}")
        if cl_resp.status_code == 200:
            data = cl_resp.json()
            count = data.get("count", 0)
            results = data.get("results", [])
            print(f"Found {count} results")
            for r in results[:3]:
                print(f" - {r.get('name')} ({r.get('party_name')})")
        else:
            print(f"CL Error: {cl_resp.text}")

if __name__ == "__main__":
    asyncio.run(test_search("10001"))
