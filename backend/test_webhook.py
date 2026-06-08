import asyncio
import httpx

async def test_webhook():
    url = "https://webhook.cristhiansancore.com.br/webhook-test/NOVO-MEMBRO"
    payload = {
        "event": "manual_test",
        "message": "Teste de integração do Sistema da Igreja ⛪",
        "timestamp": "2026-02-20T20:30:56",
        "system": "Portal de Gestão Firebird"
    }
    
    print(f"Enviando POST para: {url}...")
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, timeout=10.0)
            print(f"Status: {response.status_code}")
            print(f"Resposta do Servidor: {response.text}")
        except Exception as e:
            print(f"Erro ao disparar webhook: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_webhook())
