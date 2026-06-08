import fdb
import os
from app.database import DB_PATH, DB_USER, DB_PASS

def init_db():
    # Extrai o caminho do arquivo do DB_PATH (ex: localhost:C:/path/to/db.fdb -> C:/path/to/db.fdb)
    db_file = DB_PATH.split(':')[-1]
    
    if os.path.exists(db_file):
        print(f"Banco de dados já existe em: {db_file}")
    else:
        print(f"Criando novo banco de dados Firebird em: {db_file}...")
        try:
            # Cria o banco fisicamente
            fdb.create_database(
                host='localhost',
                database=db_file,
                user=DB_USER,
                password=DB_PASS,
                page_size=8192,
                charset='UTF8'
            )
            print("Arquivo .FDB criado com sucesso!")
        except Exception as e:
            print(f"Erro ao criar arquivo de banco: {e}")
            return

    # Conecta para criar as tabelas
    try:
        conn = fdb.connect(host='localhost', database=db_file, user=DB_USER, password=DB_PASS, charset='UTF8')
        cur = conn.cursor()

        print("Criando tabelas e geradores...")

        ddl_commands = [
            # Tabela Membros
            "CREATE TABLE MEMBERS (ID INTEGER NOT NULL PRIMARY KEY, NAME VARCHAR(150) NOT NULL, PHONE VARCHAR(20), EMAIL VARCHAR(150), JOIN_DATE DATE DEFAULT 'NOW', IS_ACTIVE SMALLINT DEFAULT 1 CHECK (IS_ACTIVE IN (0, 1)))",
            "CREATE GENERATOR GEN_MEMBERS_ID",
            """
            CREATE TRIGGER BI_MEMBERS FOR MEMBERS
            ACTIVE BEFORE INSERT POSITION 0
            AS
            BEGIN
                IF (NEW.ID IS NULL) THEN NEW.ID = NEXT VALUE FOR GEN_MEMBERS_ID;
            END
            """,
            # Tabela Eventos
            "CREATE TABLE EVENTS (ID INTEGER NOT NULL PRIMARY KEY, TITLE VARCHAR(200) NOT NULL, DESCRIPTION BLOB SUB_TYPE TEXT, EVENT_DATE TIMESTAMP NOT NULL, IS_PUBLIC SMALLINT DEFAULT 1 CHECK (IS_PUBLIC IN (0, 1)))",
            "CREATE GENERATOR GEN_EVENTS_ID",
            """
            CREATE TRIGGER BI_EVENTS FOR EVENTS
            ACTIVE BEFORE INSERT POSITION 0
            AS
            BEGIN
                IF (NEW.ID IS NULL) THEN NEW.ID = NEXT VALUE FOR GEN_EVENTS_ID;
            END
            """,
            # Tabela Categorias Financeiras
            "CREATE TABLE FINANCIAL_CATEGORIES (ID INTEGER NOT NULL PRIMARY KEY, NAME VARCHAR(50) NOT NULL UNIQUE, CAT_TYPE VARCHAR(10) NOT NULL)",
            "CREATE GENERATOR GEN_FINCAT_ID",
            """
            CREATE TRIGGER BI_FINCAT FOR FINANCIAL_CATEGORIES
            ACTIVE BEFORE INSERT POSITION 0
            AS
            BEGIN
                IF (NEW.ID IS NULL) THEN NEW.ID = NEXT VALUE FOR GEN_FINCAT_ID;
            END
            """,
            "INSERT INTO FINANCIAL_CATEGORIES (NAME, CAT_TYPE) VALUES ('Dízimo', 'IN')",
            "INSERT INTO FINANCIAL_CATEGORIES (NAME, CAT_TYPE) VALUES ('Oferta', 'IN')",
            "INSERT INTO FINANCIAL_CATEGORIES (NAME, CAT_TYPE) VALUES ('Aluguel', 'OUT')",
            "INSERT INTO FINANCIAL_CATEGORIES (NAME, CAT_TYPE) VALUES ('Energia', 'OUT')",
            "INSERT INTO FINANCIAL_CATEGORIES (NAME, CAT_TYPE) VALUES ('Água', 'OUT')",
            
            # Tabela Financeiro
            "CREATE TABLE FINANCIAL (ID INTEGER NOT NULL PRIMARY KEY, DESCRIPTION VARCHAR(200) NOT NULL, AMOUNT DECIMAL(18,2) NOT NULL, CATEGORY VARCHAR(50), TRANS_TYPE VARCHAR(10) NOT NULL, TRANS_DATE TIMESTAMP DEFAULT 'NOW')",
            "CREATE GENERATOR GEN_FINANCIAL_ID",
            """
            CREATE TRIGGER BI_FINANCIAL FOR FINANCIAL
            ACTIVE BEFORE INSERT POSITION 0
            AS
            BEGIN
                IF (NEW.ID IS NULL) THEN NEW.ID = NEXT VALUE FOR GEN_FINANCIAL_ID;
            END
            """,
            # Usuário Admin Padrão
            "CREATE TABLE USERS_ADMIN (ID INTEGER NOT NULL PRIMARY KEY, NAME VARCHAR(100), EMAIL VARCHAR(150) NOT NULL UNIQUE, PASSWORD_HASH VARCHAR(255) NOT NULL)",
            "CREATE GENERATOR GEN_USERS_ID",
            """
            CREATE TRIGGER BI_USERS FOR USERS_ADMIN
            ACTIVE BEFORE INSERT POSITION 0
            AS
            BEGIN
                IF (NEW.ID IS NULL) THEN NEW.ID = NEXT VALUE FOR GEN_USERS_ID;
            END
            """,
            # Inserir usuário inicial (senha: senha123 - hash bcrypt)
            "INSERT INTO USERS_ADMIN (NAME, EMAIL, PASSWORD_HASH) VALUES ('Administrador', 'admin@igreja.com', '$2b$12$Ju2Im4pXcNovnD32tEXKeuLp8fFtG633wodlJzmGls1ENXgnbdU/u')"
        ]

        for cmd in ddl_commands:
            try:
                cur.execute(cmd)
                conn.commit()
            except Exception as e:
                print(f"Aviso no comando SQL: {e}")
                conn.rollback()

        print("Estrutura do banco de dados pronta!")
        conn.close()
    except Exception as e:
        print(f"Erro ao configurar tabelas: {e}")

if __name__ == "__main__":
    init_db()
