import { useEffect, Component } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Lenis from "lenis";
import { Toaster } from "sonner";
import "@/index.css";
import LandingPage from "@/pages/LandingPage";
import Signup from "@/pages/Signup";
import Payment from "@/pages/Payment";
import Processing from "@/pages/Processing";
import Confirmed from "@/pages/Confirmed";
import Ticket from "@/pages/Ticket";
import StatesPreview from "@/pages/StatesPreview";

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-paper text-ink flex items-center justify-center p-6">
                    <p className="font-serif text-2xl text-center">
                        Algo saiu do lugar. Atualize a página para continuar.
                    </p>
                </div>
            );
        }
        return this.props.children;
    }
}

function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => {
        if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true });
        else window.scrollTo(0, 0);
    }, [pathname]);
    return null;
}

function SmoothScroll() {
    useEffect(() => {
        const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
        window.__lenis = lenis;
        let raf;
        const loop = (t) => {
            lenis.raf(t);
            raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
        return () => {
            cancelAnimationFrame(raf);
            lenis.destroy();
            window.__lenis = null;
        };
    }, []);
    return null;
}

export default function App() {
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <SmoothScroll />
                <ScrollToTop />
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/inscricao/cadastro" element={<Signup />} />
                    <Route path="/inscricao/pagamento" element={<Payment />} />
                    <Route path="/inscricao/processando" element={<Processing />} />
                    <Route path="/inscricao/confirmado" element={<Confirmed />} />
                    <Route path="/inscricao/ingresso" element={<Ticket />} />
                    <Route path="/estados" element={<StatesPreview />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                <Toaster
                    position="top-center"
                    toastOptions={{
                        style: {
                            background: "#171615",
                            color: "#FAF8F5",
                            borderRadius: "12px",
                        },
                    }}
                />
            </BrowserRouter>
        </ErrorBoundary>
    );
}
