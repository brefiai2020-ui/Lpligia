import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, ShieldCheck } from "lucide-react";
import PortraitFrame from "@/components/PortraitFrame";
import { scrollToId } from "@/lib/scroll";
import { useSettings, formatBRL } from "@/lib/settings";

const ease = [0.22, 1, 0.36, 1];

export default function Hero() {
    const { settings: s } = useSettings();
    const LINES = (s.heroTitle || "").split("\n").filter(Boolean);
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
    const y = useTransform(scrollYProgress, [0, 1], [0, 60]);
    const yText = useTransform(scrollYProgress, [0, 1], [0, 30]);

    return (
        <section ref={ref} className="relative min-h-screen flex items-center overflow-hidden bg-paper">
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                <div className="absolute -top-32 -right-32 w-[42rem] h-[42rem] rounded-full bg-beige blur-3xl opacity-70" />
                <div className="absolute bottom-0 -left-40 w-[36rem] h-[36rem] rounded-full bg-goldlight/30 blur-3xl opacity-50" />
            </div>

            <div className="relative max-w-6xl mx-auto px-5 sm:px-8 w-full pt-28 pb-20 lg:pt-24">
                <div className="grid lg:grid-cols-12 gap-14 lg:gap-10 items-center">
                    <motion.div style={{ y: yText }} className="lg:col-span-7">
                        <motion.p
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.1, ease }}
                            className="flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-gold"
                        >
                            <span className="h-px w-10 bg-gold/60" aria-hidden="true" /> Mentoria em grupo
                        </motion.p>

                        <h1 className="mt-6 font-serif text-[2.7rem] leading-[1.05] sm:text-6xl lg:text-7xl text-ink">
                            {LINES.map((line, i) => (
                                <span key={i} className="block overflow-hidden pb-1">
                                    <motion.span
                                        className={`block ${i === LINES.length - 1 ? "italic text-gold" : ""}`}
                                        initial={{ y: "110%" }}
                                        animate={{ y: 0 }}
                                        transition={{ duration: 1, delay: 0.25 + i * 0.14, ease }}
                                    >
                                        {line}
                                    </motion.span>
                                </span>
                            ))}
                        </h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.75, ease }}
                            className="mt-6 max-w-md text-base sm:text-lg text-smoke leading-relaxed"
                        >
                            {s.heroSubtitle}
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.9, ease }}
                            className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] uppercase tracking-[0.22em] text-ink/80"
                            data-testid="hero-event-meta"
                        >
                            <span>{s.eventDateLabel}</span>
                            <span className="text-gold" aria-hidden="true">·</span>
                            <span>Mentoria em grupo</span>
                            <span className="text-gold" aria-hidden="true">·</span>
                            <span>{s.slotsTotal} vagas</span>
                            <span className="text-gold" aria-hidden="true">·</span>
                            <span>{formatBRL(s.pricePix)} no Pix</span>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 1.05, ease }}
                            className="mt-6 text-[11px] uppercase tracking-[0.18em] text-gold"
                            data-testid="hero-seats-label"
                        >
                            {s.seatsLabel}
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 1.05, ease }}
                            className="mt-10 flex flex-col sm:flex-row sm:items-center gap-4"
                        >
                            {s.soldOut ? (
                                <span
                                    data-testid="hero-cta-soldout"
                                    className="h-14 px-9 inline-flex items-center justify-center rounded-full bg-cream/50 text-smoke/60 cursor-not-allowed text-sm uppercase tracking-[0.18em] border border-line"
                                >
                                    Inscrições encerradas
                                </span>
                            ) : (
                                <Link
                                    data-testid="hero-cta-button"
                                    to="/inscricao/cadastro"
                                    className="h-14 px-9 whitespace-nowrap inline-flex items-center justify-center rounded-full bg-ink text-paper text-sm uppercase tracking-[0.18em] hover:bg-gold hover:text-ink transition-all duration-300"
                                >
                                    Quero garantir minha vaga
                                </Link>
                            )}
                            <button
                                data-testid="hero-secondary-cta"
                                onClick={() => scrollToId("experiencia")}
                                className="h-14 px-6 whitespace-nowrap inline-flex items-center justify-center gap-2 text-sm uppercase tracking-[0.18em] text-ink border-b border-ink/30 hover:border-gold hover:text-gold transition-colors"
                            >
                                Conhecer a experiência <ArrowDown size={15} strokeWidth={1.5} />
                            </button>
                        </motion.div>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8, delay: 1.3 }}
                            className="mt-6 flex items-center gap-2 text-xs text-smoke/80"
                        >
                            <ShieldCheck size={14} strokeWidth={1.5} className="text-gold" /> {s.seatsLabel} ·
                            A partir de {formatBRL(s.pricePix)} · Pagamento seguro
                        </motion.p>
                    </motion.div>

                    <motion.div
                        style={{ y }}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.1, delay: 0.5, ease }}
                        className="lg:col-span-5 relative max-w-sm mx-auto lg:ml-auto w-full"
                    >
                        <PortraitFrame
                            stamp={
                                <div
                                    className="absolute -left-4 sm:-left-10 bottom-14 bg-cream border border-line/70 shadow-lg rounded-2xl px-5 py-4 max-w-[230px]"
                                    data-testid="hero-quote-card"
                                >
                                    <p className="font-serif italic text-lg sm:text-xl text-ink leading-snug">
                                        “{s.heroQuote}”
                                    </p>
                                </div>
                            }
                        />
                        <RotatingBadge />
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

function RotatingBadge() {
    return (
        <div className="absolute -top-9 -right-3 sm:-right-9 w-24 h-24 hidden sm:block" aria-hidden="true">
            <svg viewBox="0 0 100 100" className="w-full h-full animate-spin-slower">
                <defs>
                    <path id="badge-circle" d="M 50,50 m -37,0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" />
                </defs>
                <text
                    className="fill-ink"
                    style={{ fontSize: "9px", letterSpacing: "2.6px", textTransform: "uppercase", fontFamily: "Manrope, sans-serif" }}
                >
                    <textPath href="#badge-circle">Mentoria em grupo · 10.10.2026 ·</textPath>
                </text>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-serif italic text-gold text-lg">
                LJ
            </span>
        </div>
    );
}
