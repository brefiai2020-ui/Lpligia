import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const STEPS = ["Cadastro", "Pagamento", "Ingresso"];

export default function CheckoutShell({ step, children }) {
    return (
        <div className="min-h-screen bg-paper flex flex-col" data-testid="checkout-shell">
            <header className="border-b border-line/60">
                <div className="max-w-2xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
                    <Link to="/" data-testid="checkout-home-link" className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full border border-gold/60 flex items-center justify-center font-serif italic text-gold text-xs">
                            LJ
                        </span>
                        <span className="font-serif text-base text-ink">Dra. Lígia Jeane Matroski</span>
                    </Link>
                    <span className="text-[10px] uppercase tracking-[0.24em] text-smoke/70 hidden sm:block">
                        Mentoria em grupo · 10.10.2026
                    </span>
                </div>
            </header>

            <main className="flex-1 w-full max-w-2xl mx-auto px-5 sm:px-8 py-10 sm:py-14 w-full">
                <ol className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] mb-10">
                    {STEPS.map((label, i) => (
                        <li key={label} className="flex items-center gap-3">
                            <span
                                className={`flex items-center gap-2 ${
                                    i + 1 === step ? "text-gold" : "text-smoke/50"
                                }`}
                            >
                                <span
                                    className={`w-6 h-6 rounded-full border text-[9px] flex items-center justify-center ${
                                        i + 1 === step ? "border-gold text-gold" : "border-line text-smoke/50"
                                    }`}
                                >
                                    {String(i + 1).padStart(2, "0")}
                                </span>
                                {label}
                            </span>
                            {i < STEPS.length - 1 && <span className="w-8 h-px bg-line" aria-hidden="true" />}
                        </li>
                    ))}
                </ol>
                {children}
            </main>

            <footer className="py-6 text-center">
                <Link
                    to="/"
                    data-testid="checkout-back-link"
                    className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-smoke/70 hover:text-gold transition-colors"
                >
                    <ArrowLeft size={14} strokeWidth={1.5} /> Voltar ao início
                </Link>
            </footer>
        </div>
    );
}
