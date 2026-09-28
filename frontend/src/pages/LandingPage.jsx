import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FixedCta from "@/components/FixedCta";
import Hero from "@/sections/Hero";
import Marquee from "@/sections/Marquee";
import Connection from "@/sections/Connection";
import ForYou from "@/sections/ForYou";
import Experience from "@/sections/Experience";
import VideoSection from "@/sections/VideoSection";
import About from "@/sections/About";
import ImpactQuote from "@/sections/ImpactQuote";
import EventDetails from "@/sections/EventDetails";
import Offer from "@/sections/Offer";
import PurchaseFlow from "@/sections/PurchaseFlow";
import Faq from "@/sections/Faq";
import FinalCta from "@/sections/FinalCta";

export default function LandingPage() {
    return (
        <div className="bg-paper">
            <Navbar />
            <main>
                <Hero />
                <Marquee />
                <Connection />
                <ForYou />
                <Experience />
                <VideoSection />
                <About />
                <ImpactQuote />
                <EventDetails />
                <Offer />
                <PurchaseFlow />
                <Faq />
                <FinalCta />
            </main>
            <Footer />
            <FixedCta />
        </div>
    );
}
