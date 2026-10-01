from dotenv import load_dotenv

load_dotenv()

import os
import re
import uuid
import asyncio
import ipaddress
import secrets
import logging
from datetime import datetime, timezone, timedelta
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse

import httpx
import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

# MongoDB
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# JWT
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"

# Email: Resend direto (API HTTP oficial). Credenciais 100% por variável de ambiente.
RESEND_URL = "https://api.resend.com/emails"
EMAIL_FROM_NAME = os.environ["EMAIL_FROM_NAME"]

# InfinitePay / WhatsApp / URLs
INFINITEPAY_HANDLE = os.environ.get("INFINITEPAY_HANDLE", "")
INFINITEPAY_API_URL = os.environ.get("INFINITEPAY_API_URL", "https://api.checkout.infinitepay.io")
PUBLIC_APP_URL = os.environ.get("PUBLIC_APP_URL", "").rstrip("/")
INFINITEPAY_SANDBOX = os.environ.get("INFINITEPAY_SANDBOX", "") == "1"
WHATSAPP_API_URL = os.environ.get("WHATSAPP_API_URL", "")
WHATSAPP_API_TOKEN = os.environ.get("WHATSAPP_API_TOKEN", "")
WHATSAPP_ADMIN_PHONE = os.environ.get("WHATSAPP_ADMIN_PHONE", "")
WHATSAPP_PROVIDER = os.environ.get("WHATSAPP_PROVIDER", "generic")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DEFAULT_SETTINGS = {
    "event_name": "Mentoria em Grupo",
    "event_date": "10 de outubro de 2026",
    "event_time": "",
    "location": "",
    "capacity": 50,
    "infinitepay_handle": "",
    "eventDateLabel": "10 de outubro de 2026",
    "eventDateShort": "10/10/2026",
    "eventDateTicket": "10 OUTUBRO 2026",
    "eventPlaceNote": "Horário e local serão informados em breve.",
    "slotsTotal": 50,
    "pricePix": 189.90,
    "priceCard": 229.00,
    "installments": 3,
    "photoUrl": "",
    "videoUrl": "",
    "whatsappNumber": "",
    "instagram": "@draligijeanematroski",
    "soldOut": False,
    "heroTitle": "Tudo começa quando\nvocê decide olhar\npara dentro.",
    "heroSubtitle": "Uma experiência de mentoria em grupo para mulheres que desejam ampliar a consciência, compreender seus padrões e abrir espaço para novas possibilidades.",
    "heroQuote": "Um encontro para parar, olhar e se escutar.",
    "connectionTitle": "Talvez você não precise de mais respostas.",
    "connectionHighlight": "Talvez precise de um espaço para fazer novas perguntas.",
    "connectionText": "Muitas vezes seguimos no automático — sem parar para perceber nossos pensamentos, escolhas, padrões e possibilidades. Este encontro é um convite para interromper esse ritmo com calma, presença e escuta.",
    "impactQuote": "Você não precisa ter todas as respostas.\nPrecisa se permitir olhar.",
    "finalTitle": "Reserve esse momento para você.",
    "finalText": "Uma experiência em grupo para parar, olhar para dentro e ampliar suas possibilidades.",
    "formTitle": "Vamos reservar sua vaga?",
    "formSubtitle": "Leva menos de um minuto.",
    "consentText": "Concordo com o uso dos meus dados para fins de inscrição e comunicação sobre o evento.",
    "colorPaper": "#F2EAE0",
    "colorBeige": "#A98E72",
    "colorInk": "#3A2E27",
    "colorGold": "#C5A880",
    "colorRose": "#C4705C",
}

COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")

