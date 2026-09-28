import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { X, Clock, Search } from "lucide-react";
import CheckoutShell from "@/components/CheckoutShell";
import { apiService, getStoredOrderNsu, setStoredOrderNsu } from "@/services/api";

export default function Processing() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const [failState, setFailState] = useState(null);
    const [review, setReview] = useState(false);
    const [checking, setChecking] = useState(false);
    const st = params.get("st");

    // Retorna da InfinitePay para /pagamento-concluido com order_nsu na URL.
    useEffect(() => {
        const nsuParam = params.get("order_nsu");
        if (nsuParam) setStoredOrderNsu(nsuParam);
    }, [params]);

    useEffect(() => {
        if (st === "recusado" || st === "expirado") return;
        const nsu = params.get("order_nsu") || getStoredOrderNsu();
        if (!nsu) {
            navigate("/inscricao/cadastro", { replace: true });
            return;
        }
        let cancelled = false;
        const poll = async () => {
            try {
                const { data } = await apiService.paymentStatus(nsu);
                if (cancelled) return;
                if (data.status === "PAID") {
                    navigate("/inscricao/confirmado", { replace: true });
                } else if (data.status === "PAYMENT_REVIEW") {
                    setReview(true);
                } else if (data.status === "FAILED" || data.status === "CANCELLED") {
                    setFailState(data.status);
                }
            } catch {
                // segue tentando
            }
        };
        poll();
        const timer = setInterval(poll, 4000);
        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, [st, params, navigate]);

    const manualCheck = async () => {
        setChecking(true);
        try {
            const nsu = params.get("order_nsu") || getStoredOrderNsu();
            if (nsu) await apiService.checkPayment(nsu);
        } catch {
            // silencioso: o webhook continua sendo a via principal
        } finally {
            setChecking(false);
        }
    };

    const backToPayment = () => navigate("/inscricao/pagamento");
    const state = failState || st;

    return (
        <CheckoutShell step={3}>
            {state === "recusado" || state === "FAILED" || state === "CANCELLED" ? (
                <StateBlock
                    testid="payment-refused"
                    icon={
                        <span className="w-16 h-16 rounded-full bg-wine/10 text-wine flex items-center justify-center">
                            <X size={28} strokeWidth={1.5} />
                        </span>
                    }
                    title="Pagamento não concluído"
                    text="Não foi possível confirmar seu pagamento. Você pode tentar novamente — sua vaga continua reservada."
                    button={
                        <button
                            data-testid="retry-payment-button"
                            onClick={backToPayment}
                            className="h-14 px-9 rounded-full bg-ink text-paper text-sm uppercase tracking-[0.18em] hover:bg-gold hover:text-ink transition-colors"
                        >
                            Tentar novamente
                        </button>
                    }
                />
            ) : state === "expirado" ? (
                <StateBlock
                    testid="payment-expired"
                    icon={
                        <span className="w-16 h-16 rounded-full bg-smoke/10 text-smoke flex items-center justify-center">
                            <Clock size={26} strokeWidth={1.5} />
                        </span>
                    }
                    title="Pagamento expirado"
                    text="Seu código de pagamento expirou. Refaça o pagamento para garantir sua vaga."
                    button={
                        <button
                            data-testid="reprocess-payment-button"
                            onClick={backToPayment}
                            className="h-14 px-9 rounded-full bg-ink text-paper text-sm uppercase tracking-[0.18em] hover:bg-gold hover:text-ink transition-colors"
                        >
                            Refazer pagamento
                        </button>
                    }
                />
            ) : review ? (
                <div className="text-center py-14" data-testid="payment-review">
                    <span className="mx-auto w-16 h-16 rounded-full bg-gold/10 text-gold flex items-center justify-center">
                        <Clock size={26} strokeWidth={1.5} />
                    </span>
                    <h1 className="mt-9 font-serif text-3xl sm:text-4xl text-ink leading-snug" data-testid="review-title">
                        Pagamento em análise
                    </h1>
                    <p className="mt-4 text-smoke leading-relaxed max-w-sm mx-auto">
                        Recebemos seu pagamento e estamos finalizando a confirmação. Você receberá o ingresso por
                        e-mail e WhatsApp — pode fechar esta página.
                    </p>
                </div>
            ) : (
                <div className="text-center py-14" data-testid="payment-processing">
                    <div
                        className="mx-auto w-16 h-16 rounded-full border-2 border-line border-t-gold animate-spin"
                        aria-label="Carregando"
                    />
                    <h1 className="mt-9 font-serif text-3xl sm:text-4xl text-ink leading-snug" data-testid="processing-title">
                        Estamos confirmando seu pagamento...
                    </h1>
                    <p className="mt-4 text-smoke" data-testid="processing-warning">
                        Não feche esta página.
                    </p>
                    <button
                        data-testid="manual-check-button"
                        onClick={manualCheck}
                        disabled={checking}
                        className="mt-8 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-smoke/70 hover:text-gold transition-colors disabled:opacity-60"
                    >
                        <Search size={13} strokeWidth={1.5} /> {checking ? "Verificando..." : "Verificar novamente"}
                    </button>
                    <p className="mt-10 text-[11px] uppercase tracking-[0.22em] text-smoke/60">
                        Pagamento processado de forma segura pela InfinitePay
                    </p>
                </div>
            )}
        </CheckoutShell>
    );
}

function StateBlock({ icon, title, text, button, testid }) {
    return (
        <div className="text-center py-14" data-testid={testid}>
            <div className="flex justify-center">{icon}</div>
            <h1 className="mt-9 font-serif text-3xl sm:text-4xl text-ink leading-snug" data-testid="state-title">
                {title}
            </h1>
            <p className="mt-4 text-smoke leading-relaxed max-w-sm mx-auto">{text}</p>
            <div className="mt-9">{button}</div>
        </div>
    );
}


