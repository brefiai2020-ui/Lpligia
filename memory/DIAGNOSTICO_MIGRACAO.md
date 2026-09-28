# Diagnóstico Técnico — Migração GitHub + Vercel + Supabase
Data: 2026-09-28 · Baseado nos arquivos reais de /app · Nenhuma alteração de código foi feita.

## Respostas 1–20

1. **Frontend**: React 19.0.0 com Create React App (`react-scripts 5.0.1`) + CRACO 7.1.0. NÃO é Next.js, NÃO é Vite. Roteamento com react-router-dom 7.18. Estilos Tailwind 3.4 + shadcn/radix. Gerenciador: Yarn 1.22.
2. **Linguagem**: JavaScript (JSX). Não há TypeScript em nenhum dos dois lados.
3. **Backend**: Python/FastAPI 0.110 — arquivo único `/app/backend/server.py` (1.126 linhas), servido por uvicorn na porta 8001. Acesso ao banco com Motor (MongoDB assíncrono). Auth própria: JWT (pyjwt, HS256) + bcrypt.
4. **APIs server-side**: Sim — 23 rotas sob `/api`: settings (GET/PUT), registrations (POST/GET), payment/create, payments/{nsu}/status, payments/{nsu}/check, webhooks/infinitepay, tickets/{token}, auth/login|me|logout, admin/registrations (GET/PUT/DELETE), admin/resend-email, admin/dashboard, admin/payments, admin/payments/{pid}/approve|reject, admin/tickets/{token}/use.
5. **Arquivos do Emergent**: `/app/.emergent/` (configs/crons da plataforma — ignorar no export); devDependencies `@emergentbase/overlay` e `@emergentbase/visual-edits` (carregam SOMENTE no dev-server, com fail-open); script `https://assets.emergent.sh/scripts/emergent-main.js` em `public/index.html` linha 20; env `ENABLE_HEALTH_CHECK`/`WDS_SOCKET_PORT` (só preview). Nenhum prende a aplicação em produção — são removíveis em minutos.
6. **Roda local sem Emergent?** Sim. Stack 100% padrão: `pip install -r backend/requirements.txt` + MongoDB (local ou Atlas) + `yarn install && yarn start`. Único ajuste: remover os itens do item 5 e trocar o proxy de e-mail (item 18).
7. **Vercel?** Frontend: sim, build estático (`yarn build` → `build/`) com rewrites de SPA. Backend: FastAPI roda como Vercel Python Function (wrapper ASGI), com ressalvas do item 20 — ou em um serviço long-running.
8. **Supabase como banco?** Supabase é PostgreSQL — NÃO é substituto direto do MongoDB. Duas rotas: (A) manter MongoDB e usar Atlas free tier (zero mudança de código); (B) migrar para Supabase Postgres reescrevendo a camada de dados de server.py (motor → asyncpg/SQLAlchemy + schema SQL). As coleções são simples (7), então o rewrite é limitado, porém real.
9. **Dependências incompatíveis com Vercel?** Nenhuma dura. `@emergentbase/*` são dev-only e removíveis. CRA está em manutenção pela Meta mas compila normalmente.
10. **Conversões necessárias**: se o backend for na Vercel → empacotar FastAPI como Vercel Function (padrão `api/index.py` + `vercel.json`). Supabase Edge Functions: NÃO são necessárias neste desenho (o backend continua sendo FastAPI). Se escolher a rota B (Postgres), convertem-se as funções de dados, não as rotas.
11. **Onde está cada coisa** (tudo REAL, sem mock):
   - Cadastro: `frontend/src/pages/Signup.jsx` → POST `/api/registrations` (Mongo `registrations`).
   - Inscrições: coleção `registrations` + painel `/admin` (`components/admin/RegistrationsPanel.jsx`) → `/api/admin/registrations*`.
   - Pagamentos: coleção `payments` + `/api/payment/create` (cria checkout na InfinitePay), webhook `/api/webhooks/infinitepay`, `/api/payments/{nsu}/check`; painel `PaymentsPanel.jsx`.
   - Vagas: coleção `counters` (contador atômico `confirmed_sales`) + capacidade em `site_settings` — nunca ultrapassa 50; esgotado → "Inscrições encerradas".
   - Painel admin: `pages/Admin.jsx` + `components/admin/*` + `/api/auth/*` e `/api/admin/*` (JWT + bcrypt + limitador de tentativas em `login_attempts`).
   - Ingressos: coleção `tickets` (ticket_code MNT-2026-XXXX + qr_token seguro), página `/inscricao/ingresso`.
   - QR Code: `qrcode.react` renderiza URL `/ingresso/validar/{qr_token}`; validação em `pages/TicketValidation.jsx` + `/api/tickets/{token}` e `/api/admin/tickets/{token}/use`.
12. **Real vs mockado**: REAL = banco MongoDB, auth JWT, controle atômico de vagas, QR/validação, criação de checkout InfinitePay + webhook + payment_check (em modo sandbox no preview), e-mails enviados via proxy do Emergent. INATIVO/MOCKADO = cobrança real InfinitePay (falta handle; `INFINITEPAY_SANDBOX=1`), envio WhatsApp (adaptador pronto para generic/cloud/evolution/zapi, sem credenciais), vídeo (placeholder), foto oficial (monograma), textos de Política/Termos.
13. **O que falta**: InfinitePay → `INFINITEPAY_HANDLE` real, `INFINITEPAY_SANDBOX=""`, `PUBLIC_APP_URL` = domínio de produção, testar 1 pagamento real. Supabase → escolher rota A/B, criar projeto, schema e string de conexão. Resend → `RESEND_API_KEY` + domínio/remetente verificado e trocar a função `send_email` do proxy pela API direta. WhatsApp → escolher provedor e preencher `WHATSAPP_API_URL/TOKEN/PROVIDER/ADMIN_PHONE`.
14. **Banco do Emergent**: MongoDB gerenciado no pod (`MONGO_URL` em backend/.env, `DB_NAME=test_database`). Coleções atuais: counters(2), login_attempts(1), payments(1), registrations(2), site_settings(1), tickets(0), users(1). Export: botão "Go to database" (MongoDB Viewer → Dump DB / Export all, link válido 4 dias) ou `mongodump --uri="$MONGO_URL" --db=$DB_NAME` no terminal do pod (mongodump/mongoexport já instalados em /usr/bin).
15. **Arquivos a modificar para Vercel**: `frontend/public/index.html` (remover linha 20 do script emergent); `frontend/vercel.json` (novo: rewrites SPA + build); `frontend/package.json` (remover `@emergentbase/*`); backend `api/index.py` (novo wrapper ASGI) + `vercel.json` (se backend na Vercel); `CORS_ORIGINS` apontando para o domínio Vercel; não versionar `.env` e `.emergent/`.
16. **Comandos**: instalar → `yarn install` (frontend) / `pip install -r backend/requirements.txt`; dev → `yarn start` (porta 3000) + `uvicorn server:app --port 8001 --reload`; build → `yarn build` (saída `build/`); produção → build estático servido por CDN (Vercel) + `uvicorn server:app` (ou Function).
17. **Variáveis de ambiente**: backend → `MONGO_URL` (ou string Postgres na rota B), `DB_NAME`, `CORS_ORIGINS`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `EMAIL_FROM_NAME`, `RESEND_API_KEY` (novo, fora do Emergent), `INFINITEPAY_HANDLE`, `INFINITEPAY_API_URL`, `PUBLIC_APP_URL`, `INFINITEPAY_SANDBOX`, `WHATSAPP_API_URL`, `WHATSAPP_API_TOKEN`, `WHATSAPP_ADMIN_PHONE`, `WHATSAPP_PROVIDER`; frontend → `REACT_APP_BACKEND_URL` (embutida no build). Remover fora do Emergent: `EMERGENT_EMAIL_KEY`, `WDS_SOCKET_PORT`, `ENABLE_HEALTH_CHECK`.
18. **Serviços Emergent inutilizados fora da plataforma**: o proxy de e-mail `https://integrations.emergentagent.com/api/v1/email/send` com `EMERGENT_EMAIL_KEY` (único lock-in real — substituir por Resend direto); o MongoDB local do pod; o domínio de preview. Todo o resto é código padrão.
19. **Export para GitHub**: Sim, integralmente, pelo fluxo "Save to GitHub" do chat (conecta OAuth; pode exigir plano Standard). Vão frontend+backend completos, sem `.env`, sem dados do banco e sem node_modules — recriar variáveis no host de destino.
20. **Limitações reais na Vercel**: nenhuma bloqueante. Pontos de atenção: backend como Function = cold start + pool de conexões Mongo (usar client singleton global) + timeout configurável (webhook e polling cabem folgado); CRA é legado mas funcional; SPA precisa de rewrites. Alternativa mais simples para o backend: serviço long-running (Railway/Render/Fly) — continua sem custo Emergent.

## A)–H) Plano de migração

**A) Já compatível com Vercel**: todo o frontend (landing 5 seções, fluxo de inscrição, ingresso, admin, validação de QR), build CRA, integração InfinitePay (httpx puro), adaptador WhatsApp, QR Code — nada depende de infraestrutura do Emergent em runtime.

**B) Precisa ser alterado**: `send_email()` em server.py (proxy → Resend direto com RESEND_API_KEY + remetente verificado); `public/index.html` (remover script Emergent); devDeps `@emergentbase/*`; novos `vercel.json`/`api/index.py` (se backend na Vercel); `CORS_ORIGINS` para o domínio final.

**C) Precisa sair do Emergent**: MongoDB do pod → MongoDB Atlas (rota A) ou Supabase Postgres (rota B); proxy de e-mail → Resend; variáveis recriadas no painel da Vercel (`.env` não é exportado).

**D) O que fica no Supabase**: na rota B, o banco (tabelas users, registrations, payments, tickets, site_settings, counters, whatsapp_logs, login_attempts — conversão dos counters atômicos em sequences/transações) e, opcionalmente, Storage para mídias futuras. Na rota A, o Supabase só faria sentido para Storage/Auth — hoje não há uso obrigatório.

**E) O que fica na Vercel**: frontend estático (CDN) +, opcionalmente, o FastAPI como Python Function. Recomendação técnica: Vercel para o frontend; backend como Function é viável, mas um serviço long-running simplifica conexão com o banco.

**F) Supabase Edge Functions**: nada obrigatório. Só valeria a pena se a usuária quisesse reescrever o backend em Deno/TypeScript — não recomendado agora (retrabalho sem ganho para 23 rotas).

**G) Vercel Functions**: empacotar `server.py` (FastAPI) atrás de `api/index.py` com `app` exportado, rotas `/api/*` mapeadas, client Mongo global reutilizado entre invocações, `maxDuration` ajustado. Webhook InfinitePay, status/polling, admin e auth cabem no modelo serverless.

**H) Passo a passo**: 1) "Save to GitHub" no chat (repositório próprio, branch main); 2) exportar dados (Dump DB ou mongodump); 3) criar projeto no Supabase/Atlas e importar dados (mongorestore ou SQL na rota B); 4) remover artefatos Emergent (script, devDeps, .emergent) e trocar o e-mail para Resend direto; 5) criar `vercel.json` do frontend com rewrites + env `REACT_APP_BACKEND_URL`; 6) subir backend (Function ou Railway/Render) com as variáveis do item 17 e `CORS_ORIGINS` do domínio Vercel; 7) configurar webhook da InfinitePay para `{PUBLIC_APP_URL}/api/webhooks/infinitepay`; 8) testar inscrição + pagamento real + e-mail + ingresso; 9) apontar domínio próprio se houver.

**Custos externos estimados**: Vercel Hobby (grátis), Supabase free tier ou Atlas M0 (grátis), Resend plano free (3k e-mails/mês) — R$ 0 de infraestrutura inicial.
