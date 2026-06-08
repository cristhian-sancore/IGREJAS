import fdb

def fix_db():
    try:
        conn = fdb.connect(
            host='localhost', 
            database='C:/coisas/IGREJAS/database/CHMS.FDB', 
            user='SYSDBA', 
            password='masterkey', 
            charset='UTF8'
        )
        cur = conn.cursor()
        
        # O hash correto para 'senha123' gerado anteriormente
        correct_hash = '$2b$12$Ju2Im4pXcNovnD32tEXKeuLp8fFtG633wodlJzmGls1ENXgnbdU/u'
        
        cur.execute("UPDATE USERS_ADMIN SET PASSWORD_HASH = ? WHERE EMAIL = ?", (correct_hash, 'admin@igreja.com'))
        conn.commit()
        print("Hash atualizado com sucesso no script Python!")
        
        # Verifica agora
        cur.execute("SELECT PASSWORD_HASH FROM USERS_ADMIN")
        row = cur.fetchone()
        print(f"Hash no banco agora: [{row[0]}]")
        
        conn.close()
    except Exception as e:
        print(f"Erro ao consertar banco: {e}")

if __name__ == "__main__":
    fix_db()
