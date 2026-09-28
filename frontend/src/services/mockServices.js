// ============================================================
// Camada de serviços MOCKADA.
// Preparada para plugar as integrações reais sem tocar na UI:
//   · Supabase / backend  → createRegistration
//   · InfinitePay         → createInfinitePayCheckout, checkPaymentStatus
//   · Backend + QR real   → generateTicket
//   · WhatsApp API        → sendWhatsAppConfirmation
// ============================================================
import { EVENT } from "@/config";

const LS_REGISTRATION = "lj_registration";
const LS_TICKET = "lj_ticket";

export async function createRegistration(data) {
    // TODO(INTEGRAÇÃO): substituir por POST /registrations (Supabase/backend).
    const registration = {
        id: `reg_${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString(),
    };
    localStorage.setItem(LS_REGISTRATION, JSON.stringify(registration));
    await delay(600);
    return registration;
}

export async function createInfinitePayCheckout() {
    // TODO(INTEGRAÇÃO): aqui entra a URL/API real do Checkout InfinitePay.
    await delay(400);
    return { paymentId: `mock_${Date.now()}`, checkoutUrl: null };
}

export async function checkPaymentStatus(paymentId) {
    // TODO(INTEGRAÇÃO): consultar status real (polling/webhook InfinitePay).
    await delay(2600);
    return { paymentId, status: "approved" };
}

export async function generateTicket() {
    // TODO(INTEGRAÇÃO): o backend gerará o código + QR Code real.
    const existing = getTicket();
    if (existing) return existing;
    const code = `MNT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const registration = getRegistration();
    const ticket = {
        code,
        name: registration?.nome || "NOME DA PARTICIPANTE",
        event: EVENT.productName,
        dateLabel: EVENT.dateTicket,
        issuedAt: new Date().toISOString(),
    };
    localStorage.setItem(LS_TICKET, JSON.stringify(ticket));
    return ticket;
}

export async function sendWhatsAppConfirmation(ticket) {
    // TODO(INTEGRAÇÃO): disparar mensagem real via WhatsApp API.
    await delay(600);
    return { ok: true, mock: true, ticket };
}

export function getRegistration() {
    try {
        return JSON.parse(localStorage.getItem(LS_REGISTRATION));
    } catch {
        return null;
    }
}

export function getTicket() {
    try {
        return JSON.parse(localStorage.getItem(LS_TICKET));
    } catch {
        return null;
    }
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
