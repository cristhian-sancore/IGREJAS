from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.routers import public, admin
from app.auth import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, timedelta, verify_password
from app.database import get_db
from fastapi.middleware.cors import CORSMiddleware

from app.services.automation import start_scheduler

app = FastAPI(
    title="ChMS Igreja - Portal & Gestão",
    description="API para o sistema de gestão e portal da igreja integrada ao Firebird 2.5",
    version="0.2.0"
)

@app.on_event("startup")
async def startup_event():
    start_scheduler()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://admin.cristhiansancore.com.br",
        "https://adminibn.cristhiansancore.com.br"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(public.router)
app.include_router(admin.router)

@app.post("/public/login", tags=["Autenticação"])
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db=Depends(get_db)):
    """Autenticação real consultando a tabela USERS_ADMIN do Firebird."""
    if not db:
        # Fallback para desenvolvimento local caso o banco esteja inacessível
        if form_data.username == "admin" and form_data.password == "senha123":
            return {"access_token": create_access_token({"sub": "admin"}), "token_type": "bearer"}
        raise HTTPException(status_code=500, detail="Banco de dados inacessível")

    cur = db.cursor()
    cur.execute("SELECT PASSWORD_HASH, NAME FROM USERS_ADMIN WHERE EMAIL = ?", (form_data.username,))
    user = cur.fetchone()

    if not user or not verify_password(form_data.password, user[0]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": form_data.username, "name": user[1]}, 
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/")
async def root():
    return {"message": "API Igreja Firebird 2.5 Online"}
