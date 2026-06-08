import fdb
from app.database import DB_PATH, DB_USER, DB_PASS

def setup_finance_template():
    db_name = DB_PATH.split(':')[-1]
    conn = fdb.connect(host='localhost', database=db_name, user=DB_USER, password=DB_PASS, charset='UTF8')
    cur = conn.cursor()
    
    try:
        cur.execute("SELECT 1 FROM WEBHOOK_TEMPLATES WHERE EVENT_TYPE = 'FINANCIAL_REMINDER'")
        if not cur.fetchone():
            cur.execute("""
                INSERT INTO WEBHOOK_TEMPLATES (EVENT_TYPE, CONTENT) 
                VALUES ('FINANCIAL_REMINDER', '⚠️ *Lembrete de Pagamento:* \n\nA conta *{description}* no valor de R$ {amount} vence dia {due_date}. \n\nPor favor, verifique o fluxo de caixa para realizar o pagamento.')
            """)
            conn.commit()
            print("Template FINANCIAL_REMINDER inserido.")
        else:
            print("Template já existe.")
    except Exception as e:
        print(f"Erro: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    setup_finance_template()
