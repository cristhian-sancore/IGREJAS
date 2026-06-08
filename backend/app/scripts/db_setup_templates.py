import fdb
from app.database import DB_PATH, DB_USER, DB_PASS

def setup_templates():
    db_name = DB_PATH.split(':')[-1]
    
    # Passo 1: Criar a tabela
    try:
        conn = fdb.connect(host='localhost', database=db_name, user=DB_USER, password=DB_PASS, charset='UTF8')
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE WEBHOOK_TEMPLATES (
                EVENT_TYPE VARCHAR(50) PRIMARY KEY,
                CONTENT BLOB SUB_TYPE TEXT
            )
        """)
        conn.commit()
        conn.close()
        print("Tabela WEBHOOK_TEMPLATES criada.")
    except Exception as e:
        print(f"Erro na criacao (provavelmente ja existe): {e}")

    # Passo 2: Inserir defaults
    try:
        conn = fdb.connect(host='localhost', database=db_name, user=DB_USER, password=DB_PASS, charset='UTF8')
        cur = conn.cursor()
        
        defaults = [
            ('BIRTHDAY', '🎉 Feliz Aniversário, {name}! Que Deus te abençoe grandemente neste dia especial. 🎂'),
            ('EVENT', '📢 *Lembrete de Evento Hoje!* \n\n📌 *{title}* \n⏰ Horário: {time} \n\nNão perca! Com o amor de Cristo.'),
            ('MEMBER_CREATED', '🤝 Bem-vindo(a) à nossa igreja, {name}! É uma alegria ter você conosco. Que Deus te abençoe! ✨'),
            ('FINANCIAL_TRANSACTION', '💰 Registro Financeiro: {description} no valor de R$ {amount} ({type}).'),
            ('EVENT_CREATED', '📅 Novo evento agendado: {title} para o dia {date}. Marque na sua agenda!')
        ]
        
        for event, content in defaults:
            try:
                cur.execute("INSERT INTO WEBHOOK_TEMPLATES (EVENT_TYPE, CONTENT) VALUES (?, ?)", (event, content))
            except:
                # Se ja existir, atualiza
                cur.execute("UPDATE WEBHOOK_TEMPLATES SET CONTENT = ? WHERE EVENT_TYPE = ?", (content, event))
        
        conn.commit()
        conn.close()
        print("Templates padrão inseridos/atualizados.")
        
    except Exception as e:
        print(f"Erro na insercao: {e}")

if __name__ == "__main__":
    setup_templates()
