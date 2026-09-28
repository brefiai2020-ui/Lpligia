import { Reveal } from "@/components/Reveal";
import { useSettings } from "@/lib/settings";
import { Squiggle } from "@/components/Organic";

export default function ImpactQuote() {
    const { settings: s } = useSettings();
    const [firstLine, ...restLines] = (s.impactQuote || "").split("\n");
    return (
        <section
            className="relative z-10 rounded-t-[2.5rem] md:rounded-t-[4rem] -mt-8 md:-mt-12 bg-ink py-28 sm:py-40 overflow-hidden"
            data-testid="impact-quote"
        >
            <div className="absolute inset-0 texture-grain opacity-20" aria-hidden="true" />
            <Squiggle className="absolute top-14 left-10 w-48 opacity-50 hidden md:block" color="rgb(var(--c-roselight-rgb))" />
            <div className="relative max-w-4xl mx-auto px-5 sm:px-8 text-center">
                <Reveal>
                    <p className="font-serif italic text-3xl sm:text-5xl lg:text-6xl text-cream leading-[1.2]">
                        {firstLine}
                        {restLines.length > 0 && (
                        <span className="block mt-5 text-roselight">{restLines.join(" ")}</span>
                        )}
                    </p>
                </Reveal>
            </div>
        </section>
    );
}
