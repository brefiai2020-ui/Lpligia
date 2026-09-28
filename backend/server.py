from dotenv import load_dotenv

load_dotenv()

import os
import re
import uuid
import asyncio
import ipaddress
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
from typing import Optional, List
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

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DEFAULT_SETTINGS = {
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
    "colorPaper": "#FAF8F5",
    "colorBeige": "#F3ECE3",
    "colorInk": "#171615",
    "colorGold": "#C5A059",
}

TEXT_SETTINGS = [k for k in DEFAULT_SETTINGS if k.startswith(("hero", "connection", "impact", "final", "form", "consent", "event"))]
COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")


def merge_settings(doc) -> dict:
    merged = dict(DEFAULT_SETTINGS)
    if doc:
        merged.update({k: v for k, v in doc.items() if k in DEFAULT_SETTINGS})
    return merged


async def current_settings() -> dict:
    return merge_settings(await db.site_settings.find_one({}, {"_id": 0}))


def format_brl(amount) -> str:
    return f"R$ {float(amount):.2f}".replace(".", ",")


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


async def send_ticket_email(reg: dict, code: str, method: str, amount: float) -> None:
    try:
        settings = await current_settings()
        method_label = "Pix" if method == "pix" else f"Cartão em até {settings['installments']}x"
        subject = f"Pagamento confirmado — Ingresso {code} | Mentoria em Grupo"
        html = ticket_email_html(reg.get("nome", ""), code, method_label, format_brl(amount), settings["eventDateLabel"])
        await send_email(to=reg["email"], subject=subject, html=html)
        logger.info(f"Ingresso {code} enviado para {reg['email']}")
    except Exception as e:
        logger.error(f"Falha ao enviar e-mail do ingresso {code}: {e}")


async def generate_unique_code() -> str:
    for _ in range(20):
        code = f"MNT-2026-{int.from_bytes(os.urandom(2), 'big') % 9000 + 1000}"
        if not await db.registrations.find_one({"ticket_code": code}):
            return code
    return f"MNT-2026-{uuid.uuid4().hex[:4].upper()}"


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


class CheckoutCreate(BaseModel):
    method: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SettingsUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")
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


# ---------- Rotas públicas ----------

@api_router.get("/")
async def root():
    return {"message": "Hello World"}


@api_router.get("/settings")
async def get_settings_public():
    return await current_settings()


@api_router.post("/registrations")
async def create_registration(input: RegistrationCreate):
    settings = await current_settings()
    if settings["soldOut"]:
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
    reg = {
        "id": str(uuid.uuid4()),
        "nome": nome,
        "whatsapp": input.whatsapp.strip(),
        "email": input.email.lower().strip(),
        "cpf": re.sub(r"\D", "", input.cpf),
        "consent": True,
        "status": "aguardando",
        "ticket_code": None,
        "method": None,
        "amount": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.registrations.insert_one(reg)
    return {"id": reg["id"], "nome": reg["nome"], "status": reg["status"]}


@api_router.post("/registrations/{rid}/checkout")
async def create_checkout(rid: str, input: CheckoutCreate):
    reg = await db.registrations.find_one({"id": rid})
    if not reg:
        raise HTTPException(status_code=404, detail="Inscrição não encontrada.")
    if input.method not in ("pix", "cartao"):
        raise HTTPException(status_code=400, detail="Forma de pagamento inválida.")
    settings = await current_settings()
    amount = settings["pricePix"] if input.method == "pix" else settings["priceCard"]
    payment = {
        "id": str(uuid.uuid4()),
        "registration_id": rid,
        "method": input.method,
        "amount": amount,
        "status": "processando",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.payments.insert_one(payment)
    await db.registrations.update_one(
        {"id": rid},
        {"$set": {"payment_id": payment["id"], "method": input.method, "amount": amount, "status": "processando"}},
    )
    # TODO(INTEGRAÇÃO): aqui entrará a URL/API real do Checkout InfinitePay.
    return {"payment_id": payment["id"], "amount": amount, "method": input.method, "status": "processando"}


@api_router.get("/payments/{pid}/status")
async def payment_status(pid: str):
    payment = await db.payments.find_one({"id": pid}, {"_id": 0})
    if not payment:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado.")
    if payment["status"] == "processando":
        created = datetime.fromisoformat(payment["created_at"])
        if datetime.now(timezone.utc) - created >= timedelta(seconds=3):
            # MOCK: aprovação automática (na integração real, o status virá da InfinitePay).
            code = await generate_unique_code()
            await db.payments.update_one({"id": pid}, {"$set": {"status": "aprovado", "ticket_code": code}})
            reg = await db.registrations.find_one({"id": payment["registration_id"]})
            if reg:
                await db.registrations.update_one(
                    {"id": reg["id"]}, {"$set": {"status": "pago", "ticket_code": code}}
                )
                asyncio.create_task(
                    send_ticket_email(reg, code, payment["method"], payment["amount"])
                )
            return {"status": "aprovado", "ticket_code": code, "method": payment["method"], "amount": payment["amount"]}
        return {"status": "processando"}
    return {"status": payment["status"], "ticket_code": payment.get("ticket_code")}


@api_router.get("/registrations/{rid}")
async def get_registration_public(rid: str):
    reg = await db.registrations.find_one({"id": rid}, {"_id": 0})
    if not reg:
        raise HTTPException(status_code=404, detail="Inscrição não encontrada.")
    return {
        "id": reg["id"],
        "nome": reg["nome"],
        "status": reg["status"],
        "ticket_code": reg.get("ticket_code"),
        "method": reg.get("method"),
        "amount": reg.get("amount"),
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
        "pagos": len([r for r in regs if r.get("status") == "pago"]),
        "aguardando": len([r for r in regs if r.get("status") in ("aguardando", "processando")]),
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
    if "status" in data and data["status"] not in ("aguardando", "processando", "pago", "recusado", "expirado"):
        raise HTTPException(status_code=400, detail="Status inválido.")
    send_email_task = None
    if data.get("status") == "pago" and reg.get("status") != "pago" and not reg.get("ticket_code"):
        code = await generate_unique_code()
        data["ticket_code"] = code
        method = data.get("method") or reg.get("method") or "pix"
        amount = reg.get("amount") or (await current_settings())["pricePix"]
        send_email_task = send_ticket_email({**reg, **data}, code, method, amount)
    if data:
        await db.registrations.update_one({"id": rid}, {"$set": data})
    if send_email_task:
        asyncio.create_task(send_email_task)
    updated = await db.registrations.find_one({"id": rid}, {"_id": 0})
    return updated


@api_router.delete("/admin/registrations/{rid}")
async def admin_delete_registration(rid: str, user: dict = Depends(get_current_admin)):
    result = await db.registrations.delete_one({"id": rid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Inscrição não encontrada.")
    return {"ok": True}


@api_router.post("/admin/registrations/{rid}/resend-email")
async def admin_resend_email(rid: str, user: dict = Depends(get_current_admin)):
    reg = await db.registrations.find_one({"id": rid})
    if not reg:
        raise HTTPException(status_code=404, detail="Inscrição não encontrada.")
    if reg.get("status") != "pago" or not reg.get("ticket_code"):
        raise HTTPException(status_code=400, detail="Só é possível reenviar após o pagamento confirmado.")
    email_id = await send_email(
        to=reg["email"],
        subject=f"Pagamento confirmado — Ingresso {reg['ticket_code']} | Mentoria em Grupo",
        html=ticket_email_html(
            reg["nome"], reg["ticket_code"],
            "Pix" if reg.get("method") == "pix" else "Cartão",
            format_brl(reg.get("amount") or 0),
            (await current_settings())["eventDateLabel"],
        ),
    )
    return {"ok": True, "email_id": email_id}


@api_router.put("/admin/settings")
async def admin_save_settings(input: SettingsUpdate, user: dict = Depends(get_current_admin)):
    data = {k: v for k, v in input.model_dump().items() if v is not None}
    for key in ("colorPaper", "colorBeige", "colorInk", "colorGold"):
        if key in data and not COLOR_RE.match(data[key]):
            raise HTTPException(status_code=400, detail=f"Cor inválida em {key}.")
    if "pricePix" in data and data["pricePix"] < 0:
        raise HTTPException(status_code=400, detail="Preço inválido.")
    if "priceCard" in data and data["priceCard"] < 0:
        raise HTTPException(status_code=400, detail="Preço inválido.")
    if "installments" in data and not 1 <= data["installments"] <= 12:
        raise HTTPException(status_code=400, detail="Parcelamento inválido.")
    if data:
        await db.site_settings.update_one({}, {"$set": data}, upsert=True)
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
    await db.payments.create_index("id")
    await seed_admin()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
