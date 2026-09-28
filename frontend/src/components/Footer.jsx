import { useState } from "react";
import { Link } from "react-router-dom";
import { Instagram, X } from "lucide-react";
import { EVENT } from "@/config";

const LEGAL = {
    privacidade: {
        title: "Política de Privacidade",
        body: "Conteúdo institucional em preparação. Será publicado antes da abertura das inscrições.",
    },
    termos: {
        title: "Termos de Uso",
        body: "Conteúdo institucional em preparação. Será publicado antes da abertura das inscrições.",
    },
};

export default function Footer() {
    const [modal, setModal] = useState(null);

    return (
        <footer className="bg-ink text-cream" data-testid="footer">
            <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="w-10 h-10 rounded-full border border-gold/50 flex items-center justify-center font-serif italic text-gold">
                                LJ
                            </span>
                            <p className="font-serif text-2xl">{EVENT.mentor}</p>
                        </div>
                        <p className="mt-3 text-sm text-cream/60 tracking-wide">Psicóloga clínica | Mentora</p>
                        <a
                            data-testid="footer-instagram-link"
                            href={EVENT.instagramUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-4 inline-flex items-center gap-2 text-sm text-cream/80 hover:text-gold transition-colors"
                        >
                            <Instagram size={16} strokeWidth={1.5} /> {EVENT.instagram}
                        </a>
                    </div>
                    <div className="flex flex-col md:items-end gap-2 text-sm">
                        <button
                            data-testid="footer-privacy-button"
                            onClick={() => setModal("privacidade")}
                            className="text-cream/70 hover:text-gold transition-colors text-left md:text-right"
                        >
                            Política de Privacidade
                        </button>
                        <button
                            data-testid="footer-terms-button"
                            onClick={() => setModal("termos")}
                            className="text-cream/70 hover:text-gold transition-colors text-left md:text-right"
                        >
                            Termos de Uso
                        </button>
                        <Link
                            data-testid="footer-states-link"
                            to="/estados"
                            className="text-[11px] uppercase tracking-[0.2em] text-cream/35 hover:text-gold mt-3 transition-colors"
                        >
                            Estados da interface (demo)
                        </Link>
                    </div>
                </div>
                <div className="mt-12 pt-6 border-t border-cream/10 flex flex-col sm:flex-row justify-between gap-2 text-xs text-cream/40">
                    <p>© 2026 {EVENT.mentor}. Todos os direitos reservados.</p>
                    <p>Pagamento processado pelo Checkout InfinitePay.</p>
                </div>
            </div>

            {modal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-5" role="dialog" aria-modal="true">
                    <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={() => setModal(null)} />
                    <div className="relative bg-paper text-ink rounded-2xl max-w-md w-full p-8" data-testid="legal-modal">
                        <button
                            data-testid="legal-modal-close"
                            onClick={() => setModal(null)}
                            className="absolute top-4 right-4 p-2 text-smoke hover:text-ink transition-colors"
                            aria-label="Fechar"
                        >
                            <X size={18} strokeWidth={1.5} />
                        </button>
                        <h3 className="font-serif text-2xl">{LEGAL[modal].title}</h3>
                        <p className="mt-4 text-sm text-smoke leading-relaxed">{LEGAL[modal].body}</p>
                    </div>
                </div>
            )}
        </footer>
    );
}
