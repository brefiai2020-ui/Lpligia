import { Eye, Users, Compass, Sprout, Sparkles } from "lucide-react";
import { Reveal, Eyebrow } from "@/components/Reveal";
import { Squiggle } from "@/components/Organic";

const BENEFITS = [
    {
        icon: Eye,
        title: "Clareza emocional",
        desc: "Enxergar os padrões que passam despercebidos.",
    },
    {
        icon: Users,
        title: "Troca segura",
        desc: "Escuta e acolhimento entre mulheres.",
    },
    {
        icon: Compass,
        title: "Ferramentas práticas",
        desc: "Para levar para a vida desde o primeiro dia.",
    },
    {
        icon: Sprout,
        title: "Pausa consciente",
        desc: "Sair do automático e se reencontrar.",
    },
    {
        icon: Sparkles,
        title: "Meditação",
        desc: "Para despertar a Glândula Pineal.",
    },
];

const CHIPS = [
    "Está numa fase de mudanças",
    "Sente padrões se repetindo",
    "Quer sair do automático",
    "Busca mais consciência",
    "Quer novas perspectivas",
];

export default function ForYou() {
    return (
        <section
            id="viver"
            className="relative z-10 rounded-t-[2.5rem] md:rounded-t-[4rem] -mt-8 md:-mt-12 bg-paper py-16 sm:py-32 scroll-mt-20"
            data-testid="section-beneficios"
        >
            <div className="max-w-6xl mx-auto px-5 sm:px-8">
                <Reveal>
                    <Eyebrow tone="dark">
                        O que você vai viver
                    </Eyebrow>

                    <h2 className="mt-5 font-serif italic font-light text-3xl sm:text-4xl lg:text-5xl text-ink leading-tight max-w-2xl">
                        Um despertar de consciência e a existência de uma nova realidade.
                    </h2>

                    <Squiggle
                        className="w-44 mt-6"
                        color="rgb(var(--c-rose-rgb))"
                    />
                </Reveal>

                <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {BENEFITS.map((b, i) => (
                        <Reveal
                            key={b.title}
                            delay={0.06 * i}
                            className="h-full"
                        >
                            <div className="h-full bg-cream border border-line/50 rounded-3xl p-7 hover:border-gold hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                                <span className="w-11 h-11 rounded-full border border-rose/70 text-rose flex items-center justify-center">
                                    <b.icon
                                        size={19}
                                        strokeWidth={1.4}
                                    />
                                </span>

                                <h3 className="mt-6 font-serif italic text-xl text-ink">
                                    {b.title}
                                </h3>

                                <p className="mt-2 text-sm text-smoke leading-relaxed">
                                    {b.desc}
                                </p>
                            </div>
                        </Reveal>
                    ))}
                </div>

                <Reveal delay={0.15}>
                    <div
                        className="mt-10 flex flex-wrap justify-center gap-2.5"
                        data-testid="for-who-chips"
                    >
                        <span className="w-full text-center text-[11px] uppercase tracking-[0.28em] text-smoke/70 mb-1">
                            Para quem é
                        </span>

                        {CHIPS.map((c) => (
                            <span
                                key={c}
                                className="px-4 py-2 rounded-full border border-line bg-cream text-[13px] text-ink/80"
                            >
                                {c}
                            </span>
                        ))}
                    </div>
                </Reveal>
            </div>
        </section>
    );
}
