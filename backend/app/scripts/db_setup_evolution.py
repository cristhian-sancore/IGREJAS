import fdb
from app.database import DB_PATH, DB_USER, DB_PASS

def setup_evolution_table():
    db_name = DB_PATH.split(':')[-1]
    
    conn = fdb.connect(host='localhost', database=db_name, user=DB_USER, password=DB_PASS, charset='UTF8')
    cur = conn.cursor()
    
    try:
        # Tabela para configuração da Evolution API
        cur.execute("""
            CREATE TABLE EVOLUTION_CONFIG (
                ID INTEGER NOT NULL,
                BASE_URL VARCHAR(500),
                API_KEY VARCHAR(500),
                INSTANCE_NAME VARCHAR(100),
                IS_ENABLED SMALLINT DEFAULT 0,
                CONSTRAINT PK_EVOLUTION_CONFIG PRIMARY KEY (ID)
            )
        """)
        conn.commit()
        print("Tabela EVOLUTION_CONFIG criada.")
        
        cur.execute("INSERT INTO EVOLUTION_CONFIG (ID, IS_ENABLED) VALUES (1, 0)")
        conn.commit()
        print("Registro inicial inserido.")
        
    except Exception as e:
        print(f"Erro: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    setup_evolution_table()
