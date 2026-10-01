import { HeartHandshake, Compass, Hourglass, Sparkles, ArrowUpRight } from "lucide-react";
import { Reveal, Eyebrow } from "@/components/Reveal";
import { Blob } from "@/components/Organic";
import { useSettings } from "@/lib/settings";
import ligiaPhoto from "../ligia-jeane.jpg";

const CREDS = [
    { icon: Hourglass, label: "+20 anos de experiência" },
    { icon: HeartHandshake, label: "Psicóloga clínica e mentora" },
    { icon: Compass, label: "Psicologia Junguiana" },
    { icon: Sparkles, label: "Expansão de consciência" },
];

export function PhonePortrait() {
    return (
        <div
            className="relative w-56 sm:w-64 mx-auto"
            data-testid="mentor-portrait"
        >
            <div
                className="absolute -inset-6 rounded-[3.5rem] border border-cream/40 -rotate-2"
                aria-hidden="true"
            />

            <div className="relative rounded-[2.8rem] bg-ink p-2.5 shadow-2xl">
                <div className="relative rounded-[2.2rem] overflow-hidden aspect-[9/18] bg-gradient-to-b from-cream via-paper to-beige/60">

                    <span
                        className="absolute top-2.5 left-1/2 -translate-x-1/2 w-20 h-5 rounded-full bg-ink z-10"
                        aria-hidden="true"
                    />

                    <img
                        src={ligiaPhoto}
                        alt="Dra. Lígia Jeane Matroski"
                        className="w-full h-full object-cover object-center"
                    />
                </div>
            </div>

            <div
                className="absolute -right-5 top-14 w-24 h-24 rounded-full bg-rose text-white flex flex-col items-center justify-center shadow-lg rotate-3"
                data-testid="about-experience-badge"
            >
                <span className="font-serif italic text-2xl leading-none">
                    +20
                </span>

                <span className="text-[9px] uppercase tracking-[0.18em] mt-1">
                    anos
                </span>
            </div>
        </div>
    );
}

export default function About() {
    const { settings: s } = useSettings();

    const instagramUrl = s.instagram
        ? `https://instagram.com/${s.instagram.replace("@", "")}`
        : "https://instagram.com/";

    return (
        <section
            id="sobre"
            className="relative z-10 rounded-t-[2.5rem] md:rounded-t-[4rem] -mt-8 md:-mt-12 bg-beige py-16 sm:py-32 scroll-mt-20 overflow-hidden"
            data-testid="about-section"
        >
            <div
                className="absolute inset-0 texture-grain opacity-10"
                aria-hidden="true"
            />

            <Blob
                className="-top-10 -left-16 w-72 h-72 bg-cream/15"
            />

            <div className="relative max-w-6xl mx-auto px-5 sm:px-8 grid lg:grid-cols-12 gap-16 lg:gap-10 items-center">

                <Reveal className="lg:col-span-5">
                    <PhonePortrait />
                </Reveal>

                <div className="lg:col-span-7">

                    <Reveal>
                        <Eyebrow tone="light">
                            Sobre a Lígia
                        </Eyebrow>

                        <h2 className="mt-5 font-serif italic font-light text-3xl sm:text-4xl lg:text-5xl text-white leading-tight">
                            Quem vai conduzir essa experiência?
                        </h2>

                        <p className="mt-5 font-serif italic text-2xl text-white/90">
                            Dra. Lígia Jeane Matroski
                        </p>

                        <p className="mt-5 text-white/95 leading-relaxed max-w-xl">
                            Psicóloga clínica e mentora há mais de 20 anos,
                            com uma trajetória dedicada à Psicologia Junguiana,
                            à expansão de consciência e ao desenvolvimento humano.
                        </p>
                    </Reveal>

                    <Reveal delay={0.12}>
                        <div className="mt-9 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
                            {CREDS.map((c) => (
                                <div
                                    key={c.label}
                                    className="flex items-center gap-3 bg-white/15 border border-white/40 rounded-xl px-5 py-4"
                                >
                                    <c.icon
                                        size={18}
                                        strokeWidth={1.4}
                                        className="text-white shrink-0"
                                    />

                                    <span className="text-sm text-white">
                                        {c.label}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <a
                            data-testid="about-instagram-button"
                            href={instagramUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-10 h-14 px-9 inline-flex items-center gap-2 rounded-full bg-white text-ink text-sm uppercase tracking-[0.18em] hover:bg-rose hover:text-white transition-colors duration-300"
                        >
                            Conhecer o trabalho da Lígia

                            <ArrowUpRight
                                size={16}
                                strokeWidth={1.5}
                            />
                        </a>
                    </Reveal>

                </div>
            </div>
        </section>
    );
}
