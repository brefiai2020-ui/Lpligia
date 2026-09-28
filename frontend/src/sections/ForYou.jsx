import { Sprout, Repeat, Compass, Eye, PauseCircle, Aperture } from "lucide-react";
import { Reveal, Eyebrow } from "@/components/Reveal";

const ITEMS = [
    { icon: Sprout, text: "Está vivendo uma fase de mudanças." },
    { icon: Repeat, text: "Sente que alguns padrões continuam se repetindo." },
    { icon: Compass, text: "Quer compreender melhor suas escolhas." },
    { icon: Eye, text: "Busca mais consciência sobre si mesma." },
    { icon: PauseCircle, text: "Quer sair um pouco do piloto automático." },
    { icon: Aperture, text: "Tem vontade de olhar para a vida por novas perspectivas." },
];

export default function ForYou() {
    return (
        <section className="bg-paper py-24 sm:py-32" data-testid="for-you-section">
            <div className="max-w-6xl mx-auto px-5 sm:px-8">
                <Reveal>
                    <Eyebrow tone="dark">Para quem é</Eyebrow>
                    <h2 className="mt-5 font-serif italic font-light text-3xl sm:text-4xl lg:text-5xl text-ink leading-tight">
                        Essa experiência é para você que...
                    </h2>
                </Reveal>
                <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ITEMS.map((item, i) => (
                        <Reveal key={i} delay={0.06 * i} className="h-full">
                            <div className="h-full bg-cream border border-line/50 rounded-3xl p-7 hover:border-gold hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                                <span className="w-11 h-11 rounded-full border border-gold/60 text-gold flex items-center justify-center">
                                    <item.icon size={19} strokeWidth={1.4} />
                                </span>
                                <p className="mt-6 text-ink leading-relaxed">{item.text}</p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
