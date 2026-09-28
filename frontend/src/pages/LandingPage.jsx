import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FixedCta from "@/components/FixedCta";
import Hero from "@/sections/Hero";
import About from "@/sections/About";
import ForYou from "@/sections/ForYou";
import Investment from "@/sections/Investment";
import Faq from "@/sections/Faq";

export default function LandingPage() {
    return (
        <div className="bg-paper">
            <Navbar />
            <main>
                <Hero />
                <About />
                <ForYou />
                <Investment />
                <Faq />
            </main>
            <Footer />
            <FixedCta />
        </div>
    );
}
