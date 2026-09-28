import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { Reveal, Eyebrow } from "@/components/Reveal";
import { useSettings, formatBRL } from "@/lib/settings";

export default function Offer() {
    const { settings: s } = useSettings();
    return (
        <section id="mentoria" className="bg-beige py-24 sm:py-32 scroll-mt-20" data-testid="offer-section">
            <div className="max-w-xl mx-auto px-5 sm:px-8">
                <Reveal>
                    <div className="bg-cream border border-line/60 rounded-3xl p-8 sm:p-12 text-center shadow-sm">
                        <Eyebrow center>Oferta</Eyebrow>
                        <h2 className="mt-5 font-serif text-3xl sm:text-4xl text-ink leading-tight">
                            Seu próximo passo pode começar aqui.
                        </h2>
                        <p className="mt-6 text-[11px] uppercase tracking-[0.28em] text-gold">Mentoria em Grupo</p>
                        <p className="mt-2 text-sm text-smoke">com Dra. Lígia Jeane Matroski</p>
                        <p className="mt-6 font-serif text-6xl text-ink" data-testid="offer-price">
                            {formatBRL(s.pricePix)}
                        </p>
                        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-smoke" data-testid="offer-price-pix">
                            no Pix
                        </p>
                        <p className="mt-3 text-sm text-smoke" data-testid="offer-price-card">
                            ou {formatBRL(s.priceCard)} no cartão em até {s.installments}x
                        </p>
                        <div className="mt-6 flex justify-center gap-2 text-[11px] uppercase tracking-[0.18em]">
                            <span className="px-4 py-2 rounded-full border border-line bg-paper text-smoke">
                                {s.eventDateLabel}
                            </span>
                            <span className="px-4 py-2 rounded-full border border-line bg-paper text-smoke" data-testid="offer-seats-chip">
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
                        <p className="mt-5 flex items-center justify-center gap-2 text-xs text-smoke/80">
                            <ShieldCheck size={14} strokeWidth={1.5} className="text-gold" />
                            Pagamento seguro pelo Checkout InfinitePay.
                        </p>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}
