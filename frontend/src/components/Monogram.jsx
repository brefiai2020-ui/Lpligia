export const Monogram = ({ className = "", tone = "gold" }) => (
    <span
        className={`inline-flex items-center justify-center rounded-full border ${
            tone === "gold" ? "border-gold/60 text-gold" : "border-cream/30 text-cream"
        } ${className}`}
        aria-hidden="true"
    >
        <span className="font-serif italic leading-none">LJ</span>
    </span>
);
