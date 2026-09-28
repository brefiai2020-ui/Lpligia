# PRD — Landing Page Premium | Mentoria em Grupo — Dra. Lígia Jeane Matroski

## Problema original
Criar SOMENTE O FRONTEND de uma landing page de vendas premium, responsiva e mobile-first para a Mentoria em Grupo da Dra. Lígia Jeane Matroski (10/10/2026, R$ 100, 50 vagas, pagamento via InfinitePay), com estética acolhedora, sofisticada e feminina ("menos é mais"), incluindo o fluxo visual completo de inscrição (5 telas), estados de pagamento e funções mockadas preparadas para integração futura (InfinitePay, Supabase, WhatsApp, QR real). Sem backend, sem banco, sem auth.

## Arquitetura
- React (CRA/craco) + Tailwind + framer-motion + lenis + react-router-dom v7. Sem backend.
- Rotas: `/` (landing 14 seções), `/inscricao/cadastro`, `/inscricao/pagamento`, `/inscricao/processando` (+`?st=recusado|expirado`), `/inscricao/confirmado`, `/inscricao/ingresso`, `/estados` (galeria de estados).
- `src/config.js`: constantes do evento + `PORTRAIT_URL` (foto oficial), `VIDEO_URL`, `FLAGS.soldOut`.
- `src/services/mockServices.js`: createRegistration, createInfinitePayCheckout, checkPaymentStatus, generateTicket, sendWhatsAppConfirmation — todos mockados (localStorage), pontos de integração marcados com TODO(INTEGRAÇÃO).
- Identidade: Cormorant Garamond (títulos) + Manrope (texto) + JetBrains Mono (códigos); paleta off-white/bege/preto quente/cinza/dourado (#FAF8F5 · #F3ECE3 · #171615 · #4A4643 · #C5A059).
- Placeholder do retrato: moldura em arco com monograma "LJ" — substituído automaticamente ao definir PORTRAIT_URL.

## Personas
- Mulher 28–55, chega por WhatsApp/Instagram no celular, busca autoconhecimento; decide em mobile.
- Dra. Lígia (dona): precisa de página que transmita exclusividade e permita plugar pagamentos/ingresso depois.

## Requisitos core (estáticos)
14 seções da landing (header transparente→sólido, hero, marquee, conexão, para quem é, 3 pilares, vídeo 16:9, sobre, frase de impacto, detalhes, oferta, 3 passos, FAQ, CTA final, footer com modais legais) + 5 telas do fluxo + 6 estados (aguardando, processando, aprovado, recusado, expirado, esgotado com bloqueio) + CTA fixo mobile + microcopy sem falsa urgência + data-testids.

## Implementado (2026-09-28)
- Landing completa com animações (reveal mascarado no hero, parallax discreto, marquee editorial, hover suaves).
- Fluxo de inscrição e2e funcional com dados simulados: cadastro (máscaras WhatsApp/CPF + consentimento) → pagamento (resumo + PAGAR COM INFINITEPAY visual) → processando (auto-aprova ~3s) → confirmado (código MNT-2026-XXXX) → ingresso digital (QR mockup, perfuração de ticket).
- Estados recusado/expirado via `?st=`; esgotado via `FLAGS.soldOut` ou `?st=esgotado`; galeria em /estados.
- Favicon SVG monograma; SEO/meta pt-BR.

## Backlog
- P0: foto oficial (PORTRAIT_URL) e vídeo real (VIDEO_URL) — ambos já suportados.
- P1: integração InfinitePay real (checkout + status), Supabase/backend para registros, WhatsApp API, QR real.
- P2: conteúdo das políticas (Privacy/Termos são placeholders honestos), horário/local quando definidos.

## Próximas tarefas
1. Receber foto oficial e vídeo da Dra. Lígia e plugar em config.js.
2. Integrar InfinitePay real nas funções mockadas.
3. Conectar backend (Supabase) + QR real do ingresso.
