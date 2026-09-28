import { Link } from "react-router-dom";
import { Hourglass, HeartHandshake, Compass, Sparkles, ArrowUpRight } from "lucide-react";
import { Reveal, Eyebrow } from "@/components/Reveal";
import PortraitFrame from "@/components/PortraitFrame";
import { useSettings } from "@/lib/settings";

const CREDS = [
    { icon: Hourglass, label: "+20 anos de experiência" },
    { icon: HeartHandshake, label: "Psicóloga clínica" },
    { icon: Compass, label: "Mentora" },
    { icon: Sparkles, label: "Desenvolvimento humano" },
];

export default function About() {
    const { settings: s } = useSettings();
    const instagramUrl = s.instagram ? `https://instagram.com/${s.instagram.replace("@", "")}` : "https://instagram.com/";
    return (
        <section id="sobre" className="bg-paper py-24 sm:py-32 scroll-mt-20" data-testid="about-section">
            <div className="max-w-6xl mx-auto px-5 sm:px-8 grid lg:grid-cols-12 gap-14 lg:gap-16 items-center">
                <Reveal className="lg:col-span-5">
                    <div className="relative max-w-xs mx-auto lg:mx-0">
                        <PortraitFrame
                            stamp={
                                <div className="absolute -right-4 top-10 w-24 h-24 rounded-full bg-gold text-ink flex flex-col items-center justify-center shadow-lg" data-testid="about-experience-badge">
                                    <span className="font-serif text-2xl leading-none">+20</span>
                                    <span className="text-[9px] uppercase tracking-[0.18em] mt-1">anos</span>
                                </div>
                            }
                        />
                    </div>
                </Reveal>

                <div className="lg:col-span-7">
                    <Reveal>
                        <Eyebrow>Sobre a Lígia</Eyebrow>
                        <h2 className="mt-5 font-serif text-3xl sm:text-4xl lg:text-5xl text-ink leading-tight">
                            Quem vai conduzir essa experiência?
                        </h2>
                        <p className="mt-5 font-serif italic text-2xl text-gold">Dra. Lígia Jeane Matroski</p>
                        <p className="mt-5 text-smoke leading-relaxed max-w-xl">
                            Psicóloga clínica e mentora há mais de 20 anos, com uma trajetória dedicada ao
                            desenvolvimento humano, despertar e expansão da consciência.
                        </p>
                    </Reveal>
                    <Reveal delay={0.12}>
                        <div className="mt-9 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
                            {CREDS.map((c) => (
                                <div
                                    key={c.label}
                                    className="flex items-center gap-3 bg-cream border border-line/60 rounded-xl px-5 py-4"
                                >
                                    <c.icon size={18} strokeWidth={1.4} className="text-gold shrink-0" />
                                    <span className="text-sm text-ink">{c.label}</span>
                                </div>
                            ))}
                        </div>
                        <a
                            data-testid="about-instagram-button"
                            href={instagramUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-10 h-14 px-9 inline-flex items-center gap-2 rounded-full border border-ink text-ink text-sm uppercase tracking-[0.18em] hover:bg-ink hover:text-paper transition-colors duration-300"
                        >
                            Conhecer o trabalho da Lígia <ArrowUpRight size={16} strokeWidth={1.5} />
                        </a>
                    </Reveal>
                </div>
            </div>
        </section>
    );
}
