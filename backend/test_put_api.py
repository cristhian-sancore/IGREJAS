import httpx
import asyncio

async def test_put_n8n():
    url = "http://localhost:8000/admin/config/users"
    # Precisamos de um token válido se estivermos testando com auth.
    # Mas como estou rodando localmente, posso tentar ver se ele me dá 401 ou 422.
    # Se der 422, o problema é o schema.
    
    payload = {
        "base_url": "https://n8n.cristhiansancore.com.br",
        "api_key": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MWNjOWQ2NC1kNWI5LTQzN2EtYTcwNi01MTlkMGIyMjZlYzAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzcxNjM4ODUwfQ.U4KK5wibYWDTm40EpB2N_bP5v202orjDlCInxfJHkjQ",
        "is_enabled": 1
    }
    
    async with httpx.AsyncClient() as client:
        try:
            # Testar GET
            resp = await client.get(url)
            print(f"GET Status: {resp.status_code}")
            print(f"GET Body: {resp.text}")
        except Exception as e:
            print(f"Erro GET: {e}")

if __name__ == "__main__":
    asyncio.run(test_put_n8n())
