import httpx
import asyncio

async def test_full_flow():
    base_url = "http://localhost:8000"
    
    # 1. Login
    async with httpx.AsyncClient() as client:
        login_data = {
            "username": "admin@igreja.com",
            "password": "senha123"
        }
        resp = await client.post(f"{base_url}/public/login", data=login_data)
        if resp.status_code != 200:
            print(f"Login falhou: {resp.text}")
            return
        
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("Login OK!")

        # 2. Testar PUT N8N
        payload = {
            "base_url": "https://n8n.cristhiansancore.com.br",
            "api_key": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MWNjOWQ2NC1kNWI5LTQzN2EtYTcwNi01MTlkMGIyMjZlYzAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzcxNjM4ODUwfQ.U4KK5wibYWDTm40EpB2N_bP5v202orjDlCInxfJHkjQ",
            "is_enabled": 1
        }
        
        resp = await client.put(f"{base_url}/admin/config/n8n", json=payload, headers=headers)
        print(f"PUT N8N Status: {resp.status_code}")
        print(f"PUT N8N Body: {resp.text}")

        # 3. Testar GET Workflows
        resp = await client.get(f"{base_url}/admin/config/n8n/workflows", headers=headers)
        print(f"GET Workflows Status: {resp.status_code}")
        print(f"Workflows: {len(resp.json())} encontrados")

if __name__ == "__main__":
    asyncio.run(test_full_flow())
