import { motion } from "framer-motion";

// Traço fluido estilo psicologia (linha contínua que se desenha ao entrar na tela).
export const Squiggle = ({ className = "", color = "rgb(var(--c-gold-rgb))", delay = 0 }) => (
    <svg viewBox="0 0 220 44" fill="none" className={className} aria-hidden="true">
        <motion.path
            d="M4 30 C 28 8, 54 6, 80 24 S 132 44, 158 24 S 202 6, 216 16"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 1.8, delay, ease: "easeInOut" }}
        />
    </svg>
);

// Forma orgânica viva (blob) para suavizar retratos e cartões.
export const Blob = ({ className = "" }) => (
    <motion.div
        className={`absolute ${className}`}
        style={{ borderRadius: "62% 38% 46% 54% / 55% 48% 52% 45%" }}
        animate={{
            borderRadius: [
                "62% 38% 46% 54% / 55% 48% 52% 45%",
                "48% 52% 62% 38% / 45% 60% 40% 55%",
                "62% 38% 46% 54% / 55% 48% 52% 45%",
            ],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden="true"
    />
);
