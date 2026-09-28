import { Calendar, Users, Ticket, Wallet } from "lucide-react";
import { Reveal, Eyebrow } from "@/components/Reveal";

const DETAILS = [
    { icon: Calendar, value: "10 de outubro de 2026", label: "Data do encontro" },
    { icon: Users, value: "Mentoria em grupo", label: "Formato" },
    { icon: Ticket, value: "Apenas 50 vagas", label: "Exclusividade" },
    { icon: Wallet, value: "R$ 100", label: "Investimento" },
];

export default function EventDetails() {
    return (
        <section className="bg-paper py-24 sm:py-32" data-testid="event-details">
            <div className="max-w-6xl mx-auto px-5 sm:px-8">
                <Reveal>
                    <Eyebrow>Detalhes do evento</Eyebrow>
                    <h2 className="mt-5 font-serif text-3xl sm:text-4xl text-ink leading-tight max-w-xl">
                        Tudo o que você precisa saber.
                    </h2>
                </Reveal>
                <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {DETAILS.map((d, i) => (
                        <Reveal key={d.label} delay={0.06 * i} className="h-full">
                            <div className="h-full bg-cream border border-line/60 rounded-2xl p-6 sm:p-7">
                                <d.icon size={20} strokeWidth={1.4} className="text-gold" />
                                <p className="mt-6 font-serif text-xl sm:text-2xl text-ink leading-snug">{d.value}</p>
                                <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-smoke/70">{d.label}</p>
                            </div>
                        </Reveal>
                    ))}
                </div>
                <Reveal delay={0.2}>
                    <p className="mt-6 text-xs text-smoke/70 tracking-wide" data-testid="details-pending-note">
                        Horário e local serão informados em breve.
                    </p>
                </Reveal>
            </div>
        </section>
    );
}
