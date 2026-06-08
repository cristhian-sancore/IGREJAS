import asyncio
import logging
import sys
import io

# Forçar saída UTF-8 para evitar erro de encoding no Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from app.services.automation import check_birthdays

# Configuração de logs
logging.basicConfig(level=logging.INFO)

async def test_birthday_trigger():
    print("Iniciando teste manual de gatilho de aniversarios...")
    print("Verificando se ha membros com aniversario hoje no banco de dados...")
    
    try:
        await check_birthdays()
        print("\nVerificacao concluida!")
        print("Se houver aniversariantes hoje e Webhooks ativos em 'Configuracoes', eles foram disparados.")
    except Exception as e:
        print(f"\nErro durante o teste: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_birthday_trigger())
