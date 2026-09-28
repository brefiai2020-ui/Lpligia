import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";
import CheckoutShell from "@/components/CheckoutShell";
import { createRegistration } from "@/services/mockServices";
import { FLAGS } from "@/config";

const maskPhone = (v) => {
    v = v.replace(/\D/g, "").slice(0, 11);
    if (v.length > 6) return `(${v.slice(0, 2)}) ${v.slice(2, v.length - 4)}-${v.slice(-4)}`;
    if (v.length > 2) return `(${v.slice(0, 2)}) ${v.slice(2)}`;
    return v;
};

const maskCpf = (v) => {
    v = v.replace(/\D/g, "").slice(0, 11);
    return v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
};

export default function Signup() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const soldOut = FLAGS.soldOut || params.get("st") === "esgotado";
    const [fields, setFields] = useState({ nome: "", whatsapp: "", email: "", cpf: "", consent: false });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const set = (key, value) => setFields((f) => ({ ...f, [key]: value }));

    const validate = () => {
        const e = {};
        if (fields.nome.trim().length < 3) e.nome = "Informe seu nome completo.";
        if (fields.whatsapp.replace(/\D/g, "").length < 10) e.whatsapp = "Informe um WhatsApp válido.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) e.email = "Informe um e-mail válido.";
        if (fields.cpf.replace(/\D/g, "").length !== 11) e.cpf = "Informe um CPF válido.";
        if (!fields.consent) e.consent = "É necessário aceitar o uso dos seus dados.";
        return e;
    };

    const onSubmit = async (ev) => {
        ev.preventDefault();
        const e = validate();
        setErrors(e);
        if (Object.keys(e).length) return;
        setSubmitting(true);
        try {
            await createRegistration(fields);
            navigate("/inscricao/pagamento");
        } catch {
            toast.error("Não foi possível concluir agora. Tente novamente.");
            setSubmitting(false);
        }
    };

    return (
        <CheckoutShell step={1}>
            {soldOut ? (
                <div className="text-center py-10" data-testid="soldout-state">
                    <span className="w-16 h-16 rounded-full border border-gold/60 text-gold inline-flex items-center justify-center font-serif italic text-2xl">
                        LJ
                    </span>
                    <h1 className="mt-8 font-serif text-4xl text-ink">Inscrições encerradas</h1>
                    <p className="mt-4 text-smoke leading-relaxed max-w-sm mx-auto">
                        As inscrições para esta edição foram encerradas. Acompanhe o Instagram{" "}
                        <a
                            href="https://instagram.com/draligijeanematroski"
                            target="_blank"
                            rel="noreferrer"
                            className="text-gold underline underline-offset-4"
                        >
                            @draligijeanematroski
                        </a>{" "}
                        para as próximas turmas.
                    </p>
                    <span
                        data-testid="soldout-disabled-button"
                        className="mt-10 h-14 px-8 inline-flex items-center justify-center rounded-full bg-cream/60 text-smoke/60 text-sm uppercase tracking-[0.18em] border border-line cursor-not-allowed"
                    >
                        Inscrições encerradas
                    </span>
                    <div className="mt-6">
                        <Link to="/" className="text-xs uppercase tracking-[0.2em] text-smoke/70 hover:text-gold">
                            Voltar para a página do evento
                        </Link>
                    </div>
                </div>
            ) : (
                <>
                    <h1 className="font-serif text-4xl sm:text-5xl text-ink leading-tight" data-testid="signup-title">
                        Vamos reservar sua vaga?
                    </h1>
                    <p className="mt-4 text-smoke">Leva menos de um minuto.</p>

                    <form onSubmit={onSubmit} className="mt-10 space-y-6" noValidate data-testid="signup-form">
                        <Field label="Nome completo" error={errors.nome}>
                            <input
                                data-testid="form-input-nome"
                                type="text"
                                value={fields.nome}
                                onChange={(e) => set("nome", e.target.value)}
                                placeholder="Seu nome completo"
                                className="w-full h-13 py-3.5 px-4 rounded-xl border border-line bg-cream text-ink placeholder:text-smoke/40 focus:border-gold transition-colors"
                            />
                        </Field>

                        <Field label="WhatsApp" error={errors.whatsapp}>
                            <input
                                data-testid="form-input-whatsapp"
                                type="tel"
                                inputMode="numeric"
                                value={fields.whatsapp}
                                onChange={(e) => set("whatsapp", maskPhone(e.target.value))}
                                placeholder="(00) 00000-0000"
                                className="w-full py-3.5 px-4 rounded-xl border border-line bg-cream text-ink placeholder:text-smoke/40 focus:border-gold transition-colors"
                            />
                        </Field>

                        <Field label="E-mail" error={errors.email}>
                            <input
                                data-testid="form-input-email"
                                type="email"
                                value={fields.email}
                                onChange={(e) => set("email", e.target.value)}
                                placeholder="seu@email.com"
                                className="w-full py-3.5 px-4 rounded-xl border border-line bg-cream text-ink placeholder:text-smoke/40 focus:border-gold transition-colors"
                            />
                        </Field>

                        <Field label="CPF" error={errors.cpf}>
                            <input
                                data-testid="form-input-cpf"
                                type="text"
                                inputMode="numeric"
                                value={fields.cpf}
                                onChange={(e) => set("cpf", maskCpf(e.target.value))}
                                placeholder="000.000.000-00"
                                className="w-full py-3.5 px-4 rounded-xl border border-line bg-cream text-ink placeholder:text-smoke/40 focus:border-gold transition-colors"
                            />
                        </Field>

                        <label className="flex items-start gap-3 cursor-pointer select-none" data-testid="consent-wrapper">
                            <input
                                data-testid="form-checkbox-consent"
                                type="checkbox"
                                checked={fields.consent}
                                onChange={(e) => set("consent", e.target.checked)}
                                className="mt-1 w-4 h-4 accent-[#C5A059]"
                            />
                            <span className="text-sm text-smoke leading-relaxed">
                                Concordo com o uso dos meus dados para fins de inscrição e comunicação sobre o evento.
                            </span>
                        </label>
                        {errors.consent && <p className="text-xs text-wine -mt-3">{errors.consent}</p>}

                        <button
                            data-testid="submit-registration-button"
                            type="submit"
                            disabled={submitting}
                            className="w-full h-14 rounded-full bg-ink text-paper text-sm uppercase tracking-[0.18em] hover:bg-gold hover:text-ink transition-colors duration-300 disabled:opacity-60"
                        >
                            {submitting ? "Reservando..." : "Continuar para pagamento"}
                        </button>
                    </form>
                </>
            )}
        </CheckoutShell>
    );
}

function Field({ label, error, children }) {
    return (
        <div>
            <label className="block text-[11px] uppercase tracking-[0.2em] text-smoke mb-2">{label}</label>
            {children}
            {error && <p className="mt-2 text-xs text-wine" data-testid="field-error">{error}</p>}
        </div>
    );
}
