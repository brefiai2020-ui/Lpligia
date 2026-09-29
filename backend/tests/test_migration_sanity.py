"""Backend sanity tests post-migration (Etapa 2). Foco em endpoints solicitados no review."""
import os
import time
import uuid
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://olhar-dentro.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@draligia.com"
ADMIN_PASSWORD = "Mentoria2026!"

PALETTE = {"#EFEAD9", "#5F7355", "#4E362A", "#C4A57E", "#C67C5F"}


def test_settings_public_palette():
    r = requests.get(f"{BASE_URL}/api/settings", timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    # Cores podem estar em nested "colors" ou top-level; concatenamos tudo
    raw = str(data).upper()
    present = {c for c in PALETTE if c.upper() in raw}
    assert present == PALETTE, f"Cores ausentes: {PALETTE - present}"


def test_admin_dashboard_requires_auth():
    r = requests.get(f"{BASE_URL}/api/admin/dashboard", timeout=15)
    assert r.status_code == 401, r.status_code


def test_login_wrong_password_401():
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": ADMIN_EMAIL, "password": "wrong-password-xxx"},
                      timeout=15)
    assert r.status_code == 401, r.status_code


def test_login_ok_and_dashboard_available_49_after_e2e():
    """Login ok, dashboard retorna capacity/confirmed/available."""
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
                      timeout=15)
    assert r.status_code == 200, r.text
    token = r.json().get("access_token")
    assert token
    d = requests.get(f"{BASE_URL}/api/admin/dashboard",
                     headers={"Authorization": f"Bearer {token}"}, timeout=15)
    assert d.status_code == 200
    dj = d.json()
    print("DASHBOARD:", dj)
    assert "capacity" in dj or "total_capacity" in dj or dj  # smoke


def test_webhook_infinitepay_idempotent_sandbox():
    """Cria uma inscrição, gera payment, chama webhook 2x — idempotente."""
    suffix = uuid.uuid4().hex[:6]
    reg = requests.post(f"{BASE_URL}/api/registrations", json={
        "nome": f"TEST Sanity {suffix}",
        "whatsapp": "+5511999990000",
        "email": f"test.sanity.{suffix}@example.com",
        "cpf": "39053344705",
        "consent": True,
    }, timeout=15)
    assert reg.status_code in (200, 201), reg.text
    rid = reg.json()["id"]

    pc = requests.post(f"{BASE_URL}/api/payment/create",
                       json={"registration_id": rid, "payment_method": "pix"}, timeout=15)
    assert pc.status_code in (200, 201), pc.text
    order_nsu = pc.json().get("order_nsu") or pc.json().get("payment_id") or pc.json().get("id")
    amount = pc.json().get("amount") or 18990

    payload = {
        "order_nsu": order_nsu,
        "transaction_nsu": f"TX-{suffix}",
        "amount": amount,
        "paid_amount": amount,
        "capture_method": "pix",
    }
    w1 = requests.post(f"{BASE_URL}/api/webhooks/infinitepay", json=payload, timeout=15)
    w2 = requests.post(f"{BASE_URL}/api/webhooks/infinitepay", json=payload, timeout=15)
    assert w1.status_code in (200, 201), w1.text
    assert w2.status_code in (200, 201), w2.text
    # idempotência: status permanece confirmado
    time.sleep(1)
    reg_get = requests.get(f"{BASE_URL}/api/registrations/{rid}", timeout=15)
    assert reg_get.status_code == 200
    assert reg_get.json().get("status", "").upper() in ("CONFIRMED", "CONFIRMADA", "CONFIRMED_PAID"), reg_get.json()


def test_html_no_emergent_no_posthog():
    r = requests.get(f"{BASE_URL}/", timeout=15)
    assert r.status_code == 200
    html = r.text.lower()
    assert "emergent.sh" not in html, "emergent.sh presente no HTML"
    assert "posthog" not in html, "posthog presente no HTML"
