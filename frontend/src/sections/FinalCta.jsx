import { Link } from "react-router-dom";
import { Reveal } from "@/components/Reveal";
import { Squiggle } from "@/components/Organic";
import { useSettings, formatBRL } from "@/lib/settings";

export default function FinalCta() {
    const { settings: s } = useSettings();
    return (
        <section
            id="final-cta"
            className="relative z-10 rounded-t-[2.5rem] md:rounded-t-[4rem] -mt-8 md:-mt-12 bg-ink py-16 sm:py-32 overflow-hidden"
            data-testid="final-cta"
        >
            <div className="absolute inset-0 texture-grain opacity-20" aria-hidden="true" />
            <Squiggle className="absolute bottom-16 left-12 w-52 opacity-50 hidden md:block" color="rgb(var(--c-roselight-rgb))" />
            <div className="relative max-w-3xl mx-auto px-5 sm:px-8 text-center">
                <Reveal>
                    <h2 className="font-serif italic font-light text-4xl sm:text-5xl lg:text-6xl text-white leading-[1.15]">
                        {s.finalTitle}
                    </h2>
                    <p className="mt-6 text-white/85 leading-relaxed max-w-xl mx-auto">{s.finalText}</p>
                </Reveal>
                <Reveal delay={0.12}>
                    {s.soldOut ? (
                        <span
                            data-testid="final-cta-soldout"
                            className="mt-10 h-14 px-10 inline-flex items-center justify-center rounded-full bg-white/15 text-white/60 text-sm uppercase tracking-[0.18em] cursor-not-allowed"
                        >
                            Inscrições encerradas
                        </span>
                    ) : (
                        <Link
                            data-testid="final-cta-button"
                            to="/inscricao/cadastro"
                            className="mt-10 h-14 px-10 inline-flex items-center justify-center rounded-full bg-rose text-white text-sm font-semibold uppercase tracking-[0.18em] hover:bg-cream hover:text-ink transition-colors duration-300"
                        >
                            Quero participar
                        </Link>
                    )}
                </Reveal>
            </div>
        </section>
    );
}
