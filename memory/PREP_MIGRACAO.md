# PREPARAÇÃO PARA MIGRAÇÃO — GitHub → Vercel → MongoDB Atlas → Resend → InfinitePay
Data: 2026-09-28 · Nenhuma alteração de código/arquivo foi executada nesta etapa. Tudo abaixo foi VERIFICADO nos arquivos reais.

## Confirmações pedidas
1. **"Save to GitHub"**: confirmado com o suporte Emergent — exporta frontend+backend completos (sem .env, sem dados do banco, sem node_modules). Pode exigir plano Standard. Nenhum segredo vai junto POR PADRÃO, mas há arquivos rastreados com senha que precisam sair do git ANTES do export (ver Riscos).
2. **Referências ao MongoDB interno**: ZERO hardcode (`mongodb://` / `localhost:27017` não existem no código). A conexão vem 100% de `MONGO_URL`/`DB_NAME` (server.py linhas 32-34). Atlas = trocar a string no painel da Vercel. Índices/contadores são criados no startup de forma idempotente — funcionam no Atlas sem mudança.
3. **Estratégia de conexão Mongo atual**: client GLOBAL criado 1x na importação do módulo (`AsyncIOMotorClient(mongo_url)`) — Motor mantém connection pool próprio (default maxPoolSize=100). Nada é criado/fechado por request (só `client.close()` no shutdown do processo). É exatamente o padrão recomendado para serverless (client reutilizado entre invocações quentes).
4. **FastAPI → Vercel Function sem alterar /api/***: SIM. Padrão `api/index.py` (`from server import app as api_app`) + `vercel.json` roteando `/api/*` para a função. As 23 rotas públicas permanecem idênticas. `startup` (índices + seed_admin) roda por cold start e é idempotente (seed cria admin só se não existir).

## C) DEPENDÊNCIAS EXCLUSIVAS DO EMERGENT (ARQUIVO → LOCAL → O QUE FAZ → O QUE SUBSTITUIR)
| Arquivo | Linha/local | O que faz | O que substituir |
|---|---|---|---|
| backend/server.py | 38-40 (`EMAIL_BASE_URL`, `EMAIL_KEY`) e uso em `send_email()` ~295-304 | Envia e-mails via proxy gerenciado `https://integrations.emergentagent.com/api/v1/email/send` com header `X-Email-Key` | Chamar Resend direto: `POST https://api.resend.com/emails` com `Authorization: Bearer RESEND_API_KEY` + `from` verificado (EMAIL_FROM). ÚNICO lock-in funcional |
| backend/server.py | ~1078-1079 (`seed_admin`) | Fallback `os.environ.get("ADMIN_PASSWORD", "Mentoria2026!")` — senha default ESCRITA no código | Remover o valor do fallback (`os.environ["ADMIN_PASSWORD"]` ou dummy) antes de subir ao GitHub |
| backend/requirements.txt | 28 (`emergentintegrations==0.2.1`) | SDK de integrações Emergent — NÃO é importado por server.py | Remover a linha (ou manter: inofensivo, só engrossa o build) |
| frontend/public/index.html | 20 | Script da plataforma `assets.emergent.sh/scripts/emergent-main.js` | Remover a linha `<script>` |
| frontend/public/index.html | 35-105 (bloco de analytics) | Snippet de analytics com `api_host: "https://ap.emergent.sh"` (linha 98) | Remover o bloco inteiro de analytics (editar com cuidado — bloco único) |
| frontend/package.json | 85-86 (devDeps) | `@emergentbase/overlay` + `@emergentbase/visual-edits` (overlay/edição visual do Emergent; só dev-server, fail-open) | Remover os 2 devDeps (`yarn remove`) |
| frontend/craco.config.js | blocos `emergentOverlay`/`withVisualEdits`/health-check | Carrega overlay + health-check no dev server | Simplificar o craco (manter alias `@`, watchOptions, eslint) |
| frontend/plugins/health-check/ | pasta (2 arquivos) | Endpoints de saúde do preview (só ativa com `ENABLE_HEALTH_CHECK=true`) | Remover a pasta (ou ignorar) |
| frontend/.env | `ENABLE_HEALTH_CHECK`, `WDS_SOCKET_PORT` | Variáveis do dev-server do preview | Não levar; recriar só `REACT_APP_BACKEND_URL` na Vercel |
| backend/.env | `EMERGENT_EMAIL_KEY` | Chave do proxy de e-mail | Não levar; substituir por `RESEND_API_KEY` |
| /app/.emergent/ | pasta toda | Configs/crons da plataforma | Não enviar |

## A) CHECKLIST DE EXPORTAÇÃO PARA GITHUB
**VÃO**: `frontend/` (src, public, package.json, yarn.lock, craco.config.js, tailwind.config.js, postcss.config.js, plugins/), `backend/` (server.py, requirements.txt, pytest.ini), `tests/`, `README.md`, `.gitignore`.
**NÃO VÃO (regra + verificado)**: `frontend/.env`, `backend/.env` (não rastreados hoje, MAS ver Risco 1), `node_modules/`, `build/`, `__pycache__/`, `/app/.emergent/`, `memory/` (PRD, diagnóstico, test_credentials), `auth_testing.md` (contém senha admin), `test_result.md`, `test_reports/` (relatórios citam a senha), `*.png` (screenshots), `design_guidelines.json`.
**Preservado integralmente (nada muda)**: React 19 + CRA/CRACO, FastAPI, as 23 rotas /api, auth JWT+bcrypt, admin, inscrições, pagamentos, contador atômico das 50 vagas, InfinitePay (checkout/webhook/payment_check), tickets+QR+validação, visual atual.

## B) ARQUIVOS QUE PRECISAM SER ALTERADOS DEPOIS (na ordem em que devem ser tocados)
1. `.gitignore` (raiz): adicionar `.env`, `backend/.env`, `frontend/.env`, `memory/`, `auth_testing.md`, `test_result.md`, `test_reports/`, `.emergent/` — ANTES do primeiro push.
2. `backend/server.py`: remover senha do fallback do seed_admin; trocar `send_email()` p/ Resend direto (1 função).
3. `backend/requirements.txt`: remover `emergentintegrations`.
4. `frontend/public/index.html`: remover script linha 20 + bloco de analytics (35-105).
5. `frontend/package.json` + `craco.config.js` + `plugins/`: remover @emergentbase/*, health-check.
6. Novos: `frontend/vercel.json` (rewrites SPA) e `api/index.py` + `vercel.json` (se backend na Vercel).
7. Nada mais — nenhuma rota, regra de negócio ou layout muda.

## D) VARIÁVEIS DE AMBIENTE
**Nunca commitar (todos os segredos)**: MONGO_URL (usuário/senha do Atlas), JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, RESEND_API_KEY, EMERGENT_EMAIL_KEY (morre), INFINITEPAY_HANDLE/INFINITEPAY_API_URL/INFINITEPAY_SANDBOX, WHATSAPP_API_URL/TOKEN/ADMIN_PHONE/PROVIDER, EMAIL_FROM_NAME, CORS_ORIGINS, DB_NAME, PUBLIC_APP_URL.
**Recriar na Vercel**: frontend → só `REACT_APP_BACKEND_URL` (embutida no build); backend → MONGO_URL (Atlas), DB_NAME, JWT_SECRET (NOVO valor), ADMIN_EMAIL, ADMIN_PASSWORD (NOVA senha), CORS_ORIGINS (domínio Vercel — OBRIGATÓRIO explícito, ver Risco 4), EMAIL_FROM_NAME, RESEND_API_KEY, INFINITEPAY_* , PUBLIC_APP_URL, WHATSAPP_* (quando ativar).

## E) RISCOS/ATENÇÕES
1. **`.env` NÃO está coberto pelo .gitignore atual** (hoje fora do git por exclusão local da plataforma). Se exportar sem corrigir, risco de subir segredos. Corrigir PRIMEIRO.
2. **Senha do admin aparece em 4 arquivos rastreados** (auth_testing.md, server.py fallback, test_reports/, test_result.md). Remover do git antes do export e TROCAR a senha admin depois da migração.
3. **E-mail para de enviar fora do Emergent** até trocar o proxy por Resend (inscrição/pagamento continuam; e-mail do ingresso não sai). Trocar ANTES de abrir as inscrições reais.
4. **CORS + cookies**: `allow_credentials=True` não funciona com `allow_origins=["*"]` — na Vercel, `CORS_ORIGINS` precisa listar o domínio final explicitamente (cookies são samesite=none/secure, já corretos p/ domínios distintos).
5. **Atlas serverless/Vercel**: sem IP fixo → Network Access 0.0.0.0/0 + senha forte; client global já é o padrão certo.
6. Cold start nas Functions (~1-3s) — aceitável para 23 rotas leves; webhook/polling cabem no timeout.
7. Persistência de preview ≠ produção: os dados atuais (2 inscritas de teste, settings) precisam do dump/mongorestore para o Atlas.
8. CRA está em manutenção pela Meta — funciona, mas é o candidato natural a Vite no futuro (NÃO fazer agora).

## F) ORDEM EXATA DA MIGRAÇÃO (a executar somente com autorização)
1. Preparação de segurança no código: .gitignore + remover senha do fallback + limpar refs Emergent (itens B1-B5) — commit local.
2. "Save to GitHub" → repositório próprio (frontend+backend).
3. MongoDB Atlas: criar cluster M0, usuário, liberar rede, `mongorestore` do dump atual (ou Dump DB no viewer → import).
4. Vercel frontend: importar repo, `yarn build`, env `REACT_APP_BACKEND_URL` apontando para o backend.
5. Backend: subir FastAPI (Vercel Function via api/index.py ou Railway/Render) com MONGO_URL do Atlas, JWT_SECRET novo, ADMIN_* novos, CORS_ORIGINS do domínio Vercel.
6. Resend: domínio verificado + RESEND_API_KEY + trocar send_email → testar e-mail de ingresso.
7. InfinitePay: INFINITEPAY_HANDLE real, INFINITEPAY_SANDBOX off, PUBLIC_APP_URL final, webhook `{PUBLIC_APP_URL}/api/webhooks/infinitepay` → 1 pagamento real de teste.
8. Testar fim-a-fim (inscrição → pagamento → e-mail → ingresso/QR → validação) + trocar senha do admin.
Custo estimado: R$ 0/mês inicial (Vercel Hobby + Atlas M0 + Resend free).
