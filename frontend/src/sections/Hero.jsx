import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, ShieldCheck } from "lucide-react";
import { scrollToId } from "@/lib/scroll";
import { useSettings, formatBRL } from "@/lib/settings";

// Ambiente terapêutico acolhedor (sem rosto) — trocado automaticamente quando a foto oficial
// for configurada no admin? Não: este fundo é atmosférico e permanece; a foto oficial entra na seção Sobre.
const HERO_BG =
    "https://images.unsplash.com/photo-1701817822150-2d218d8610e6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwzfHx3YXJtdGhlcmFwaXN0aWNfb2ZmaWNlX3RoZXJhcHlfc2Vzc2lvbl9pbnRlcmlvcl9jb3p5X21pbmltYWxpc3R8ZW58MHx8fHwxNzkwNjIxNjM0fDA&ixlib=rb-4.1.0&q=85";

const ease = [0.22, 1, 0.36, 1];

export default function Hero() {
    const { settings: s } = useSettings();
    const LINES = (s.heroTitle || "").split("\n").filter(Boolean);
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"],
    });

    const yBg = useTransform(
        scrollYProgress,
        [0, 1],
        ["0%", "14%"],
    );

    const yText = useTransform(
        scrollYProgress,
        [0, 1],
        [0, 40],
    );

    return (
        <section
            ref={ref}
            className="relative min-h-screen flex items-center overflow-hidden bg-ink"
            data-testid="section-hero"
        >
            <motion.div
                style={{ y: yBg }}
                className="absolute inset-0 scale-110"
                data-testid="hero-background"
                aria-hidden="true"
            >
                <img
                    src={HERO_BG}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        e.currentTarget.style.display = "none";
                    }}
                />
            </motion.div>

            <div
                className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/60 to-ink/25"
                aria-hidden="true"
            />

            <div
                className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-ink/40"
                aria-hidden="true"
            />

            <div className="relative max-w-6xl mx-auto px-5 sm:px-8 w-full pt-28 pb-24">
                <motion.div
                    style={{ y: yText }}
                    className="max-w-2xl"
                >
                    <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.7,
                            delay: 0.1,
                            ease,
                        }}
                        className="flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-goldlight"
                    >
                        <span
                            className="h-px w-10 bg-rose"
                            aria-hidden="true"
                        />{" "}
                        Terapia em grupo
                    </motion.p>

                    <h1 className="mt-7 font-serif italic font-light text-[2.8rem] leading-[1.06] sm:text-6xl lg:text-7xl text-cream">
                        {LINES.map((line, i) => (
                            <span
                                key={i}
                                className="block overflow-hidden pb-1"
                            >
                                <motion.span
                                    className={`block ${
                                        i === LINES.length - 1
                                            ? "text-goldlight"
                                            : ""
                                    }`}
                                    initial={{ y: "110%" }}
                                    animate={{ y: 0 }}
                                    transition={{
                                        duration: 1,
                                        delay: 0.25 + i * 0.14,
                                        ease,
                                    }}
                                >
                                    {line}
                                </motion.span>
                            </span>
                        ))}
                    </h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.8,
                            delay: 0.75,
                            ease,
                        }}
                        className="mt-6 max-w-lg text-base sm:text-lg text-cream/80 leading-relaxed"
                    >
                        {s.heroSubtitle}
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.8,
                            delay: 0.9,
                            ease,
                        }}
                        className="mt-8 flex flex-wrap items-center gap-2.5"
                        data-testid="hero-event-meta"
                    >
                        <span className="px-4 py-2 rounded-full bg-cream/10 border border-cream/25 backdrop-blur text-[11px] uppercase tracking-[0.2em] text-cream">
                            {s.eventDateLabel}
                        </span>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.8,
                            delay: 1.05,
                            ease,
                        }}
                        className="mt-10 flex flex-col sm:flex-row sm:items-center gap-4"
                    >
                        {s.soldOut ? (
                            <span
                                data-testid="hero-cta-soldout"
                                className="h-14 px-9 inline-flex items-center justify-center rounded-full bg-cream/15 text-cream/60 cursor-not-allowed text-sm uppercase tracking-[0.18em] border border-cream/25"
                            >
                                Inscrições encerradas
                            </span>
                        ) : (
                            <Link
                                data-testid="hero-cta-button"
                                to="/inscricao/cadastro"
                                className="h-14 px-9 whitespace-nowrap inline-flex items-center justify-center rounded-full bg-cream text-ink text-sm uppercase tracking-[0.18em] hover:bg-rose hover:text-white transition-colors duration-300"
                            >
                                Venha viver essa experiência única
                            </Link>
                        )}

                        <button
                            data-testid="hero-secondary-cta"
                            onClick={() => scrollToId("viver")}
                            className="h-14 px-6 whitespace-nowrap inline-flex items-center justify-center gap-2 text-sm uppercase tracking-[0.18em] text-cream border-b border-cream/40 hover:border-goldlight hover:text-goldlight transition-colors"
                        >
                            Conhecer a experiência{" "}
                            <ArrowDown
                                size={15}
                                strokeWidth={1.5}
                            />
                        </button>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                            duration: 0.8,
                            delay: 1.3,
                        }}
                        className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-cream/75"
                        data-testid="hero-quote-card"
                    >
                        <span className="font-serif italic text-base text-goldlight">
                            “{s.heroQuote}”
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                            <ShieldCheck
                                size={13}
                                strokeWidth={1.5}
                            />{" "}
                            Pagamento seguro
                        </span>
                    </motion.p>
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                    delay: 1.6,
                    duration: 1,
                }}
                className="absolute bottom-7 left-1/2 -translate-x-1/2 text-cream/60"
                aria-hidden="true"
            >
                <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{
                        repeat: Infinity,
                        duration: 2.2,
                        ease: "easeInOut",
                    }}
                >
                    <ArrowDown
                        size={18}
                        strokeWidth={1.4}
                    />
                </motion.div>
            </motion.div>

            <RotatingBadge />
        </section>
    );
}

function RotatingBadge() {
    return (
        <div
            className="absolute bottom-16 right-8 w-24 h-24 hidden lg:block"
            aria-hidden="true"
        >
            <svg
                viewBox="0 0 100 100"
                className="w-full h-full animate-spin-slower"
            >
                <defs>
                    <path
                        id="badge-circle"
                        d="M 50,50 m -37,0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
                    />
                </defs>

                <text
                    className="fill-cream/80"
                    style={{
                        fontSize: "9px",
                        letterSpacing: "2.6px",
                        textTransform: "uppercase",
                        fontFamily: "Manrope, sans-serif",
                    }}
                >
                    <textPath href="#badge-circle">
                        Terapia em grupo · 10.10.2026 ·
                    </textPath>
                </text>
            </svg>

            <span className="absolute inset-0 flex items-center justify-center font-serif italic text-goldlight text-lg">
                LJ
            </span>
        </div>
    );
}
