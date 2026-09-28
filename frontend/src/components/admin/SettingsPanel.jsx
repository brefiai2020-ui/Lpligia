import { useEffect, useState } from "react";
import { toast } from "sonner";
import { apiService, formatApiError } from "@/services/api";
import { useSettings } from "@/lib/settings";

const TEXT_FIELDS = {
    evento: [
        ["event_name", "Nome do evento", "Mentoria em Grupo"],
        ["eventDateLabel", "Data (texto completo)", "10 de outubro de 2026"],
        ["eventDateShort", "Data curta", "10/10/2026"],
        ["eventDateTicket", "Data no ingresso", "10 OUTUBRO 2026"],
        ["event_time", "Horário (quando definido)", "14:00"],
        ["location", "Local (quando definido)", "Espaço / endereço"],
        ["eventPlaceNote", "Nota de horário/local", "Horário e local serão informados em breve."],
        ["instagram", "Instagram", "@draligijeanematroski"],
        ["whatsappNumber", "WhatsApp para receber confirmações (só números)", "5547998887766"],
    ],
    valores: [["capacity", "Capacidade máxima de vagas", "50"], ["slotsTotal", "Vagas exibidas na página", "50"], ["pricePix", "Preço no Pix (R$)", "189.90"], ["priceCard", "Preço no cartão (R$)", "229.00"], ["installments", "Parcelas no cartão", "3"], ["infinitepay_handle", "InfiniteTag da InfinitePay (sem o $)", "draligia"]],
    midia: [["photoUrl", "URL da foto da Dra. Lígia", "https://..."], ["videoUrl", "URL do vídeo (YouTube/Vimeo/MP4)", "https://..."]],
    conteudo: [
        ["heroTitle", "Título do hero (quebre linhas com Enter)", "Tudo começa quando\nvocê decide olhar\npara dentro.", true],
        ["heroSubtitle", "Subtítulo do hero", "Uma experiência de mentoria...", true],
        ["heroQuote", "Frase do cartão do hero", "Um encontro para parar, olhar e se escutar."],
        ["connectionTitle", "Título do bloco de conexão", "Talvez você não precise de mais respostas."],
        ["connectionHighlight", "Frase de destaque (dourada)", "Talvez precise de um espaço para fazer novas perguntas."],
        ["connectionText", "Texto do bloco de conexão", "Muitas vezes seguimos no automático...", true],
        ["impactQuote", "Frase de impacto (quebre linhas com Enter)", "Você não precisa ter todas as respostas.\nPrecisa se permitir olhar.", true],
        ["finalTitle", "Título do CTA final", "Reserve esse momento para você."],
        ["finalText", "Texto do CTA final", "Uma experiência em grupo...", true],
        ["formTitle", "Título do formulário", "Vamos reservar sua vaga?"],
        ["formSubtitle", "Subtítulo do formulário", "Leva menos de um minuto."],
        ["consentText", "Texto do consentimento", "Concordo com o uso dos meus dados...", true],
    ],
};

const COLORS = [
    ["colorPaper", "Fundo claro"],
    ["colorBeige", "Bege / cards"],
    ["colorInk", "Escuro / seções"],
    ["colorGold", "Destaque (dourado)"],
];

export default function SettingsPanel() {
    const { settings, refresh } = useSettings();
    const [form, setForm] = useState(settings);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setForm((f) => ({ ...f, ...settings }));
    }, [settings]);

    const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

    const save = async () => {
        setSaving(true);
        try {
            const payload = {
                ...form,
                slotsTotal: Number(form.slotsTotal) || 0,
                pricePix: Number(String(form.pricePix).replace(",", ".")) || 0,
                priceCard: Number(String(form.priceCard).replace(",", ".")) || 0,
                installments: Number(form.installments) || 1,
            };
            await apiService.saveSettings(payload);
            await refresh();
            toast.success("Site atualizado! As mudanças já estão no ar.");
        } catch (e) {
            toast.error(formatApiError(e));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-10" data-testid="admin-settings-panel">
            <section>
                <h3 className="text-[11px] uppercase tracking-[0.22em] text-gold mb-4">Vagas esgotadas</h3>
                <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                        data-testid="settings-input-soldout"
                        type="checkbox"
                        checked={!!form.soldOut}
                        onChange={(e) => set("soldOut", e.target.checked)}
                        className="w-4 h-4 accent-[#C5A059]"
                    />
                    <span className="text-sm text-ink">
                        Encerrar inscrições (mostra “Inscrições encerradas” e bloqueia o pagamento em todo o site)
                    </span>
                </label>
            </section>

            {Object.entries(TEXT_FIELDS).map(([group, fields]) => (
                <section key={group}>
                    <h3 className="text-[11px] uppercase tracking-[0.22em] text-gold mb-4">
                        {group === "evento" ? "Evento" : group === "valores" ? "Valores" : group === "midia" ? "Foto e vídeo" : "Conteúdo"}
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {fields.map(([key, label, placeholder, wide]) => (
                            <div key={key} className={wide ? "sm:col-span-2" : ""}>
                                <label className="block text-[11px] uppercase tracking-[0.18em] text-smoke mb-1.5">{label}</label>
                                {key === "heroTitle" || key === "impactQuote" ? (
                                    <textarea
                                        data-testid={`settings-input-${key}`}
                                        rows={3}
                                        value={form[key] || ""}
                                        placeholder={placeholder}
                                        onChange={(e) => set(key, e.target.value)}
                                        className="w-full py-3 px-4 rounded-xl border border-line bg-cream text-ink focus:border-gold"
                                    />
                                ) : (
                                    <input
                                        data-testid={`settings-input-${key}`}
                                        value={form[key] ?? ""}
                                        placeholder={placeholder}
                                        onChange={(e) => set(key, e.target.value)}
                                        className="w-full py-3 px-4 rounded-xl border border-line bg-cream text-ink focus:border-gold"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            ))}

            <section>
                <h3 className="text-[11px] uppercase tracking-[0.22em] text-gold mb-4">Cores do site</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {COLORS.map(([key, label]) => (
                        <div key={key} className="bg-cream border border-line/60 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <input
                                    data-testid={`settings-color-${key}`}
                                    type="color"
                                    value={form[key] || "#000000"}
                                    onChange={(e) => set(key, e.target.value)}
                                    className="w-10 h-10 rounded-lg cursor-pointer border border-line bg-transparent p-1"
                                />
                                <div>
                                    <p className="text-xs text-ink">{label}</p>
                                    <p className="text-[10px] text-smoke/70 font-mono mt-0.5">{form[key]}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <p className="mt-3 text-[11px] text-smoke/70">
                    Tons derivados (bordas, textos suaves, dourado claro) se ajustam automaticamente.
                </p>
            </section>

            <button
                data-testid="settings-save-button"
                onClick={save}
                disabled={saving}
                className="h-13 py-3.5 px-10 rounded-full bg-ink text-paper text-sm uppercase tracking-[0.18em] hover:bg-gold hover:text-ink transition-colors disabled:opacity-60"
            >
                {saving ? "Salvando..." : "Salvar alterações"}
            </button>
        </div>
    );
}
