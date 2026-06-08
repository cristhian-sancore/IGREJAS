from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime
from app.auth import get_current_user
from app.database import get_db
from app.schemas import (
    MemberCreate, MemberResponse, FinancialCreate, FinancialResponse, 
    CategoryCreate, CategoryResponse, EventCreate, EventResponse, 
    CellCreate, CellResponse, UserCreate, UserResponse, 
    WebhookConfig, WebhookResponse, WebhookTemplate, WebhookTemplateUpdate, 
    EvolutionConfigResponse, WebhookTemplateTest, 
    NotificationRecipient, NotificationRecipientResponse,
    AutomationResponse, N8NConfigResponse
)
from app.auth import get_password_hash
from app.services.automation import trigger_webhooks

router = APIRouter(
    prefix="/admin",
    tags=["Administrativo"],
    dependencies=[Depends(get_current_user)]
)

def get_db_template(db, event_type: str, default: str) -> str:
    """Busca template no banco de dados."""
    cur = db.cursor()
    cur.execute("SELECT CONTENT FROM WEBHOOK_TEMPLATES WHERE EVENT_TYPE = ?", (event_type,))
    row = cur.fetchone()
    if row:
        return row[0] if isinstance(row[0], str) else row[0].decode('utf-8')
    return default

@router.get("/members", response_model=List[MemberResponse])
async def list_members(db=Depends(get_db)):
    """Lista todos os membros do banco Firebird."""
    if not db:
        raise HTTPException(status_code=500, detail="Sem conexão com o banco de dados")
    
    cur = db.cursor()
    cur.execute("SELECT ID, NAME, PHONE, ADDRESS, BIRTH_DATE, JOIN_DATE, IS_BAPTIZED, IS_VISITOR, IS_ACTIVE, ACCEPTS_NOTIFICATIONS FROM MEMBERS ORDER BY NAME")
    
    members = []
    for row in cur.fetchall():
        members.append({
            "id": row[0],
            "name": row[1],
            "phone": row[2],
            "address": row[3],
            "birth_date": row[4],
            "join_date": row[5],
            "is_baptized": row[6] or 0,
            "is_visitor": row[7] or 0,
            "is_active": row[8],
            "accepts_notifications": row[9] if row[9] is not None else 1
        })
    return members

@router.post("/members", response_model=MemberResponse)
async def create_member(member: MemberCreate, db=Depends(get_db)):
    """Cadastra um novo membro no Firebird."""
    if not db:
        raise HTTPException(status_code=500, detail="Sem conexão com o banco de dados")
    
    cur = db.cursor()
    try:
        phone = member.phone if member.phone and member.phone.strip() else None
        address = member.address if member.address and member.address.strip() else None
        
        sql = "INSERT INTO MEMBERS (NAME, PHONE, ADDRESS, BIRTH_DATE, IS_BAPTIZED, IS_VISITOR, IS_ACTIVE, ACCEPTS_NOTIFICATIONS) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING ID, JOIN_DATE"
        cur.execute(sql, (member.name, phone, address, member.birth_date, member.is_baptized, member.is_visitor, member.is_active, member.accepts_notifications))
        row = cur.fetchone()
        db.commit()
        
        # Disparo de Webhook em background (opcionalmente pode ser await ou task)
        try:
            template = get_db_template(db, "MEMBER_CREATED", "🤝 Bem-vindo(a) à nossa igreja, {name}! ✨")
            msg = template.format(name=member.name, phone=phone, address=address)
            
            payload = {
                "event": "member_created",
                "id": row[0],
                "name": member.name,
                "phone": phone,
                "address": address,
                "message": msg,
                "timestamp": datetime.now().isoformat()
            }
            await trigger_webhooks("MEMBER_CREATED", payload)
        except:
            pass
            
        return {
            "id": row[0],
            "name": member.name,
            "phone": phone,
            "address": address,
            "birth_date": member.birth_date,
            "join_date": row[1],
            "is_baptized": member.is_baptized,
            "is_visitor": member.is_visitor,
            "is_active": member.is_active,
            "accepts_notifications": member.accepts_notifications
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao salvar membro: {str(e)}")

@router.put("/members/{member_id}", response_model=MemberResponse)
async def update_member(member_id: int, member: MemberCreate, db=Depends(get_db)):
    """Atualiza os dados de um membro existente."""
    if not db:
        raise HTTPException(status_code=500, detail="Sem conexão com o banco de dados")
    
    cur = db.cursor()
    try:
        phone = member.phone if member.phone and member.phone.strip() else None
        address = member.address if member.address and member.address.strip() else None
        
        sql = """
            UPDATE MEMBERS 
            SET NAME = ?, PHONE = ?, ADDRESS = ?, BIRTH_DATE = ?, IS_BAPTIZED = ?, IS_VISITOR = ?, IS_ACTIVE = ?, ACCEPTS_NOTIFICATIONS = ?
            WHERE ID = ?
        """
        cur.execute(sql, (member.name, phone, address, member.birth_date, member.is_baptized, member.is_visitor, member.is_active, member.accepts_notifications, member_id))
        
        # Buscar a data de ingresso que não mudou
        cur.execute("SELECT JOIN_DATE FROM MEMBERS WHERE ID = ?", (member_id,))
        join_date = cur.fetchone()[0]
        
        db.commit()
        
        return {
            "id": member_id,
            "name": member.name,
            "phone": phone,
            "address": address,
            "birth_date": member.birth_date,
            "join_date": join_date,
            "is_baptized": member.is_baptized,
            "is_visitor": member.is_visitor,
            "is_active": member.is_active,
            "accepts_notifications": member.accepts_notifications
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao atualizar membro: {str(e)}")

@router.delete("/members/{member_id}")
async def delete_member(member_id: int, db=Depends(get_db)):
    """Remove um membro do banco."""
    cur = db.cursor()
    cur.execute("DELETE FROM MEMBERS WHERE ID = ?", (member_id,))
    db.commit()
    return {"status": "success"}

# FINANCEIRO
@router.get("/financial", response_model=List[FinancialResponse])
async def list_financial(db=Depends(get_db)):
    """Lista todas as transações financeiras do banco Firebird."""
    if not db:
        raise HTTPException(status_code=500, detail="Sem conexão com o banco de dados")
    
    cur = db.cursor()
    cur.execute("SELECT ID, DESCRIPTION, AMOUNT, CATEGORY, TRANS_TYPE, TRANS_DATE, DUE_DATE, PAYMENT_DATE, IS_PAID FROM FINANCIAL ORDER BY TRANS_DATE DESC")
    
    transactions = []
    for row in cur.fetchall():
        transactions.append({
            "id": row[0],
            "description": row[1],
            "amount": float(row[2]),
            "category": row[3],
            "trans_type": row[4],
            "trans_date": row[5],
            "due_date": row[6],
            "payment_date": row[7],
            "is_paid": row[8] or 0
        })
    return transactions

@router.post("/financial", response_model=FinancialResponse)
async def create_transaction(trans: FinancialCreate, db=Depends(get_db)):
    """Registra uma nova transação financeira."""
    if not db:
        raise HTTPException(status_code=500, detail="Sem conexão com o banco de dados")
    
    cur = db.cursor()
    try:
        sql = "INSERT INTO FINANCIAL (DESCRIPTION, AMOUNT, CATEGORY, TRANS_TYPE, DUE_DATE, PAYMENT_DATE, IS_PAID) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING ID, TRANS_DATE"
        cur.execute(sql, (trans.description, trans.amount, trans.category, trans.trans_type, trans.due_date, trans.payment_date, trans.is_paid))
        row = cur.fetchone()
        db.commit()
        
        # Disparo de Webhook para Transação Financeira
        try:
            template = get_db_template(db, "FINANCIAL_TRANSACTION", "💰 Registro Financeiro: {description} no valor de R$ {amount} ({type}).")
            msg = template.format(description=trans.description, amount=trans.amount, type=trans.trans_type)
            
            payload = {
                "event": "financial_transaction",
                "id": row[0],
                "description": trans.description,
                "amount": trans.amount,
                "type": trans.trans_type,
                "category": trans.category,
                "message": msg,
                "timestamp": datetime.now().isoformat()
            }
            await trigger_webhooks("FINANCIAL_TRANSACTION", payload)
        except:
            pass
            
        return {
            "id": row[0],
            "description": trans.description,
            "amount": trans.amount,
            "category": trans.category,
            "trans_type": trans.trans_type,
            "trans_date": row[1],
            "due_date": trans.due_date,
            "payment_date": trans.payment_date,
            "is_paid": trans.is_paid
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao salvar transação: {str(e)}")

@router.put("/financial/{trans_id}", response_model=FinancialResponse)
async def update_financial(trans_id: int, trans: FinancialCreate, db=Depends(get_db)):
    """Atualiza um lançamento financeiro existente."""
    if not db:
        raise HTTPException(status_code=500, detail="Sem conexão com o banco de dados")
    
    cur = db.cursor()
    try:
        sql = """
            UPDATE FINANCIAL 
            SET DESCRIPTION = ?, AMOUNT = ?, CATEGORY = ?, TRANS_TYPE = ?, DUE_DATE = ?, PAYMENT_DATE = ?, IS_PAID = ? 
            WHERE ID = ?
        """
        cur.execute(sql, (trans.description, trans.amount, trans.category, trans.trans_type, trans.due_date, trans.payment_date, trans.is_paid, trans_id))
        
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Lançamento não encontrado")
            
        db.commit()
        
        # Busca o registro atualizado para retornar
        cur.execute("SELECT ID, DESCRIPTION, AMOUNT, CATEGORY, TRANS_TYPE, TRANS_DATE, DUE_DATE, PAYMENT_DATE, IS_PAID FROM FINANCIAL WHERE ID = ?", (trans_id,))
        row = cur.fetchone()
        
        return {
            "id": row[0],
            "description": row[1],
            "amount": float(row[2]),
            "category": row[3],
            "trans_type": row[4],
            "trans_date": row[5],
            "due_date": row[6],
            "payment_date": row[7],
            "is_paid": row[8] or 0
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao atualizar lançamento: {str(e)}")

@router.delete("/financial/{trans_id}")
async def delete_financial(trans_id: int, db=Depends(get_db)):
    """Exclui um lançamento financeiro."""
    if not db:
        raise HTTPException(status_code=500, detail="Sem conexão com o banco de dados")
    
    cur = db.cursor()
    try:
        cur.execute("DELETE FROM FINANCIAL WHERE ID = ?", (trans_id,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Lançamento não encontrado")
        db.commit()
        return {"detail": "Lançamento excluído com sucesso"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao excluir lançamento: {str(e)}")

# CATEGORIAS
@router.get("/categories", response_model=List[CategoryResponse])
async def list_categories(db=Depends(get_db)):
    """Lista todas as categorias financeiras."""
    if not db:
        raise HTTPException(status_code=500, detail="Sem conexão com o banco de dados")
    
    cur = db.cursor()
    cur.execute("SELECT ID, NAME, CAT_TYPE FROM FINANCIAL_CATEGORIES ORDER BY NAME")
    
    categories = []
    for row in cur.fetchall():
        categories.append({
            "id": row[0],
            "name": row[1],
            "cat_type": row[2]
        })
    return categories

@router.post("/categories", response_model=CategoryResponse)
async def create_category(cat: CategoryCreate, db=Depends(get_db)):
    """Cadastra uma nova categoria financeira."""
    if not db:
        raise HTTPException(status_code=500, detail="Sem conexão com o banco de dados")
    
    cur = db.cursor()
    try:
        sql = "INSERT INTO FINANCIAL_CATEGORIES (NAME, CAT_TYPE) VALUES (?, ?) RETURNING ID"
        cur.execute(sql, (cat.name, cat.cat_type))
        row = cur.fetchone()
        db.commit()
        
        return {
            "id": row[0],
            "name": cat.name,
            "cat_type": cat.cat_type
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao salvar categoria: {str(e)}")

# EVENTOS / AGENDA
@router.get("/events", response_model=List[EventResponse])
async def list_events(db=Depends(get_db)):
    """Lista todos os eventos da agenda."""
    if not db:
        raise HTTPException(status_code=500, detail="Sem conexão com o banco de dados")
    
    cur = db.cursor()
    cur.execute("SELECT ID, TITLE, DESCRIPTION, EVENT_DATE, IMAGE_URL, IMAGE_BASE64, IS_PUBLIC FROM EVENTS ORDER BY EVENT_DATE DESC")
    
    events = []
    for row in cur.fetchall():
        img_base64 = row[5]
        if hasattr(img_base64, 'read'):
            img_base64 = img_base64.read()
            if isinstance(img_base64, bytes):
                img_base64 = img_base64.decode('utf-8')
                
        events.append({
            "id": row[0],
            "title": row[1],
            "description": row[2],
            "event_date": row[3],
            "is_public": row[6],
            "image_url": row[4],
            "image_base64": img_base64
        })
    return events

@router.post("/events", response_model=EventResponse)
async def create_event(event: EventCreate, db=Depends(get_db)):
    """Cria um novo evento na agenda."""
    if not db:
        raise HTTPException(status_code=500, detail="Sem conexão com o banco de dados")
    
    cur = db.cursor()
    try:
        sql = "INSERT INTO EVENTS (TITLE, DESCRIPTION, EVENT_DATE, IS_PUBLIC, IMAGE_URL, IMAGE_BASE64) VALUES (?, ?, ?, ?, ?, ?) RETURNING ID"
        cur.execute(sql, (event.title, event.description, event.event_date, event.is_public, event.image_url, event.image_base64))
        row = cur.fetchone()
        db.commit()
        
        # Disparo de Webhook para Novo Evento
        try:
            template = get_db_template(db, "EVENT_CREATED", "📅 Novo evento agendado: {title} para o dia {date}.")
            date_str = event.event_date.strftime('%d/%m/%Y %H:%M')
            msg = template.format(title=event.title, date=date_str, description=event.description)
            
            payload = {
                "event": "event_created",
                "id": row[0],
                "title": event.title,
                "date": event.event_date.isoformat() if hasattr(event.event_date, 'isoformat') else str(event.event_date),
                "description": event.description,
                "image_url": event.image_url,
                "image_base64": event.image_base64,
                "message": msg,
                "timestamp": datetime.now().isoformat()
            }
            await trigger_webhooks("EVENT_CREATED", payload)
        except:
            pass
            
        return {
            "id": row[0],
            "title": event.title,
            "description": event.description,
            "event_date": event.event_date,
            "is_public": event.is_public,
            "image_url": event.image_url,
            "image_base64": event.image_base64
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao salvar evento: {str(e)}")

@router.put("/events/{event_id}", response_model=EventResponse)
async def update_event(event_id: int, event: EventCreate, db=Depends(get_db)):
    """Atualiza um evento existente na agenda."""
    if not db:
        raise HTTPException(status_code=500, detail="Sem conexão com o banco de dados")
    
    cur = db.cursor()
    try:
        sql = """
            UPDATE EVENTS 
            SET TITLE = ?, DESCRIPTION = ?, EVENT_DATE = ?, IS_PUBLIC = ?, IMAGE_URL = ?, IMAGE_BASE64 = ?
            WHERE ID = ?
        """
        cur.execute(sql, (event.title, event.description, event.event_date, event.is_public, event.image_url, event.image_base64, event_id))
        db.commit()
        
        return {
            "id": event_id,
            "title": event.title,
            "description": event.description,
            "event_date": event.event_date,
            "is_public": event.is_public,
            "image_url": event.image_url,
            "image_base64": event.image_base64
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao atualizar evento: {str(e)}")

@router.delete("/events/{event_id}")
async def delete_event(event_id: int, db=Depends(get_db)):
    """Exclui um evento da agenda."""
    if not db:
        raise HTTPException(status_code=500, detail="Sem conexão com o banco de dados")
    
    cur = db.cursor()
    try:
        cur.execute("DELETE FROM EVENTS WHERE ID = ?", (event_id,))
        db.commit()
        return {"detail": "Evento excluído"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao excluir evento: {str(e)}")

# CÉLULAS
@router.get("/cells", response_model=List[CellResponse])
async def list_cells(db=Depends(get_db)):
    """Lista todas as células cadastradas."""
    if not db:
        raise HTTPException(status_code=500, detail="Sem conexão com o banco de dados")
    
    cur = db.cursor()
    cur.execute("SELECT ID, NAME, ADDRESS, LEADER, CO_LEADER, MAP_URL, CATEGORY FROM CELLS ORDER BY NAME")
    
    cells = []
    for row in cur.fetchall():
        cells.append({
            "id": row[0],
            "name": row[1],
            "address": row[2],
            "leader": row[3],
            "co_leader": row[4],
            "map_url": row[5],
            "category": row[6]
        })
    return cells

@router.post("/cells", response_model=CellResponse)
async def create_cell(cell: CellCreate, db=Depends(get_db)):
    """Cadastra uma nova célula."""
    if not db:
        raise HTTPException(status_code=500, detail="Sem conexão com o banco de dados")
    
    cur = db.cursor()
    try:
        sql = "INSERT INTO CELLS (NAME, ADDRESS, LEADER, CO_LEADER, MAP_URL, CATEGORY) VALUES (?, ?, ?, ?, ?, ?) RETURNING ID"
        cur.execute(sql, (cell.name, cell.address, cell.leader, cell.co_leader, cell.map_url, cell.category))
        row = cur.fetchone()
        db.commit()
        
        return {
            "id": row[0],
            "name": cell.name,
            "address": cell.address,
            "leader": cell.leader,
            "co_leader": cell.co_leader,
            "map_url": cell.map_url,
            "category": cell.category
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao salvar célula: {str(e)}")

@router.delete("/cells/{cell_id}")
async def delete_cell(cell_id: int, db=Depends(get_db)):
    """Remove uma célula do sistema."""
    if not db:
        raise HTTPException(status_code=500, detail="Sem conexão com o banco de dados")
    
    cur = db.cursor()
    try:
        cur.execute("DELETE FROM CELLS WHERE ID = ?", (cell_id,))
        db.commit()
        return {"detail": "Célula removida"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao remover célula: {str(e)}")

# CONFIGURAÇÕES - WEBHOOKS
@router.get("/config/webhooks", response_model=List[WebhookResponse])
async def list_webhooks(db=Depends(get_db)):
    """Lista todos os webhooks configurados."""
    if not db:
        raise HTTPException(status_code=500, detail="Sem conexão com o banco de dados")
    
    cur = db.cursor()
    cur.execute("SELECT ID, URL, EVENT_TYPE, IS_ACTIVE FROM WEBHOOK_CONFIG")
    
    webhooks = []
    for row in cur.fetchall():
        webhooks.append({
            "id": row[0],
            "url": row[1],
            "event_type": row[2],
            "is_active": row[3]
        })
    return webhooks

@router.post("/config/webhooks", response_model=WebhookResponse)
async def create_webhook(webhook: WebhookConfig, db=Depends(get_db)):
    """Salva uma nova configuração de webhook."""
    if not db:
        raise HTTPException(status_code=500, detail="Sem conexão com o banco de dados")
    
    cur = db.cursor()
    try:
        sql = "INSERT INTO WEBHOOK_CONFIG (URL, EVENT_TYPE, IS_ACTIVE) VALUES (?, ?, ?) RETURNING ID"
        cur.execute(sql, (webhook.url, webhook.event_type, webhook.is_active))
        row = cur.fetchone()
        db.commit()
        
        return {
            "id": row[0],
            "url": webhook.url,
            "event_type": webhook.event_type,
            "is_active": webhook.is_active
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao salvar webhook: {str(e)}")

@router.delete("/config/webhooks/{webhook_id}")
async def delete_webhook(webhook_id: int, db=Depends(get_db)):
    """Remove um webhook."""
    cur = db.cursor()
    cur.execute("DELETE FROM WEBHOOK_CONFIG WHERE ID = ?", (webhook_id,))
    db.commit()
    return {"detail": "Webhook removido"}

# CONFIGURAÇÕES - USUÁRIOS
@router.get("/config/users", response_model=List[UserResponse])
async def list_admin_users(db=Depends(get_db)):
    """Lista usuários que acessam o painel administrativo."""
    if not db:
        raise HTTPException(status_code=500, detail="Sem conexão com o banco de dados")
    
    cur = db.cursor()
    cur.execute("SELECT ID, NAME, EMAIL, ACCESS_LEVEL FROM USERS_ADMIN")
    
    users = []
    for row in cur.fetchall():
        users.append({
            "id": row[0],
            "name": row[1],
            "email": row[2],
            "access_level": row[3] or "ADMIN"
        })
    return users

@router.post("/config/users", response_model=UserResponse)
async def create_admin_user(user: UserCreate, db=Depends(get_db)):
    """Cria um novo usuário administrativo com senha criptografada."""
    if not db:
        raise HTTPException(status_code=500, detail="Sem conexão com o banco de dados")
    
    cur = db.cursor()
    try:
        hashed_password = get_password_hash(user.password)
        sql = "INSERT INTO USERS_ADMIN (NAME, EMAIL, PASSWORD_HASH, ACCESS_LEVEL) VALUES (?, ?, ?, ?) RETURNING ID"
        cur.execute(sql, (user.name, user.email, hashed_password, user.access_level))
        row = cur.fetchone()
        db.commit()
        
        return {
            "id": row[0],
            "name": user.name,
            "email": user.email,
            "access_level": user.access_level
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao criar usuário: {str(e)}")

@router.delete("/config/users/{user_id}")
async def delete_admin_user(user_id: int, db=Depends(get_db)):
    """Remove um usuário do sistema."""
    cur = db.cursor()
    cur.execute("DELETE FROM USERS_ADMIN WHERE ID = ?", (user_id,))
    db.commit()
    return {"detail": "Usuário removido"}

# CONFIGURAÇÕES - TEMPLATES DE MENSAGEM
@router.get("/config/templates", response_model=List[WebhookTemplate])
async def list_templates(db=Depends(get_db)):
    """Lista todos os templates de mensagem."""
    cur = db.cursor()
    cur.execute("SELECT EVENT_TYPE, CONTENT FROM WEBHOOK_TEMPLATES")
    return [{"event_type": r[0], "content": (r[1] if isinstance(r[1], str) else r[1].decode('utf-8'))} for r in cur.fetchall()]

@router.put("/config/templates/{event_type}")
async def update_template(event_type: str, template: WebhookTemplateUpdate, db=Depends(get_db)):
    """Atualiza um template de mensagem."""
    cur = db.cursor()
    cur.execute("UPDATE WEBHOOK_TEMPLATES SET CONTENT = ? WHERE EVENT_TYPE = ?", (template.content, event_type))
    db.commit()
    return {"detail": "Template atualizado"}

@router.post("/config/templates/test")
async def test_template_message(test: WebhookTemplateTest, db=Depends(get_db)):
    """Envia uma mensagem de teste usando um template e a Evolution API."""
    cur = db.cursor()
    # 1. Usar conteúdo enviado ou buscar no banco
    if test.content:
        template = test.content
    else:
        cur.execute("SELECT CONTENT FROM WEBHOOK_TEMPLATES WHERE EVENT_TYPE = ?", (test.event_type,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Template não encontrado")
        template = row[0] if isinstance(row[0], str) else row[0].decode('utf-8')
    # 2. Buscar dados reais para o teste
    dummy_data = {
        "name": "João da Silva (Teste)",
        "phone": test.phone,
        "address": "Rua da Igreja, 123",
        "title": "Evento de Teste",
        "time": "19:30",
        "description": "Descrição de teste para o seu evento.",
        "date": datetime.now().strftime('%d/%m/%Y'),
        "amount": "100.00",
        "type": "Dízimo",
        "category": "Geral"
    }

    try:
        if test.event_type == "BIRTHDAY":
            # Busca todos os membros com nascimento e encontra o próximo aniversário em Python
            cur.execute("SELECT NAME, PHONE, ADDRESS, EXTRACT(MONTH FROM BIRTH_DATE), EXTRACT(DAY FROM BIRTH_DATE) FROM MEMBERS WHERE IS_ACTIVE = 1 AND BIRTH_DATE IS NOT NULL")
            rows = cur.fetchall()
            if rows:
                today = datetime.now()
                cur_month, cur_day = today.month, today.day
                
                def days_until_birthday(row):
                    m, d = int(row[3]), int(row[4])
                    # Dias até o aniversário neste ano
                    try:
                        bday_this_year = datetime(today.year, m, d)
                    except:
                        return 999
                    delta = (bday_this_year - today.replace(hour=0, minute=0, second=0, microsecond=0)).days
                    if delta < 0:  # Já passou este ano, usa o próximo
                        delta += 365
                    return delta
                
                best = min(rows, key=days_until_birthday)
                dummy_data.update({"name": best[0], "phone": best[1] or test.phone, "address": best[2] or ""})
            else:
                # Fallback: qualquer membro ativo
                cur.execute("SELECT first 1 NAME, PHONE, ADDRESS FROM MEMBERS WHERE IS_ACTIVE = 1")
                row = cur.fetchone()
                if row:
                    dummy_data.update({"name": row[0], "phone": row[1] or test.phone, "address": row[2] or ""})
        
        elif test.event_type in ["EVENT", "EVENT_CREATED"]:
            cur.execute("SELECT first 1 TITLE, EVENT_DATE, DESCRIPTION FROM EVENTS ORDER BY EVENT_DATE DESC")
            row = cur.fetchone()
            if row:
                t_str = row[1].strftime('%H:%M') if row[1] else "19:30"
                d_str = row[1].strftime('%d/%m/%Y') if row[1] else dummy_data["date"]
                dummy_data.update({"title": row[0], "time": t_str, "date": d_str, "description": row[2] or ""})
        
        elif test.event_type == "FINANCIAL_TRANSACTION":
            cur.execute("SELECT first 1 DESCRIPTION, AMOUNT, TRANS_TYPE FROM FINANCIAL ORDER BY ID DESC")
            row = cur.fetchone()
            if row:
                dummy_data.update({"description": row[0], "amount": str(row[1]), "type": row[2]})
        
        elif test.event_type == "MEMBER_CREATED":
            cur.execute("SELECT first 1 NAME, PHONE FROM MEMBERS ORDER BY ID DESC")
            row = cur.fetchone()
            if row:
                dummy_data.update({"name": row[0], "phone": row[1] or test.phone})

        msg = template.format(**dummy_data)
        
        # 3. Disparar via automação
        from app.services.automation import send_evolution_api
        await send_evolution_api(test.phone, msg)
        
        return {"detail": "Teste disparado! Verifique o WhatsApp.", "preview": msg}
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Variável desconhecida no template: {{{e}}}. Verifique as variáveis disponíveis.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao processar template: {str(e)}")

# CONFIGURAÇÕES - EVOLUTION API
@router.get("/config/evolution", response_model=EvolutionConfigResponse)
async def get_evolution_config(db=Depends(get_db)):
    """Busca a configuração da Evolution API."""
    cur = db.cursor()
    cur.execute("SELECT BASE_URL, API_KEY, INSTANCE_NAME, IS_ENABLED FROM EVOLUTION_CONFIG WHERE ID = 1")
    row = cur.fetchone()
    if row:
        return {
            "base_url": row[0],
            "api_key": row[1],
            "instance_name": row[2],
            "is_enabled": row[3]
        }
    return {"is_enabled": 0}

@router.put("/config/evolution")
async def update_evolution_config(config: EvolutionConfigResponse, db=Depends(get_db)):
    """Atualiza a configuração da Evolution API."""
    cur = db.cursor()
    cur.execute("""
        UPDATE EVOLUTION_CONFIG 
        SET BASE_URL = ?, API_KEY = ?, INSTANCE_NAME = ?, IS_ENABLED = ? 
        WHERE ID = 1
    """, (config.base_url, config.api_key, config.instance_name, config.is_enabled))
    db.commit()
    return {"detail": "Configuração da Evolution API atualizada"}

# CONFIGURAÇÕES - DESTINATÁRIOS DE NOTIFICAÇÃO
@router.get("/config/recipients", response_model=List[NotificationRecipientResponse])
async def list_recipients(db=Depends(get_db)):
    """Lista todos os destinatários de notificações administrativas."""
    cur = db.cursor()
    cur.execute("SELECT ID, NAME, PHONE, IS_ACTIVE FROM NOTIFICATION_RECIPIENTS")
    return [{"id": r[0], "name": r[1], "phone": r[2], "is_active": r[3]} for r in cur.fetchall()]

@router.post("/config/recipients", response_model=NotificationRecipientResponse)
async def create_recipient(rec: NotificationRecipient, db=Depends(get_db)):
    """Adiciona um novo destinatário de notificação."""
    cur = db.cursor()
    # Obter próximo ID
    cur.execute("SELECT COALESCE(MAX(ID), 0) + 1 FROM NOTIFICATION_RECIPIENTS")
    next_id = cur.fetchone()[0]
    
    cur.execute("INSERT INTO NOTIFICATION_RECIPIENTS (ID, NAME, PHONE, IS_ACTIVE) VALUES (?, ?, ?, ?)", 
                (next_id, rec.name, rec.phone, rec.is_active))
    db.commit()
    return {**rec.dict(), "id": next_id}

@router.delete("/config/recipients/{rec_id}")
async def delete_recipient(rec_id: int, db=Depends(get_db)):
    """Remove um destinatário de notificação."""
    cur = db.cursor()
    cur.execute("DELETE FROM NOTIFICATION_RECIPIENTS WHERE ID = ?", (rec_id,))
    db.commit()
    return {"detail": "Destinatário removido"}

# CONFIGURAÇÕES - AUTOMAÇÕES INTERNAS
@router.get("/config/automations", response_model=List[AutomationResponse])
async def list_automations(db=Depends(get_db)):
    """Lista as automações internas do sistema."""
    if not db:
        raise HTTPException(status_code=500, detail="Sem conexão com o banco de dados")
    cur = db.cursor()
    cur.execute("SELECT ID, NAME, DESCRIPTION, IS_ENABLED, SCHEDULE FROM AUTOMATIONS")
    return [{"id": r[0], "name": r[1], "description": r[2], "is_enabled": r[3], "schedule": r[4]} for r in cur.fetchall()]

@router.put("/config/automations/{auto_id}")
async def update_automation(auto_id: str, is_enabled: int, db=Depends(get_db)):
    """Ativa ou desativa uma automação interna."""
    if not db:
        raise HTTPException(status_code=500, detail="Sem conexão com o banco de dados")
    cur = db.cursor()
    try:
        cur.execute("UPDATE AUTOMATIONS SET IS_ENABLED = ? WHERE ID = ?", (is_enabled, auto_id))
        db.commit()
        return {"detail": f"Automação {auto_id} atualizada"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# CONFIGURAÇÕES - N8N
@router.get("/config/n8n", response_model=N8NConfigResponse)
async def get_n8n_config(db=Depends(get_db)):
    """Busca a configuração do N8N."""
    if not db:
        raise HTTPException(status_code=500, detail="Sem conexão com o banco de dados")
    cur = db.cursor()
    cur.execute("SELECT BASE_URL, API_KEY, IS_ENABLED FROM N8N_CONFIG WHERE ID = 1")
    row = cur.fetchone()
    if row:
        return {"base_url": row[0] or "", "api_key": row[1] or "", "is_enabled": row[2] or 0}
    return {"base_url": "", "api_key": "", "is_enabled": 0}

@router.put("/config/n8n")
async def update_n8n_config(config: N8NConfigResponse, db=Depends(get_db)):
    """Atualiza a configuração do N8N."""
    if not db:
        raise HTTPException(status_code=500, detail="Sem conexão com o banco de dados")
    cur = db.cursor()
    try:
        clean_url = config.base_url.rstrip('/') if config.base_url else ""
        cur.execute("UPDATE N8N_CONFIG SET BASE_URL = ?, API_KEY = ?, IS_ENABLED = ? WHERE ID = 1", 
                    (clean_url, config.api_key, config.is_enabled))
        db.commit()
        return {"detail": "Configuração N8N atualizada"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/config/n8n/workflows")
async def list_n8n_workflows(db=Depends(get_db)):
    """Tenta listar os workflows do N8N conectado."""
    cur = db.cursor()
    cur.execute("SELECT BASE_URL, API_KEY, IS_ENABLED FROM N8N_CONFIG WHERE ID = 1")
    row = cur.fetchone()
    if not row or not row[2] or not row[0]:
        return []
    
    base_url = row[0].rstrip('/')
    api_key = row[1]
    
    try:
        import httpx
        headers = {"X-N8N-API-KEY": api_key}
        async with httpx.AsyncClient() as client:
            # Endpoint padrão da v1 da API do n8n para listar workflows
            resp = await client.get(f"{base_url}/api/v1/workflows", headers=headers, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                return data.get("data", [])
            return []
    except:
        return []
