import { useMemo } from "react";

// QR Code visual de exemplo (MOCKUP). Será substituído pelo QR real gerado pelo backend.
export default function QrMock({ size = 168, seed = "MNT-2026" }) {
    const n = 25;
    const grid = useMemo(() => {
        let s = 0;
        for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;
        const rand = () => {
            s = (s + 0x6d2b79f5) >>> 0;
            let t = s;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
        const g = Array.from({ length: n }, () => Array(n).fill(0));
        const finder = (r0, c0) => {
            for (let r = 0; r < 7; r++)
                for (let c = 0; c < 7; c++) {
                    const on =
                        r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
                    g[r0 + r][c0 + c] = on ? 1 : -1;
                }
        };
        finder(0, 0);
        finder(0, n - 7);
        finder(n - 7, 0);
        for (let r = 0; r < n; r++)
            for (let c = 0; c < n; c++) if (g[r][c] === 0 && rand() > 0.52) g[r][c] = 1;
        return g;
    }, [seed]);

    const cell = size / (n + 4);
    const off = cell * 2;

    return (
        <svg
            data-testid="ticket-qr-code"
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            role="img"
            aria-label="QR Code de exemplo (mockup)"
        >
            <rect width={size} height={size} fill="#FAF8F5" rx="10" />
            {grid.flatMap((row, r) =>
                row.map((v, c) =>
                    v === 1 ? (
                        <rect
                            key={`${r}-${c}`}
                            x={off + c * cell}
                            y={off + r * cell}
                            width={cell * 0.92}
                            height={cell * 0.92}
                            fill="#171615"
                            rx={cell * 0.18}
                        />
                    ) : null,
                ),
            )}
        </svg>
    );
}
