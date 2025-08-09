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
      
      {/* Companies logo slider */}
      <div className="relative h-24 bg-gradient-to-b from-transparent via-slate-900/30 to-transparent overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"></div>
        
        {/* Sliding logos container */}
        <div className="flex items-center h-full relative overflow-hidden w-full">
          <div className="flex items-center animate-slide-infinite-loop">
            {/* Red flag with "Connected apps" */}
            <div className="flex items-center gap-6 flex-shrink-0">
              <div className="relative">
                <div className="bg-red-500 text-white px-6 py-3 rounded-xl shadow-xl font-bold text-base whitespace-nowrap relative z-20 border-2 border-red-600">
                  🚩 Connected Apps
                </div>
                {/* Flag pole */}
                <div className="absolute top-1/2 -right-3 w-6 h-1 bg-gray-500 transform -translate-y-1/2 shadow-md"></div>
              </div>
              {/* Connection string/line */}
              <div className="h-1 bg-gray-500 flex-shrink-0" style={{width: '60px'}}></div>
            </div>
            
            {/* Single set of logos with gaps and connections */}
            <div className="flex items-center gap-16 flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-14 h-14 bg-white/95 rounded-xl p-3 shadow-lg hover:scale-110 transition-transform duration-300">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" 
                    alt="Gmail" 
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <div className="h-1 bg-gray-500 w-12"></div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-14 h-14 bg-white/95 rounded-xl p-3 shadow-lg hover:scale-110 transition-transform duration-300">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" 
                    alt="WhatsApp" 
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <div className="h-1 bg-gray-500 w-12"></div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-14 h-14 bg-white/95 rounded-xl p-3 shadow-lg hover:scale-110 transition-transform duration-300">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/8/83/Telegram_2019_Logo.svg" 
                    alt="Telegram" 
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <div className="h-1 bg-gray-500 w-12"></div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-14 h-14 bg-white/95 rounded-xl p-3 shadow-lg hover:scale-110 transition-transform duration-300">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" 
                    alt="Google Calendar" 
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <div className="h-1 bg-gray-500 w-12"></div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-14 h-14 bg-white/95 rounded-xl p-3 shadow-lg hover:scale-110 transition-transform duration-300">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" 
                    alt="Google Drive" 
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <div className="h-1 bg-gray-500 w-12"></div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-14 h-14 bg-white/95 rounded-xl p-3 shadow-lg hover:scale-110 transition-transform duration-300">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/3/30/Google_Sheets_logo_%282014-2020%29.svg" 
                    alt="Google Sheets" 
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <div className="h-1 bg-gray-500 w-12"></div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-14 h-14 bg-white/95 rounded-xl p-3 shadow-lg hover:scale-110 transition-transform duration-300">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Docs_logo_%282014-2020%29.svg" 
                    alt="Google Docs" 
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <div className="h-1 bg-gray-500 w-12"></div>
              </div>
              
              <div className="flex items-center justify-center w-14 h-14 bg-white/95 rounded-xl p-3 shadow-lg hover:scale-110 transition-transform duration-300">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/9/9b/Google_Meet_icon_%282020%29.svg" 
                  alt="Google Meet" 
                  className="w-8 h-8 object-contain"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent pointer-events-none"></div>
      </div>
      
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
