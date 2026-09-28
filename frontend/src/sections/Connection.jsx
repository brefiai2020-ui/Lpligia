import { Reveal } from "@/components/Reveal";
import { useSettings } from "@/lib/settings";
import { Squiggle } from "@/components/Organic";

export default function Connection() {
    const { settings: s } = useSettings();
    return (
        <section
            className="relative z-10 rounded-t-[2.5rem] md:rounded-t-[4rem] -mt-8 md:-mt-12 bg-beige py-24 sm:py-32"
            data-testid="connection-block"
        >
            <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center">
                <Squiggle className="w-40 mx-auto mb-8" color="rgb(var(--c-cream-rgb))" />
                <Reveal>
                    <h2 className="mt-5 font-serif italic font-light text-3xl sm:text-4xl lg:text-5xl text-white leading-tight">
                        {s.connectionTitle}
                    </h2>
                </Reveal>
                <Reveal delay={0.12}>
                    <p className="mt-5 font-serif italic text-2xl sm:text-3xl text-white leading-snug">
                        {s.connectionHighlight}
                    </p>
                </Reveal>
                <Reveal delay={0.2}>
                    <p className="mt-9 text-white/95 leading-relaxed max-w-xl mx-auto">{s.connectionText}</p>
                </Reveal>
            </div>
        </section>
    );
}
