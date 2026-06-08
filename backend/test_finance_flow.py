import asyncio
import fdb
import sys
import io
from datetime import datetime, timedelta
from app.database import DB_PATH, DB_USER, DB_PASS
from app.services.automation import check_pending_payments, get_admin_recipients

# Configurar saída para evitar erros de unicode no Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

async def manual_test_finance():
    print("--- Verificando Destinatarios Administrativos ---")
    admins = get_admin_recipients()
    if not admins:
        print("[!] NENHUM destinatario administrativo cadastrado.")
        print("Vou cadastrar o numero +5565996772226 como destinatario adm para este teste.")
        
        conn = fdb.connect(host='localhost', database=DB_PATH.split(':')[-1], user=DB_USER, password=DB_PASS, charset='UTF8')
        cur = conn.cursor()
        cur.execute("SELECT COALESCE(MAX(ID), 0) + 1 FROM NOTIFICATION_RECIPIENTS")
        next_id = cur.fetchone()[0]
        cur.execute("INSERT INTO NOTIFICATION_RECIPIENTS (ID, NAME, PHONE, IS_ACTIVE) VALUES (?, ?, ?, ?)", 
                    (next_id, "Teste Manual", "5565996772226", 1))
        conn.commit()
        conn.close()
        print(f"[*] Destinatario de teste cadastrado (ID: {next_id})")
    else:
        print(f"[*] Destinatarios encontrados: {admins}")

    print("\n--- Verificando Contas a Vencer (Proximos 7 dias) ---")
    conn = fdb.connect(host='localhost', database=DB_PATH.split(':')[-1], user=DB_USER, password=DB_PASS, charset='UTF8')
    cur = conn.cursor()
    
    today = datetime.now().date()
    next_week = today + timedelta(days=7)
    
    cur.execute("""
        SELECT DESCRIPTION, AMOUNT, DUE_DATE 
        FROM FINANCIAL 
        WHERE TRANS_TYPE = 'SAIDA' 
        AND IS_PAID = 0 
        AND DUE_DATE BETWEEN ? AND ?
    """, (today.isoformat(), next_week.isoformat()))
    
    rows = cur.fetchall()
    if not rows:
        print("[i] Nenhuma conta pendente real encontrada.")
        print("Criando conta de TESTE...")
        
        test_due = today + timedelta(days=3)
        cur.execute("SELECT COALESCE(MAX(ID), 0) + 1 FROM FINANCIAL")
        next_id = cur.fetchone()[0]
        
        cur.execute("""
            INSERT INTO FINANCIAL (ID, DESCRIPTION, AMOUNT, CATEGORY, TRANS_TYPE, DUE_DATE, IS_PAID)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (next_id, "CONTA TESTE (VENCE EM BREVE)", 250.00, "GERAL", "SAIDA", test_due.isoformat(), 0))
        conn.commit()
        print(f"[*] Conta de teste criada (ID: {next_id})")
    else:
        print(f"[*] Encontrada(s) {len(rows)} conta(s) pendente(s).")
    
    conn.close()
    
    print("\n--- Disparando Robo de Notificacao ---")
    await check_pending_payments()
    print(">>> Processo concluido! Se houver contas a vencer, verifique o WhatsApp.")

if __name__ == "__main__":
    asyncio.run(manual_test_finance())
