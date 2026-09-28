# PRD — Landing Page Premium + Admin + InfinitePay | Mentoria em Grupo — Dra. Lígia Jeane Matroski

## Problema original
Landing page de vendas premium, mobile-first para a Mentoria em Grupo da Dra. Lígia Jeane Matroski (10/10/2026, 50 vagas), estética acolhedora e sofisticada ("menos é mais"), fluxo de inscrição em 5 telas + área admin. Evoluções: preços Pix R$ 189,90 / Cartão R$ 229,00 em até 3x (18990/22900 centavos), integração REAL InfinitePay (checkout + webhook + payment_check), controle atômico das 50 vagas, ingresso com QR Code real e validação, e-mails Resend, WhatsApp (adaptador pronto, aguardando credenciais).

## Arquitetura
- React (CRA/craco) + Tailwind (cores via CSS vars RGB editáveis) + framer-motion + lenis + react-router-dom + qrcode.react.
- Backend FastAPI + MongoDB (motor): users (admin JWT/bcrypt + brute force), registrations (PENDING_PAYMENT→CONFIRMED, registration_code sequencial MNT-2026-XXXX), payments (order_nsu único MNT-2026-XXXX-XXXXXX, transaction_nsu, invoice_slug, receipt_url, paid_amount, installments, capture_method), tickets (ticket_code, qr_token seguro, VALID/USED/CANCELLED), site_settings, whatsapp_logs, counters (confirmed_sales atômico, registration_code).
- Rotas: `/`, `/inscricao/{cadastro,pagamento,processando,confirmado,ingresso}`, `/pagamento-concluido` (retorno InfinitePay: só confirma via webhook/payment_check, NUNCA pela chegada), `/ingresso/validar/:token` (✅/⚠️/❌, admin marca utilizado), `/estados` (demo), `/admin` (Inscritas | Pagamentos | Editar site).
- InfinitePay: POST /api/payment/create valida método (PIX|CARD), vagas, define valor no backend (18990/22900 centavos), cria checkout em POST {INFINITEPAY_API_URL}/links com handle, order_nsu, redirect_url, webhook_url, customer. Webhook POST /api/webhooks/infinitepay: idempotente (transaction_nsu), valida valor (divergente→PAYMENT_REVIEW), ocupa vaga atomicamente (nunca >capacity; sem vaga→PAYMENT_REVIEW), PAID→CONFIRMED→ingresso+QR→e-mail+WhatsApp. payment_check para consulta manual. Modo INFINITEPAY_SANDBOX=1 no preview (checkout simulado; caminho do webhook é o real).
- E-mails (Resend proxy Emergent, guardrails): "Pagamento confirmado — Ingresso MNT-2026-XXXX" na aprovação (automática/admin/reenvio).
- WhatsApp: adaptador generic/cloud/evolution/zapi via WHATSAPP_API_URL+TOKEN (não configurado → log not_configured); botões wa.me com mensagem pronta continuam.
- Admin: dashboard (vagas totais, vendas confirmadas, disponíveis, receita total/Pix/cartão, pendentes, em análise), área PAGAMENTOS EM ANÁLISE (aprovar→fluxo completo / rejeitar), tabela de pagamentos com VER COMPROVANTE (receipt_url), inscritas (editar/apagar/cancelar libera vaga), editor do site (datas, preços, vagas, mídias, textos, cores, InfiniteTag).

## Personas
- Mulher 28–55, chega por WhatsApp/Instagram no celular; paga por Pix ou cartão no checkout InfinitePay.
- Dra. Lígia (dona): acompanha vendas/vagas/receita, analisa pagamentos divergentes, valida ingressos, edita o site sem programar.

## Implementado
- 2026-09-28: landing premium completa (14 seções, animações, CTA fixo mobile), estados da interface, ingresso, admin v1.
- 2026-09-28: preços Pix/Cartão em todo o site; integração InfinitePay real (checkout, webhook idempotente, payment_check, sandbox no preview); controle atômico de 50 vagas com "Restam X vagas"/"Última vaga"/encerradas; ingresso com QR Code real (URL /ingresso/validar/TOKEN) + página de validação; e-mails Resend; adaptador WhatsApp; admin com pagamentos/análise/dashboard financeiro.

## Backlog
- P0: configurar INFINITEPAY_HANDLE real (InfiniteTag) e desligar INFINITEPAY_SANDBOX; credenciais WhatsApp (WHATSAPP_API_URL/TOKEN/PROVIDER).
- P1: foto oficial e vídeo real (admin cola URLs — já suportado).
- P2: conteúdo real de Política/Termos; horário/local do evento; relatório de vendas exportável.

## Testes executados (briefing §33)
T1 PIX 18990→PAID+1 vaga ✓ · T2 CARD 22900→PAID+1 vaga ✓ · T3 CARD 3x valor 22900 ✓ · T4 recusado/falhou→vaga NÃO ocupada ✓ · T5 pendente→não ocupa ✓ · T6 webhook duplicado→1 vaga só ✓ · T7 última vaga→1 ocupa, outro→PAYMENT_REVIEW ✓ · T8 capacidade esgotada→0 vagas e nova venda bloqueada ("Inscrições encerradas") ✓

## Redesign editorial (2026-09-28, referência da usuária)
- Nova direção visual: paleta terrosa em camadas — chocolate #3A2E27, caramelo #A98E72, creme #F2EAE0, dourado latte #C5A880 (todos editáveis nos color pickers do admin; derivados se ajustam sozinhos).
- Hero com foto ambiente em tela cheia + overlay chocolate, título serif itálico com reveal linha a linha, chips (data/vagas/preço), CTA pill creme, selo giratório e indicador de scroll; parallax no fundo.
- Experiência em seção escura (linhas editoriais com numerais itálicos dourados); Sobre a Lígia em caramelo com retrato em MOLDURA DE CELULAR + badge +20 anos e textos creme; títulos das seções em itálico; cards com hover lift; checkout/cadastro/ingresso seguem o mesmo tema.
- Toda a funcionalidade preservada: vagas em tempo real, InfinitePay, Resend, WhatsApp, admin.

## Refinamento orgânico + rosa queimado (2026-09-28)
- Linguagem "psicologia": seções sobrepostas com cantos curvos (rounded-t-[2.5/4rem] + margem negativa), traços squiggle que se desenham no scroll (Squiggle), blobs orgânicos animados (Blob) atrás de oferta/retrato.
- Rosa queimado #C4705C adicionado à paleta (token rose/roselight + 5º color picker no admin; derivados automáticos).
- Regra de contraste aplicada: fonte branca sobre caramelo/rosa/chocolate (Sobre, Conexão, Experiência, CTA final); dourado nunca como texto sobre fundos claros; textos auxiliares escurecidos.
- Preço e vagas limitados a 2 seções (Detalhes do evento + Oferta): hero mostra só a data, CTA final sem meta de valores, barra fixa só preço, menu mobile só data. FAQ mantém respostas (conteúdo solicitado no briefing original).
