import { useState } from "react";
import { Play } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { Monogram } from "@/components/Monogram";
import { useSettings } from "@/lib/settings";

export default function VideoSection() {
    const { settings: s } = useSettings();
    const [playing, setPlaying] = useState(false);

    return (
        <section className="bg-paper py-24 sm:py-32" data-testid="video-section">
            <div className="max-w-5xl mx-auto px-5 sm:px-8">
                <Reveal className="text-center">
                    <p className="flex justify-center items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-gold">
                        <span className="h-px w-10 bg-gold/60" aria-hidden="true" /> Vídeo{" "}
                        <span className="h-px w-10 bg-gold/60" aria-hidden="true" />
                    </p>
                    <h2 className="mt-5 font-serif text-3xl sm:text-4xl lg:text-5xl text-ink leading-tight">
                        Antes de decidir participar,
                        <br className="hidden sm:block" /> quero conversar com você.
                    </h2>
                    <p className="mt-4 text-smoke">Conheça a proposta diretamente da Dra. Lígia.</p>
                </Reveal>

                <Reveal delay={0.15}>
                    <div
                        className="mt-12 relative rounded-3xl overflow-hidden bg-ink aspect-video group"
                        data-testid="video-player"
                    >
                        {s.videoUrl ? (
                            <iframe
                                src={s.videoUrl}
                                title="Dra. Lígia Jeane Matroski"
                                className="absolute inset-0 w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        ) : playing ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 text-center px-6">
                                <Monogram className="w-16 h-16 text-2xl" tone="gold" />
                                <p className="font-serif italic text-2xl text-cream leading-snug">
                                    Espaço reservado para o vídeo da Dra. Lígia.
                                </p>
                                <p className="text-[10px] uppercase tracking-[0.22em] text-cream/50">
                                    A URL do vídeo pode ser configurada na área administrativa
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="absolute inset-0 texture-grain opacity-30" aria-hidden="true" />
                                <div
                                    className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(197,160,89,0.16),transparent_65%)]"
                                    aria-hidden="true"
                                />
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                                    <button
                                        data-testid="video-play-button"
                                        onClick={() => setPlaying(true)}
                                        className="relative w-20 h-20 rounded-full border border-gold/70 text-gold flex items-center justify-center transition-all duration-500 group-hover:scale-105 group-hover:bg-gold group-hover:text-ink"
                                        aria-label="Dar play"
                                    >
                                        <span
                                            className="absolute inset-0 rounded-full border border-gold/30 animate-ping-slow"
                                            aria-hidden="true"
                                        />
                                        <Play size={22} strokeWidth={1.5} className="ml-1" />
                                    </button>
                                    <p className="text-[11px] uppercase tracking-[0.28em] text-cream/80">Dar play</p>
                                </div>
                                <div className="absolute bottom-6 inset-x-0 text-center hidden sm:block">
                                    <p className="text-[10px] uppercase tracking-[0.3em] text-cream/40">
                                        Dra. Lígia Jeane Matroski · Mentoria em Grupo
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </Reveal>
            </div>
        </section>
    );
}
