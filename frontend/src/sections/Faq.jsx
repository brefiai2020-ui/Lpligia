import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Reveal, Eyebrow } from "@/components/Reveal";
import { Squiggle } from "@/components/Organic";
import { useSettings, formatBRL } from "@/lib/settings";

export default function Faq() {
    const { settings: s } = useSettings();
    const [open, setOpen] = useState(0);

    const QA = [
        {
            q: "Quando será a terapia em grupo?",
            a: "10 de outubro de 2026. Check-in a partir das 08:00 · início às 09:00 · encerramento às 12:00.",
        },
        {
            q: "Qual o investimento?",
            a: `${formatBRL(s.pricePix)} no Pix ou ${formatBRL(s.priceCard)} no cartão em até ${s.installments}x.`,
        },
        {
            q: "Quantas vagas estão disponíveis?",
            a: `${s.slotsTotal} vagas, para manter o grupo acolhedor.`,
        },
        {
            q: "Como faço o pagamento?",
            a: "O pagamento será realizado por link, com opção de pagamento via Pix ou cartão de crédito.",
        },
        {
            q: "Como receberei meu ingresso?",
            a: "Após a confirmação do pagamento, você receberá as instruções para acessar seu ingresso digital.",
        },
        {
            q: "Preciso imprimir o ingresso?",
            a: "Não. O ingresso digital poderá ser apresentado pelo celular.",
        },
        {
            q: "Posso levar meus filhos?",
            a: "Por se tratar de um prédio comercial, o espaço não conta com área de lazer ou cuidadores durante o evento. Por isso, para garantir o conforto e a segurança de todos, a participação na experiência é destinada somente às inscritas.",
        },
    ];

    return (
        <section
            id="final-cta"
            className="relative z-10 rounded-t-[2.5rem] md:rounded-t-[4rem] -mt-8 md:-mt-12 bg-ink py-16 sm:py-24 overflow-hidden"
            data-testid="faq-final-section"
        >
            <div
                className="absolute inset-0 texture-grain opacity-20"
                aria-hidden="true"
            />

            <Squiggle
                className="absolute bottom-16 right-10 w-52 opacity-50 hidden md:block"
                color="rgb(var(--c-roselight-rgb))"
            />

            <div className="relative max-w-3xl mx-auto px-5 sm:px-8">
                <Reveal>
                    <Eyebrow center tone="light">
                        Dúvidas frequentes
                    </Eyebrow>

                    <h2 className="mt-5 font-serif italic font-light text-3xl sm:text-4xl text-cream text-center leading-tight">
                        Perguntas & respostas
                    </h2>
                </Reveal>

                <div className="mt-12 border-t border-cream/15">
                    {QA.map((item, i) => {
                        const isOpen = open === i;

                        return (
                            <Reveal key={i} delay={0.05 * i}>
                                <div className="border-b border-cream/15">
                                    <button
                                        data-testid={`faq-item-${i}`}
                                        onClick={() =>
                                            setOpen(isOpen ? -1 : i)
                                        }
                                        className="w-full flex items-center justify-between gap-6 py-6 text-left"
                                        aria-expanded={isOpen}
                                    >
                                        <span className="font-serif text-xl sm:text-2xl text-cream">
                                            {item.q}
                                        </span>

                                        <Plus
                                            size={20}
                                            strokeWidth={1.4}
                                            className={`text-roselight shrink-0 transition-transform duration-300 ${
                                                isOpen ? "rotate-45" : ""
                                            }`}
                                        />
                                    </button>

                                    <AnimatePresence initial={false}>
                                        {isOpen && (
                                            <motion.div
                                                initial={{
                                                    height: 0,
                                                    opacity: 0,
                                                }}
                                                animate={{
                                                    height: "auto",
                                                    opacity: 1,
                                                }}
                                                exit={{
                                                    height: 0,
                                                    opacity: 0,
                                                }}
                                                transition={{
                                                    duration: 0.35,
                                                    ease: [
                                                        0.22,
                                                        1,
                                                        0.36,
                                                        1,
                                                    ],
                                                }}
                                                className="overflow-hidden"
                                                data-testid={`faq-answer-${i}`}
                                            >
                                                <p className="pb-6 text-cream/75 leading-relaxed max-w-xl">
                                                    {item.a}
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </Reveal>
                        );
                    })}
                </div>

                <Reveal delay={0.1}>
                    <div
                        className="mt-16 text-center"
                        data-testid="final-cta-block"
                    >
                        <h3 className="font-serif italic font-light text-3xl sm:text-4xl text-white leading-tight">
                            {s.finalTitle}
                        </h3>

                        <p className="mt-4 text-white/85 leading-relaxed max-w-xl mx-auto">
                            {s.finalText}
                        </p>

                        {s.soldOut ? (
                            <span
                                data-testid="final-cta-soldout"
                                className="mt-9 h-14 px-10 inline-flex items-center justify-center rounded-full bg-white/15 text-white/60 text-sm uppercase tracking-[0.18em] cursor-not-allowed"
                            >
                                Inscrições encerradas
                            </span>
                        ) : (
                            <Link
                                data-testid="final-cta-button"
                                to="/inscricao/cadastro"
                                className="mt-9 h-14 px-10 inline-flex items-center justify-center rounded-full bg-rose text-white text-sm font-semibold uppercase tracking-[0.18em] hover:bg-cream hover:text-ink transition-colors duration-300"
                            >
                                Quero participar
                            </Link>
                        )}
                    </div>
                </Reveal>
            </div>
        </section>
    );
}
