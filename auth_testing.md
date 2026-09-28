# Auth Testing Playbook — Mentoria Dra. Lígia

## MongoDB Verification
```
mongosh
use test_database
db.users.find({role: "admin"}).pretty()
db.users.findOne({role: "admin"}, {password_hash: 1})
```
Verify: bcrypt hash starts with `$2b$`, unique index on users.email, index on login_attempts.identifier.

## API Testing
```
curl -c /tmp/cookies.txt -X POST http://localhost:8001/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@draligia.com","password":"Mentoria2026!"}'
cat /tmp/cookies.txt
curl -b /tmp/cookies.txt http://localhost:8001/api/auth/me
```
Login returns user object + sets access_token/refresh_token httpOnly cookies. `/me` returns the same user.

## E2E registration + payment + email
```
REG=$(curl -s -X POST http://localhost:8001/api/registrations -H "Content-Type: application/json" -d '{"nome":"Maria Teste","whatsapp":"47998887766","email":"delivered@resend.dev","cpf":"12345678909","consent":true}')
echo $REG
PAY=$(curl -s -X POST http://localhost:8001/api/registrations/$(echo $REG | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])")/checkout -H "Content-Type: application/json" -d '{"method":"pix"}')
echo $PAY
PID=$(echo $PAY | python3 -c "import sys,json;print(json.load(sys.stdin)['payment_id'])")
sleep 4
curl -s http://localhost:8001/api/payments/$PID/status
```
Auto-approves after ~3s, generates ticket code MNT-2026-XXXX and sends email via Resend (recipient = registration email).

## Admin-protected routes
```
TOKEN=$(curl -s -X POST http://localhost:8001/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@draligia.com","password":"Mentoria2026!"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")
curl -s http://localhost:8001/api/admin/registrations -H "Authorization: Bearer $TOKEN"
curl -s -X PUT http://localhost:8001/api/admin/settings -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"pricePix":189.90}'
```
Without token these return 401.
