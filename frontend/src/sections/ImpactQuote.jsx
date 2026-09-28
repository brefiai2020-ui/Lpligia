import { Reveal } from "@/components/Reveal";
import { useSettings } from "@/lib/settings";

export default function ImpactQuote() {
    const { settings: s } = useSettings();
    const [firstLine, ...restLines] = (s.impactQuote || "").split("\n");
    return (
        <section className="bg-ink py-28 sm:py-40 relative overflow-hidden" data-testid="impact-quote">
            <div className="absolute inset-0 texture-grain opacity-20" aria-hidden="true" />
            <div className="relative max-w-4xl mx-auto px-5 sm:px-8 text-center">
                <Reveal>
                    <p className="font-serif italic text-3xl sm:text-5xl lg:text-6xl text-cream leading-[1.2]">
                        {firstLine}
                        {restLines.length > 0 && (
                            <span className="block mt-5 text-goldlight">{restLines.join(" ")}</span>
                        )}
                    </p>
                </Reveal>
            </div>
        </section>
    );
}
