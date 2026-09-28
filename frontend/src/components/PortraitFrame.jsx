import { PORTRAIT_URL, EVENT } from "@/config";

// Moldura do retrato. Enquanto PORTRAIT_URL (config.js) estiver vazia,
// exibe um placeholder elegante com o monograma — cole a URL e a foto assume o lugar.
export default function PortraitFrame({ className = "", stamp = null }) {
    return (
        <div className={`relative ${className}`} data-testid="mentor-portrait">
            <div
                className="absolute inset-0 rounded-t-full rounded-b-[2rem] border border-gold/50 translate-x-3 translate-y-3"
                aria-hidden="true"
            />
            <div className="relative aspect-[3/4] rounded-t-full rounded-b-[2rem] overflow-hidden bg-gradient-to-b from-beige via-cream to-line/70">
                {PORTRAIT_URL ? (
                    <img src={PORTRAIT_URL} alt={EVENT.mentor} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-6">
                        <span className="w-24 h-24 rounded-full border border-gold/60 flex items-center justify-center font-serif italic text-gold text-4xl">
                            LJ
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.3em] text-smoke/70 text-center px-6 leading-relaxed">
                            Foto oficial
                            <br />
                            em breve
                        </span>
                    </div>
                )}
            </div>
            {stamp}
        </div>
    );
}
