from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.database import get_db
from app.schemas import EventResponse

router = APIRouter(prefix="/public", tags=["Público"])

@router.get("/events", response_model=List[EventResponse])
async def get_public_events(db=Depends(get_db)):
    """Retorna eventos marcados como públicos vindos do Firebird."""
    if not db:
        # Fallback para demonstração se o banco não estiver acessível
        return [
            {"id": 1, "title": "Culto Exemplo (Offline)", "description": "Ligue o Firebird para dados reais.", "event_date": "2024-05-20T19:00:00", "is_public": 1}
        ]
    
    cur = db.cursor()
    cur.execute("SELECT ID, TITLE, DESCRIPTION, EVENT_DATE, IS_PUBLIC FROM EVENTS WHERE IS_PUBLIC = 1 ORDER BY EVENT_DATE")
    
    events = []
    for row in cur.fetchall():
        events.append({
            "id": row[0],
            "title": row[1],
            "description": row[2].read() if hasattr(row[2], 'read') else row[2],
            "event_date": row[3],
            "is_public": row[4]
        })
    return events

@router.get("/news")
async def get_news():
    return [
        {"id": 1, "title": "Bem-vindo ao Novo ChMS", "content": "Sistema integrado com Firebird 2.5."}
    ]
@router.post("/members/toggle-notifications")
async def toggle_notifications(phone: str, accepts: bool, db=Depends(get_db)):
    """API para n8n/Chatbot ativar/desativar notificações de um membro pelo telefone."""
    if not db:
        raise HTTPException(status_code=500, detail="Sem conexão com o banco")
    
    # Limpar o telefone para busca (apenas números)
    clean_phone = "".join(filter(str.isdigit, phone))
    if not clean_phone:
        raise HTTPException(status_code=400, detail="Telefone inválido")

    cur = db.cursor()
    try:
        # Busca o membro (tenta com o número exato e variações com/sem 55)
        # Mais simples: busca membros que CONTÉM o número limpo
        sql = "UPDATE MEMBERS SET ACCEPTS_NOTIFICATIONS = ? WHERE PHONE LIKE ?"
        cur.execute(sql, (1 if accepts else 0, f"%{clean_phone}%"))
        
        if cur.rowcount == 0:
            return {"status": "not_found", "message": "Nenhum membro encontrado com este telefone"}
            
        db.commit()
        return {"status": "success", "message": f"Preferência atualizada para {'SIM' if accepts else 'NÃO'}"}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
