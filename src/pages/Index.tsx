import Navigation from "@/components/Navigation";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { BenefitsSection } from "@/components/BenefitsSection";
import RoadmapSection from "@/components/RoadmapSection";
import PricingSection from "@/components/PricingSection";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <BenefitsSection />
      <RoadmapSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
