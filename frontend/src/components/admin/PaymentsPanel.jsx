import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RefreshCw, ExternalLink, Check, X } from "lucide-react";
import { apiService, formatApiError } from "@/services/api";
import { formatBRL } from "@/lib/settings";

const STATUS_LABEL = {
    PENDING_PAYMENT: "Pendente",
    PAID: "Pago",
    PAYMENT_REVIEW: "Em análise",
    FAILED: "Falhou",
    CANCELLED: "Cancelado",
};

const STATUS_STYLE = {
    PENDING_PAYMENT: "bg-goldlight/40 text-ink border-gold/40",
    PAID: "bg-pine/10 text-pine border-pine/30",
    PAYMENT_REVIEW: "bg-wine/10 text-wine border-wine/30",
    FAILED: "bg-smoke/10 text-smoke border-smoke/30",
    CANCELLED: "bg-smoke/10 text-smoke border-smoke/30",
};

export default function PaymentsPanel() {
    const [dash, setDash] = useState(null);
    const [payments, setPayments] = useState(null);

    const load = () =>
        Promise.all([apiService.adminDashboard(), apiService.adminPayments()])
            .then(([d, p]) => {
                setDash(d.data);
                setPayments(p.data.payments);
            })
            .catch((e) => toast.error(formatApiError(e)));

    useEffect(() => {
        load();
    }, []);

    const act = async (id, action, okMsg) => {
        try {
            await (action === "approve" ? apiService.approvePayment(id) : apiService.rejectPayment(id));
            toast.success(okMsg);
            load();
        } catch (e) {
            toast.error(formatApiError(e));
        }
    };

    const reviews = (payments || []).filter((p) => p.status === "PAYMENT_REVIEW");

    return (
        <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
                {dash &&
                    [
                        { label: "Vagas totais", value: dash.capacity, testid: "dash-capacity" },
                        { label: "Vendas confirmadas", value: dash.confirmed, testid: "dash-confirmed" },
                        { label: "Vagas disponíveis", value: dash.available, testid: "dash-available" },
                        { label: "Receita total", value: formatBRL(dash.revenueTotal), testid: "dash-revenue" },
                        { label: "Receita Pix", value: formatBRL(dash.revenuePix), testid: "dash-revenue-pix" },
                        { label: "Receita cartão", value: formatBRL(dash.revenueCard), testid: "dash-revenue-card" },
                    ].map((c) => (
                        <div key={c.label} className="bg-cream border border-line/60 rounded-xl px-4 py-3" data-testid={c.testid}>
                            <p className="font-serif text-xl text-ink leading-tight">{c.value}</p>
                            <p className="text-[9px] uppercase tracking-[0.16em] text-smoke/70 mt-1">{c.label}</p>
                        </div>
                    ))}
            </div>

            {dash && dash.reviewPayments > 0 && (
                <div className="mb-8 border border-wine/30 bg-wine/5 rounded-2xl p-5" data-testid="payments-review-area">
                    <h3 className="text-[11px] uppercase tracking-[0.2em] text-wine">Pagamentos em análise ({dash.reviewPayments})</h3>
                    <p className="mt-1 text-xs text-smoke">Valor divergente, inconsistência ou chegada sem vaga disponível.</p>
                    <div className="mt-4 space-y-3">
                        {reviews.map((p) => (
                            <div key={p.id} className="bg-paper border border-line/60 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3" data-testid="review-row">
                                <div className="text-sm">
                                    <p className="text-ink">{p.name}</p>
                                    <p className="text-xs text-smoke/70 font-mono">{p.order_nsu}</p>
                                    <p className="text-[11px] text-wine mt-0.5">
                                        {p.review_reason === "VALOR_DIVERGENTE"
                                            ? `Valor recebido: ${formatBRL((p.paid_amount || 0) / 100)} · esperado ${formatBRL((p.amount || 0) / 100)}`
                                            : "Chegou quando não havia vaga disponível."}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        data-testid="review-approve-button"
                                        onClick={() => act(p.id, "approve", "Pagamento aprovado: vaga ocupada e ingresso enviado.")}
                                        className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-pine text-paper text-[11px] uppercase tracking-[0.14em] hover:opacity-90"
                                    >
                                        <Check size={14} strokeWidth={1.5} /> Aprovar
                                    </button>
                                    <button
                                        data-testid="review-reject-button"
                                        onClick={() => act(p.id, "reject", "Pagamento rejeitado.")}
                                        className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-wine/40 text-wine text-[11px] uppercase tracking-[0.14em] hover:bg-wine hover:text-paper"
                                    >
                                        <X size={14} strokeWidth={1.5} /> Rejeitar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] uppercase tracking-[0.2em] text-gold">Pagamentos</h3>
                <button
                    data-testid="payments-refresh-button"
                    onClick={load}
                    className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-smoke hover:text-gold transition-colors"
                >
                    <RefreshCw size={14} strokeWidth={1.5} /> Atualizar
                </button>
            </div>

            {!payments ? (
                <p className="text-smoke text-sm">Carregando...</p>
            ) : payments.length === 0 ? (
                <p className="text-smoke text-sm" data-testid="payments-empty">Nenhum pagamento ainda.</p>
            ) : (
                <div className="overflow-x-auto border border-line/60 rounded-2xl bg-cream" data-testid="payments-table">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-[10px] uppercase tracking-[0.16em] text-smoke/70 border-b border-line">
                                <th className="px-4 py-3">Nome</th>
                                <th className="px-4 py-3">Order NSU</th>
                                <th className="px-4 py-3">Método</th>
                                <th className="px-4 py-3">Valor</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Data</th>
                                <th className="px-4 py-3">Transaction NSU</th>
                                <th className="px-4 py-3">Ingresso</th>
                                <th className="px-4 py-3 text-right">Comprovante</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((p) => (
                                <tr key={p.id} className="border-b border-line/50 last:border-0" data-testid="payment-row">
                                    <td className="px-4 py-3 text-ink">{p.name}</td>
                                    <td className="px-4 py-3 font-mono text-xs text-smoke">{p.order_nsu}</td>
                                    <td className="px-4 py-3 text-ink">{p.payment_method === "PIX" ? "Pix" : `Cartão${p.installments > 1 ? ` ${p.installments}x` : ""}`}</td>
                                    <td className="px-4 py-3 text-ink">{formatBRL((p.amount || 0) / 100)}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex px-3 py-1 rounded-full border text-[11px] ${STATUS_STYLE[p.status] || ""}`}>
                                            {STATUS_LABEL[p.status] || p.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-smoke">
                                        {new Date(p.paid_at || p.created_at).toLocaleDateString("pt-BR")}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-smoke">{p.transaction_nsu || "—"}</td>
                                    <td className="px-4 py-3 font-mono text-xs text-ink">{p.ticket_code || "—"}</td>
                                    <td className="px-4 py-3 text-right">
                                        {p.receipt_url ? (
                                            <a
                                                data-testid="receipt-link"
                                                href={p.receipt_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.14em] text-gold hover:text-ink"
                                            >
                                                Ver comprovante <ExternalLink size={12} strokeWidth={1.5} />
                                            </a>
                                        ) : (
                                            "—"
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
