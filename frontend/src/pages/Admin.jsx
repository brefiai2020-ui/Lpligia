import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LogOut } from "lucide-react";
import { apiService } from "@/services/api";
import AdminLogin from "@/components/admin/AdminLogin";
import RegistrationsPanel from "@/components/admin/RegistrationsPanel";
import SettingsPanel from "@/components/admin/SettingsPanel";

export default function Admin() {
    const [checking, setChecking] = useState(true);
    const [user, setUser] = useState(null);
    const [tab, setTab] = useState("inscritos");

    useEffect(() => {
        if (!localStorage.getItem("lj_admin_token")) {
            setChecking(false);
            return;
        }
        apiService
            .adminMe()
            .then(({ data }) => setUser(data))
            .catch(() => localStorage.removeItem("lj_admin_token"))
            .finally(() => setChecking(false));
    }, []);

    const logout = async () => {
        try {
            await apiService.adminLogout();
        } catch {}
        localStorage.removeItem("lj_admin_token");
        setUser(null);
    };

    return (
        <div className="min-h-screen bg-paper" data-testid="admin-page">
            <header className="border-b border-line/60">
                <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full border border-gold/60 flex items-center justify-center font-serif italic text-gold text-xs">
                            LJ
                        </span>
                        <span className="font-serif text-lg text-ink">Área administrativa</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link
                            to="/"
                            data-testid="admin-site-link"
                            className="text-xs uppercase tracking-[0.2em] text-smoke hover:text-gold transition-colors"
                        >
                            Ver site
                        </Link>
                        {user && (
                            <button
                                data-testid="admin-logout-button"
                                onClick={logout}
                                className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-smoke hover:text-gold transition-colors"
                            >
                                <LogOut size={14} strokeWidth={1.5} /> Sair
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-5 sm:px-8 py-10">
                {checking ? (
                    <p className="text-smoke text-sm">Carregando...</p>
                ) : !user ? (
                    <AdminLogin onLogin={setUser} />
                ) : (
                    <>
                        <div className="flex gap-6 border-b border-line mb-8">
                            {[
                                { id: "inscritos", label: "Inscritos" },
                                { id: "site", label: "Editar site" },
                            ].map((t) => (
                                <button
                                    key={t.id}
                                    data-testid={`admin-tab-${t.id}`}
                                    onClick={() => setTab(t.id)}
                                    className={`pb-3 text-sm uppercase tracking-[0.16em] border-b-2 -mb-px transition-colors ${
                                        tab === t.id
                                            ? "border-gold text-ink"
                                            : "border-transparent text-smoke/60 hover:text-ink"
                                    }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                        {tab === "inscritos" ? <RegistrationsPanel /> : <SettingsPanel />}
                    </>
                )}
            </main>
        </div>
    );
}
