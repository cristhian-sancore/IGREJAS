import fdb
from app.database import DB_PATH, DB_USER, DB_PASS

def migrate():
    # Remover o prefixo 'localhost:' se existir para o fdb.connect no Windows se necessário, 
    # mas mantendo a lógica de extração do path
    db_name = DB_PATH.split(':')[-1]
    
    print(f"Conectando ao banco: {db_name}")
    conn = fdb.connect(host='localhost', database=db_name, user=DB_USER, password=DB_PASS, charset='UTF8')
    cur = conn.cursor()
    
    try:
        print("Adicionando coluna ACCEPTS_NOTIFICATIONS na tabela MEMBERS...")
        # Firebird 2.5/3.0 syntax
        cur.execute("ALTER TABLE MEMBERS ADD ACCEPTS_NOTIFICATIONS SMALLINT DEFAULT 1")
        conn.commit()
        print("Coluna adicionada com sucesso!")
    except Exception as e:
        print(f"Erro ou coluna já existe: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
