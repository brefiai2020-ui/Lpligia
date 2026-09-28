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

# Email (proxy gerenciado Emergent — constante, nunca de env)
EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ["EMERGENT_EMAIL_KEY"]
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


def merge_settings(doc) -> dict:
    merged = dict(DEFAULT_SETTINGS)
    if doc:
        merged.update({k: v for k, v in doc.items() if k in DEFAULT_SETTINGS})
    return merged


async def current_settings() -> dict:
    return merge_settings(await db.site_settings.find_one({}, {"_id": 0}))


def format_brl(amount_reais) -> str:
    return f"R$ {float(amount_reais):.2f}".replace(".", ",")


def format_brl_cents(cents) -> str:
    return f"R$ {int(round(cents)) / 100:.2f}".replace(".", ",")


def price_cents(settings: dict, method: str) -> int:
    # Regra do briefing: PIX = 18990 | CARD = 22900 (centavos), derivados das configurações.
    if method == "PIX":
        return int(round(float(settings["pricePix"]) * 100))
    if method == "CARD":
        return int(round(float(settings["priceCard"]) * 100))
    raise ValueError("Método inválido")


# ---------- Vagas (controle atômico) ----------

async def get_seats_counter() -> dict:
    doc = await db.counters.find_one({"_id": "confirmed_sales"})
    if doc is None:
        await db.counters.update_one({"_id": "confirmed_sales"}, {"$setOnInsert": {"count": 0}}, upsert=True)
        doc = await db.counters.find_one({"_id": "confirmed_sales"})
    return doc


async def get_available_seats(settings: Optional[dict] = None) -> int:
    s = settings or await current_settings()
    counter = await get_seats_counter()
    return max(0, int(s["capacity"]) - int(counter["count"]))


async def try_occupy_seat(capacity: int) -> bool:
    # Atômico: só ocupa se count < capacity — nunca passa de 50.
    doc = await db.counters.find_one_and_update(
        {"_id": "confirmed_sales", "count": {"$lt": capacity}},
        {"$inc": {"count": 1}},
    )
    return doc is not None


async def release_seat() -> None:
    await db.counters.update_one({"_id": "confirmed_sales", "count": {"$gt": 0}}, {"$inc": {"count": -1}})


async def next_registration_code() -> str:
    doc = await db.counters.find_one_and_update(
        {"_id": "registration_code"},
        {"$inc": {"count": 1}},
        upsert=True,
        return_document=True,
    )
    return f"MNT-2026-{doc['count']:04d}"


# ---------- Senha / JWT ----------

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(user: dict) -> str:
    payload = {
        "sub": user["user_id"],
        "email": user["email"],
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(user: dict) -> str:
    payload = {
        "sub": user["user_id"],
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_admin(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        header = request.headers.get("Authorization", "")
        token = header[7:] if header.startswith("Bearer ") else None
    if not token:
        raise HTTPException(status_code=401, detail="Não autenticado.")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Token inválido.")
        user = await db.users.find_one({"user_id": payload["sub"]})
        if not user or user.get("role") != "admin":
            raise HTTPException(status_code=401, detail="Acesso restrito.")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sessão expirada.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido.")
    user.pop("password_hash", None)
    user.pop("_id", None)
    return user


# ---------- Email (playbook Resend) ----------

_SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly")
_CRED_ASK = ("reply with your password", "reply with the code", "send your password", "cvv",
             "send us your password", "enter your password below", "confirm your card number",
             "your full card number", "seed phrase", "recovery phrase", "verify your card",
             "social security number", "confirm your bank details")
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)


def _host_ok(host: str) -> bool:
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)


def _same_site(shown: str, real: str) -> bool:
    return shown == real or real.endswith("." + shown) or shown.endswith("." + real)


class _EmailScan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags, self.urls, self.anchors = set(), [], []
        self._href, self._text = None, []

    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]
        if tag.lower() == "a":
            self._href = dict((k.lower(), v) for k, v in attrs).get("href")
            self._text = []

    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, "".join(self._text)))
            self._href, self._text = None, []


def _assert_safe_email(subject: str, html: str) -> None:
    scan = _EmailScan()
    scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms or input fields in email (G2)")
    body = f"{subject}\n{html}".lower()
    for p in _CRED_ASK:
        if p in body:
            raise ValueError(f"Email asks the recipient for credentials: {p!r} (G2)")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not low.startswith("https://"):
            raise ValueError(f"Email links/assets must be absolute https: {url!r} (G3)")
        host = urlparse(low).hostname or ""
        if not _host_ok(host) or urlparse(low).username is not None:
            raise ValueError(f"Shortened, numeric-host or credential-bearing URL: {url!r} (G3)")
    for href, text in scan.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real:
            continue
        for m in _HOSTISH.finditer(text):
            if not _same_site(m.group(1).lower(), real):
                raise ValueError(f"Anchor text {m.group(1)!r} ≠ real link host {real!r} (G3)")


async def send_email(*, to: str, subject: str, html: str, reply_to: Optional[str] = None) -> Optional[str]:
    _assert_safe_email(subject, html)
    payload = {"to": [to], "subject": subject, "html": html, "from_name": EMAIL_FROM_NAME}
    if reply_to or os.environ.get("EMAIL_REPLY_TO"):
        payload["contact_email"] = reply_to or os.environ.get("EMAIL_REPLY_TO")
    try:
        async with httpx.AsyncClient(timeout=30) as client_http:
            resp = await client_http.post(
                f"{EMAIL_BASE_URL}/api/v1/email/send",
                headers={"X-Email-Key": EMAIL_KEY},
                json=payload,
            )
        resp.raise_for_status()
        return resp.json().get("id")
    except httpx.HTTPStatusError as e:
        logger.error(f"Email send failed: {e.response.status_code} {e.response.text}")
        raise HTTPException(status_code=502, detail="Falha ao enviar e-mail.")
    except Exception as e:
        logger.error(f"Email send error: {str(e)}")
        raise HTTPException(status_code=500, detail="Falha ao enviar e-mail.")


def ticket_email_html(nome: str, code: str, method_label: str, amount: str, date_label: str) -> str:
    first = escape(nome.strip().split()[0]) if nome.strip() else ""
    return f"""<!doctype html>
<html><body style="margin:0;padding:0;background:#FAF8F5;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F5;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
  <tr><td style="background:#171615;padding:28px 32px;border-radius:16px 16px 0 0;text-align:center;">
    <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#C5A059;font-style:italic;">Mentoria em Grupo</p>
    <p style="margin:8px 0 0;font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;color:#FAF8F5;">DRA. LÍGIA JEANE MATROSKI</p>
  </td></tr>
  <tr><td style="background:#FFFFFF;padding:32px;border:1px solid #E5DEC1;border-top:none;">
    <p style="margin:0 0 14px;font-family:Arial,sans-serif;font-size:15px;color:#171615;">Olá, {first}!</p>
    <p style="margin:0 0 24px;font-family:Arial,sans-serif;font-size:15px;line-height:24px;color:#4A4643;">
      Seu pagamento foi <strong style="color:#2D5A3A;">confirmado</strong> e sua vaga na
      <strong>Mentoria em Grupo</strong> com a Dra. Lígia Jeane Matroski está garantida.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr><td style="padding:10px 0;border-bottom:1px solid #E5DEC1;font-family:Arial,sans-serif;font-size:12px;letter-spacing:1px;color:#8a8378;">DATA</td>
          <td align="right" style="padding:10px 0;border-bottom:1px solid #E5DEC1;font-family:Arial,sans-serif;font-size:14px;color:#171615;">{escape(date_label)}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #E5DEC1;font-family:Arial,sans-serif;font-size:12px;letter-spacing:1px;color:#8a8378;">PAGAMENTO</td>
          <td align="right" style="padding:10px 0;border-bottom:1px solid #E5DEC1;font-family:Arial,sans-serif;font-size:14px;color:#171615;">{escape(method_label)} · {escape(amount)}</td></tr>
      <tr><td style="padding:10px 0;font-family:Arial,sans-serif;font-size:12px;letter-spacing:1px;color:#8a8378;">INGRESSO</td>
          <td align="right" style="padding:10px 0;font-family:Arial,sans-serif;font-size:16px;color:#171615;"><strong>{escape(code)}</strong></td></tr>
    </table>
    <p style="margin:24px 0 0;font-family:Arial,sans-serif;font-size:13px;line-height:20px;color:#4A4643;">
      Guarde este e-mail: o código do ingresso será solicitado no momento do acesso ao encontro.
      Você também receberá a confirmação pelo WhatsApp.
    </p>
  </td></tr>
  <tr><td style="padding:20px;text-align:center;">
    <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#8a8378;">
      Enviado por {escape(EMAIL_FROM_NAME)}. Nunca pedimos senha ou dados de cartão por e-mail.
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>"""


async def send_ticket_email(reg: dict, code: str, method_label: str, amount: str, date_label: str) -> None:
    try:
        await send_email(
            to=reg["email"],
            subject=f"Pagamento confirmado — Ingresso {code} | Mentoria em Grupo",
            html=ticket_email_html(reg.get("nome", ""), code, method_label, amount, date_label),
        )
        logger.info(f"E-mail do ingresso {code} enviado para {reg['email']}")
    except Exception as e:
        logger.error(f"Falha ao enviar e-mail do ingresso {code}: {e}")


# ---------- WhatsApp (adaptador; inativo até WHATSAPP_API_URL ser configurada) ----------

async def send_whatsapp(registration_id: str, phone: str, message: str) -> str:
    log = {"id": str(uuid.uuid4()), "registration_id": registration_id, "phone": phone, "message": message}
    if not (WHATSAPP_API_URL and WHATSAPP_API_TOKEN):
        log.update({"status": "not_configured", "sent_at": datetime.now(timezone.utc).isoformat()})
        await db.whatsapp_logs.insert_one(log)
        return "not_configured"
    headers, body = {"Content-Type": "application/json"}, {}
    provider = WHATSAPP_PROVIDER.lower()
    if provider == "evolution":
        headers["apikey"] = WHATSAPP_API_TOKEN
        body = {"number": phone, "text": message}
    elif provider == "cloud":
        headers["Authorization"] = f"Bearer {WHATSAPP_API_TOKEN}"
        body = {"messaging_product": "whatsapp", "recipient_type": "individual", "to": phone, "type": "text",
                "text": {"preview_url": False, "body": message}}
    elif provider == "zapi":
        headers["Client-Token"] = WHATSAPP_API_TOKEN
        body = {"phone": phone, "message": message}
    else:
        headers["Authorization"] = f"Bearer {WHATSAPP_API_TOKEN}"
        body = {"to": phone, "message": message}
    try:
        async with httpx.AsyncClient(timeout=8.0) as client_http:
            resp = await client_http.post(WHATSAPP_API_URL, headers=headers, json=body)
        status = "sent" if resp.status_code < 300 else "failed"
    except Exception as e:
        logger.error(f"WhatsApp send error: {e}")
        status = "failed"
    log.update({"status": status, "sent_at": datetime.now(timezone.utc).isoformat()})
    await db.whatsapp_logs.insert_one(log)
    return status


def whatsapp_confirmation_message(nome: str, ticket_code: str, method_label: str, amount: str, date_label: str, ticket_url: str) -> str:
    first = nome.strip().split()[0] if nome.strip() else ""
    return (
        "🎉 PAGAMENTO CONFIRMADO!\n\n"
        f"Olá, {first}!\n\n"
        "Sua vaga para a Mentoria em Grupo com a Dra. Lígia Jeane Matroski está confirmada.\n\n"
        f"📅 {date_label}\n"
        f"🎟️ Ingresso:\n{ticket_code}\n\n"
        f"💰 Pagamento: {method_label}\n"
        f"Valor: {amount}\n\n"
        f"Seu ingresso:\n{ticket_url}\n\n"
        "Guarde este link e apresente o QR Code no dia do evento."
    )


# ---------- Confirmação de pagamento (núcleo idempotente) ----------

def method_label(method: str) -> str:
    return "Pix" if method == "PIX" else "Cartão"


async def process_paid(payment: dict, data: dict, force: bool = False) -> str:
    """Webhook/consulta confirmou pagamento: valida, ocupa vaga atomicamente, gera ingresso e avisa. Nunca processa duas vezes."""
    if payment.get("status") == "PAID":
        return "PAID"
    payment = await db.payments.find_one({"id": payment["id"]}, {"_id": 0})
    if payment.get("status") == "PAID":
        return "PAID"

    settings = await current_settings()
    expected = price_cents(settings, payment["payment_method"])
    paid_amount = data.get("paid_amount") or data.get("amount")
    if not force and paid_amount is not None and int(paid_amount) != expected:
        await db.payments.update_one(
            {"id": payment["id"], "status": {"$ne": "PAID"}},
            {"$set": {"status": "PAYMENT_REVIEW", "review_reason": "VALOR_DIVERGENTE",
                      "invoice_slug": data.get("invoice_slug"), "transaction_nsu": data.get("transaction_nsu"),
                      "receipt_url": data.get("receipt_url"), "paid_amount": paid_amount,
                      "installments": data.get("installments"), "capture_method": data.get("capture_method")}},
        )
        return "PAYMENT_REVIEW"

    if not await try_occupy_seat(int(settings["capacity"])):
        await db.payments.update_one(
            {"id": payment["id"], "status": {"$ne": "PAID"}},
            {"$set": {"status": "PAYMENT_REVIEW", "review_reason": "SEM_VAGAS_DISPONIVEIS",
                      "invoice_slug": data.get("invoice_slug"), "transaction_nsu": data.get("transaction_nsu"),
                      "receipt_url": data.get("receipt_url"), "paid_amount": paid_amount,
                      "installments": data.get("installments"), "capture_method": data.get("capture_method")}},
        )
        return "PAYMENT_REVIEW"

    now = datetime.now(timezone.utc).isoformat()
    await db.payments.update_one(
        {"id": payment["id"]},
        {"$set": {"status": "PAID", "paid_at": now,
                  "invoice_slug": data.get("invoice_slug"), "transaction_nsu": data.get("transaction_nsu"),
                  "receipt_url": data.get("receipt_url"), "paid_amount": paid_amount or expected,
                  "installments": data.get("installments") or (1 if payment["payment_method"] == "PIX" else settings["installments"]),
                  "capture_method": data.get("capture_method")}},
    )
    reg = await db.registrations.find_one({"id": payment["registration_id"]})
    if reg:
        await db.registrations.update_one(
            {"id": reg["id"]},
            {"$set": {"status": "CONFIRMED", "updated_at": now,
                      "method": payment["payment_method"], "amount_cents": expected}},
        )
        existing_ticket = await db.tickets.find_one({"registration_id": reg["id"]})
        if not existing_ticket:
            qr_token = secrets.token_urlsafe(24)
            await db.tickets.insert_one({
                "id": str(uuid.uuid4()),
                "registration_id": reg["id"],
                "ticket_code": reg["registration_code"],
                "qr_token": qr_token,
                "status": "VALID",
                "created_at": now,
                "validated_at": None,
                "validated_by": None,
            })
            ticket_url = f"{PUBLIC_APP_URL or ''}/ingresso/validar/{qr_token}"
            method_lbl = method_label(payment["payment_method"])
            amount_lbl = format_brl_cents(expected)
            date_lbl = settings["eventDateLabel"]
            asyncio.create_task(
                send_ticket_email(reg, reg["registration_code"], method_lbl, amount_lbl, date_lbl)
            )
            asyncio.create_task(
                send_whatsapp(
                    reg["id"], reg["whatsapp"],
                    whatsapp_confirmation_message(reg["nome"], reg["registration_code"], method_lbl, amount_lbl, date_lbl, ticket_url),
                )
            )
            if WHATSAPP_ADMIN_PHONE:
                asyncio.create_task(
                    send_whatsapp(
                        reg["id"], WHATSAPP_ADMIN_PHONE,
                        f"Nova venda confirmada: {reg['nome']} · {method_lbl} · {amount_lbl} · Ingresso {reg['registration_code']}",
                    )
                )
    return "PAID"


def normalize_webhook(payload: dict) -> dict:
    out = {}
    wanted = {"invoice_slug", "amount", "paid_amount", "installments", "capture_method", "transaction_nsu", "order_nsu", "receipt_url"}
    def walk(node):
        if isinstance(node, dict):
            for k, v in node.items():
                if k in wanted and k not in out and not isinstance(v, (dict, list)):
                    out[k] = v
                walk(v)
        elif isinstance(node, list):
            for item in node:
                walk(item)
    walk(payload or {})
    if "capture_method" in out and isinstance(out["capture_method"], str):
        cm = out["capture_method"].lower()
        out["capture_method"] = "PIX" if cm == "pix" else ("CARD" if "card" in cm or "credit" in cm else out["capture_method"])
    return out


# ---------- Modelos ----------

class RegistrationCreate(BaseModel):
    nome: str
    whatsapp: str
    email: EmailStr
    cpf: str
    consent: bool


class RegistrationUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    nome: Optional[str] = None
    whatsapp: Optional[str] = None
    email: Optional[EmailStr] = None
    cpf: Optional[str] = None
    status: Optional[str] = None


class PaymentCreate(BaseModel):
    registration_id: str
    payment_method: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SettingsUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    event_name: Optional[str] = None
    event_date: Optional[str] = None
    event_time: Optional[str] = None
    location: Optional[str] = None
    capacity: Optional[int] = None
    infinitepay_handle: Optional[str] = None
    eventDateLabel: Optional[str] = None
    eventDateShort: Optional[str] = None
    eventDateTicket: Optional[str] = None
    eventPlaceNote: Optional[str] = None
    slotsTotal: Optional[int] = None
    pricePix: Optional[float] = None
    priceCard: Optional[float] = None
    installments: Optional[int] = None
    photoUrl: Optional[str] = None
    videoUrl: Optional[str] = None
    whatsappNumber: Optional[str] = None
    instagram: Optional[str] = None
    soldOut: Optional[bool] = None
    heroTitle: Optional[str] = None
    heroSubtitle: Optional[str] = None
    heroQuote: Optional[str] = None
    connectionTitle: Optional[str] = None
    connectionHighlight: Optional[str] = None
    connectionText: Optional[str] = None
    impactQuote: Optional[str] = None
    finalTitle: Optional[str] = None
    finalText: Optional[str] = None
    formTitle: Optional[str] = None
    formSubtitle: Optional[str] = None
    consentText: Optional[str] = None
    colorPaper: Optional[str] = None
    colorBeige: Optional[str] = None
    colorInk: Optional[str] = None
    colorGold: Optional[str] = None
    colorRose: Optional[str] = None


# ---------- Rotas públicas ----------

@api_router.get("/")
async def root():
    return {"message": "Hello World"}


@api_router.get("/settings")
async def get_settings_public():
    settings = await current_settings()
    available = await get_available_seats(settings)
    settings["availableSeats"] = available
    settings["soldOut"] = bool(settings["soldOut"]) or available <= 0
    return settings


@api_router.post("/registrations")
async def create_registration(input: RegistrationCreate):
    settings = await current_settings()
    if settings["soldOut"] or await get_available_seats(settings) <= 0:
        raise HTTPException(status_code=403, detail="Inscrições encerradas.")
    if not input.consent:
        raise HTTPException(status_code=400, detail="É necessário aceitar o uso dos seus dados.")
    nome = input.nome.strip()
    if len(nome) < 3:
        raise HTTPException(status_code=400, detail="Informe seu nome completo.")
    if len(re.sub(r"\D", "", input.whatsapp)) < 10:
        raise HTTPException(status_code=400, detail="Informe um WhatsApp válido.")
    if len(re.sub(r"\D", "", input.cpf)) != 11:
        raise HTTPException(status_code=400, detail="Informe um CPF válido.")
    now = datetime.now(timezone.utc).isoformat()
    reg = {
        "id": str(uuid.uuid4()),
        "registration_code": await next_registration_code(),
        "nome": nome,
        "whatsapp": input.whatsapp.strip(),
        "email": input.email.lower().strip(),
        "cpf": re.sub(r"\D", "", input.cpf),
        "consent": True,
        "status": "PENDING_PAYMENT",
        "order_nsu": None,
        "method": None,
        "amount_cents": None,
        "created_at": now,
        "updated_at": now,
    }
    await db.registrations.insert_one(reg)
    return {"id": reg["id"], "registration_code": reg["registration_code"], "status": reg["status"]}


@api_router.post("/payment/create")
async def create_payment(input: PaymentCreate):
    # payment_method válido: PIX | CARD (qualquer outro é rejeitado). Valor SEMPRE definido no backend.
    input.payment_method = (input.payment_method or "").upper()
    if input.payment_method not in ("PIX", "CARD"):
        raise HTTPException(status_code=400, detail="Método de pagamento inválido.")
    reg = await db.registrations.find_one({"id": input.registration_id})
    if not reg:
        raise HTTPException(status_code=404, detail="Inscrição não encontrada.")
    if reg.get("status") != "PENDING_PAYMENT":
        raise HTTPException(status_code=400, detail="Esta inscrição não está mais pendente de pagamento.")
    settings = await current_settings()
    if await get_available_seats(settings) <= 0:
        raise HTTPException(status_code=403, detail="Inscrições encerradas.")

    amount = price_cents(settings, input.payment_method)
    order_nsu = f"{reg['registration_code']}-{secrets.token_hex(3).upper()}"
    description = f"{settings['event_name']} — Dra. Lígia Jeane Matroski"
    phone_digits = re.sub(r"\D", "", reg["whatsapp"])
    customer = {
        "name": reg["nome"],
        "email": reg["email"],
        "phone_number": f"+55{phone_digits}",
    }
    checkout_url = None
    slug = None
    if INFINITEPAY_SANDBOX or not INFINITEPAY_HANDLE:
        # Modo sandbox do preview: nenhum dado sai para a InfinitePay; o webhook é simulado nos testes.
        checkout_url = f"{PUBLIC_APP_URL or ''}/pagamento-concluido?order_nsu={order_nsu}&sandbox=1"
        if not INFINITEPAY_SANDBOX:
            raise HTTPException(status_code=503, detail="Checkout ainda não configurado: informe o infinitepay_handle no servidor.")
    else:
        payload = {
            "handle": INFINITEPAY_HANDLE,
            "items": [{"quantity": 1, "price": amount, "description": description}],
            "order_nsu": order_nsu,
            "redirect_url": f"{PUBLIC_APP_URL}/pagamento-concluido",
            "webhook_url": f"{PUBLIC_APP_URL}/api/webhooks/infinitepay",
            "customer": customer,
        }
        try:
            async with httpx.AsyncClient(timeout=20) as client_http:
                resp = await client_http.post(f"{INFINITEPAY_API_URL}/links", json=payload)
                resp.raise_for_status()
                rdata = resp.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"InfinitePay /links falhou: {e.response.status_code} {e.response.text}")
            raise HTTPException(status_code=502, detail="Não foi possível abrir o checkout agora. Tente novamente.")
        except Exception as e:
            logger.error(f"InfinitePay /links erro: {e}")
            raise HTTPException(status_code=502, detail="Não foi possível abrir o checkout agora. Tente novamente.")
        slug = rdata.get("slug") or rdata.get("invoice_slug")
        checkout_url = rdata.get("url") or rdata.get("checkout_url") or rdata.get("link")
        if not checkout_url and slug:
            checkout_url = f"https://pay.infinitepay.io/{INFINITEPAY_HANDLE}/{slug}"
        if not checkout_url:
            raise HTTPException(status_code=502, detail="Checkout criado sem URL de retorno. Contate o suporte.")

    now = datetime.now(timezone.utc).isoformat()
    payment = {
        "id": str(uuid.uuid4()),
        "registration_id": reg["id"],
        "order_nsu": order_nsu,
        "invoice_slug": slug,
        "transaction_nsu": None,
        "payment_method": input.payment_method,
        "amount": amount,
        "paid_amount": None,
        "installments": 1 if input.payment_method == "PIX" else int(settings["installments"]),
        "capture_method": None,
        "receipt_url": None,
        "status": "PENDING_PAYMENT",
        "checkout_url": checkout_url,
        "created_at": now,
        "paid_at": None,
    }
    await db.payments.insert_one(payment)
    await db.registrations.update_one(
        {"id": reg["id"]},
        {"$set": {"order_nsu": order_nsu, "method": input.payment_method, "amount_cents": amount, "updated_at": now}},
    )
    return {"checkout_url": checkout_url, "order_nsu": order_nsu, "amount": amount, "payment_method": input.payment_method}


@api_router.get("/payments/{order_nsu}/status")
async def payment_status(order_nsu: str):
    payment = await db.payments.find_one({"order_nsu": order_nsu}, {"_id": 0})
    if not payment:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado.")
    return {
        "status": payment["status"],
        "order_nsu": order_nsu,
        "payment_method": payment.get("payment_method"),
        "amount": payment.get("amount"),
        "review_reason": payment.get("review_reason"),
    }


@api_router.post("/payments/{order_nsu}/check")
async def payment_check(order_nsu: str):
    # Consulta oficial de status na InfinitePay (o webhook continua sendo a via principal).
    payment = await db.payments.find_one({"order_nsu": order_nsu})
    if not payment:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado.")
    if payment.get("status") != "PENDING_PAYMENT":
        return {"status": payment["status"], "order_nsu": order_nsu}
    if INFINITEPAY_SANDBOX or not INFINITEPAY_HANDLE or not payment.get("transaction_nsu"):
        return {"status": payment["status"], "order_nsu": order_nsu, "checked": False}
    body = {
        "handle": INFINITEPAY_HANDLE,
        "order_nsu": order_nsu,
        "transaction_nsu": payment.get("transaction_nsu"),
        "slug": payment.get("invoice_slug"),
    }
    try:
        async with httpx.AsyncClient(timeout=15) as client_http:
            resp = await client_http.post(f"{INFINITEPAY_API_URL}/payment_check", json=body)
            resp.raise_for_status()
            rdata = resp.json()
    except Exception as e:
        logger.error(f"payment_check erro: {e}")
        return {"status": payment["status"], "order_nsu": order_nsu, "checked": False}
    if rdata.get("paid"):
        status = await process_paid(
            payment,
            {"amount": rdata.get("amount"), "paid_amount": rdata.get("paid_amount"),
             "installments": rdata.get("installments"), "capture_method": rdata.get("capture_method")},
        )
        return {"status": status, "order_nsu": order_nsu, "checked": True}
    return {"status": payment["status"], "order_nsu": order_nsu, "checked": True}


@api_router.post("/webhooks/infinitepay")
async def infinitepay_webhook(request: Request):
    try:
        payload = await request.json()
    except Exception:
        return JSONResponse({"ok": False}, status_code=400)
    data = normalize_webhook(payload)
    order_nsu = data.get("order_nsu")
    transaction_nsu = data.get("transaction_nsu")
    if not order_nsu:
        return JSONResponse({"ok": False}, status_code=400)

    payment = await db.payments.find_one({"order_nsu": order_nsu})
    if not payment:
        logger.warning(f"Webhook para order_nsu desconhecido: {order_nsu}")
        return JSONResponse({"ok": False}, status_code=400)

    # Idempotência: mesma transação ou pedido já pago → nada a fazer.
    if payment.get("transaction_nsu") and payment["transaction_nsu"] == transaction_nsu:
        return {"ok": True, "status": payment["status"]}
    if payment.get("status") == "PAID":
        return {"ok": True, "status": "PAID"}

    status = await process_paid(payment, data)
    return {"ok": True, "status": status}


@api_router.get("/registrations/{rid}")
async def get_registration_public(rid: str):
    reg = await db.registrations.find_one({"id": rid}, {"_id": 0})
    if not reg:
        raise HTTPException(status_code=404, detail="Inscrição não encontrada.")
    ticket = await db.tickets.find_one({"registration_id": rid}, {"_id": 0})
    return {
        "id": reg["id"],
        "registration_code": reg.get("registration_code"),
        "nome": reg["nome"],
        "status": reg["status"],
        "ticket_code": (ticket or {}).get("ticket_code") or reg.get("registration_code"),
        "qr_token": (ticket or {}).get("qr_token"),
        "method": reg.get("method"),
        "amount_cents": reg.get("amount_cents"),
    }


@api_router.get("/tickets/{token}")
async def ticket_validation(token: str):
    ticket = await db.tickets.find_one({"qr_token": token}, {"_id": 0})
    if not ticket:
        return {"valid": False, "state": "INVALID"}
    reg = await db.registrations.find_one({"id": ticket["registration_id"]}, {"_id": 0})
    settings = await current_settings()
    return {
        "valid": ticket["status"] in ("VALID", "USED"),
        "state": ticket["status"],
        "name": reg["nome"] if reg else "",
        "ticket_code": ticket["ticket_code"],
        "event_name": settings["event_name"],
        "event_date": settings["eventDateLabel"],
    }


# ---------- Auth ----------

@api_router.post("/auth/login")
async def login(input: LoginRequest, request: Request, response: Response):
    email = input.email.lower().strip()
    identifier = f"{request.client.host if request.client else 'unknown'}:{email}"
    now = datetime.now(timezone.utc)
    att = await db.login_attempts.find_one({"identifier": identifier})
    if att and att.get("locked_until") and datetime.fromisoformat(att["locked_until"]) > now:
        raise HTTPException(status_code=429, detail="Muitas tentativas. Tente novamente em alguns minutos.")
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(input.password, user.get("password_hash", "")):
        count = (att.get("count", 0) + 1) if att else 1
        update = {"count": count}
        if count >= 5:
            update = {"count": 0, "locked_until": (now + timedelta(minutes=15)).isoformat()}
        await db.login_attempts.update_one({"identifier": identifier}, {"$set": update}, upsert=True)
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos.")
    await db.login_attempts.delete_one({"identifier": identifier})
    access = create_access_token(user)
    refresh = create_refresh_token(user)
    response.set_cookie(key="access_token", value=access, httponly=True, secure=True, samesite="none", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=refresh, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    return {"user": {"user_id": user["user_id"], "email": user["email"], "name": user.get("name"), "role": user.get("role")}, "access_token": access}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_admin)):
    return user


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


# ---------- Admin ----------

@api_router.get("/admin/registrations")
async def admin_registrations(user: dict = Depends(get_current_admin)):
    regs = await db.registrations.find({}, {"_id": 0}).sort("created_at", -1).to_list(2000)
    counts = {
        "total": len(regs),
        "confirmed": len([r for r in regs if r.get("status") == "CONFIRMED"]),
        "pending": len([r for r in regs if r.get("status") == "PENDING_PAYMENT"]),
    }
    return {"registrations": regs, "counts": counts}


@api_router.put("/admin/registrations/{rid}")
async def admin_update_registration(rid: str, input: RegistrationUpdate, user: dict = Depends(get_current_admin)):
    reg = await db.registrations.find_one({"id": rid})
    if not reg:
        raise HTTPException(status_code=404, detail="Inscrição não encontrada.")
    data = {k: v for k, v in input.model_dump().items() if v is not None}
    if "cpf" in data:
        data["cpf"] = re.sub(r"\D", "", data["cpf"])
        if len(data["cpf"]) != 11:
            raise HTTPException(status_code=400, detail="CPF inválido.")
    if "status" in data and data["status"] not in ("PENDING_PAYMENT", "CONFIRMED", "CANCELLED"):
        raise HTTPException(status_code=400, detail="Status inválido.")
    data["updated_at"] = datetime.now(timezone.utc).isoformat()

    # Regra de cancelamento definida pelo administrador: cancelar inscrição confirmada libera a vaga.
    if data.get("status") == "CANCELLED" and reg.get("status") == "CONFIRMED":
        await release_seat()
        await db.tickets.update_one({"registration_id": rid}, {"$set": {"status": "CANCELLED"}})
        await db.payments.update_many({"registration_id": rid, "status": "PAID"}, {"$set": {"status": "CANCELLED"}})
    if data.get("status") == "CONFIRMED" and reg.get("status") != "CONFIRMED":
        if await try_occupy_seat(int((await current_settings())["capacity"])):
            ticket = await db.tickets.find_one({"registration_id": rid})
            if not ticket:
                qr_token = secrets.token_urlsafe(24)
                await db.tickets.insert_one({
                    "id": str(uuid.uuid4()), "registration_id": rid,
                    "ticket_code": reg.get("registration_code"), "qr_token": qr_token,
                    "status": "VALID", "created_at": data["updated_at"],
                    "validated_at": None, "validated_by": None,
                })
        else:
            raise HTTPException(status_code=400, detail="Sem vagas disponíveis para confirmar.")
    if data:
        await db.registrations.update_one({"id": rid}, {"$set": data})
    return await db.registrations.find_one({"id": rid}, {"_id": 0})


@api_router.delete("/admin/registrations/{rid}")
async def admin_delete_registration(rid: str, user: dict = Depends(get_current_admin)):
    reg = await db.registrations.find_one({"id": rid})
    if reg and reg.get("status") == "CONFIRMED":
        await release_seat()
    result = await db.registrations.delete_one({"id": rid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Inscrição não encontrada.")
    await db.payments.delete_many({"registration_id": rid})
    await db.tickets.delete_many({"registration_id": rid})
    return {"ok": True}


@api_router.post("/admin/registrations/{rid}/resend-email")
async def admin_resend_email(rid: str, user: dict = Depends(get_current_admin)):
    reg = await db.registrations.find_one({"id": rid})
    if not reg:
        raise HTTPException(status_code=404, detail="Inscrição não encontrada.")
    if reg.get("status") != "CONFIRMED":
        raise HTTPException(status_code=400, detail="Só é possível reenviar após a confirmação do pagamento.")
    settings = await current_settings()
    method_lbl = method_label(reg.get("method") or "PIX")
    email_id = await send_email(
        to=reg["email"],
        subject=f"Pagamento confirmado — Ingresso {reg['registration_code']} | Mentoria em Grupo",
        html=ticket_email_html(
            reg["nome"], reg["registration_code"], method_lbl,
            format_brl_cents(reg.get("amount_cents") or 0), settings["eventDateLabel"],
        ),
    )
    return {"ok": True, "email_id": email_id}


@api_router.get("/admin/dashboard")
async def admin_dashboard(user: dict = Depends(get_current_admin)):
    settings = await current_settings()
    counter = await get_seats_counter()
    paid = await db.payments.find({"status": "PAID"}, {"_id": 0, "amount": 1, "payment_method": 1}).to_list(5000)
    pending = await db.payments.count_documents({"status": "PENDING_PAYMENT"})
    review = await db.payments.count_documents({"status": "PAYMENT_REVIEW"})
    confirmed = int(counter["count"])
    revenue = sum(p["amount"] for p in paid)
    return {
        "capacity": int(settings["capacity"]),
        "confirmed": confirmed,
        "available": max(0, int(settings["capacity"]) - confirmed),
        "revenueTotal": revenue / 100,
        "revenuePix": sum(p["amount"] for p in paid if p["payment_method"] == "PIX") / 100,
        "revenueCard": sum(p["amount"] for p in paid if p["payment_method"] == "CARD") / 100,
        "pendingPayments": pending,
        "reviewPayments": review,
    }


@api_router.get("/admin/payments")
async def admin_payments(user: dict = Depends(get_current_admin)):
    payments = await db.payments.find({}, {"_id": 0}).sort("created_at", -1).to_list(2000)
    regs = {r["id"]: r for r in await db.registrations.find({}, {"_id": 0, "id": 1, "nome": 1, "email": 1}).to_list(2000)}
    tickets = {t["registration_id"]: t for t in await db.tickets.find({}, {"_id": 0}).to_list(2000)}
    out = []
    for p in payments:
        reg = regs.get(p["registration_id"], {})
        out.append({
            "id": p["id"],
            "name": reg.get("nome", "—"),
            "order_nsu": p.get("order_nsu"),
            "payment_method": p.get("payment_method"),
            "amount": p.get("amount"),
            "paid_amount": p.get("paid_amount"),
            "status": p.get("status"),
            "created_at": p.get("created_at"),
            "paid_at": p.get("paid_at"),
            "transaction_nsu": p.get("transaction_nsu"),
            "ticket_code": (tickets.get(p["registration_id"]) or {}).get("ticket_code"),
            "receipt_url": p.get("receipt_url"),
            "review_reason": p.get("review_reason"),
            "installments": p.get("installments"),
        })
    return {"payments": out}


@api_router.post("/admin/payments/{pid}/approve")
async def admin_approve_payment(pid: str, user: dict = Depends(get_current_admin)):
    payment = await db.payments.find_one({"id": pid})
    if not payment:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado.")
    if payment.get("status") == "PAID":
        return {"ok": True, "status": "PAID"}
    data = {"paid_amount": payment.get("paid_amount"), "invoice_slug": payment.get("invoice_slug"),
            "transaction_nsu": payment.get("transaction_nsu"), "receipt_url": payment.get("receipt_url"),
            "installments": payment.get("installments"), "capture_method": payment.get("capture_method")}
    status = await process_paid(payment, data, force=True)
    if status == "PAYMENT_REVIEW":
        raise HTTPException(status_code=400, detail="Sem vagas disponíveis para aprovar.")
    return {"ok": True, "status": status}


@api_router.post("/admin/payments/{pid}/reject")
async def admin_reject_payment(pid: str, user: dict = Depends(get_current_admin)):
    payment = await db.payments.find_one({"id": pid})
    if not payment:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado.")
    if payment.get("status") == "PAID":
        raise HTTPException(status_code=400, detail="Pagamento já confirmado.")
    await db.payments.update_one({"id": pid}, {"$set": {"status": "FAILED"}})
    await db.registrations.update_one({"id": payment["registration_id"], "status": {"$ne": "CONFIRMED"}},
                                      {"$set": {"status": "PENDING_PAYMENT"}})
    return {"ok": True, "status": "FAILED"}


@api_router.post("/admin/tickets/{token}/use")
async def admin_use_ticket(token: str, user: dict = Depends(get_current_admin)):
    ticket = await db.tickets.find_one({"qr_token": token})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ingresso não encontrado.")
    if ticket.get("status") == "USED":
        raise HTTPException(status_code=400, detail="Ingresso já utilizado.")
    if ticket.get("status") != "VALID":
        raise HTTPException(status_code=400, detail="Ingresso não está válido.")
    await db.tickets.update_one(
        {"qr_token": token},
        {"$set": {"status": "USED", "validated_at": datetime.now(timezone.utc).isoformat(), "validated_by": user["email"]}},
    )
    return {"ok": True, "status": "USED"}


@api_router.put("/admin/settings")
async def admin_save_settings(input: SettingsUpdate, user: dict = Depends(get_current_admin)):
    data = {k: v for k, v in input.model_dump().items() if v is not None}
    for key in ("colorPaper", "colorBeige", "colorInk", "colorGold", "colorRose"):
        if key in data and not COLOR_RE.match(data[key]):
            raise HTTPException(status_code=400, detail=f"Cor inválida em {key}.")
    if "pricePix" in data and data["pricePix"] < 0:
        raise HTTPException(status_code=400, detail="Preço inválido.")
    if "priceCard" in data and data["priceCard"] < 0:
        raise HTTPException(status_code=400, detail="Preço inválido.")
    if "capacity" in data and not 0 <= data["capacity"] <= 1000:
        raise HTTPException(status_code=400, detail="Capacidade inválida.")
    if "installments" in data and not 1 <= data["installments"] <= 12:
        raise HTTPException(status_code=400, detail="Parcelamento inválido.")
    if data:
        await db.site_settings.update_one({}, {"$set": data}, upsert=True)
        if "capacity" in data:
            pass  # contador de vagas continua atômico contra a nova capacidade
    return await current_settings()


# ---------- Seed + eventos ----------

async def seed_admin():
    email = os.environ.get("ADMIN_EMAIL", "admin@draligia.com").lower()
    password = os.environ.get("ADMIN_PASSWORD", "Mentoria2026!")
    existing = await db.users.find_one({"email": email})
    if existing is None:
        await db.users.insert_one({
            "user_id": str(uuid.uuid4()),
            "email": email,
            "password_hash": hash_password(password),
            "name": "Administradora",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info("Admin semeado com sucesso.")
    elif not verify_password(password, existing["password_hash"]):
        await db.users.update_one({"email": email}, {"$set": {"password_hash": hash_password(password)}})
        logger.info("Hash da senha do admin atualizado.")


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.registrations.create_index("id")
    await db.registrations.create_index("registration_code")
    await db.payments.create_index("order_nsu", unique=True)
    await db.payments.create_index("transaction_nsu")
    await db.tickets.create_index("qr_token", unique=True)
    await db.tickets.create_index("registration_id")
    await db.counters.update_one({"_id": "confirmed_sales"}, {"$setOnInsert": {"count": 0}}, upsert=True)
    await db.counters.update_one({"_id": "registration_code"}, {"$setOnInsert": {"count": 0}}, upsert=True)
    await seed_admin()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


from fastapi.responses import JSONResponse  # noqa: E402

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
