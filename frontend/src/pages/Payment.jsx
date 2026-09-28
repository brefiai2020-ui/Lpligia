import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { QrCode, CreditCard, ShieldCheck, Lock } from "lucide-react";
import CheckoutShell from "@/components/CheckoutShell";
import {
    apiService,
    formatApiError,
    getStoredRegistrationId,
    setStoredOrderNsu,
} from "@/services/api";
import { useSettings, formatBRL } from "@/lib/settings";

export default function Payment() {
    const navigate = useNavigate();
    const { settings: s } = useSettings();
    const [method, setMethod] = useState("PIX");
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("NOME DA PARTICIPANTE");
    const rid = getStoredRegistrationId();

    useEffect(() => {
        if (!rid) return;
        apiService
            .getRegistration(rid)
            .then(({ data }) => setName(data.nome || "NOME DA PARTICIPANTE"))
            .catch(() => {});
    }, [rid]);

    const totalCents = method === "PIX" ? Math.round(s.pricePix * 100) : Math.round(s.priceCard * 100);

    const onPay = async () => {
        setLoading(true);
        try {
            const { data } = await apiService.createPayment(rid, method);
            setStoredOrderNsu(data.order_nsu);
            window.location.href = data.checkout_url;
        } catch (e) {
            toast.error(formatApiError(e));
            setLoading(false);
        }
    };

    if (s.soldOut) {
        return (
            <CheckoutShell step={2}>
                <div className="text-center py-16" data-testid="payment-soldout">
                    <h1 className="font-serif text-4xl text-ink">Inscrições encerradas</h1>
                    <p className="mt-4 text-smoke">As inscrições para esta edição foram encerradas.</p>
                    <Link
                        to="/"
                        className="mt-8 inline-block text-xs uppercase tracking-[0.2em] text-smoke/70 hover:text-gold"
                    >
                        Voltar para a página do evento
                    </Link>
                </div>
            </CheckoutShell>
        );
    }

    if (!rid) {
        return (
            <CheckoutShell step={2}>
                <div className="text-center py-16" data-testid="payment-no-registration">
                    <h1 className="font-serif text-4xl text-ink">Faça sua inscrição primeiro</h1>
                    <p className="mt-4 text-smoke">Para acessar o pagamento, reserve sua vaga no formulário.</p>
                    <Link
                        data-testid="payment-go-signup"
                        to="/inscricao/cadastro"
                        className="mt-8 inline-flex py-3.5 px-8 items-center rounded-full bg-ink text-paper text-sm uppercase tracking-[0.18em] hover:bg-gold hover:text-ink transition-colors"
                    >
                        Ir para a inscrição
                    </Link>
                </div>
            </CheckoutShell>
        );
    }

    return (
        <CheckoutShell step={2}>
            <div className="flex items-center gap-2" data-testid="payment-status-pill">
                <span className="w-2 h-2 rounded-full bg-gold animate-pulse-dot" aria-hidden="true" />
                <span className="text-[11px] uppercase tracking-[0.22em] text-smoke">Aguardando pagamento</span>
            </div>

            <h1 className="mt-5 font-serif text-4xl sm:text-5xl text-ink leading-tight" data-testid="payment-title">
                Quase lá!
            </h1>
            <p className="mt-3 text-[11px] uppercase tracking-[0.24em] text-smoke mt-6">Como você prefere pagar?</p>

            <div className="mt-10 bg-cream border border-line/60 rounded-3xl p-7 sm:p-9" data-testid="payment-summary">
                <div className="space-y-4 text-sm">
                    <Row label="Participante" value={name} />
                    <Row label="Evento" value="Mentoria em Grupo" />
                    <Row label="Condução" value="Dra. Lígia Jeane Matroski" />
                    <Row label="Data" value={s.eventDateShort} />
                </div>
                <div className="mt-7 pt-6 border-t border-line flex items-end justify-between">
                    <span className="text-[11px] uppercase tracking-[0.22em] text-smoke">Total</span>
                    <span className="font-serif text-4xl text-ink" data-testid="payment-total">
                        {formatBRL(totalCents / 100)}
                    </span>
                </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                    data-testid="payment-method-pix"
                    onClick={() => setMethod("PIX")}
                    className={`flex flex-col items-start gap-1.5 rounded-2xl px-5 py-4 text-left border transition-colors ${
                        method === "PIX" ? "border-gold bg-beige" : "border-line/60 bg-paper hover:border-gold/50"
                    }`}
                >
                    <QrCode size={18} strokeWidth={1.4} className="text-gold" />
                    <span className="text-xs uppercase tracking-[0.14em] text-smoke">Pix</span>
                    <span className="text-sm text-ink">
                        {formatBRL(s.pricePix)}
                        <span className="block text-[11px] text-smoke">Pagamento à vista</span>
                    </span>
                </button>
                <button
                    data-testid="payment-method-card"
                    onClick={() => setMethod("CARD")}
                    className={`flex flex-col items-start gap-1.5 rounded-2xl px-5 py-4 text-left border transition-colors ${
                        method === "CARD" ? "border-gold bg-beige" : "border-line/60 bg-paper hover:border-gold/50"
                    }`}
                >
                    <CreditCard size={18} strokeWidth={1.4} className="text-gold" />
                    <span className="text-xs uppercase tracking-[0.14em] text-smoke">Cartão</span>
                    <span className="text-sm text-ink">
                        {formatBRL(s.priceCard)}
                        <span className="block text-[11px] text-smoke">Até {s.installments}x</span>
                    </span>
                </button>
            </div>

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
                Pagamento seguro · Pix ou cartão · processado pela InfinitePay
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


