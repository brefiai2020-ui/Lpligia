import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
    RefreshCw,
    Mail,
    Pencil,
    Trash2,
    X,
    Download,
} from "lucide-react";
import {
    apiService,
    formatApiError,
    formatBRL,
} from "@/services/api";

const STATUS_LABEL = {
    PENDING_PAYMENT: "Aguardando",
    CONFIRMED: "Confirmada",
    CANCELLED: "Cancelada",
};

const STATUS_STYLE = {
    PENDING_PAYMENT: "bg-goldlight/40 text-ink border-gold/40",
    CONFIRMED: "bg-pine/10 text-pine border-pine/30",
    CANCELLED: "bg-smoke/10 text-smoke border-smoke/30",
};

export default function RegistrationsPanel() {
    const [rows, setRows] = useState(null);
    const [counts, setCounts] = useState(null);
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);

    const load = () =>
        apiService
            .listRegistrations()
            .then(({ data }) => {
                setRows(data.registrations);
                setCounts(data.counts);
            })
            .catch((e) => toast.error(formatApiError(e)));

    useEffect(() => {
        load();
    }, []);

    const resend = async (row) => {
        try {
            await apiService.resendEmail(row.id);
            toast.success(`E-mail reenviado para ${row.email}`);
        } catch (e) {
            toast.error(formatApiError(e));
        }
    };

    const remove = async () => {
        try {
            await apiService.deleteRegistration(deleting.id);
            toast.success("Inscrição apagada.");
            setDeleting(null);
            load();
        } catch (e) {
            toast.error(formatApiError(e));
        }
    };

    const exportCsv = () => {
        if (!rows || rows.length === 0) {
            toast.error("Não há inscrições para exportar.");
            return;
        }

        const escapeCsv = (value) => {
            const text = value == null ? "" : String(value);
            return `"${text.replace(/"/g, '""')}"`;
        };

        const header = [
            "Nome",
            "WhatsApp",
            "E-mail",
            "CPF",
            "Status",
            "Ingresso",
            "Data",
        ];

        const lines = rows.map((r) =>
            [
                r.nome,
                r.whatsapp,
                r.email,
                r.cpf,
                STATUS_LABEL[r.status] || r.status,
                r.ticket_code || "",
                r.created_at
                    ? new Date(r.created_at).toLocaleString("pt-BR")
                    : "",
            ]
                .map(escapeCsv)
                .join(";"),
        );

        const csv =
            "\uFEFF" +
            [
                header.map(escapeCsv).join(";"),
                ...lines,
            ].join("\r\n");

        const blob = new Blob([csv], {
            type: "text/csv;charset=utf-8;",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `inscricoes-${new Date()
            .toISOString()
            .slice(0, 10)}.csv`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);

        toast.success("CSV exportado.");
    };

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex flex-wrap gap-3">
                    {counts &&
                        [
                            {
                                label: "Inscritas",
                                value: counts.total,
                            },
                            {
                                label: "Confirmadas",
                                value: counts.confirmed,
                            },
                            {
                                label: "Aguardando",
                                value: counts.pending,
                            },
                        ].map((c) => (
                            <div
                                key={c.label}
                                className="bg-cream border border-line/60 rounded-xl px-5 py-3"
                                data-testid={`admin-count-${c.label.toLowerCase()}`}
                            >
                                <p className="font-serif text-2xl text-ink leading-none">
                                    {c.value}
                                </p>

                                <p className="text-[10px] uppercase tracking-[0.18em] text-smoke/70 mt-1">
                                    {c.label}
                                </p>
                            </div>
                        ))}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        data-testid="admin-export-csv-button"
                        onClick={exportCsv}
                        disabled={!rows || rows.length === 0}
                        className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-line text-ink text-[11px] uppercase tracking-[0.16em] hover:border-gold hover:text-gold transition-colors disabled:opacity-40"
                    >
                        <Download size={14} strokeWidth={1.5} />
                        Exportar CSV
                    </button>

                    <button
                        data-testid="admin-refresh-button"
                        onClick={load}
                        className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-smoke hover:text-gold transition-colors"
                    >
                        <RefreshCw size={14} strokeWidth={1.5} />
                        Atualizar
                    </button>
                </div>
            </div>

            {!rows ? (
                <p className="text-smoke text-sm">
                    Carregando...
                </p>
            ) : rows.length === 0 ? (
                <p
                    className="text-smoke text-sm"
                    data-testid="admin-empty"
                >
                    Nenhuma inscrição ainda.
                </p>
            ) : (
                <div
                    className="overflow-x-auto border border-line/60 rounded-2xl bg-cream"
                    data-testid="admin-registrations-table"
                >
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-[10px] uppercase tracking-[0.16em] text-smoke/70 border-b border-line">
                                <th className="px-4 py-3">
                                    Código
                                </th>
                                <th className="px-4 py-3">
                                    Nome
                                </th>
                                <th className="px-4 py-3">
                                    Contato
                                </th>
                                <th className="px-4 py-3">
                                    CPF
                                </th>
                                <th className="px-4 py-3">
                                    Status
                                </th>
                                <th className="px-4 py-3">
                                    Ingresso
                                </th>
                                <th className="px-4 py-3">
                                    Data
                                </th>
                                <th className="px-4 py-3 text-right">
                                    Ações
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {rows.map((r) => (
                                <tr
                                    key={r.id}
                                    className="border-b border-line/50 last:border-0"
                                    data-testid="admin-registration-row"
                                >
                                    <td className="px-4 py-3 font-mono text-xs text-gold">
                                        {r.registration_code}
                                    </td>

                                    <td className="px-4 py-3 text-ink">
                                        {r.nome}
                                    </td>

                                    <td className="px-4 py-3 text-smoke">
                                        <div>{r.whatsapp}</div>
                                        <div className="text-xs text-smoke/70">
                                            {r.email}
                                        </div>
                                    </td>

                                    <td className="px-4 py-3 text-smoke font-mono text-xs">
                                        {r.cpf?.replace(
                                            /(\d{3})(\d{3})(\d{3})(\d{2})/,
                                            "$1.$2.$3-$4",
                                        )}
                                    </td>

                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex px-3 py-1 rounded-full border text-[11px] ${
                                                STATUS_STYLE[r.status] || ""
                                            }`}
                                        >
                                            {STATUS_LABEL[r.status] ||
                                                r.status}
                                        </span>
                                    </td>

                                    <td className="px-4 py-3 font-mono text-xs text-ink">
                                        {r.ticket_code || "—"}
                                    </td>

                                    <td className="px-4 py-3 text-xs text-smoke">
                                        {new Date(
                                            r.created_at,
                                        ).toLocaleDateString("pt-BR")}
                                    </td>

                                    <td className="px-4 py-3">
                                        <div className="flex justify-end gap-1">
                                            {r.status === "CONFIRMED" &&
                                                r.ticket_code && (
                                                    <button
                                                        data-testid="admin-resend-email-button"
                                                        onClick={() =>
                                                            resend(r)
                                                        }
                                                        title="Reenviar e-mail do ingresso"
                                                        className="p-2 rounded-lg text-pine hover:bg-pine/10 transition-colors"
                                                    >
                                                        <Mail
                                                            size={15}
                                                            strokeWidth={1.5}
                                                        />
                                                    </button>
                                                )}

                                            <button
                                                data-testid="admin-edit-button"
                                                onClick={() =>
                                                    setEditing(r)
                                                }
                                                title="Editar"
                                                className="p-2 rounded-lg text-smoke hover:bg-gold/10 hover:text-gold transition-colors"
                                            >
                                                <Pencil
                                                    size={15}
                                                    strokeWidth={1.5}
                                                />
                                            </button>

                                            <button
                                                data-testid="admin-delete-button"
                                                onClick={() =>
                                                    setDeleting(r)
                                                }
                                                title="Apagar"
                                                className="p-2 rounded-lg text-wine/70 hover:bg-wine/10 hover:text-wine transition-colors"
                                            >
                                                <Trash2
                                                    size={15}
                                                    strokeWidth={1.5}
                                                />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {editing && (
                <EditModal
                    row={editing}
                    onClose={() => setEditing(null)}
                    onSaved={() => {
                        setEditing(null);
                        load();
                    }}
                />
            )}

            {deleting && (
                <div
                    className="fixed inset-0 z-[70] flex items-center justify-center p-5"
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
                        onClick={() => setDeleting(null)}
                    />

                    <div
                        className="relative bg-paper rounded-2xl max-w-sm w-full p-7"
                        data-testid="admin-delete-modal"
                    >
                        <h3 className="font-serif text-2xl text-ink">
                            Apagar inscrição?
                        </h3>

                        <p className="mt-3 text-sm text-smoke">
                            A inscrição de{" "}
                            <strong>{deleting.nome}</strong>{" "}
                            será removida permanentemente.
                        </p>

                        <div className="mt-6 flex gap-3">
                            <button
                                data-testid="admin-delete-cancel"
                                onClick={() =>
                                    setDeleting(null)
                                }
                                className="flex-1 h-11 rounded-full border border-ink/30 text-ink text-xs uppercase tracking-[0.16em] hover:border-gold hover:text-gold"
                            >
                                Cancelar
                            </button>

                            <button
                                data-testid="admin-delete-confirm"
                                onClick={remove}
                                className="flex-1 h-11 rounded-full bg-wine text-paper text-xs uppercase tracking-[0.16em] hover:opacity-90"
                            >
                                Apagar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function EditModal({ row, onClose, onSaved }) {
    const [form, setForm] = useState({
        nome: row.nome,
        whatsapp: row.whatsapp,
        email: row.email,
        status: row.status,
    });

    const [saving, setSaving] = useState(false);

    const save = async () => {
        setSaving(true);

        try {
            await apiService.updateRegistration(
                row.id,
                form,
            );

            toast.success("Inscrição atualizada.");
            onSaved();
        } catch (e) {
            toast.error(formatApiError(e));
            setSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center p-5"
            role="dialog"
            aria-modal="true"
        >
            <div
                className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
                onClick={onClose}
            />

            <div
                className="relative bg-paper rounded-2xl max-w-md w-full p-7"
                data-testid="admin-edit-modal"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-smoke hover:text-ink"
                    aria-label="Fechar"
                >
                    <X size={18} strokeWidth={1.5} />
                </button>

                <h3 className="font-serif text-2xl text-ink">
                    Editar inscrição
                </h3>

                <div className="mt-5 space-y-4">
                    <div>
                        <label className="block text-[11px] uppercase tracking-[0.18em] text-smoke mb-1.5">
                            Nome
                        </label>

                        <input
                            data-testid="admin-edit-nome"
                            value={form.nome}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    nome: e.target.value,
                                }))
                            }
                            className="w-full py-3 px-4 rounded-xl border border-line bg-cream text-ink focus:border-gold"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] uppercase tracking-[0.18em] text-smoke mb-1.5">
                            WhatsApp
                        </label>

                        <input
                            data-testid="admin-edit-whatsapp"
                            value={form.whatsapp}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    whatsapp: e.target.value,
                                }))
                            }
                            className="w-full py-3 px-4 rounded-xl border border-line bg-cream text-ink focus:border-gold"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] uppercase tracking-[0.18em] text-smoke mb-1.5">
                            E-mail
                        </label>

                        <input
                            data-testid="admin-edit-email"
                            value={form.email}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    email: e.target.value,
                                }))
                            }
                            className="w-full py-3 px-4 rounded-xl border border-line bg-cream text-ink focus:border-gold"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] uppercase tracking-[0.18em] text-smoke mb-1.5">
                            Status
                        </label>

                        <select
                            data-testid="admin-edit-status"
                            value={form.status}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    status: e.target.value,
                                }))
                            }
                            className="w-full py-3 px-4 rounded-xl border border-line bg-cream text-ink focus:border-gold"
                        >
                            {Object.entries(STATUS_LABEL).map(
                                ([v, label]) => (
                                    <option
                                        key={v}
                                        value={v}
                                    >
                                        {label}
                                    </option>
                                ),
                            )}
                        </select>

                        <p className="mt-2 text-[11px] text-smoke/70">
                            Confirmar ocupa uma vaga e envia o ingresso por e-mail e WhatsApp. Cancelar libera a vaga.
                        </p>
                    </div>
                </div>

                <button
                    data-testid="admin-edit-save"
                    onClick={save}
                    disabled={saving}
                    className="mt-6 w-full h-12 rounded-full bg-ink text-paper text-sm uppercase tracking-[0.18em] hover:bg-gold hover:text-ink transition-colors disabled:opacity-60"
                >
                    {saving ? "Salvando..." : "Salvar"}
                </button>
            </div>
        </div>
    );
}
