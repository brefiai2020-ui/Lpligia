import { Reveal, Eyebrow } from "@/components/Reveal";

const STEPS = [
    "Faça sua inscrição",
    "Realize o pagamento pelo Checkout InfinitePay",
    "Receba sua confirmação e seu ingresso digital",
];

export default function PurchaseFlow() {
    return (
        <section
            className="relative z-10 rounded-t-[2.5rem] md:rounded-t-[4rem] -mt-8 md:-mt-12 bg-paper py-24 sm:py-32"
            data-testid="purchase-flow"
        >
            <div className="max-w-6xl mx-auto px-5 sm:px-8">
                <Reveal>
                    <Eyebrow tone="dark">Como participar</Eyebrow>
                    <h2 className="mt-5 font-serif text-3xl sm:text-4xl text-ink leading-tight max-w-xl">
                        Do clique ao ingresso, em três passos.
                    </h2>
                </Reveal>
                <div className="mt-14 grid md:grid-cols-3 gap-10 md:gap-8">
                    {STEPS.map((step, i) => (
                        <Reveal key={i} delay={0.1 * i}>
                            <div className="border-t border-line pt-6 relative">
                                <span
                                    className="hidden md:block absolute top-0 left-0 w-full h-px bg-gold/60 origin-left scale-x-0 transition-transform duration-700"
                                    style={{ transform: "scaleX(1)", transformOrigin: "left" }}
                                    aria-hidden="true"
                                />
                                <span className="font-serif italic text-5xl text-rose">{`0${i + 1}`}</span>
                                <p className="mt-5 text-ink leading-relaxed max-w-xs">{step}</p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
