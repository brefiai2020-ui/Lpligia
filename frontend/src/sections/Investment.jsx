import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { Reveal, Eyebrow } from "@/components/Reveal";
import { useSettings, formatBRL } from "@/lib/settings";

export default function Investment() {
    const { settings: s } = useSettings();

    const STEPS = [
        {
            n: "01",
            t: "Inscreva-se",
            d: "Cadastro em 1 minuto, sem complicação.",
        },
        {
            n: "02",
            t: "Receba a confirmação",
            d: "Ingresso digital com QR Code no seu e-mail.",
        },
        {
            n: "03",
            t: "Viva o encontro",
            d: `Presencial e em grupo, em ${s.eventDateShort}.`,
        },
    ];

    return (
        <section
            id="mentoria"
            className="relative z-10 rounded-t-[2.5rem] md:rounded-t-[4rem] -mt-8 md:-mt-12 bg-cream py-16 sm:py-32 scroll-mt-20 overflow-hidden"
            data-testid="section-investimento"
        >
            <div className="relative max-w-5xl mx-auto px-5 sm:px-8">
                <Reveal>
                    <Eyebrow tone="dark">Como funciona</Eyebrow>

                    <h2 className="mt-5 font-serif italic font-light text-3xl sm:text-4xl text-ink leading-tight max-w-xl">
                        Do clique ao ingresso, em três passos.
                    </h2>
                </Reveal>

                <div className="mt-10 grid sm:grid-cols-3 gap-6 sm:gap-8">
                    {STEPS.map((step, i) => (
                        <Reveal key={step.n} delay={0.08 * i}>
                            <div className="border-t border-line pt-5">
                                <span className="font-serif italic text-4xl text-rose">
                                    {step.n}
                                </span>

                                <h3 className="mt-3 font-serif italic text-xl text-ink">
                                    {step.t}
                                </h3>

                                <p className="mt-1.5 text-sm text-smoke leading-relaxed">
                                    {step.d}
                                </p>
                            </div>
                        </Reveal>
                    ))}
                </div>

                <Reveal delay={0.1}>
                    <div
                        className="relative mt-12 bg-ink rounded-[2.5rem] p-8 sm:p-12 text-center overflow-hidden"
                        data-testid="investimento-card"
                    >
                        <div
                            className="absolute inset-0 texture-grain opacity-20"
                            aria-hidden="true"
                        />

                        <div className="relative">
                            <Eyebrow center tone="light">
                                Investimento
                            </Eyebrow>

                            <p className="mt-5 inline-flex px-4 py-2 rounded-full bg-cream/10 border border-cream/25 text-[11px] uppercase tracking-[0.2em] text-cream">
                                {s.eventDateLabel}
                            </p>

                            <p
                                className="mt-6 font-serif italic text-6xl sm:text-7xl text-white leading-none"
                                data-testid="investimento-price-pix"
                            >
                                {formatBRL(s.pricePix)}
                            </p>

                            <p
                                className="mt-2 text-[11px] uppercase tracking-[0.2em] text-goldlight"
                                data-testid="investimento-pix-note"
                            >
                                no Pix · melhor valor
                            </p>

                            <p
                                className="mt-4 text-sm text-cream/85"
                                data-testid="investimento-price-card"
                            >
                                ou {formatBRL(s.priceCard)} no cartão em até{" "}
                                <strong className="text-white font-semibold">
                                    {s.installments}x sem juros
                                </strong>{" "}
                                de {formatBRL(s.priceCard / s.installments)}
                            </p>

                            <div className="mt-6 flex justify-center">
                                <span
                                    className="px-4 py-2 rounded-full bg-rose/20 border border-rose/50 text-[11px] uppercase tracking-[0.18em] text-white"
                                    data-testid="investimento-seats-chip"
                                >
                                    {s.seatsLabel}
                                </span>
                            </div>

                            {s.soldOut ? (
                                <span
                                    data-testid="investimento-cta-soldout"
                                    className="mt-9 h-14 w-full px-8 inline-flex items-center justify-center rounded-full bg-cream/15 text-cream/60 text-sm uppercase tracking-[0.18em] border border-cream/25 cursor-not-allowed"
                                >
                                    Inscrições encerradas
                                </span>
                            ) : (
                                <Link
                                    data-testid="investimento-cta-button"
                                    to="/inscricao/cadastro"
                                    className="mt-9 h-14 w-full px-8 inline-flex items-center justify-center rounded-full bg-rose text-white text-sm font-semibold uppercase tracking-[0.18em] hover:bg-cream hover:text-ink transition-colors duration-300"
                                >
                                    Garantir meu ingresso
                                </Link>
                            )}

                            <p className="mt-5 flex items-center justify-center gap-2 text-xs text-cream/75">
                                <ShieldCheck
                                    size={14}
                                    strokeWidth={1.5}
                                    className="text-goldlight"
                                />

                                Pagamento seguro pelo Checkout InfinitePay ·
                                confirmação por e-mail.
                            </p>
                        </div>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}
