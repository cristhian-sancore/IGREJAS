import fdb
from app.database import DB_PATH, DB_USER, DB_PASS

def migrate_events():
    db_name = DB_PATH.split(':')[-1]
    conn = fdb.connect(host='localhost', database=db_name, user=DB_USER, password=DB_PASS, charset='UTF8')
    cur = conn.cursor()
    
    try:
        cur.execute("ALTER TABLE EVENTS ADD IMAGE_URL VARCHAR(1000)")
        conn.commit()
        print("Coluna IMAGE_URL adicionada na tabela EVENTS.")
    except Exception as e:
        if "already exists" in str(e).lower() or "-607" in str(e):
            print("Coluna IMAGE_URL já existe.")
        else:
            print(f"Erro ao adicionar coluna: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_events()
