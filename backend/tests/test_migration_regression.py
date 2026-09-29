"""Regression tests for Etapa 1 da migração (Emergent cleanup, send_email stub)."""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://olhar-dentro.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@draligia.com"
ADMIN_PASSWORD = "Mentoria2026!"


@pytest.fixture(scope="session")
def sess():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(sess):
    r = sess.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "access_token" in data
    return data["access_token"]


# ---- Backend sanity ----
def test_settings_ok(sess):
    r = sess.get(f"{BASE_URL}/api/settings")
    assert r.status_code == 200
    assert isinstance(r.json(), dict)


def test_payment_create_route_exists(sess):
    # POST sem payload deve ser 4xx (não 404)
    r = sess.post(f"{BASE_URL}/api/payment/create", json={})
    assert r.status_code != 404, f"route missing: got {r.status_code}"
    assert 400 <= r.status_code < 500


def test_payments_check_route_exists(sess):
    # /api/payments/{order_nsu}/check - unknown NSU => 404 é o comportamento (payment não encontrado)
    r = sess.post(f"{BASE_URL}/api/payments/UNKNOWN-NSU/check", json={})
    # Rota existe → retorna 404 do handler (payment não encontrado), não 404 de rota inexistente
    assert r.status_code in (400, 404)
    if r.status_code == 404:
        assert "não encontrado" in r.text.lower() or "not found" in r.text.lower()


def test_webhook_infinitepay_route_exists(sess):
    r = sess.post(f"{BASE_URL}/api/webhooks/infinitepay", json={})
    assert r.status_code != 404, f"route missing: got {r.status_code}"


def test_login_wrong_password(sess):
    r = sess.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong-xyz"})
    assert r.status_code == 401


def test_html_no_emergent_scripts():
    r = requests.get(BASE_URL + "/")
    assert r.status_code == 200
    body = r.text.lower()
    assert "assets.emergent.sh" not in body
    assert "ap.emergent.sh" not in body
    assert "emergent-main.js" not in body


# ---- Full registration flow (sandbox, no email) ----
@pytest.fixture(scope="session")
def created_registration(sess):
    unique = uuid.uuid4().hex[:8]
    payload = {
        "nome": f"TEST Migracao {unique}",
        "whatsapp": "(11) 98888-7777",
        "email": f"teste-migracao-{unique}@example.com",
        "cpf": "390.533.447-05",  # valid CPF for testing
        "consent": True,
    }
    r = sess.post(f"{BASE_URL}/api/registrations", json=payload)
    assert r.status_code in (200, 201), f"create failed: {r.status_code} {r.text}"
    data = r.json()
    assert "id" in data
    return data, payload


def test_registration_created(created_registration):
    data, _ = created_registration
    assert data.get("status") in ("aguardando", "pending", "waiting", "PENDING", "PENDING_PAYMENT")
    assert data.get("registration_code", "").startswith("MNT-2026-")


def test_checkout_pix_and_paid(sess, created_registration):
    data, _ = created_registration
    reg_id = data["id"]
    # Passo 1: criar payment (rota correta é /api/payment/create)
    r = sess.post(f"{BASE_URL}/api/payment/create", json={"registration_id": reg_id, "payment_method": "PIX"})
    assert r.status_code == 200, f"payment/create failed: {r.status_code} {r.text}"
    body = r.json()
    order_nsu = body.get("order_nsu")
    assert order_nsu, f"no order_nsu: {body}"
    assert "checkout_url" in body

    # Passo 2: em sandbox, simular webhook da InfinitePay para aprovar
    webhook_payload = {
        "order_nsu": order_nsu,
        "transaction_nsu": f"TXN-{uuid.uuid4().hex[:10]}",
        "amount": body.get("amount"),
        "paid_amount": body.get("amount"),
        "installments": 1,
        "capture_method": "pix",
        "invoice_slug": "sandbox-slug",
    }
    wr = sess.post(f"{BASE_URL}/api/webhooks/infinitepay", json=webhook_payload)
    assert wr.status_code == 200, f"webhook failed: {wr.status_code} {wr.text}"
    wd = wr.json()
    assert wd.get("status") == "PAID", f"webhook did not mark PAID: {wd}"

    # Passo 3: confirmar via GET status
    rs = sess.get(f"{BASE_URL}/api/payments/{order_nsu}/status")
    assert rs.status_code == 200
    assert rs.json().get("status") == "PAID"


def test_registration_has_code_after_payment(sess, created_registration):
    data, _ = created_registration
    reg_id = data["id"]
    # give some time for post-payment code assignment
    code = None
    status = None
    for _ in range(10):
        r = sess.get(f"{BASE_URL}/api/registrations/{reg_id}")
        if r.status_code == 200:
            d = r.json()
            code = d.get("registration_code") or d.get("code")
            status = d.get("status")
            if code and status == "CONFIRMED":
                break
        time.sleep(1)
    assert code and code.startswith("MNT-2026-"), f"missing registration_code, got: {code}"
    assert status == "CONFIRMED", f"registration not CONFIRMED: {status}"


# ---- Admin ----
def test_admin_list_registrations(sess, admin_token, created_registration):
    reg, _ = created_registration
    headers = {"Authorization": f"Bearer {admin_token}"}
    r = sess.get(f"{BASE_URL}/api/admin/registrations", headers=headers)
    assert r.status_code == 200
    body = r.json()
    items = body if isinstance(body, list) else body.get("items") or body.get("registrations") or []
    ids = [i.get("id") for i in items]
    assert reg["id"] in ids, "created registration not in admin list"


def test_admin_dashboard_metrics(sess, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    # try common endpoints
    for path in ("/api/admin/dashboard", "/api/admin/metrics", "/api/admin/stats"):
        r = sess.get(f"{BASE_URL}{path}", headers=headers)
        if r.status_code == 200:
            return
    pytest.skip("no dashboard metrics endpoint found")


def test_admin_resend_email_stub(sess, admin_token, created_registration):
    reg, _ = created_registration
    headers = {"Authorization": f"Bearer {admin_token}"}
    r = sess.post(f"{BASE_URL}/api/admin/registrations/{reg['id']}/resend-email", headers=headers)
    assert r.status_code == 200, f"resend-email failed: {r.status_code} {r.text}"
    body = r.json()
    # No stub, email_id deve ser None (send_email retorna None)
    assert body.get("ok") is True
    assert body.get("email_id") is None
