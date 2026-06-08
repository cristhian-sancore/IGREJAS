# ⛪ Portal da Igreja + ChMS

Este é o código base para o sistema de gestão de igrejas.

## 🚀 Como rodar o Backend

1.  **Instale os requisitos:**
    ```bash
    pip install -r backend/requirements.txt
    ```

2.  **Configure o Banco de Dados:**
    *   O banco padrão esperado é o Firebird 2.5.
    *   Você pode configurar o caminho no arquivo `backend/app/database.py` ou via variável de ambiente `FIREBIRD_DB_PATH`.

3.  **Inicie o Servidor:**
    ```bash
    cd backend
    uvicorn app.main:app --reload
    ```

4.  **Acesse a Documentação Interativa:**
    *   Abra `http://localhost:8000/docs` no seu navegador.

## 🔑 Login de Teste (Mock)
*   **Usuário:** `admin`
*   **Senha:** `senha123`

## 📁 Estrutura
*   `/backend/app/routers/public.py`: Endpoints abertos para o site.
*   `/backend/app/routers/admin.py`: Painel administrativo protegido por JWT.
*   `/backend/app/database.py`: Driver de conexão `fdb` para Firebird 2.5.
