import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSettings } from "@/lib/settings";

export default function Navbar() {
    const { settings: s } = useSettings();
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const ctaLabel = s.soldOut ? "Inscrições encerradas" : "Garantir vaga";
    // Sobre o hero escuro (topo da home, sem rolagem): texto claro; depois, barra creme com texto escuro.
    const onDark = !scrolled && location.pathname === "/";

    return (
        <header
            className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
                scrolled
                    ? "bg-cream/90 backdrop-blur-md border-b border-line/50"
                    : "bg-transparent border-b border-transparent"
            }`}
            data-testid="navbar"
        >
            <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 md:h-20 flex items-center justify-between gap-3">
                <button
                    data-testid="nav-home-link"
                    onClick={() => {
                        if (location.pathname !== "/") navigate("/");
                    }}
                    className="flex items-center gap-3 text-left min-w-0"
                >
                    <span
                        className={`w-9 h-9 shrink-0 rounded-full border flex items-center justify-center font-serif italic text-sm transition-colors ${
                            onDark ? "border-cream/50 text-goldlight" : "border-gold/60 text-gold"
                        }`}
                    >
                        LJ
                    </span>
                    <span
                        className={`font-serif italic text-sm sm:text-lg leading-tight truncate transition-colors ${
                            onDark ? "text-cream" : "text-ink"
                        }`}
                    >
                        Dra. Lígia Jeane Matroski
                    </span>
                </button>

                <Link
                    data-testid="nav-cta-button"
                    to="/inscricao/cadastro"
                    className={`shrink-0 h-10 sm:h-11 px-4 sm:px-6 inline-flex items-center rounded-full text-[11px] sm:text-[13px] uppercase tracking-[0.14em] transition-colors duration-300 ${
                        s.soldOut
                            ? "bg-smoke/10 text-smoke/60 cursor-not-allowed pointer-events-none border border-line"
                            : onDark
                              ? "bg-cream text-ink hover:bg-rose hover:text-white"
                              : "bg-ink text-cream hover:bg-rose hover:text-white"
                    }`}
                >
                    {ctaLabel}
                </Link>
            </div>
        </header>
    );
}
