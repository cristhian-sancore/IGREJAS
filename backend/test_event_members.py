import asyncio
import sys
import os

# Ajustar PYTHONPATH para encontrar o pacote app
sys.path.append(os.getcwd())

from app.services.automation import check_events

async def test_member_notification():
    # Configurar sys.stdout para UTF-8 no Windows para evitar erros de encoding
    if sys.platform == "win32":
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

    print("--- Iniciando Teste de Notificação de Eventos para Membros ---")
    
    # Criar um evento para hoje via banco de dados para garantir que o teste funcione
    import fdb
    from app.database import DB_PATH, DB_USER, DB_PASS
    from datetime import datetime

    db_name = DB_PATH.split(':')[-1]
    conn = fdb.connect(host='localhost', database=db_name, user=DB_USER, password=DB_PASS, charset='UTF8')
    cur = conn.cursor()
    
    try:
        # 1. Verificar se existem membros
        cur.execute("SELECT COUNT(*) FROM MEMBERS WHERE IS_ACTIVE = 1")
        count = cur.fetchone()[0]
        print(f"Total de membros ativos: {count}")
        
        if count == 0:
            print("AVISO: Nenhum membro ativo encontrado. O teste não enviará nada.")
        
        # 2. Criar ou atualizar um evento para HOJE
        today = datetime.now().strftime('%Y-%m-%d')
        cur.execute("SELECT ID FROM EVENTS WHERE CAST(EVENT_DATE AS DATE) = ?", (today,))
        event_exists = cur.fetchone()
        
        if not event_exists:
            print("Criando evento de teste com IMAGEM para hoje...")
            # Um pixel vermelho em base64 para teste
            pixel_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
            cur.execute("""
                INSERT INTO EVENTS (TITLE, DESCRIPTION, EVENT_DATE, IS_PUBLIC, IMAGE_BASE64) 
                VALUES (?, ?, ?, ?, ?)
            """, ("Evento com Imagem Hoje", "Teste de envio de imagem.", f"{today} 19:30:00", 1, pixel_base64))
            conn.commit()
        else:
            # Forçar uma imagem no evento existente para o teste
            cur.execute("UPDATE EVENTS SET IMAGE_BASE64 = ? WHERE CAST(EVENT_DATE AS DATE) = ?", 
                        ("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", today))
            conn.commit()
            print("Evento hoje atualizado com imagem para teste.")
            
        # 3. Disparar a verificação
        await check_events()
        print("\n--- Teste concluído! Verifique os logs e o WhatsApp. ---")
        
    except Exception as e:
        print(f"Erro no teste: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    asyncio.run(test_member_notification())
