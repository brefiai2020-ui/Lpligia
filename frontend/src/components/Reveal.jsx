import { motion } from "framer-motion";

export const Reveal = ({ children, delay = 0, y = 28, className = "" }) => (
    <motion.div
        className={className}
        initial={{ opacity: 0, y }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
        {children}
    </motion.div>
);

export const Eyebrow = ({ children, center = false, tone = "gold" }) => {
    const tones = {
        gold: "text-gold",
        dark: "text-ink",
        light: "text-cream/90",
    };
    const line = { gold: "bg-gold/60", dark: "bg-rose/80", light: "bg-white/60" };
    return (
        <p
            className={`flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] ${tones[tone]} ${
                center ? "justify-center" : ""
            }`}
        >
            <span className={`h-px w-10 ${line[tone]}`} aria-hidden="true" />
            {children}
            {center && <span className={`h-px w-10 ${line[tone]}`} aria-hidden="true" />}
        </p>
    );
};
