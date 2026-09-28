# PRD — Landing Page Premium + Admin | Mentoria em Grupo — Dra. Lígia Jeane Matroski

## Problema original
Landing page de vendas premium, responsiva e mobile-first para a Mentoria em Grupo da Dra. Lígia Jeane Matroski, com estética acolhedora e sofisticada ("menos é mais"), fluxo visual de inscrição em 5 telas, estados de pagamento e funções preparadas para integração. Evolução solicitada: preços Pix R$ 189,90 / Cartão R$ 229,00 em até 3x, área admin (inscritos + edição do site), e-mails via Resend e WhatsApp do ingresso.

## Arquitetura
- React (CRA/craco) + Tailwind (cores via CSS vars RGB → editáveis em runtime) + framer-motion + lenis + react-router-dom.
- Backend FastAPI + MongoDB (motor): coleções users (admin JWT/bcrypt), registrations, payments, site_settings, login_attempts.
- Rotas site: `/`, `/inscricao/{cadastro|pagamento|processando|confirmado|ingresso}`, `/estados` (demo), `/admin` (login JWT + painéis).
- API: POST /api/registrations, POST /api/registrations/{id}/checkout, GET /api/payments/{id}/status (auto-aprova ~3s MOCK + e-mail), GET /api/registrations/{id}, POST /api/auth/login|logout, GET /api/auth/me, GET/PUT /api/admin/registrations (+DELETE, +resend-email), GET /api/settings (público), PUT /api/admin/settings.
- E-mails (Resend via proxy Emergent, guardrails G1–G6): template server-side "Pagamento confirmado — Ingresso MNT-2026-XXXX" com data, forma, valor e código. Enviado na aprovação automática, na aprovação manual do admin e no botão reenviar.
- WhatsApp: botões dos ingressos abrem wa.me com mensagem pronta (número de destino configurável no admin).

## Admin (/admin — login admin@draligia.com, ver /app/memory/test_credentials.md)
- Inscritos: contadores, tabela (nome, contato, CPF, status, ingresso, data), editar (nome/whatsapp/e-mail/status — marcar Pago gera código e envia e-mail), apagar, reenviar e-mail.
- Editar site: vagas esgotadas (toggle), datas, nota horário/local, instagram, WhatsApp, vagas, preços Pix/Cartão/parcelas, URL da foto, URL do vídeo, textos (hero, conexão, impacto, CTA final, formulário, consentimento) e 4 cores do site (derivados ajustam automaticamente).

## Personas
- Mulher 28–55, chega por WhatsApp/Instagram no celular; decide em mobile.
- Dra. Lígia (dona): edita conteúdo/preços/mídias sem programar; acompanha e confirma inscritos.

## Implementado
- 2026-09-28: landing completa (14 seções, animações, CTA fixo mobile), fluxo de inscrição e2e com pagamento MOCK (auto-aprova), estados (aguardando/processando/aprovado/recusado/expirado/esgotado), ingresso com QR mockup.
- 2026-09-28: preços Pix 189,90 / Cartão 229,00 (3x) em todo o site; backend real (MongoDB) com auth admin JWT + brute force; área /admin (inscritos + editor do site); e-mails Resend funcionais; WhatsApp wa.me real nos botões.

## Backlog
- P0: foto oficial e vídeo real (admin colar URLs) — já suportados.
- P1: InfinitePay real (checkout/status/webhook) substituindo o MOCK de auto-aprovação.
- P2: conteúdo real de Política/Termos; horário/local quando definidos; envio automático de WhatsApp via API oficial (requer credenciais do usuário).
