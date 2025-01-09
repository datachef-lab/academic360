import { About } from "@/components/root/About";
import Contact from "@/components/root/Contact";
import { Cta } from "@/components/root/Cta";
import { FAQ } from "@/components/root/FAQ";
import { Features } from "@/components/root/Features";
import { Footer } from "@/components/root/Footer";
import { Hero } from "@/components/root/Hero";
import { HowItWorks } from "@/components/root/HowItworks";
import { Navbar } from "@/components/root/Navbar";
import { ScrollToTop } from "@/components/root/ScrollToTop";
import { Services } from "@/components/root/Services";
import { Testimonials } from "@/components/root/Testimonials";
export default function Root() {
  return (
    <div className="flex flex-col items-center">
      <Navbar />
      <Hero />
      <About />
      <HowItWorks />
      <Features />
      <Services />
      <Cta />
      <Testimonials />
      <FAQ />
      <Contact/>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
