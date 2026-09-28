import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import CheckoutShell from "@/components/CheckoutShell";
import { apiService, getStoredRegistrationId } from "@/services/api";
import { useSettings, formatBRL } from "@/lib/settings";

export default function Confirmed() {
    const { settings: s } = useSettings();
    const [reg, setReg] = useState(null);
    const rid = getStoredRegistrationId();

    useEffect(() => {
        if (!rid) return;
        apiService
            .getRegistration(rid)
            .then(({ data }) => setReg(data))
            .catch(() => {});
    }, [rid]);

    const waText = encodeURIComponent(
        `Olá! Acabei de garantir minha vaga na Mentoria em Grupo com a Dra. Lígia Jeane Matroski (${s.eventDateShort}). Meu ingresso: ${reg?.ticket_code || "MNT-2026-XXXX"}`,
    );
    const waLink = s.whatsappNumber
        ? `https://wa.me/${s.whatsappNumber.replace(/\D/g, "")}?text=${waText}`
        : `https://wa.me/?text=${waText}`;

    return (
        <CheckoutShell step={3}>
            <div className="text-center py-8" data-testid="payment-confirmed">
                <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 16 }}
                    className="mx-auto w-20 h-20 rounded-full bg-pine text-cream flex items-center justify-center"
                >
                    <Check size={36} strokeWidth={1.5} />
                </motion.div>

                <h1 className="mt-9 font-serif text-4xl sm:text-5xl text-ink leading-tight" data-testid="confirmed-title">
                    Pagamento confirmado!
                </h1>
                <p className="mt-5 text-smoke leading-relaxed max-w-md mx-auto">
                    Sua vaga para a Mentoria em Grupo com a Dra. Lígia Jeane Matroski está confirmada.
                    {reg?.email_sent !== false && " Enviamos a confirmação e seu ingresso para o seu e-mail."}
                </p>

                <div
                    className="mt-9 bg-cream border border-line/60 rounded-2xl px-7 py-6 text-left max-w-sm mx-auto"
                    data-testid="confirmed-details"
                >
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-[11px] uppercase tracking-[0.2em] text-smoke/70">Data</span>
                        <span className="text-ink">{s.eventDateLabel}</span>
                    </div>
                    {reg?.method && (
                        <div className="mt-3 pt-3 border-t border-line flex items-center justify-between gap-4">
                            <span className="text-[11px] uppercase tracking-[0.2em] text-smoke/70">Pagamento</span>
                            <span className="text-ink">
                                {reg.method === "pix" ? "Pix" : "Cartão"} · {formatBRL(reg.amount || 0)}
                            </span>
                        </div>
                    )}
                    <div className="mt-3 pt-3 border-t border-line flex items-center justify-between gap-4">
                        <span className="text-[11px] uppercase tracking-[0.2em] text-smoke/70">Ingresso</span>
                        <span className="font-mono text-sm text-ink" data-testid="ticket-code">
                            {reg?.ticket_code || "MNT-2026-····"}
                        </span>
                    </div>
                </div>

                <div className="mt-10 flex flex-col gap-3 max-w-sm mx-auto">
                    <Link
                        data-testid="access-ticket-button"
                        to="/inscricao/ingresso"
                        className="h-14 rounded-full bg-ink text-paper text-sm uppercase tracking-[0.18em] hover:bg-gold hover:text-ink transition-colors duration-300 inline-flex items-center justify-center"
                    >
                        Acessar meu ingresso
                    </Link>
                    <a
                        data-testid="whatsapp-share-button"
                        href={waLink}
                        target="_blank"
                        rel="noreferrer"
                        className="h-14 rounded-full border border-ink text-ink text-sm uppercase tracking-[0.18em] hover:border-gold hover:text-gold transition-colors duration-300 inline-flex items-center justify-center"
                    >
                        Enviar ingresso pelo WhatsApp
                    </a>
                </div>
            </div>
        </CheckoutShell>
    );
}

