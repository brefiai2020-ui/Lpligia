import { useState } from "react";
import { apiService, formatApiError } from "@/services/api";

export default function AdminLogin({ onLogin }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const { data } = await apiService.adminLogin(email, password);
            localStorage.setItem("lj_admin_token", data.access_token);
            onLogin(data.user);
        } catch (err) {
            setError(formatApiError(err, "Não foi possível entrar."));
            setLoading(false);
        }
    };

    return (
        <div className="max-w-sm mx-auto py-10">
            <h1 className="font-serif text-3xl text-ink">Entrar</h1>
            <p className="mt-2 text-sm text-smoke">Acesso restrito à administração.</p>
            <form onSubmit={submit} className="mt-8 space-y-5" data-testid="admin-login-form">
                <div>
                    <label className="block text-[11px] uppercase tracking-[0.2em] text-smoke mb-2">E-mail</label>
                    <input
                        data-testid="admin-login-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full py-3.5 px-4 rounded-xl border border-line bg-cream text-ink focus:border-gold transition-colors"
                    />
                </div>
                <div>
                    <label className="block text-[11px] uppercase tracking-[0.2em] text-smoke mb-2">Senha</label>
                    <input
                        data-testid="admin-login-password"
                        type="password"
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full py-3.5 px-4 rounded-xl border border-line bg-cream text-ink focus:border-gold transition-colors"
                    />
                </div>
                {error && (
                    <p className="text-xs text-wine" data-testid="admin-login-error">
                        {error}
                    </p>
                )}
                <button
                    data-testid="admin-login-submit"
                    type="submit"
                    disabled={loading}
                    className="w-full h-13 py-3.5 rounded-full bg-ink text-paper text-sm uppercase tracking-[0.18em] hover:bg-gold hover:text-ink transition-colors disabled:opacity-60"
                >
                    {loading ? "Entrando..." : "Entrar"}
                </button>
            </form>
        </div>
    );
}
