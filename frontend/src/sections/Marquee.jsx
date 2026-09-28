const ITEMS = ["Consciência", "Reflexão", "Novas possibilidades", "Acolhimento", "Presença", "Autoconhecimento"];

export default function Marquee() {
    return (
        <div className="border-y border-line/60 bg-cream py-5 overflow-hidden" aria-hidden="true">
            <div className="flex w-max animate-marquee">
                {[0, 1].map((copy) => (
                    <div key={copy} className="flex items-center shrink-0">
                        {ITEMS.map((item) => (
                            <span key={`${copy}-${item}`} className="flex items-center">
                                <span className="font-serif italic text-xl sm:text-2xl text-smoke px-8 whitespace-nowrap">
                                    {item}
                                </span>
                                <span className="w-1.5 h-1.5 rounded-full bg-gold/70" />
                            </span>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
