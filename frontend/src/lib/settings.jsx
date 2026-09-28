import { createContext, useContext, useEffect, useState } from "react";
import { apiService } from "@/services/api";

export const DEFAULT_SETTINGS = {
    eventDateLabel: "10 de outubro de 2026",
    eventDateShort: "10/10/2026",
    eventDateTicket: "10 OUTUBRO 2026",
    eventPlaceNote: "Horário e local serão informados em breve.",
    slotsTotal: 50,
    pricePix: 189.9,
    priceCard: 229.0,
    installments: 3,
    photoUrl: "",
    videoUrl: "",
    whatsappNumber: "",
    instagram: "@draligijeanematroski",
    soldOut: false,
    heroTitle: "Tudo começa quando\nvocê decide olhar\npara dentro.",
    heroSubtitle:
        "Uma experiência de mentoria em grupo para mulheres que desejam ampliar a consciência, compreender seus padrões e abrir espaço para novas possibilidades.",
    heroQuote: "Um encontro para parar, olhar e se escutar.",
    connectionTitle: "Talvez você não precise de mais respostas.",
    connectionHighlight: "Talvez precise de um espaço para fazer novas perguntas.",
    connectionText:
        "Muitas vezes seguimos no automático — sem parar para perceber nossos pensamentos, escolhas, padrões e possibilidades. Este encontro é um convite para interromper esse ritmo com calma, presença e escuta.",
    impactQuote: "Você não precisa ter todas as respostas.\nPrecisa se permitir olhar.",
    finalTitle: "Reserve esse momento para você.",
    finalText: "Uma experiência em grupo para parar, olhar para dentro e ampliar suas possibilidades.",
    formTitle: "Vamos reservar sua vaga?",
    formSubtitle: "Leva menos de um minuto.",
    consentText:
        "Concordo com o uso dos meus dados para fins de inscrição e comunicação sobre o evento.",
    colorPaper: "#EFEAD9",
    colorBeige: "#5F7355",
    colorInk: "#4E362A",
    colorGold: "#C4A57E",
    colorRose: "#C67C5F",
};

export const formatBRL = (v) =>
    Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function hexToRgb(hex) {
    const h = hex.replace("#", "");
    const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
    return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

export function mixHex(a, b, t) {
    const pa = a.replace("#", "").match(/.{2}/g).map((x) => parseInt(x, 16));
    const pb = b.replace("#", "").match(/.{2}/g).map((x) => parseInt(x, 16));
    const mixed = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
    return `#${mixed.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export function applyTheme(s) {
    const root = document.documentElement.style;
    root.setProperty("--c-paper-rgb", hexToRgb(s.colorPaper));
    root.setProperty("--c-beige-rgb", hexToRgb(s.colorBeige));
    root.setProperty("--c-ink-rgb", hexToRgb(s.colorInk));
    root.setProperty("--c-gold-rgb", hexToRgb(s.colorGold));
    root.setProperty("--c-cream-rgb", hexToRgb(mixHex(s.colorPaper, s.colorBeige, 0.5)));
    root.setProperty("--c-line-rgb", hexToRgb(mixHex(s.colorBeige, "#000000", 0.1)));
    root.setProperty("--c-smoke-rgb", hexToRgb(mixHex(s.colorInk, "#FFFFFF", 0.24)));
    root.setProperty("--c-goldlight-rgb", hexToRgb(mixHex(s.colorGold, "#FFFFFF", 0.45)));
    root.setProperty("--c-rose-rgb", hexToRgb(s.colorRose || "#C4705C"));
    root.setProperty("--c-roselight-rgb", hexToRgb(mixHex(s.colorRose || "#C4705C", "#FFFFFF", 0.4)));
}

const SettingsCtx = createContext(null);

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);

    useEffect(() => {
        apiService
            .getSettings()
            .then(({ data }) => setSettings((s) => ({ ...s, ...data })))
            .catch(() => {});
    }, []);

    useEffect(() => {
        applyTheme(settings);
    }, [settings]);

    const refresh = () =>
        apiService
            .getSettings()
            .then(({ data }) => setSettings((s) => ({ ...s, ...data })))
            .catch(() => {});

    const available = Math.max(
        0,
        Number(settings.availableSeats ?? settings.capacity ?? settings.slotsTotal ?? 50),
    );
    const enriched = {
        ...settings,
        available,
        seatsLabel: settings.soldOut
            ? "Inscrições encerradas"
            : available === 1
              ? "Última vaga disponível"
              : `Restam ${available} vagas`,
    };

    return (
        <SettingsCtx.Provider value={{ settings: enriched, setSettings, refresh }}>
            {children}
        </SettingsCtx.Provider>
    );
}

export const useSettings = () => useContext(SettingsCtx);
