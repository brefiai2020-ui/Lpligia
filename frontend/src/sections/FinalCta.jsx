import { Link } from "react-router-dom";
import { Reveal } from "@/components/Reveal";
import { useSettings, formatBRL } from "@/lib/settings";

export default function FinalCta() {
    const { settings: s } = useSettings();
    return (
        <section className="bg-ink py-24 sm:py-32 relative overflow-hidden" data-testid="final-cta">
            <div className="absolute inset-0 texture-grain opacity-20" aria-hidden="true" />
            <div className="relative max-w-3xl mx-auto px-5 sm:px-8 text-center">
                <Reveal>
                    <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-cream leading-[1.15]">
                        {s.finalTitle}
                    </h2>
                    <p className="mt-6 text-cream/70 leading-relaxed max-w-xl mx-auto">{s.finalText}</p>
                </Reveal>
                <Reveal delay={0.12}>
                    <div
                        className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-2 text-[11px] uppercase tracking-[0.22em] text-gold"
                        data-testid="final-cta-meta"
                    >
                        <span>{s.eventDateLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatBRL(s.pricePix)} no Pix</span>
                        <span aria-hidden="true">·</span>
                        <span>{s.seatsLabel}</span>
                    </div>
                    {s.soldOut ? (
                        <span
                            data-testid="final-cta-soldout"
                            className="mt-10 h-14 px-10 inline-flex items-center justify-center rounded-full bg-cream/15 text-cream/60 text-sm uppercase tracking-[0.18em] cursor-not-allowed"
                        >
                            Inscrições encerradas
                        </span>
                    ) : (
                        <Link
                            data-testid="final-cta-button"
                            to="/inscricao/cadastro"
                            className="mt-10 h-14 px-10 inline-flex items-center justify-center rounded-full bg-gold text-ink text-sm font-semibold uppercase tracking-[0.18em] hover:bg-paper transition-colors duration-300"
                        >
                            Quero participar
                        </Link>
                    )}
                </Reveal>
            </div>
        </section>
    );
}
