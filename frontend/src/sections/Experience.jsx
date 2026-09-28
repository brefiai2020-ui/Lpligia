import { Reveal, Eyebrow } from "@/components/Reveal";
import { Squiggle } from "@/components/Organic";

const PILLARS = [
    {
        n: "01",
        name: "Consciência",
        desc: "Perceber pensamentos, comportamentos e padrões que fazem parte da sua história.",
    },
    {
        n: "02",
        name: "Reflexão",
        desc: "Criar espaço para olhar para questões que muitas vezes ficam no automático.",
    },
    {
        n: "03",
        name: "Novas possibilidades",
        desc: "A partir da reflexão, ampliar perspectivas e enxergar novos caminhos.",
    },
];

export default function Experience() {
    return (
        <section
            id="experiencia"
            className="relative z-10 rounded-t-[2.5rem] md:rounded-t-[4rem] -mt-8 md:-mt-12 bg-ink py-24 sm:py-32 scroll-mt-20 overflow-hidden"
            data-testid="experience-section"
        >
            <div className="absolute inset-0 texture-grain opacity-15" aria-hidden="true" />
            <Squiggle className="absolute top-16 right-8 w-56 opacity-50 hidden lg:block" color="rgb(var(--c-roselight-rgb))" />
            <div className="relative max-w-6xl mx-auto px-5 sm:px-8">
                <Reveal>
                    <Eyebrow>A experiência</Eyebrow>
                    <h2 className="mt-5 font-serif italic font-light text-3xl sm:text-4xl lg:text-5xl text-cream leading-tight max-w-2xl">
                        Um encontro para olhar para você.
                    </h2>
                </Reveal>
                <div className="mt-14 border-t border-cream/15">
                    {PILLARS.map((p, i) => (
                        <Reveal key={p.n} delay={0.08 * i}>
                            <div className="grid md:grid-cols-12 gap-4 md:gap-8 items-baseline py-10 border-b border-cream/15 group rounded-2xl transition-colors hover:bg-cream/5">
                                <span className="md:col-span-2 font-serif italic text-4xl text-goldlight/90">{p.n}</span>
                                <h3 className="md:col-span-4 font-serif italic text-2xl sm:text-3xl text-cream group-hover:text-goldlight transition-colors duration-300">
                                    {p.name}
                                </h3>
                                <p className="md:col-span-6 text-white/80 leading-relaxed md:text-right md:pl-10">
                                    {p.desc}
                                </p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
