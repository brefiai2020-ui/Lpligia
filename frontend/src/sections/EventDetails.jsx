import { Calendar, Users, Ticket, Wallet } from "lucide-react";
import { Reveal, Eyebrow } from "@/components/Reveal";
import { useSettings, formatBRL } from "@/lib/settings";

export default function EventDetails() {
    const { settings: s } = useSettings();
    const DETAILS = [
        { icon: Calendar, value: s.eventDateLabel, label: "Data do encontro" },
        { icon: Users, value: "Mentoria em grupo", label: "Formato" },
        { icon: Ticket, value: `Apenas ${s.slotsTotal} vagas`, label: s.seatsLabel },
        {
            icon: Wallet,
            value: `${formatBRL(s.pricePix)} no Pix`,
            label: `ou ${formatBRL(s.priceCard)} no cartão em até ${s.installments}x`,
        },
    ];
    return (
        <section
            className="relative z-10 rounded-t-[2.5rem] md:rounded-t-[4rem] -mt-8 md:-mt-12 bg-paper py-16 sm:py-32"
            data-testid="event-details"
        >
            <div className="max-w-6xl mx-auto px-5 sm:px-8">
                <Reveal>
                    <Eyebrow tone="dark">Detalhes do evento</Eyebrow>
                    <h2 className="mt-5 font-serif italic font-light text-3xl sm:text-4xl text-ink leading-tight max-w-xl">
                        Tudo o que você precisa saber.
                    </h2>
                </Reveal>
                <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {DETAILS.map((d, i) => (
                        <Reveal key={d.label} delay={0.06 * i} className="h-full">
                            <div className="h-full bg-cream border border-line/60 rounded-2xl p-6 sm:p-7">
                                <d.icon size={20} strokeWidth={1.4} className="text-rose" />
                                <p className="mt-6 font-serif text-xl sm:text-2xl text-ink leading-snug">{d.value}</p>
                                <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-smoke/70">{d.label}</p>
                            </div>
                        </Reveal>
                    ))}
                </div>
                <Reveal delay={0.2}>
                    <p className="mt-6 text-xs text-smoke/70 tracking-wide" data-testid="details-pending-note">
                        {s.eventPlaceNote}
                    </p>
                </Reveal>
            </div>
        </section>
    );
}
