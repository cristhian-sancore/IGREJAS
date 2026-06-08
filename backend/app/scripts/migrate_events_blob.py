import fdb
from app.database import DB_PATH, DB_USER, DB_PASS

def migrate_blobs():
    db_name = DB_PATH.split(':')[-1]
    conn = fdb.connect(host='localhost', database=db_name, user=DB_USER, password=DB_PASS, charset='UTF8')
    cur = conn.cursor()
    
    try:
        # Adicionar coluna BLOB para a imagem base64
        cur.execute("ALTER TABLE EVENTS ADD IMAGE_BASE64 BLOB SUB_TYPE TEXT")
        conn.commit()
        print("Coluna IMAGE_BASE64 adicionada.")
    except Exception as e:
        print(f"Aviso: {e}")
        
    try:
        # Aumentar tamanho da URL caso queira manter como fallback
        cur.execute("ALTER TABLE EVENTS ALTER IMAGE_URL TYPE VARCHAR(1000)")
        conn.commit()
    except: pass
    
    conn.close()

if __name__ == "__main__":
    migrate_blobs()
