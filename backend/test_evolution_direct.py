import asyncio
import httpx
import sys
import io

# Forçar saída UTF-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

async def test_evolution_send():
    phone = "5565996772226"
    message = "⛪ *Teste do Sistema da Igreja*\n\nOlá! Este é um teste do motor de envio direto via Evolution API. Se você recebeu esta mensagem, a integração está 100% operacional! 🎉"
    
    # Dados que peguei do banco
    base_url = "https://api.cristhiansancore.com.br"
    api_key = "AD2212E67C7B-4FA0-B71B-9C317BF372EA"
    instance = "postagem"
    
    url = f"{base_url.rstrip('/')}/message/sendText/{instance}"
    headers = {
        "apikey": api_key,
        "Content-Type": "application/json"
    }
    payload = {
        "number": phone,
        "text": message
    }
    
    print(f"Enviando mensagem para {phone} via Evolution API...")
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(url, json=payload, headers=headers, timeout=15.0)
            print(f"Status Code: {resp.status_code}")
            print(f"Resposta: {resp.text}")
            if resp.status_code in [200, 201]:
                print("\n✅ Mensagem enviada com sucesso!")
            else:
                print("\n❌ Falha no envio. Verifique se a instancia esta conectada no celular.")
        except Exception as e:
            print(f"\n❌ Erro de conexão: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_evolution_send())
