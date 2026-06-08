import fdb
from app.database import DB_PATH, DB_USER, DB_PASS

def setup_notification_recipients():
    db_name = DB_PATH.split(':')[-1]
    
    conn = fdb.connect(host='localhost', database=db_name, user=DB_USER, password=DB_PASS, charset='UTF8')
    cur = conn.cursor()
    
    try:
        # Tabela para contatos que recebem notificações administrativas (secretários, pastores)
        cur.execute("""
            CREATE TABLE NOTIFICATION_RECIPIENTS (
                ID INTEGER NOT NULL,
                NAME VARCHAR(100),
                PHONE VARCHAR(20),
                IS_ACTIVE SMALLINT DEFAULT 1,
                CONSTRAINT PK_NOTIF_RECIPIENTS PRIMARY KEY (ID)
            )
        """)
        conn.commit()
        print("Tabela NOTIFICATION_RECIPIENTS criada.")
        
        # Gerador para o ID se necessário (opcional no Firebird se usarmos manual, mas boa prática)
        try:
            cur.execute("CREATE GENERATOR GEN_NOTIF_RECIPIENTS_ID")
            conn.commit()
        except: pass

    except Exception as e:
        print(f"Aviso/Erro: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    setup_notification_recipients()
