import { Reveal } from "@/components/Reveal";
import { useSettings } from "@/lib/settings";

export default function Connection() {
    const { settings: s } = useSettings();
    return (
        <section className="bg-beige py-24 sm:py-32" data-testid="connection-block">
            <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center">
                <Reveal>
                    <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-ink leading-tight">
                        {s.connectionTitle}
                    </h2>
                </Reveal>
                <Reveal delay={0.12}>
                    <p className="mt-5 font-serif italic text-2xl sm:text-3xl text-gold leading-snug">
                        {s.connectionHighlight}
                    </p>
                </Reveal>
                <Reveal delay={0.2}>
                    <p className="mt-9 text-smoke leading-relaxed max-w-xl mx-auto">{s.connectionText}</p>
                </Reveal>
            </div>
        </section>
    );
}
