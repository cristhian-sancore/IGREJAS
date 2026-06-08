import fdb
import os

# Configurações de conexão com o Firebird 2.5
DB_PATH = os.getenv("FIREBIRD_DB_PATH", "localhost:C:/coisas/IGREJAS/database/CHMS.FDB")
DB_USER = os.getenv("FIREBIRD_USER", "SYSDBA")
DB_PASS = os.getenv("FIREBIRD_PASS", "masterkey")

def get_db_connection():
    """Retorna uma conexão ativa com o banco Firebird."""
    try:
        parts = DB_PATH.split(':', 1)
        host = parts[0]
        db_file = parts[1]
        conn = fdb.connect(
            host=host,
            database=db_file,
            user=DB_USER,
            password=DB_PASS,
            charset='UTF8'
        )
        return conn
    except Exception as e:
        # Para o ambiente de teste sem Firebird instalado, vamos apenas logar o erro
        # No código real, isso deve ser tratado adequadamente.
        print(f"Erro ao conectar ao Firebird: {e}")
        return None

# Dependency para injeção nas rotas
def get_db():
    db = get_db_connection()
    if db:
        try:
            yield db
        finally:
            db.close()
    else:
        # Fallback ou erro dependendo da necessidade
        yield None
