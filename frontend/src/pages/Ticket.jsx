import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import CheckoutShell from "@/components/CheckoutShell";
import QrMock from "@/components/QrMock";
import { QRCodeSVG } from "qrcode.react";
import { apiService, getStoredRegistrationId } from "@/services/api";
import { useSettings } from "@/lib/settings";

export default function Ticket() {
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
        `Olá! Esta é a confirmação da minha vaga na Mentoria em Grupo com a Dra. Lígia Jeane Matroski (${s.eventDateTicket}). Ingresso: ${reg?.ticket_code || "MNT-2026-XXXX"} — ${reg?.nome || "NOME DA PARTICIPANTE"}`,
    );
    const waLink = s.whatsappNumber
        ? `https://wa.me/${s.whatsappNumber.replace(/\D/g, "")}?text=${waText}`
        : `https://wa.me/?text=${waText}`;

    const addToPhone = () => {
        toast.message("Em preparação", {
            description: "O download do ingresso (Passbook/PDF) será ativado na integração.",
        });
    };

    return (
        <CheckoutShell step={3}>
            <h1 className="font-serif text-3xl sm:text-4xl text-ink text-center leading-tight" data-testid="ticket-title">
                Seu ingresso digital
            </h1>

            <div
                className="mt-10 max-w-sm mx-auto bg-cream rounded-3xl border border-line shadow-[0_30px_60px_-30px_rgba(23,22,21,0.35)] overflow-hidden"
                data-testid="digital-ticket"
            >
                <div className="relative bg-ink text-cream px-8 py-9 text-center">
                    <div className="absolute inset-0 texture-grain opacity-20" aria-hidden="true" />
                    <p className="relative text-[10px] uppercase tracking-[0.3em] text-gold">Mentoria em Grupo</p>
                    <h2 className="relative mt-3 font-serif text-2xl leading-snug">Dra. Lígia Jeane Matroski</h2>
                </div>

                <div className="px-8 py-8">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.24em] text-smoke/70">Nome</p>
                        <p className="mt-1.5 font-serif text-2xl text-ink uppercase leading-snug" data-testid="ticket-name">
                            {reg?.nome || "NOME DA PARTICIPANTE"}
                        </p>
                    </div>
                    <div className="mt-5">
                        <p className="text-[10px] uppercase tracking-[0.24em] text-smoke/70">Data</p>
                        <p className="mt-1.5 text-ink tracking-[0.14em]" data-testid="ticket-date">
                            {s.eventDateTicket}
                        </p>
                    </div>

                    <div className="relative my-8" aria-hidden="true">
                        <div className="border-t border-dashed border-line" />
                        <span className="absolute -left-11 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-paper border border-line" />
                        <span className="absolute -right-11 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-paper border border-line" />
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        {reg?.qr_token ? (
                            <QRCodeSVG
                                data-testid="ticket-qr-code"
                                value={`${window.location.origin}/ingresso/validar/${reg.qr_token}`}
                                size={168}
                                bgColor="#FAF8F5"
                                fgColor="#171615"
                                level="M"
                            />
                        ) : (
                            <QrMock seed={reg?.ticket_code || "MNT-2026"} />
                        )}
                        <p className="font-mono text-sm text-ink tracking-wider" data-testid="ticket-code-display">
                            {reg?.ticket_code || "MNT-2026-XXXX"}
                        </p>
                        <p className="text-xs text-smoke text-center leading-relaxed">
                            Apresente este QR Code no momento do acesso.
                        </p>
                    </div>
                </div>
            </div>

            {reg?.qr_token ? null : (
                <p className="mt-4 text-center text-[10px] uppercase tracking-[0.2em] text-smoke/60 max-w-sm mx-auto">
                    QR Code simulado — será gerado após a confirmação do pagamento
                </p>
            )}

            <div className="mt-8 flex flex-col gap-3 max-w-sm mx-auto">
                <button
                    data-testid="add-to-phone-button"
                    onClick={addToPhone}
                    className="h-14 rounded-full bg-ink text-paper text-sm uppercase tracking-[0.18em] hover:bg-gold hover:text-ink transition-colors duration-300"
                >
                    Adicionar ao celular
                </button>
                <a
                    data-testid="whatsapp-ticket-button"
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    className="h-14 rounded-full border border-ink text-ink text-sm uppercase tracking-[0.18em] hover:border-gold hover:text-gold transition-colors duration-300 inline-flex items-center justify-center"
                >
                    Enviar pelo WhatsApp
                </a>
                <Link
                    to="/"
                    className="text-center text-xs uppercase tracking-[0.2em] text-smoke/70 hover:text-gold pt-2"
                >
                    Voltar para a página do evento
                </Link>
            </div>
        </CheckoutShell>
    );
}

