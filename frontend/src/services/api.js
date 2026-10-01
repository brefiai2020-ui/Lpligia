import axios from "axios";

export const api = axios.create({
    baseURL: `${process.env.REACT_APP_BACKEND_URL}/api`,
    withCredentials: true,
});

api.interceptors.request.use((cfg) => {
    const token = localStorage.getItem("lj_admin_token");

    if (token) {
        cfg.headers.Authorization = `Bearer ${token}`;
    }

    return cfg;
});

export const getStoredRegistrationId = () =>
    localStorage.getItem("lj_registration_id");

export const setStoredRegistrationId = (id) =>
    localStorage.setItem("lj_registration_id", id);

export const getStoredOrderNsu = () =>
    localStorage.getItem("lj_order_nsu");

export const setStoredOrderNsu = (nsu) =>
    localStorage.setItem("lj_order_nsu", nsu);

export function formatBRL(value) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(Number(value || 0));
}

export function formatApiError(
    e,
    fallback = "Algo deu errado. Tente novamente.",
) {
    const detail = e?.response?.data?.detail;

    if (detail == null) {
        return fallback;
    }

    if (typeof detail === "string") {
        return detail;
    }

    if (Array.isArray(detail)) {
        return detail
            .map((d) =>
                d && typeof d.msg === "string"
                    ? d.msg
                    : JSON.stringify(d),
            )
            .filter(Boolean)
            .join(" ");
    }

    if (detail && typeof detail.msg === "string") {
        return detail.msg;
    }

    return fallback;
}

export const apiService = {
    getSettings: () => api.get("/settings"),

    createRegistration: (data) =>
        api.post("/registrations", data),

    createPayment: (registrationId, paymentMethod) =>
        api.post("/payment/create", {
            registration_id: registrationId,
            payment_method: paymentMethod,
        }),

    paymentStatus: (orderNsu) =>
        api.get(`/payments/${orderNsu}/status`),

    checkPayment: (orderNsu) =>
        api.post(`/payments/${orderNsu}/check`),

    getRegistration: (rid) =>
        api.get(`/registrations/${rid}`),

    ticketInfo: (token) =>
        api.get(`/tickets/${token}`),

    adminLogin: (email, password) =>
        api.post("/auth/login", {
            email,
            password,
        }),

    adminMe: () =>
        api.get("/auth/me"),

    adminLogout: () =>
        api.post("/auth/logout"),

    listRegistrations: () =>
        api.get("/admin/registrations"),

    updateRegistration: (id, data) =>
        api.put(`/admin/registrations/${id}`, data),

    deleteRegistration: (id) =>
        api.delete(`/admin/registrations/${id}`),

    resendEmail: (id) =>
        api.post(`/admin/registrations/${id}/resend-email`),

    adminDashboard: () =>
        api.get("/admin/dashboard"),

    adminPayments: () =>
        api.get("/admin/payments"),

    approvePayment: (id) =>
        api.post(`/admin/payments/${id}/approve`),

    rejectPayment: (id) =>
        api.post(`/admin/payments/${id}/reject`),

    useTicket: (token) =>
        api.post(`/admin/tickets/${token}/use`),

    saveSettings: (data) =>
        api.put("/admin/settings", data),
};
