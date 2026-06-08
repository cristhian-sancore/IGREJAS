import asyncio
import httpx
import fdb
from app.database import DB_PATH, DB_USER, DB_PASS

async def test_n8n():
    base_url = 'https://n8n.cristhiansancore.com.br'
    # Removendo barras extras se houver
    base_url = base_url.rstrip('/')
    
    api_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MWNjOWQ2NC1kNWI5LTQzN2EtYTcwNi01MTlkMGIyMjZlYzAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzcxNjM4ODUwfQ.U4KK5wibYWDTm40EpB2N_bP5v202orjDlCInxfJHkjQ'
    
    # 1. Testar conexão com a API do n8n
    print(f"Testando conexão com {base_url}...")
    headers = {'X-N8N-API-KEY': api_key}
    
    async with httpx.AsyncClient() as client:
        try:
            # Lista workflows
            resp = await client.get(f'{base_url}/api/v1/workflows', headers=headers, timeout=10)
            print(f"Status: {resp.status_code}")
            if resp.status_code == 200:
                print("Conexão com n8n OK!")
                data = resp.json()
                print(f"Workflows encontrados: {len(data.get('data', []))}")
                
                # 2. Salvar no banco de dados se a conexão funcionou
                db_name = DB_PATH.split(':')[-1]
                conn = fdb.connect(host='localhost', database=db_name, user=DB_USER, password=DB_PASS, charset='UTF8')
                cur = conn.cursor()
                try:
                    cur.execute('UPDATE N8N_CONFIG SET BASE_URL = ?, API_KEY = ?, IS_ENABLED = 1 WHERE ID = 1', (base_url, api_key))
                    conn.commit()
                    print("Configurações salvas no Firebird com sucesso!")
                except Exception as db_e:
                    print(f"Erro ao salvar no banco: {db_e}")
                finally:
                    conn.close()
            else:
                print(f"Erro na API do n8n: {resp.text}")
        except Exception as e:
            print(f"Erro de rede ou timeout: {e}")

if __name__ == "__main__":
    asyncio.run(test_n8n())
