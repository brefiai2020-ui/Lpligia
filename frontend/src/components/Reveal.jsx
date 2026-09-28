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

export const Eyebrow = ({ children, center = false }) => (
    <p
        className={`flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-gold ${
            center ? "justify-center" : ""
        }`}
    >
        <span className="h-px w-10 bg-gold/60" aria-hidden="true" />
        {children}
        {center && <span className="h-px w-10 bg-gold/60" aria-hidden="true" />}
    </p>
);
