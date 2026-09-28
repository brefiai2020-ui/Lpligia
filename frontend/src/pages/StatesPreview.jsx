import { Link } from "react-router-dom";
import { ArrowLeft, Check, X, Clock } from "lucide-react";

// Galeria de demonstração dos estados da interface (dados simulados).
export default function StatesPreview() {
    return (
        <div className="min-h-screen bg-paper" data-testid="states-preview">
            <div className="max-w-5xl mx-auto px-5 sm:px-8 py-16">
                <Link
                    to="/"
                    data-testid="states-back-link"
                    className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-smoke/70 hover:text-gold transition-colors"
                >
                    <ArrowLeft size={14} strokeWidth={1.5} /> Voltar
                </Link>
                <h1 className="mt-8 font-serif text-4xl sm:text-5xl text-ink leading-tight">
                    Estados da interface
                </h1>
                <p className="mt-4 text-smoke max-w-xl leading-relaxed">
                    Pré-visualização dos estados do fluxo de inscrição e pagamento. Todos operam com dados simulados,
                    prontos para receber as integrações reais.
                </p>

                <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <StateCard title="Pagamento aguardando">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/50 text-sm text-ink">
                            <span className="w-2 h-2 rounded-full bg-gold animate-pulse-dot" /> Aguardando pagamento
                        </span>
                        <CardLink to="/inscricao/pagamento" label="Abrir tela de pagamento" testid="state-link-aguardando" />
                    </StateCard>

                    <StateCard title="Pagamento processando">
                        <span className="w-12 h-12 rounded-full border-2 border-line border-t-gold animate-spin" />
                        <p className="text-sm text-smoke">Estamos confirmando seu pagamento...</p>
                        <CardLink to="/inscricao/processando" label="Abrir tela" testid="state-link-processando" />
                    </StateCard>

                    <StateCard title="Pagamento aprovado">
                        <span className="w-12 h-12 rounded-full bg-pine text-cream flex items-center justify-center">
                            <Check size={22} strokeWidth={1.5} />
                        </span>
                        <p className="text-sm text-smoke">Pagamento confirmado!</p>
                        <CardLink to="/inscricao/confirmado" label="Abrir tela" testid="state-link-aprovado" />
                    </StateCard>

                    <StateCard title="Pagamento recusado">
                        <span className="w-12 h-12 rounded-full bg-wine/10 text-wine flex items-center justify-center">
                            <X size={22} strokeWidth={1.5} />
                        </span>
                        <p className="text-sm text-smoke">Não foi possível concluir seu pagamento.</p>
                        <CardLink
                            to="/inscricao/processando?st=recusado"
                            label="Abrir tela"
                            testid="state-link-recusado"
                        />
                    </StateCard>

                    <StateCard title="Pagamento expirado">
                        <span className="w-12 h-12 rounded-full bg-smoke/10 text-smoke flex items-center justify-center">
                            <Clock size={22} strokeWidth={1.5} />
                        </span>
                        <p className="text-sm text-smoke">Seu código de pagamento expirou.</p>
                        <CardLink
                            to="/inscricao/processando?st=expirado"
                            label="Abrir tela"
                            testid="state-link-expirado"
                        />
                    </StateCard>

                    <StateCard title="Vaga esgotada" dark>
                        <p className="font-serif text-2xl text-cream">Inscrições encerradas</p>
                        <p className="text-sm text-cream/60">
                            Botões desabilitados em todo o site; não é possível avançar para o pagamento.
                        </p>
                        <CardLink
                            to="/inscricao/cadastro?st=esgotado"
                            label="Abrir tela"
                            testid="state-link-esgotado"
                            light
                        />
                    </StateCard>
                </div>
            </div>
        </div>
    );
}

function StateCard({ title, children, dark = false }) {
    return (
        <div
            className={`rounded-2xl border p-7 flex flex-col gap-4 min-h-[220px] ${
                dark ? "bg-ink border-ink" : "bg-cream border-line/60"
            }`}
        >
            <p className={`text-[11px] uppercase tracking-[0.22em] ${dark ? "text-cream/60" : "text-smoke/70"}`}>
                {title}
            </p>
            {children}
        </div>
    );
}

function CardLink({ to, label, testid, light = false }) {
    return (
        <Link
            to={to}
            data-testid={testid}
            className={`mt-auto text-xs uppercase tracking-[0.2em] underline underline-offset-4 ${
                light ? "text-gold" : "text-gold hover:text-ink"
            } transition-colors`}
        >
            {label}
        </Link>
    );
}
