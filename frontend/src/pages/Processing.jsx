import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { X, Clock } from "lucide-react";
import CheckoutShell from "@/components/CheckoutShell";
import { checkPaymentStatus, generateTicket } from "@/services/mockServices";

export default function Processing() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const st = params.get("st");

    useEffect(() => {
        if (st === "recusado" || st === "expirado") return;
        let cancelled = false;
        (async () => {
            const res = await checkPaymentStatus("mock");
            if (cancelled) return;
            await generateTicket();
            if (res.status === "approved") navigate("/inscricao/confirmado", { replace: true });
        })();
        return () => {
            cancelled = true;
        };
    }, [st, navigate]);

    return (
        <CheckoutShell step={3}>
            {st === "recusado" ? (
                <StateBlock
                    testid="payment-refused"
                    icon={
                        <span className="w-16 h-16 rounded-full bg-wine/10 text-wine flex items-center justify-center">
                            <X size={28} strokeWidth={1.5} />
                        </span>
                    }
                    title="Pagamento recusado"
                    text="Não foi possível concluir seu pagamento. Você pode tentar novamente."
                    button={
                        <button
                            data-testid="retry-payment-button"
                            onClick={() => navigate("/inscricao/pagamento")}
                            className="h-14 px-9 rounded-full bg-ink text-paper text-sm uppercase tracking-[0.18em] hover:bg-gold hover:text-ink transition-colors"
                        >
                            Tentar novamente
                        </button>
                    }
                />
            ) : st === "expirado" ? (
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
                            onClick={() => navigate("/inscricao/pagamento")}
                            className="h-14 px-9 rounded-full bg-ink text-paper text-sm uppercase tracking-[0.18em] hover:bg-gold hover:text-ink transition-colors"
                        >
                            Refazer pagamento
                        </button>
                    }
                />
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
