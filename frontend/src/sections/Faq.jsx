import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Reveal, Eyebrow } from "@/components/Reveal";
import { useSettings, formatBRL } from "@/lib/settings";

export default function Faq() {
    const { settings: s } = useSettings();
    const [open, setOpen] = useState(0);

    const QA = [
        { q: "Quando será a mentoria?", a: `${s.eventDateLabel}.` },
        {
            q: "Qual o investimento?",
            a: `${formatBRL(s.pricePix)} no Pix ou ${formatBRL(s.priceCard)} no cartão em até ${s.installments}x.`,
        },
        { q: "Quantas vagas estão disponíveis?", a: `${s.slotsTotal} vagas.` },
        { q: "Como faço o pagamento?", a: "O pagamento será realizado pelo Checkout InfinitePay." },
        {
            q: "Como receberei meu ingresso?",
            a: "Após a confirmação do pagamento, você receberá as instruções para acessar seu ingresso digital.",
        },
        { q: "Preciso imprimir o ingresso?", a: "Não. O ingresso digital poderá ser apresentado pelo celular." },
    ];

    return (
        <section
            className="relative z-10 rounded-t-[2.5rem] md:rounded-t-[4rem] -mt-8 md:-mt-12 bg-cream py-16 sm:py-32"
            data-testid="faq-section"
        >
            <div className="max-w-3xl mx-auto px-5 sm:px-8">
                <Reveal>
                    <Eyebrow center tone="dark">Dúvidas frequentes</Eyebrow>
                    <h2 className="mt-5 font-serif italic font-light text-3xl sm:text-4xl text-ink text-center leading-tight">
                        Perguntas & respostas
                    </h2>
                </Reveal>
                <div className="mt-14 border-t border-line">
                    {QA.map((item, i) => {
                        const isOpen = open === i;
                        return (
                            <Reveal key={i} delay={0.05 * i}>
                                <div className="border-b border-line">
                                    <button
                                        data-testid={`faq-item-${i}`}
                                        onClick={() => setOpen(isOpen ? -1 : i)}
                                        className="w-full flex items-center justify-between gap-6 py-6 text-left"
                                        aria-expanded={isOpen}
                                    >
                                        <span className="font-serif text-xl sm:text-2xl text-ink">{item.q}</span>
                                        <Plus
                                            size={20}
                                            strokeWidth={1.4}
                                            className={`text-rose shrink-0 transition-transform duration-300 ${
                                                isOpen ? "rotate-45" : ""
                                            }`}
                                        />
                                    </button>
                                    <AnimatePresence initial={false}>
                                        {isOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                                className="overflow-hidden"
                                                data-testid={`faq-answer-${i}`}
                                            >
                                                <p className="pb-6 text-smoke leading-relaxed max-w-xl">{item.a}</p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </Reveal>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
