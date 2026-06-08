import fdb
from app.database import DB_PATH, DB_USER, DB_PASS

def migrate():
    db_name = DB_PATH.split(':')[-1]
    conn = fdb.connect(host='localhost', database=db_name, user=DB_USER, password=DB_PASS, charset='UTF8')
    cur = conn.cursor()
    
    # 1. AUTOMATIONS
    try:
        cur.execute("""
            CREATE TABLE AUTOMATIONS (
                ID VARCHAR(50) NOT NULL PRIMARY KEY,
                NAME VARCHAR(100),
                DESCRIPTION VARCHAR(255),
                IS_ENABLED SMALLINT DEFAULT 1,
                SCHEDULE VARCHAR(50)
            )
        """)
        conn.commit()
        print("Tabela AUTOMATIONS criada.")
    except Exception as e:
        print(f"AUTOMATIONS já existe ou erro: {e}")
        conn.rollback()

    # Seed AUTOMATIONS
    try:
        cur.execute("INSERT INTO AUTOMATIONS (ID, NAME, DESCRIPTION, IS_ENABLED, SCHEDULE) VALUES ('BIRTHDAY', 'Aniversariantes do Dia', 'Envia felicitações para membros que fazem aniversário hoje.', 1, 'DAILY')")
        cur.execute("INSERT INTO AUTOMATIONS (ID, NAME, DESCRIPTION, IS_ENABLED, SCHEDULE) VALUES ('EVENT', 'Lembretes de Eventos', 'Envia avisos sobre eventos agendados para hoje.', 1, 'DAILY')")
        cur.execute("INSERT INTO AUTOMATIONS (ID, NAME, DESCRIPTION, IS_ENABLED, SCHEDULE) VALUES ('FINANCIAL_REMINDER', 'Contas a Vencer', 'Avisa sobre contas que vencem nos próximos 7 dias.', 1, 'DAILY')")
        conn.commit()
        print("Sementes AUTOMATIONS inseridas.")
    except Exception as e:
        print(f"Sementes AUTOMATIONS já existem ou erro: {e}")
        conn.rollback()

    # 2. N8N_CONFIG
    try:
        cur.execute("""
            CREATE TABLE N8N_CONFIG (
                ID INTEGER NOT NULL PRIMARY KEY,
                BASE_URL VARCHAR(255),
                API_KEY VARCHAR(255),
                IS_ENABLED SMALLINT DEFAULT 0
            )
        """)
        conn.commit()
        print("Tabela N8N_CONFIG criada.")
    except Exception as e:
        print(f"N8N_CONFIG já existe ou erro: {e}")
        conn.rollback()

    try:
        cur.execute("INSERT INTO N8N_CONFIG (ID, BASE_URL, API_KEY, IS_ENABLED) VALUES (1, '', '', 0)")
        conn.commit()
        print("Semente N8N_CONFIG inserida.")
    except Exception as e:
        print(f"Semente N8N_CONFIG já existe ou erro: {e}")
        conn.rollback()

    conn.close()

if __name__ == "__main__":
    migrate()
