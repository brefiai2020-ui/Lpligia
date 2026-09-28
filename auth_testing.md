# Auth Testing Playbook — Mentoria Dra. Lígia

## MongoDB Verification
```
mongosh
use test_database
db.users.find({role: "admin"}).pretty()
db.users.findOne({role: "admin"}, {password_hash: 1})
```
Verify: bcrypt hash starts with `$2b$`, unique index on users.email, login_attempts.identifier, payments.order_nsu (unique), tickets.qr_token (unique), counters.{confirmed_sales, registration_code}.

## API Testing
```
curl -c /tmp/cookies.txt -X POST http://localhost:8001/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@draligia.com","password":"Mentoria2026!"}'
cat /tmp/cookies.txt
curl -b /tmp/cookies.txt http://localhost:8001/api/auth/me
```
Login returns user object + sets access_token/refresh_token httpOnly cookies. `/me` returns the same user.

## Fluxo real de pagamento (InfinitePay)
```
REG=$(curl -s -X POST http://localhost:8001/api/registrations -H "Content-Type: application/json" -d '{"nome":"Maria Teste","whatsapp":"47998887766","email":"delivered@resend.dev","cpf":"12345678909","consent":true}')
# -> {id, registration_code: MNT-2026-XXXX, status: PENDING_PAYMENT}
PAY=$(curl -s -X POST http://localhost:8001/api/payment/create -H "Content-Type: application/json" -d "{\"registration_id\":\"$(echo $REG | python3 -c 'import sys,json;print(json.load(sys.stdin)["id"])')\",\"payment_method\":\"PIX\"}")
# PIX -> amount 18990 | CARD -> 22900 (centavos, sempre definido no backend)
# Com INFINITEPAY_SANDBOX=1 no .env do backend, checkout_url aponta para /pagamento-concluido (simulado).
# Sem sandbox e com INFINITEPAY_HANDLE configurado, a URL real vem de POST https://api.checkout.infinitepay.io/links.
```

## Webhook (via principal de confirmação, idempotente por transaction_nsu)
```
curl -s -X POST http://localhost:8001/api/webhooks/infinitepay -H "Content-Type: application/json" -d '{"invoice_slug":"abc","amount":18990,"paid_amount":18990,"installments":1,"capture_method":"pix","transaction_nsu":"TX-1","order_nsu":"MNT-2026-0001-XXXXXX","receipt_url":"https://comprovante/1"}'
# PAID -> ocupa vaga atomicamente (contador < capacity), gera ticket MNT-2026-XXXX + qr_token,
# envia e-mail (Resend) e WhatsApp (adaptador; logado em whatsapp_logs como not_configured até configurar WHATSAPP_API_URL/TOKEN).
# Reenviar o mesmo webhook retorna 200 sem processar de novo.
# Valor divergente ou chegada sem vaga -> PAYMENT_REVIEW (painel admin > Pagamentos > aprovar/rejeitar).
```

## Testes de vagas (capacidade temporária)
Definir `{"capacity":3}` via PUT /api/admin/settings, vender 3, 4º webhook -> PAYMENT_REVIEW, webhook duplicado não ocupa 2ª vaga. Voltar `{"capacity":50}` no fim.

## Admin-protected routes
```
TOKEN=$(curl -s -X POST http://localhost:8001/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@draligia.com","password":"Mentoria2026!"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")
curl -s http://localhost:8001/api/admin/dashboard -H "Authorization: Bearer $TOKEN"
curl -s http://localhost:8001/api/admin/payments -H "Authorization: Bearer $TOKEN"
curl -s -X PUT http://localhost:8001/api/admin/settings -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"pricePix":189.90}'
```
Without token these return 401.

