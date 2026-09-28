import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { scrollToId } from "@/lib/scroll";
import { useSettings, formatBRL } from "@/lib/settings";

const LINKS = [
    { label: "A experiência", id: "experiencia" },
    { label: "Sobre a Lígia", id: "sobre" },
    { label: "Mentoria", id: "mentoria" },
];

export default function Navbar() {
    const { settings: s } = useSettings();
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    const goSection = (id) => {
        setOpen(false);
        if (location.pathname !== "/") {
            navigate("/");
            setTimeout(() => scrollToId(id), 450);
        } else {
            scrollToId(id);
        }
    };

    const ctaLabel = s.soldOut ? "Inscrições encerradas" : "Quero participar";
    // Sobre o hero escuro (topo da home, sem rolagem): texto claro; depois, barra creme com texto escuro.
    const onDark = !scrolled && !open && location.pathname === "/";

    return (
        <>
            <header
                className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
                    scrolled || open
                        ? "bg-cream/90 backdrop-blur-md border-b border-line/50"
                        : "bg-transparent border-b border-transparent"
                }`}
                data-testid="navbar"
            >
                <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 md:h-20 flex items-center justify-between">
                    <button
                        data-testid="nav-home-link"
                        onClick={() => {
                            setOpen(false);
                            if (location.pathname !== "/") navigate("/");
                        }}
                        className="flex items-center gap-3 text-left"
                    >
                        <span
                            className={`w-9 h-9 rounded-full border flex items-center justify-center font-serif italic text-sm transition-colors ${
                                onDark ? "border-cream/50 text-goldlight" : "border-gold/60 text-gold"
                            }`}
                        >
                            LJ
                        </span>
                        <span
                            className={`font-serif italic text-base sm:text-lg leading-tight transition-colors ${
                                onDark ? "text-cream" : "text-ink"
                            }`}
                        >
                            Dra. Lígia Jeane Matroski
                        </span>
                    </button>

                    <nav className="hidden md:flex items-center gap-8">
                        {LINKS.map((l) => (
                            <button
                                key={l.id}
                                data-testid={`nav-link-${l.id}`}
                                onClick={() => goSection(l.id)}
                                className={`text-[13px] uppercase tracking-[0.18em] transition-colors ${
                                    onDark ? "text-cream/80 hover:text-cream" : "text-smoke hover:text-ink"
                                }`}
                            >
                                {l.label}
                            </button>
                        ))}
                        <Link
                            data-testid="nav-cta-button"
                            to="/inscricao/cadastro"
                            className={`h-11 px-6 inline-flex items-center rounded-full text-[13px] uppercase tracking-[0.18em] transition-colors duration-300 ${
                                s.soldOut
                                    ? "bg-smoke/10 text-smoke/60 cursor-not-allowed pointer-events-none border border-line"
                                    : onDark
                                      ? "bg-cream text-ink hover:bg-gold"
                                      : "bg-ink text-cream hover:bg-gold hover:text-ink"
                            }`}
                        >
                            {ctaLabel}
                        </Link>
                    </nav>

                    <button
                        data-testid="nav-mobile-toggle"
                        className={`md:hidden p-2 -mr-2 transition-colors ${onDark ? "text-cream" : "text-ink"}`}
                        onClick={() => setOpen((v) => !v)}
                        aria-label={open ? "Fechar menu" : "Abrir menu"}
                    >
                        {open ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
                    </button>
                </div>
            </header>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-40 bg-ink text-cream md:hidden flex flex-col justify-center px-8"
                        data-testid="mobile-menu"
                    >
                        <nav className="flex flex-col gap-7">
                            {LINKS.map((l, i) => (
                                <motion.button
                                    key={l.id}
                                    initial={{ opacity: 0, y: 24 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.08 * i + 0.1 }}
                                    onClick={() => goSection(l.id)}
                                    className="text-left font-serif italic text-4xl text-cream"
                                >
                                    {l.label}
                                </motion.button>
                            ))}
                        </nav>
                        <Link
                            data-testid="nav-mobile-cta"
                            to="/inscricao/cadastro"
                            onClick={() => setOpen(false)}
                            className={`mt-12 h-14 inline-flex items-center justify-center rounded-full font-semibold uppercase tracking-[0.18em] text-sm ${
                                s.soldOut ? "bg-cream/15 text-cream/60 pointer-events-none" : "bg-gold text-ink"
                            }`}
                        >
                            {ctaLabel}
                        </Link>
                        <p className="mt-8 text-xs uppercase tracking-[0.25em] text-cream/50">
                            {s.eventDateShort} · {s.seatsLabel}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
