const ITEMS = ["Consciência", "Reflexão", "Novas possibilidades", "Acolhimento", "Presença", "Autoconhecimento"];

export default function Marquee() {
    return (
        <div className="relative z-10 rounded-t-[2.5rem] md:rounded-t-[4rem] -mt-8 md:-mt-12 border-y border-line/50 bg-cream pt-5 pb-12 md:pb-16 overflow-hidden" aria-hidden="true" data-testid="marquee">
                <div className="flex w-max animate-marquee">
                {[0, 1].map((copy) => (
                    <div key={copy} className="flex items-center shrink-0">
                        {ITEMS.map((item) => (
                            <span key={`${copy}-${item}`} className="flex items-center">
                                <span className="font-serif italic text-xl sm:text-2xl text-smoke px-8 whitespace-nowrap">
                                    {item}
                                </span>
                                <span className="w-1.5 h-1.5 rounded-full bg-rose" />
                            </span>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
