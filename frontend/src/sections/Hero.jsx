import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, ShieldCheck } from "lucide-react";
import { scrollToId } from "@/lib/scroll";
import { useSettings } from "@/lib/settings";

const HERO_BG =
    "https://images.unsplash.com/photo-1701817822150-2d218d8610e6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwzfHx3YXJtdGhlcmFwaXN0aWNfb2ZmaWNlX3RoZXJhcHlfc2Vzc2lvbl9pbnRlcmlvcl9jb3p5X21pbmltYWxpc3R8ZW58MHx8fHwxNzkwNjIxNjM0fDA&ixlib=rb-4.1.0&q=85";

const VIMEO_VIDEO_ID = "1232149917";

const ease = [0.22, 1, 0.36, 1];

export default function Hero() {
    const { settings: s } = useSettings();

    // Título aprovado da Hero.
    // Não depende mais do /api/settings para evitar que o texto antigo
    // seja carregado novamente depois da abertura da página.
    const HERO_TITLE = `Do nada, tudo.
Uma nova versão de você.`;

    const LINES = HERO_TITLE
        .split("\n")
        .filter(Boolean);

    const ref = useRef(null);

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"],
    });

    const yBg = useTransform(
        scrollYProgress,
        [0, 1],
        ["0%", "14%"]
    );

    const yText = useTransform(
        scrollYProgress,
        [0, 1],
        [0, 40]
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
                className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/65 to-ink/30"
                aria-hidden="true"
            />

            <div
                className="absolute inset-0 bg-gradient-to-t from-ink/90 via-transparent to-ink/35"
                aria-hidden="true"
            />

            <div className="relative max-w-7xl mx-auto px-5 sm:px-8 w-full pt-28 pb-24">
                <div className="grid lg:grid-cols-12 gap-12 lg:gap-14 items-center">

                    <motion.div
                        style={{ y: yText }}
                        className="lg:col-span-5 max-w-2xl"
                    >
                        <motion.p
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.7,
                                delay: 0.1,
                                ease,
                            }}
                            className="text-xs sm:text-sm uppercase tracking-[0.28em] text-goldlight"
                        >
                            Terapia em grupo
                        </motion.p>

                        <motion.h1
                            initial={{ opacity: 0, y: 25 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.9,
                                delay: 0.18,
                                ease,
                            }}
                            className="mt-5 font-serif italic font-light text-5xl sm:text-6xl lg:text-7xl text-cream leading-[0.95]"
                        >
                            {LINES.map((line, index) => (
                                <span
                                    key={`${line}-${index}`}
                                    className="block"
                                >
                                    {line}
                                </span>
                            ))}
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.8,
                                delay: 0.32,
                                ease,
                            }}
                            className="mt-7 text-base sm:text-lg text-cream/85 leading-relaxed max-w-xl"
                        >
                            {s.heroSubtitle}
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.7,
                                delay: 0.42,
                                ease,
                            }}
                            className="mt-7 inline-flex items-center rounded-full border border-cream/25 bg-ink/20 backdrop-blur-sm px-5 py-2.5"
                        >
                            <span className="text-sm uppercase tracking-[0.15em] text-cream">
                                {s.eventDateLabel}
                            </span>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.7,
                                delay: 0.52,
                                ease,
                            }}
                            className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4"
                        >
                            {s.soldOut ? (
                                <span className="h-14 px-8 inline-flex items-center justify-center rounded-full bg-white/20 text-cream text-sm uppercase tracking-[0.16em]">
                                    Inscrições encerradas
                                </span>
                            ) : (
                                <Link
                                    to="/inscricao"
                                    className="h-14 px-8 inline-flex items-center justify-center rounded-full bg-rose text-white text-sm uppercase tracking-[0.16em] hover:bg-white hover:text-ink transition-colors duration-300 shadow-lg"
                                >
                                    Venha viver essa experiência única
                                </Link>
                            )}

                            <button
                                type="button"
                                onClick={() => scrollToId("sobre")}
                                className="h-14 px-5 inline-flex items-center gap-2 text-sm text-cream/85 hover:text-white transition-colors"
                            >
                                Conhecer a experiência
                                <ArrowDown
                                    size={16}
                                    strokeWidth={1.5}
                                />
                            </button>
                        </motion.div>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{
                                duration: 0.8,
                                delay: 0.65,
                            }}
                            className="mt-7 flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-cream/70"
                        >
                            <span className="font-serif italic text-base text-cream/90">
                                “{s.heroQuote}”
                            </span>

                            <span className="flex items-center gap-2">
                                <ShieldCheck
                                    size={15}
                                    strokeWidth={1.5}
                                />
                                Pagamento seguro
                            </span>
                        </motion.p>
                    </motion.div>

                    <motion.div
                        initial={{
                            opacity: 0,
                            x: 35,
                        }}
                        animate={{
                            opacity: 1,
                            x: 0,
                        }}
                        transition={{
                            duration: 0.9,
                            delay: 0.35,
                            ease,
                        }}
                        className="lg:col-span-7 w-full"
                        data-testid="hero-video"
                    >
                        <div className="relative w-full overflow-hidden rounded-[1.8rem] shadow-2xl bg-black">
                            <div className="relative w-full aspect-video">
                                <iframe
                                    src={`https://player.vimeo.com/video/${VIMEO_VIDEO_ID}?autoplay=0&title=0&byline=0&portrait=0&badge=0&dnt=1`}
                                    title="Vídeo da Dra. Lígia Jeane Matroski"
                                    className="absolute inset-0 w-full h-full border-0"
                                    allow="autoplay; fullscreen; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                    duration: 1,
                    delay: 1.1,
                }}
                className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-cream/55"
            >
                <span className="text-[9px] uppercase tracking-[0.3em]">
                    Scroll
                </span>

                <span className="w-px h-8 bg-cream/30" />
            </motion.div>

            <RotatingBadge />
        </section>
    );
}

function RotatingBadge() {
    return (
        <div
            className="hidden xl:flex absolute right-8 bottom-8 w-24 h-24 rounded-full border border-cream/20 items-center justify-center"
            aria-hidden="true"
        >
            <div className="absolute inset-0 animate-[spin_18s_linear_infinite]">
                <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full"
                >
                    <defs>
                        <path
                            id="badge-path"
                            d="M 50,50 m -37,0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
                        />
                    </defs>

                    <text
                        fill="currentColor"
                        className="text-cream/60"
                        fontSize="7"
                        letterSpacing="2"
                    >
                        <textPath href="#badge-path">
                            TERAPIA EM GRUPO • NOVA VERSÃO •
                        </textPath>
                    </text>
                </svg>
            </div>

            <span className="font-serif italic text-cream/70 text-sm">
                LJ
            </span>
        </div>
    );
}
