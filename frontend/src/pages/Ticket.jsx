import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import CheckoutShell from "@/components/CheckoutShell";
import QrMock from "@/components/QrMock";
import { generateTicket, getTicket, sendWhatsAppConfirmation } from "@/services/mockServices";
import { EVENT } from "@/config";

export default function Ticket() {
    const [ticket, setTicket] = useState(getTicket());

    useEffect(() => {
        if (ticket) return;
        generateTicket().then(setTicket);
    }, [ticket]);

    const addToPhone = () => {
        toast.message("Simulado", {
            description: "O ingresso poderá ser salvo no celular (Passbook/PDF) após a integração.",
        });
    };

    const share = async () => {
        await sendWhatsAppConfirmation(ticket);
        toast.message("Simulado", {
            description: "O envio pelo WhatsApp será ativado na integração.",
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
                    <p className="relative text-[10px] uppercase tracking-[0.3em] text-gold">{EVENT.productName}</p>
                    <h2 className="relative mt-3 font-serif text-2xl leading-snug">{EVENT.mentor}</h2>
                </div>

                <div className="px-8 py-8">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.24em] text-smoke/70">Nome</p>
                        <p className="mt-1.5 font-serif text-2xl text-ink uppercase leading-snug" data-testid="ticket-name">
                            {ticket?.name || "NOME DA PARTICIPANTE"}
                        </p>
                    </div>
                    <div className="mt-5">
                        <p className="text-[10px] uppercase tracking-[0.24em] text-smoke/70">Data</p>
                        <p className="mt-1.5 text-ink tracking-[0.14em]" data-testid="ticket-date">
                            {EVENT.dateTicket}
                        </p>
                    </div>

                    <div className="relative my-8" aria-hidden="true">
                        <div className="border-t border-dashed border-line" />
                        <span className="absolute -left-11 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-paper border border-line" />
                        <span className="absolute -right-11 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-paper border border-line" />
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <QrMock seed={ticket?.code || "MNT-2026"} />
                        <p className="font-mono text-sm text-ink tracking-wider" data-testid="ticket-code-display">
                            {ticket?.code || "MNT-2026-XXXX"}
                        </p>
                        <p className="text-xs text-smoke text-center leading-relaxed">
                            Apresente este QR Code no momento do acesso.
                        </p>
                    </div>
                </div>
            </div>

            <p className="mt-4 text-center text-[10px] uppercase tracking-[0.2em] text-smoke/60 max-w-sm mx-auto">
                QR Code simulado — será gerado pelo backend na integração
            </p>

            <div className="mt-8 flex flex-col gap-3 max-w-sm mx-auto">
                <button
                    data-testid="add-to-phone-button"
                    onClick={addToPhone}
                    className="h-14 rounded-full bg-ink text-paper text-sm uppercase tracking-[0.18em] hover:bg-gold hover:text-ink transition-colors duration-300"
                >
                    Adicionar ao celular
                </button>
                <button
                    data-testid="whatsapp-ticket-button"
                    onClick={share}
                    className="h-14 rounded-full border border-ink text-ink text-sm uppercase tracking-[0.18em] hover:border-gold hover:text-gold transition-colors duration-300"
                >
                    Enviar pelo WhatsApp
                </button>
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
