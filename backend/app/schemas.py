from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime

class MemberCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    birth_date: Optional[date] = None
    is_baptized: Optional[int] = 0
    is_visitor: Optional[int] = 0
    is_active: int = 1
    accepts_notifications: Optional[int] = 1

class MemberResponse(BaseModel):
    id: int
    name: str
    phone: Optional[str]
    address: Optional[str]
    birth_date: Optional[date]
    join_date: Optional[date]
    is_baptized: Optional[int] = 0
    is_visitor: Optional[int] = 0
    is_active: int
    accepts_notifications: Optional[int] = 1

class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    event_date: datetime
    is_public: int = 1
    image_url: Optional[str] = None
    image_base64: Optional[str] = None

class EventResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    event_date: datetime
    is_public: int
    image_url: Optional[str] = None
    image_base64: Optional[str] = None

class FinancialCreate(BaseModel):
    description: str
    amount: float
    category: Optional[str] = "Geral"
    trans_type: str # 'IN' ou 'OUT'
    due_date: Optional[date] = None
    payment_date: Optional[date] = None
    is_paid: Optional[int] = 0

class FinancialResponse(BaseModel):
    id: int
    description: str
    amount: float
    category: Optional[str]
    trans_type: str
    trans_date: datetime
    due_date: Optional[date]
    payment_date: Optional[date]
    is_paid: Optional[int]

class CategoryCreate(BaseModel):
    name: str
    cat_type: str # 'IN' ou 'OUT'

class CategoryResponse(BaseModel):
    id: int
    name: str
    cat_type: str
class CellCreate(BaseModel):
    name: str
    address: str
    leader: str
    co_leader: Optional[str] = None
    map_url: Optional[str] = None
    category: Optional[str] = "Adultos"

class CellResponse(BaseModel):
    id: int
    name: str
    address: str
    leader: str
    co_leader: Optional[str]
    map_url: Optional[str]
    category: Optional[str]

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    access_level: str # 'ADMIN', 'OPERADOR', 'VISUALIZADOR'

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    access_level: str

class WebhookConfig(BaseModel):
    url: str
    event_type: str # 'MEMBER_CREATED', 'FINANCIAL_TRANSACTION', etc.
    is_active: int = 1

class WebhookResponse(WebhookConfig):
    id: int

class WebhookTemplate(BaseModel):
    event_type: str
    content: str

class WebhookTemplateUpdate(BaseModel):
    content: str

class EvolutionConfigResponse(BaseModel):
    base_url: Optional[str] = None
    api_key: Optional[str] = None
    instance_name: Optional[str] = None
    is_enabled: int = 0

class WebhookTemplateTest(BaseModel):
    event_type: str
    phone: str
    content: Optional[str] = None

class NotificationRecipient(BaseModel):
    name: str
    phone: str
    is_active: int = 1

class NotificationRecipientResponse(NotificationRecipient):
    id: int

class AutomationResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    is_enabled: int
    schedule: Optional[str]

class N8NConfigResponse(BaseModel):
    base_url: Optional[str] = None
    api_key: Optional[str] = None
    is_enabled: int = 0
