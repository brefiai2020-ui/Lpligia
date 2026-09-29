# Mentoria em Grupo — Dra. Lígia Jeane Matroski

Landing page de venda de ingresso + fluxo de inscrição + pagamentos (InfinitePay) + ingresso digital com QR Code + painel administrativo.

**Stack:** React 19 (CRA + CRACO, JavaScript/JSX) · FastAPI (Python, arquivo único `backend/server.py`) · MongoDB (Motor assíncrono) · JWT + bcrypt · Tailwind CSS.

## Estrutura

```
frontend/          React (CRA) — landing, inscrição, ingresso, /admin
backend/           FastAPI — 22 rotas sob /api (server.py)
backend/Procfile   comando de start para Railway/Render
frontend/vercel.json  rewrites de SPA para a Vercel
tests/             testes
```

## A) Instalar o frontend

```bash
cd frontend
yarn install
cp .env.example .env   # preencha REACT_APP_BACKEND_URL
```

## B) Instalar o backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # preencha as variáveis (veja seção J)
```

## C) Configurar o MongoDB Atlas

1. Crie um cluster gratuito (M0) em [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. **Database Access**: crie um usuário/senha fortes.
3. **Network Access**: libere `0.0.0.0/0` (serverless/Vercel não tem IP fixo) — use senha forte.
4. Copie a connection string e monte `MONGO_URL`:

```
MONGO_URL=mongodb+srv://USUARIO:SENHA@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
DB_NAME=mentoria
```

- `MONGO_URL` e `DB_NAME` são lidos **exclusivamente de variáveis de ambiente** (`backend/server.py`) — não existe endereço fixo no código.
- Estratégia de conexão: **client global criado 1x por processo** (connection pool nativo do Motor) — nunca uma conexão por request.
- **Importar um dump**: `mongorestore --uri="$MONGO_URL" --nsFrom="test_database.*" --nsTo="$DB_NAME.*" backups/dump_xxx/`
- **Testar a conexão**: com o backend no ar, `curl http://localhost:8001/api/settings` deve responder 200.

## D) Configurar o Resend (e-mails)

1. Crie a conta em [resend.com](https://resend.com) → **API Keys → Create API Key** (permissão `sending_access` limitada ao domínio).
2. **Domains**: adicione seu domínio e publique no DNS os registros SPF/DKIM até ficar **Verified**.
3. Configure no ambiente do backend (nunca no código):

```
RESEND_API_KEY=re_xxxxxxxx
EMAIL_FROM=noreply@seudominio.com
EMAIL_FROM_NAME=Dra. Lígia Jeane Matroski
```

- Envia via `POST https://api.resend.com/emails` (httpx, sem SDK).
- Sem `RESEND_API_KEY`/`EMAIL_FROM` configurados, o sistema **não quebra**: registra um warning e segue (útil para desenvolvimento).
- E-mails enviados pelo sistema: confirmação/ingresso após pagamento aprovado (automático, manual pelo admin e reenvio por inscrita).

## E) Configurar a InfinitePay

- `INFINITEPAY_HANDLE`: sua InfiniteTag (conta InfinitePay).
- `INFINITEPAY_API_URL`: padrão `https://api.checkout.infinitepay.io` (não precisa mudar).
- `PUBLIC_APP_URL`: URL pública usada em redirect e webhook — **em produção aponte para o domínio do backend**.
- `INFINITEPAY_SANDBOX=1`: modo sandbox (checkout simulado; nada sai para a InfinitePay). **Deixe `=1` até o ambiente novo estar 100% testado.** Em produção: remova/zere.
- Webhook a cadastrar na InfinitePay: `POST {PUBLIC_APP_URL}/api/webhooks/infinitepay`.
- Fluxo preservado: checkout (`/api/payment/create`) → webhook idempotente por `transaction_nsu` → `payment_check` para consulta manual.

## F) Configurar o WhatsApp (opcional)

Adaptador pronto para `generic`, `cloud` (Meta), `evolution` e `zapi`:

```
WHATSAPP_PROVIDER=cloud
WHATSAPP_API_URL=https://sua-api...
WHATSAPP_API_TOKEN=...
WHATSAPP_ADMIN_PHONE=5531...
```

Sem credenciais, o sistema só registra `not_configured` e segue normal. Botões wa.me continuam funcionando.

## G) Rodar localmente

```bash
# terminal 1 — backend (porta 8001)
cd backend && source .venv/bin/activate
CORS_ORIGINS=http://localhost:3000 uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# terminal 2 — frontend (porta 3000)
cd frontend && yarn start
```

## H) Publicar o frontend na Vercel

1. Envie o repositório ao GitHub (o `.gitignore` já protege segredos).
2. Na Vercel: **Add Project → importe o repo** → Root Directory: `frontend` (build `yarn build`, output `build` — auto-detectado).
3. Variável de ambiente: `REACT_APP_BACKEND_URL` = URL pública do backend (ex.: `https://seu-backend.up.railway.app`).
4. `frontend/vercel.json` já contém os rewrites de SPA (refresh em /admin, /inscricao/... etc. funciona).

## I) Publicar o backend no Railway ou Render

- **Root directory**: `backend`.
- Start (Procfile já incluído): `uvicorn server:app --host 0.0.0.0 --port $PORT`.
- Render: use **Web Service** + ambiente **Python** (`PYTHON_VERSION=3.12`); Railway detecta o Procfile.
- Configure as variáveis da seção J no painel da plataforma (nunca em arquivos).
- Após o primeiro deploy: cadastre o webhook na InfinitePay e troque `INFINITEPAY_SANDBOX`.

## J) Variáveis de ambiente

**Backend (`backend/.env.example`)** — todas via ambiente, nunca no código:

| Variável | Uso |
|---|---|
| `MONGO_URL` | connection string do MongoDB Atlas |
| `DB_NAME` | nome do banco |
| `CORS_ORIGINS` | origens do frontend separadas por vírgula — **obrigatório explícito** (cookies não funcionam com `*`): `http://localhost:3000` em dev; `https://seu-frontend.vercel.app` em produção |
| `JWT_SECRET` | segredo dos tokens — gere com `openssl rand -hex 32` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | admin semeado no startup (**sem senha padrão no código** — gere senha forte) |
| `RESEND_API_KEY` / `EMAIL_FROM` / `EMAIL_FROM_NAME` | envio de e-mails |
| `INFINITEPAY_HANDLE` / `INFINITEPAY_API_URL` / `INFINITEPAY_SANDBOX` / `PUBLIC_APP_URL` | pagamentos |
| `WHATSAPP_PROVIDER` / `WHATSAPP_API_URL` / `WHATSAPP_API_TOKEN` / `WHATSAPP_ADMIN_PHONE` | WhatsApp (opcional) |

**Frontend (`frontend/.env.example`)**: `REACT_APP_BACKEND_URL` (embutida no build).

## K) Backup do banco

```bash
mongodump --uri="$MONGO_URL" --db="$DB_NAME" --out=backups/dump_$(date +%Y%m%d_%H%M)
```

Coleções do sistema: `users`, `site_settings`, `counters`, `registrations`, `payments`, `tickets`, `whatsapp_logs` (+`login_attempts`, operacional). Migrar obrigatoriamente: `users`, `site_settings`, `counters`; as demais conforme houver dados reais.

## L) Restaurar banco

```bash
mongorestore --uri="$MONGO_URL" --nsFrom="test_database.*" --nsTo="$DB_NAME.*" backups/dump_xxx/
```

## M) Testar pagamento (sandbox)

Com `INFINITEPAY_SANDBOX=1`: inscrição → checkout simulado → `/pagamento-concluido` → status auto-aprova e gera ingresso `MNT-2026-XXXX`. Nada sai para a InfinitePay.

## N) Testar webhook

```bash
curl -X POST "$API/api/webhooks/infinitepay" -H "Content-Type: application/json" \
  -d '{"order_nsu":"MNT-2026-XXXX-XXXXXX","transaction_nsu":"tx_teste_1","amount":18990,"paid_amount":18990,"capture_method":"pix"}'
```

Idempotente por `transaction_nsu`; valida valor contra o esperado (divergente vai para análise manual) e consome vaga atomicamente.

## O) Validar ingresso

URL do QR: `/ingresso/validar/{qr_token}` — mostra ✅ válido / ⚠️ já utilizado / ❌ inválido. O admin marca como utilizado em `/admin` → ingressos.

## Segurança

- `.env`, dumps e credenciais **nunca** vão ao GitHub (`.gitignore` cobre tudo).
- Rode `git ls-files | xargs grep -l "re_\|SECRET\|PASSWORD" ` para auditoria antes de cada push.
- Troque `JWT_SECRET` e `ADMIN_PASSWORD` ao subir o ambiente novo.
