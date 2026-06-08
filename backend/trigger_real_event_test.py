import asyncio
import os
import sys
from datetime import datetime

# Ajustar PYTHONPATH
sys.path.append(os.getcwd())
sys.stdout.reconfigure(encoding='utf-8')

from app.services.automation import check_events, trigger_webhooks, get_template
from app.database import fdb, DB_PATH, DB_USER, DB_PASS

async def simulate_event_reminder_for_phone(target_phone: str):
    print(f"Buscando eventos de hoje para enviar para {target_phone}...")
    
    today_str = datetime.now().strftime('%Y-%m-%d')
    conn = fdb.connect(host='localhost', database=DB_PATH.split(':')[-1], user=DB_USER, password=DB_PASS, charset='UTF8')
    cur = conn.cursor()
    
    try:
        sql = "SELECT TITLE, EVENT_DATE, DESCRIPTION, IMAGE_URL, IMAGE_BASE64 FROM EVENTS WHERE CAST(EVENT_DATE AS DATE) = ?"
        cur.execute(sql, (today_str,))
        events = cur.fetchall()
        
        if not events:
            print("Nenhum evento encontrado para hoje.")
            return

        # Busca o template EVENT (Lembrete do Dia)
        template = get_template("EVENT", "📢 *Lembrete de Evento Hoje!* \n\n📌 *{title}* \n⏰ Horário: {time} \n\nNão perca! Com o amor de Cristo.")
        
        from app.services.automation import send_evolution_api, send_evolution_media
        
        for e in events:
            title, date, desc, img_url, img_blob = e
            time_str = date.strftime('%H:%M') if date else "00:00"
            
            # Formata a mensagem com os dados REAIS do evento
            # Se o usuário usa {description}, o format vai preencher com o desc real
            try:
                msg = template.format(
                    title=title, 
                    time=time_str, 
                    description=(desc if desc else ""),
                    date=date.strftime('%d/%m/%Y')
                )
            except KeyError as ex:
                print(f"Erro no template: Variável {ex} não encontrada. Usando mensagem padrão.")
                msg = f"Lembrete: {title} hoje às {time_str}. {desc}"

            print(f"Mensagem formatada:\n{msg}\n")
            
            # Escolhe se envia com imagem ou texto puro
            img_base64 = img_blob
            if hasattr(img_blob, 'read'):
                img_data = img_blob.read()
                if isinstance(img_data, bytes):
                    img_base64 = img_data.decode('utf-8')
                else:
                    img_base64 = img_data
            
            final_media = img_base64 if img_base64 else img_url

            if final_media:
                print("Enviando como Mídia...")
                await send_evolution_media(target_phone, msg, final_media)
            else:
                print("Enviando como Texto...")
                await send_evolution_api(target_phone, msg)
                
            print(f"✅ Enviado para {target_phone}!")

    except Exception as ex:
        print(f"Erro: {ex}")
    finally:
        conn.close()

if __name__ == "__main__":
    # Telefone do usuário para o teste real
    phone = "5565996772226"
    asyncio.run(simulate_event_reminder_for_phone(phone))
