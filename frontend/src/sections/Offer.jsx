import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { Reveal, Eyebrow } from "@/components/Reveal";
import { Blob } from "@/components/Organic";
import { useSettings, formatBRL } from "@/lib/settings";

export default function Offer() {
    const { settings: s } = useSettings();
    return (
        <section
            id="mentoria"
            className="relative z-10 rounded-t-[2.5rem] md:rounded-t-[4rem] -mt-8 md:-mt-12 bg-beige py-16 sm:py-32 scroll-mt-20 overflow-hidden"
            data-testid="offer-section"
        >
            <Blob className="top-20 -right-20 w-80 h-80 bg-rose/25" />
            <div className="relative max-w-xl mx-auto px-5 sm:px-8">
                <Reveal>
                    <div className="bg-cream border border-line/60 rounded-3xl p-8 sm:p-12 text-center shadow-sm">
                        <Eyebrow center tone="dark">Oferta</Eyebrow>
                        <h2 className="mt-5 font-serif italic font-light text-3xl sm:text-4xl text-ink leading-tight">
                            Seu próximo passo pode começar aqui.
                        </h2>
                        <p className="mt-6 text-[11px] uppercase tracking-[0.28em] text-ink/75">Mentoria em Grupo</p>
                        <p className="mt-2 text-sm text-ink/85">com Dra. Lígia Jeane Matroski</p>
                        <p className="mt-6 font-serif italic text-6xl text-ink" data-testid="offer-price">
                            {formatBRL(s.pricePix)}
                        </p>
                        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-ink/70" data-testid="offer-price-pix">
                            no Pix
                        </p>
                        <p className="mt-3 text-sm text-ink/85" data-testid="offer-price-card">
                            ou {formatBRL(s.priceCard)} no cartão em até {s.installments}x
                        </p>
                        <div className="mt-6 flex flex-wrap justify-center gap-2 text-[11px] uppercase tracking-[0.18em]">
                            <span className="px-4 py-2 rounded-full border border-line bg-paper text-ink/80">
                                {s.eventDateLabel}
                            </span>
                            <span className="px-4 py-2 rounded-full border border-line bg-paper text-ink/80" data-testid="offer-seats-chip">
                                {s.seatsLabel}
                            </span>
                        </div>
                        {s.soldOut ? (
                            <span
                                data-testid="offer-cta-soldout"
                                className="mt-10 h-14 px-8 inline-flex items-center justify-center rounded-full bg-cream/60 text-smoke/60 text-sm uppercase tracking-[0.18em] border border-line cursor-not-allowed w-full"
                            >
                                Inscrições encerradas
                            </span>
                        ) : (
                            <Link
                                data-testid="offer-cta-button"
                                to="/inscricao/cadastro"
                                className="mt-10 h-14 px-8 inline-flex items-center justify-center rounded-full bg-ink text-paper text-sm uppercase tracking-[0.18em] hover:bg-gold hover:text-ink transition-colors duration-300 w-full"
                            >
                                Quero garantir minha vaga
                            </Link>
                        )}
                        <p className="mt-5 flex items-center justify-center gap-2 text-xs text-ink/75">
                            <ShieldCheck size={14} strokeWidth={1.5} className="text-ink" />
                            Pagamento seguro pelo Checkout InfinitePay.
                        </p>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}
