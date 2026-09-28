import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { QrCode, CreditCard, ShieldCheck, Lock } from "lucide-react";
import CheckoutShell from "@/components/CheckoutShell";
import { createInfinitePayCheckout } from "@/services/mockServices";
import { getRegistration } from "@/services/mockServices";
import { FLAGS, EVENT } from "@/config";

export default function Payment() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const registration = getRegistration();
    const name = registration?.nome || "NOME DA PARTICIPANTE";

    if (FLAGS.soldOut) {
        return (
            <CheckoutShell step={2}>
                <div className="text-center py-16" data-testid="payment-soldout">
                    <h1 className="font-serif text-4xl text-ink">Inscrições encerradas</h1>
                    <p className="mt-4 text-smoke">As inscrições para esta edição foram encerradas.</p>
                    <Link to="/" className="mt-8 inline-block text-xs uppercase tracking-[0.2em] text-smoke/70 hover:text-gold">
                        Voltar para a página do evento
                    </Link>
                </div>
            </CheckoutShell>
        );
    }

    const onPay = async () => {
        setLoading(true);
        await createInfinitePayCheckout();
        navigate("/inscricao/processando");
    };

    return (
        <CheckoutShell step={2}>
            <div className="flex items-center gap-2" data-testid="payment-status-pill">
                <span className="w-2 h-2 rounded-full bg-gold animate-pulse-dot" aria-hidden="true" />
                <span className="text-[11px] uppercase tracking-[0.22em] text-smoke">Aguardando pagamento</span>
            </div>

            <h1 className="mt-5 font-serif text-4xl sm:text-5xl text-ink leading-tight" data-testid="payment-title">
                Quase lá!
            </h1>

            <div className="mt-10 bg-cream border border-line/60 rounded-3xl p-7 sm:p-9" data-testid="payment-summary">
                <div className="space-y-4 text-sm">
                    <Row label="Participante" value={name} />
                    <Row label="Evento" value={EVENT.productName} />
                    <Row label="Condução" value={EVENT.mentor} />
                    <Row label="Data" value={EVENT.dateShort} />
                </div>
                <div className="mt-7 pt-6 border-t border-line flex items-end justify-between">
                    <span className="text-[11px] uppercase tracking-[0.22em] text-smoke">Total</span>
                    <span className="font-serif text-4xl text-ink" data-testid="payment-total">
                        {EVENT.price}
                    </span>
                </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 border border-line/60 rounded-2xl px-5 py-4 bg-paper">
                    <QrCode size={18} strokeWidth={1.4} className="text-gold shrink-0" />
                    <span className="text-sm text-ink">Pix</span>
                </div>
                <div className="flex items-center gap-3 border border-line/60 rounded-2xl px-5 py-4 bg-paper">
                    <CreditCard size={18} strokeWidth={1.4} className="text-gold shrink-0" />
                    <span className="text-sm text-ink">Cartão</span>
                </div>
            </div>
            <p className="mt-2 text-xs text-smoke/70">Você escolhe a forma de pagamento no checkout.</p>

            <button
                data-testid="infinitepay-checkout-button"
                onClick={onPay}
                disabled={loading}
                className="mt-8 w-full h-14 rounded-full bg-ink text-paper text-sm uppercase tracking-[0.18em] hover:bg-gold hover:text-ink transition-colors duration-300 disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
                <Lock size={14} strokeWidth={1.5} />
                {loading ? "Abrindo checkout..." : "Pagar com InfinitePay"}
            </button>

            <p className="mt-4 flex items-center justify-center gap-2 text-xs text-smoke/80">
                <ShieldCheck size={14} strokeWidth={1.5} className="text-gold" />
                Pagamento seguro · Pix ou cartão
            </p>
        </CheckoutShell>
    );
}

function Row({ label, value }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="text-[11px] uppercase tracking-[0.18em] text-smoke/70">{label}</span>
            <span className="text-ink text-right">{value}</span>
        </div>
    );
}
