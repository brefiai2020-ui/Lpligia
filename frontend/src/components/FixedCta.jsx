import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useSettings, formatBRL } from "@/lib/settings";

export default function FixedCta() {
    const { settings: s } = useSettings();
    const [show, setShow] = useState(false);

    useEffect(() => {
        const onScroll = () => setShow(window.scrollY > 560);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <motion.div
            initial={false}
            animate={{ y: show ? 0 : 120, opacity: show ? 1 : 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-0 inset-x-0 z-40 md:hidden pointer-events-none"
            data-testid="fixed-cta"
        >
            <div className="m-3 p-2.5 rounded-full bg-ink/95 backdrop-blur border border-cream/10 shadow-2xl flex items-center justify-between gap-3 pointer-events-auto">
                <div className="pl-3">
                    <p className="text-cream font-serif text-lg leading-none">{formatBRL(s.pricePix)}</p>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-cream/75 mt-0.5">no Pix</p>
                </div>
                {s.soldOut ? (
                    <span
                        data-testid="fixed-cta-soldout"
                        className="h-11 px-5 inline-flex items-center rounded-full bg-cream/15 text-cream/70 text-[11px] uppercase tracking-[0.16em]"
                    >
                        Inscrições encerradas
                    </span>
                ) : (
                    <Link
                        data-testid="fixed-cta-button"
                        to="/inscricao/cadastro"
                        className="h-11 px-6 inline-flex items-center rounded-full bg-rose text-white text-[11px] font-bold uppercase tracking-[0.16em] hover:bg-cream hover:text-ink transition-colors duration-300"
                    >
                        Quero garantir minha vaga
                    </Link>
                )}
            </div>
        </motion.div>
    );
}
