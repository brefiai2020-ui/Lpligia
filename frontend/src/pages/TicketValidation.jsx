import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, AlertTriangle, XCircle, ScanLine } from "lucide-react";
import { apiService } from "@/services/api";
import { Monogram } from "@/components/Monogram";

const STATES = {
    VALID: { icon: CheckCircle2, tone: "text-pine", bg: "bg-pine/10", title: "Ingresso válido" },
    USED: { icon: AlertTriangle, tone: "text-gold", bg: "bg-gold/10", title: "Ingresso já utilizado" },
    INVALID: { icon: XCircle, tone: "text-wine", bg: "bg-wine/10", title: "Ingresso inválido" },
    CANCELLED: { icon: XCircle, tone: "text-wine", bg: "bg-wine/10", title: "Ingresso cancelado" },
};

export default function TicketValidation() {
    const [info, setInfo] = useState(null);
    const [error, setError] = useState(false);
    const [using, setUsing] = useState(false);
    const token = window.location.pathname.split("/").pop();
    const isAdmin = !!localStorage.getItem("lj_admin_token");

    const load = () =>
        apiService
            .ticketInfo(token)
            .then(({ data }) => setInfo(data))
            .catch(() => setError(true));

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const markUsed = async () => {
        setUsing(true);
        try {
            await apiService.useTicket(token);
            await load();
        } catch {
            await load();
        } finally {
            setUsing(false);
        }
    };

    const state = info?.state || (error ? "INVALID" : null);
    const visual = state ? STATES[state] : null;

    return (
        <div className="min-h-screen bg-paper flex items-center justify-center p-5" data-testid="ticket-validation">
            <div className="max-w-sm w-full bg-cream border border-line/60 rounded-3xl p-8 text-center">
                <Monogram className="w-12 h-12 text-lg mx-auto" tone="gold" />
                <p className="mt-4 text-[10px] uppercase tracking-[0.3em] text-smoke/70">Validação de ingresso</p>

                {!state ? (
                    <p className="mt-10 text-smoke text-sm" data-testid="validation-loading">
                        <ScanLine size={22} strokeWidth={1.4} className="mx-auto text-gold" />
                        <span className="block mt-3">Verificando ingresso...</span>
                    </p>
                ) : (
                    <>
                        <span className={`mt-8 mx-auto w-16 h-16 rounded-full ${visual.bg} ${visual.tone} flex items-center justify-center`} data-testid={`validation-state-${state}`}>
                            <visual.icon size={28} strokeWidth={1.5} />
                        </span>
                        <h1 className={`mt-5 font-serif text-3xl text-ink ${state === "VALID" ? "" : ""}`} data-testid="validation-title">
                            {visual.title.toUpperCase()}
                        </h1>

                        {info && state !== "INVALID" && (
                            <div className="mt-7 text-left" data-testid="validation-details">
                                <Row label="Nome" value={info.name} />
                                <Row label="Evento" value={info.event_name} />
                                <Row label="Data" value={info.event_date} />
                                <Row label="Código" value={info.ticket_code} mono />
                            </div>
                        )}

                        {state === "VALID" && isAdmin && (
                            <button
                                data-testid="mark-ticket-used-button"
                                onClick={markUsed}
                                disabled={using}
                                className="mt-8 w-full h-13 py-3.5 rounded-full bg-ink text-paper text-sm uppercase tracking-[0.18em] hover:bg-gold hover:text-ink transition-colors disabled:opacity-60"
                            >
                                {using ? "Registrando..." : "Marcar como utilizado"}
                            </button>
                        )}
                        {state === "USED" && isAdmin && (
                            <p className="mt-6 text-xs text-smoke/70">Este ingresso já foi registrado nesta sessão.</p>
                        )}
                        <p className="mt-8 text-[10px] uppercase tracking-[0.2em] text-smoke/50">
                            Mentoria em Grupo · Dra. Lígia Jeane Matroski
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

function Row({ label, value, mono = false }) {
    return (
        <div className="flex items-center justify-between gap-4 py-2.5 border-b border-line/50 last:border-0">
            <span className="text-[11px] uppercase tracking-[0.18em] text-smoke/70">{label}</span>
            <span className={`text-ink text-right ${mono ? "font-mono text-sm" : ""}`}>{value || "—"}</span>
        </div>
    );
}
