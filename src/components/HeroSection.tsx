import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-bg.jpg";

export const HeroSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-hero overflow-hidden">
      {/* Hero background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{ backgroundImage: `url(${heroImage})` }}
      ></div>
      
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-accent opacity-10"></div>
      <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-40 right-20 w-32 h-32 bg-accent/10 rounded-full blur-xl"></div>
      
      <div className="container mx-auto px-6 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Badge - Made more prominent */}
          <div className="inline-flex items-center gap-3 bg-primary/15 text-primary px-6 py-3 rounded-full text-base md:text-lg font-bold mb-12 shadow-feature border border-primary/20 animate-pulse">
            <span className="w-3 h-3 bg-primary rounded-full animate-pulse"></span>
            No App Download Required • Works in Telegram & WhatsApp
          </div>
          
          {/* Main heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
            Your AI Business Assistant
            <span className="bg-gradient-primary bg-clip-text text-transparent"> Right Where You Work</span>
          </h1>
          
          {/* Subheading */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-6 max-w-4xl mx-auto leading-relaxed">
            Skip the app downloads. Get AI-powered expense tracking, content creation, and business insights directly in Telegram or WhatsApp Business. 
            <span className="block mt-2 text-lg text-primary font-medium">We handle setup • You keep your data private • One platform replaces 5+ tools</span>
          </p>
          
          {/* Integration highlight */}
          <div className="flex flex-wrap justify-center items-center gap-4 mb-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 bg-card/60 backdrop-blur-sm px-3 py-2 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Works in Telegram</span>
            </div>
            <div className="flex items-center gap-2 bg-card/60 backdrop-blur-sm px-3 py-2 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>WhatsApp Business Ready</span>
            </div>
            <div className="flex items-center gap-2 bg-card/60 backdrop-blur-sm px-3 py-2 rounded-full">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Full Setup Support</span>
            </div>
          </div>
          
          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              variant="hero" 
              size="lg" 
              className="text-lg px-8 py-4"
              onClick={() => navigate(user ? '/dashboard' : '/onboarding')}
            >
              {user ? 'Go to Dashboard' : 'Start Your Free Trial'}
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4">
              Watch Demo
            </Button>
          </div>
          
          {/* Features preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-3 bg-card/80 backdrop-blur-sm rounded-lg p-4 shadow-soft">
              <Zap className="w-6 h-6 text-primary" />
              <span className="text-foreground font-medium">Automated Expense Tracking</span>
            </div>
            <div className="flex items-center justify-center gap-3 bg-card/80 backdrop-blur-sm rounded-lg p-4 shadow-soft">
              <Sparkles className="w-6 h-6 text-accent" />
              <span className="text-foreground font-medium">AI Content Strategy</span>
            </div>
            <div className="flex items-center justify-center gap-3 bg-card/80 backdrop-blur-sm rounded-lg p-4 shadow-soft">
              <div className="w-6 h-6 bg-gradient-primary rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
              <span className="text-foreground font-medium">Voice AI Assistant</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
