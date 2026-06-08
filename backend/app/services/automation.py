import httpx
import logging
import asyncio
import random
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.database import fdb, DB_PATH, DB_USER, DB_PASS

# Configuração de Logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AutomationService")

def get_template(event_type: str, default_msg: str) -> str:
    """Busca o template customizado no banco de dados."""
    conn = fdb.connect(host='localhost', database=DB_PATH.split(':')[-1], user=DB_USER, password=DB_PASS, charset='UTF8')
    cur = conn.cursor()
    try:
        cur.execute("SELECT CONTENT FROM WEBHOOK_TEMPLATES WHERE EVENT_TYPE = ?", (event_type,))
        row = cur.fetchone()
        if row:
            return row[0] if isinstance(row[0], str) else row[0].decode('utf-8')
        return default_msg
    except:
        return default_msg
    finally:
        conn.close()

def get_admin_recipients() -> list:
    """Busca a lista de telefones cadastrados para receber notificações administrativas."""
    conn = fdb.connect(host='localhost', database=DB_PATH.split(':')[-1], user=DB_USER, password=DB_PASS, charset='UTF8')
    cur = conn.cursor()
    try:
        cur.execute("SELECT PHONE FROM NOTIFICATION_RECIPIENTS WHERE IS_ACTIVE = 1")
        return [r[0] for r in cur.fetchall() if r[0]]
    except:
        return []
    finally:
        conn.close()

def get_member_phones() -> list:
    """Busca os telefones de todos os membros ativos."""
    conn = fdb.connect(host='localhost', database=DB_PATH.split(':')[-1], user=DB_USER, password=DB_PASS, charset='UTF8')
    cur = conn.cursor()
    try:
        cur.execute("SELECT PHONE FROM MEMBERS WHERE IS_ACTIVE = 1 AND ACCEPTS_NOTIFICATIONS = 1")
        return [r[0] for r in cur.fetchall() if r[0]]
    except:
        return []
    finally:
        conn.close()

def is_automation_enabled(auto_id: str) -> bool:
    """Verifica se uma automação específica está ativa no banco."""
    conn = fdb.connect(host='localhost', database=DB_PATH.split(':')[-1], user=DB_USER, password=DB_PASS, charset='UTF8')
    cur = conn.cursor()
    try:
        cur.execute("SELECT IS_ENABLED FROM AUTOMATIONS WHERE ID = ?", (auto_id,))
        row = cur.fetchone()
        return row[0] == 1 if row else False
    except:
        return False
    finally:
        conn.close()

async def send_evolution_api(phone: str, message: str):
    """Envia mensagem via Evolution API se estiver configurada."""
    if not phone or not message:
        return

    conn = fdb.connect(host='localhost', database=DB_PATH.split(':')[-1], user=DB_USER, password=DB_PASS, charset='UTF8')
    cur = conn.cursor()
    try:
        cur.execute("SELECT BASE_URL, API_KEY, INSTANCE_NAME, IS_ENABLED FROM EVOLUTION_CONFIG WHERE ID = 1")
        row = cur.fetchone()
        if not row or row[3] == 0:
            return # Desativado ou não configurado
        
        base_url, api_key, instance, _ = row
        if not base_url or not api_key or not instance:
            return

        # Limpar telefone (remover + e espaços)
        clean_phone = "".join(filter(str.isdigit, phone))
        # Se não tiver o código do país (55), adicionamos
        if len(clean_phone) <= 11:
            clean_phone = "55" + clean_phone

        url = f"{base_url.rstrip('/')}/message/sendText/{instance}"
        headers = {"apikey": api_key, "Content-Type": "application/json"}
        payload = {"number": clean_phone, "text": message}

        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=payload, headers=headers, timeout=15.0)
            if resp.status_code in [200, 201]:
                logger.info(f"Mensagem enviada via Evolution para {clean_phone}")
            else:
                logger.error(f"Erro Evolution API ({resp.status_code}): {resp.text}")
    except Exception as e:
        logger.error(f"Falha ao enviar via Evolution API: {str(e)}")
    finally:
        conn.close()

async def send_evolution_media(phone: str, message: str, media_url: str):
    """Envia mídia (imagem/vídeo) via Evolution API."""
    if not phone or not media_url:
        return

    conn = fdb.connect(host='localhost', database=DB_PATH.split(':')[-1], user=DB_USER, password=DB_PASS, charset='UTF8')
    cur = conn.cursor()
    try:
        cur.execute("SELECT BASE_URL, API_KEY, INSTANCE_NAME, IS_ENABLED FROM EVOLUTION_CONFIG WHERE ID = 1")
        row = cur.fetchone()
        if not row or row[3] == 0:
            return
        
        base_url, api_key, instance, _ = row
        clean_phone = "".join(filter(str.isdigit, phone))
        if len(clean_phone) <= 11: clean_phone = "55" + clean_phone

        url = f"{base_url.rstrip('/')}/message/sendMedia/{instance}"
        headers = {"apikey": api_key, "Content-Type": "application/json"}
        payload = {
            "number": clean_phone,
            "media": media_url,
            "mediatype": "image",
            "caption": message
        }

        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=payload, headers=headers, timeout=20.0)
            if resp.status_code in [200, 201]:
                logger.info(f"Mídia enviada para {clean_phone}")
            else:
                logger.error(f"Erro Evolution Medida ({resp.status_code}): {resp.text}")
    except Exception as e:
        logger.error(f"Falha ao enviar mídia Evolution: {str(e)}")
    finally:
        conn.close()

async def trigger_webhooks(event_type: str, payload: dict):
    """Dispara webhooks ativos e também tenta envio via Evolution API se houver mensagem."""
    
    # 1. Enviar via Evolution API
    message = payload.get("message")
    image_url = payload.get("image_url")
    image_base64 = payload.get("image_base64")
    
    # Se houver base64 (sem o prefixo data:image/...), usamos ele como prioridade
    final_media = image_base64 if image_base64 else image_url

    if message:
        # Função auxiliar para decidir se envia texto ou mídia
        async def send_adaptive(target: str, msg: str):
            if final_media:
                await send_evolution_media(target, msg, final_media)
            else:
                await send_adaptive_text(target, msg)

        async def send_adaptive_text(target: str, msg: str):
             await send_evolution_api(target, msg)

        # Se houver um 'phone' específico
        target_phone = payload.get("phone")
        if target_phone:
            await send_adaptive(target_phone, message)
        
        # Se for um evento administrativo ou agenda
        if event_type in ["FINANCIAL_TRANSACTION", "EVENT", "EVENT_CREATED"]:
            # 1. Enviar para Admins
            admins = get_admin_recipients()
            for admin_phone in admins:
                if admin_phone != target_phone:
                    await send_adaptive(admin_phone, message)
            
            # 2. Se for um EVENTO, enviar também para todos os membros
            if event_type in ["EVENT", "EVENT_CREATED"]:
                members = get_member_phones()
                for member_phone in members:
                    # Evitar duplicar se o membro for admin ou target_phone
                    if member_phone != target_phone and member_phone not in admins:
                        # Anti-ban para volume de 300+ membros: 
                        # Pausa aleatória entre 10 a 25 segundos para simular digitação e leitura humana
                        wait_time = random.uniform(10, 25)
                        await asyncio.sleep(wait_time)
                        await send_adaptive(member_phone, message)

    # 2. Disparar Webhooks tradicionais
    conn = fdb.connect(host='localhost', database=DB_PATH.split(':')[-1], user=DB_USER, password=DB_PASS, charset='UTF8')
    cur = conn.cursor()
    try:
        cur.execute("SELECT URL FROM WEBHOOK_CONFIG WHERE EVENT_TYPE = ? AND IS_ACTIVE = 1", (event_type,))
        urls = cur.fetchall()
        
        async with httpx.AsyncClient() as client:
            for row in urls:
                url = row[0]
                try:
                    await client.post(url, json=payload, timeout=10.0)
                    logger.info(f"Webhook {event_type} enviado para {url}")
                except Exception as e:
                    logger.error(f"Erro ao enviar webhook para {url}: {str(e)}")
    finally:
        conn.close()

async def check_birthdays():
    """Verifica se há aniversariantes hoje e dispara webhooks."""
    if not is_automation_enabled("BIRTHDAY"):
        logger.info("Automação de Aniversários desativada.")
        return

    today = datetime.now()
    day = today.day
    month = today.month
    
    conn = fdb.connect(host='localhost', database=DB_PATH.split(':')[-1], user=DB_USER, password=DB_PASS, charset='UTF8')
    cur = conn.cursor()
    try:
        sql = """
            SELECT NAME, PHONE, ADDRESS 
            FROM MEMBERS 
            WHERE EXTRACT(DAY FROM BIRTH_DATE) = ? 
            AND EXTRACT(MONTH FROM BIRTH_DATE) = ?
            AND IS_ACTIVE = 1
            AND ACCEPTS_NOTIFICATIONS = 1
        """
        cur.execute(sql, (day, month))
        members = cur.fetchall()
        
        template = get_template("BIRTHDAY", "🎉 Feliz Aniversário, {name}! Que Deus te abençoe grandemente neste dia especial. 🎂")
        
        for m in members:
            name, phone, address = m
            # Garantir que phone não é None para o format
            safe_phone = phone if phone else ""
            msg = template.format(name=name, phone=safe_phone, address=(address if address else ""))
            payload = {
                "event": "birthday",
                "name": name,
                "phone": safe_phone,
                "message": msg
            }
            await trigger_webhooks("BIRTHDAY", payload)
            
    except Exception as e:
        logger.error(f"Erro ao verificar aniversariantes: {str(e)}")
    finally:
        conn.close()

async def check_events():
    """Verifica eventos do dia e dispara webhooks."""
    if not is_automation_enabled("EVENT"):
        logger.info("Automação de Eventos desativada.")
        return

    today_str = datetime.now().strftime('%Y-%m-%d')
    
    conn = fdb.connect(host='localhost', database=DB_PATH.split(':')[-1], user=DB_USER, password=DB_PASS, charset='UTF8')
    cur = conn.cursor()
    try:
        sql = "SELECT TITLE, EVENT_DATE, DESCRIPTION, IMAGE_URL, IMAGE_BASE64 FROM EVENTS WHERE CAST(EVENT_DATE AS DATE) = ?"
        cur.execute(sql, (today_str,))
        events = cur.fetchall()
        
        template = get_template("EVENT", "📢 *Lembrete de Evento Hoje!* \n\n📌 *{title}* \n⏰ Horário: {time} \n\nNão perca! Com o amor de Cristo.")
        
        for e in events:
            title, date, desc, img_url, img_blob = e
            time_str = date.strftime('%H:%M') if date else "00:00"
            
            img_base64 = img_blob
            if hasattr(img_blob, 'read'):
                img_data = img_blob.read()
                if isinstance(img_data, bytes):
                    img_base64 = img_data.decode('utf-8')
                else:
                    img_base64 = img_data

            msg = template.format(title=title, time=time_str, description=(desc if desc else ""))
            payload = {
                "event": "church_event",
                "title": title,
                "time": time_str,
                "description": desc,
                "image_url": img_url,
                "image_base64": img_base64,
                "phone": "", 
                "message": msg
            }
            await trigger_webhooks("EVENT", payload)
            
    except Exception as e:
        logger.error(f"Erro ao verificar eventos: {str(e)}")
    finally:
        conn.close()

async def check_pending_payments():
    """Verifica contas a vencer nos próximos 7 dias que ainda não foram pagas."""
    if not is_automation_enabled("FINANCIAL_REMINDER"):
        logger.info("Automação de Lembretes Financeiros desativada.")
        return

    from datetime import timedelta
    today = datetime.now().date()
    one_week_later = today + timedelta(days=7)
    
    conn = fdb.connect(host='localhost', database=DB_PATH.split(':')[-1], user=DB_USER, password=DB_PASS, charset='UTF8')
    cur = conn.cursor()
    try:
        # Busca transações de saída (PAGAR) não pagas que vencem entre hoje e daqui a 7 dias
        sql = """
            SELECT DESCRIPTION, AMOUNT, DUE_DATE 
            FROM FINANCIAL 
            WHERE TRANS_TYPE = 'SAIDA' 
            AND IS_PAID = 0 
            AND DUE_DATE BETWEEN ? AND ?
        """
        cur.execute(sql, (today.isoformat(), one_week_later.isoformat()))
        pending = cur.fetchall()
        
        if not pending:
            return

        template = get_template("FINANCIAL_REMINDER", "⚠️ *Lembrete de Pagamento:* \n\nA conta *{description}* no valor de R$ {amount} vence dia {due_date}. \n\nPor favor, verifique o fluxo de caixa para realizar o pagamento.")
        
        for p in pending:
            desc, amount, due = p
            due_str = due.strftime('%d/%m/%Y') if due else "N/A"
            msg = template.format(description=desc, amount=amount, due_date=due_str)
            
            payload = {
                "event": "financial_reminder",
                "description": desc,
                "amount": amount,
                "due_date": due_str,
                "message": msg
            }
            # Enviamos como um evento de finanças para os ADMs
            await trigger_webhooks("FINANCIAL_TRANSACTION", payload)
            
    except Exception as e:
        logger.error(f"Erro ao verificar contas a vencer: {str(e)}")
    finally:
        conn.close()

def start_scheduler():
    scheduler = AsyncIOScheduler()
    # Aniversários e Eventos do Dia
    scheduler.add_job(check_birthdays, 'cron', hour=8, minute=0)
    scheduler.add_job(check_events, 'cron', hour=7, minute=30)
    
    # Lembretes de Finanças (3x ao dia conforme solicitado)
    scheduler.add_job(check_pending_payments, 'cron', hour=8, minute=0)
    scheduler.add_job(check_pending_payments, 'cron', hour=11, minute=0)
    scheduler.add_job(check_pending_payments, 'cron', hour=15, minute=0)
    
    scheduler.start()
    logger.info("Agendador de Webhooks e WhatsApp iniciado com sucesso.")
