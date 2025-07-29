
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import heroImage from "@/assets/hero-bg.jpg";

export const HeroSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-hero overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-primary/20 rounded-full animate-gentle-breathe"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${12 + Math.random() * 8}s`,
            }}
          />
        ))}
        
        {/* Gradient orbs that follow mouse */}
        <div 
          className="absolute w-96 h-96 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-3xl transition-all duration-1000 ease-out"
          style={{
            left: `${mousePosition.x * 0.1}%`,
            top: `${mousePosition.y * 0.1}%`,
            transform: 'translate(-50%, -50%)',
          }}
        />
        <div 
          className="absolute w-64 h-64 bg-gradient-to-r from-accent/15 to-primary/15 rounded-full blur-2xl transition-all duration-700 ease-out"
          style={{
            left: `${100 - mousePosition.x * 0.08}%`,
            top: `${100 - mousePosition.y * 0.08}%`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>

      {/* Hero background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 transition-opacity duration-1000"
        style={{ backgroundImage: `url(${heroImage})` }}
      ></div>
      
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-accent opacity-10"></div>
      <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl animate-gentle-breathe"></div>
      <div className="absolute bottom-40 right-20 w-32 h-32 bg-accent/10 rounded-full blur-xl animate-slow-float"></div>
      
      {/* Geometric shapes */}
      <div className="absolute top-1/4 right-1/4 w-8 h-8 border-2 border-primary/30 rotate-45 animate-spin" style={{ animationDuration: '20s' }}></div>
      <div className="absolute bottom-1/3 left-1/4 w-6 h-6 bg-accent/20 transform rotate-12 animate-gentle-breathe"></div>
      
      <div className={`container mx-auto px-6 text-center relative z-10 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="max-w-4xl mx-auto">
          {/* Badge - Made more prominent */}
          <div className="inline-flex items-center gap-3 bg-primary/15 text-primary px-6 py-3 rounded-full text-base md:text-lg font-bold mb-6 shadow-feature border border-primary/20 animate-gentle-beat-1s">
            <span className="w-3 h-3 bg-primary rounded-full animate-gentle-beat-1s"></span>
            No App Download Required • Works in Telegram & WhatsApp
          </div>
          
          {/* Main heading with staggered animation */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
            <span className={`inline-block transition-all duration-700 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              Your AI Business Assistant
            </span>
            <br />
            <span className={`bg-gradient-primary bg-clip-text text-transparent inline-block transition-all duration-700 delay-400 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} hover:scale-105 transition-transform duration-300`}>
              Right Where You Work
            </span>
          </h1>
          
          {/* Subheading */}
          <p className={`text-xl md:text-2xl text-muted-foreground mb-6 max-w-4xl mx-auto leading-relaxed transition-all duration-700 delay-600 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            Skip the app downloads. Get AI-powered expense tracking, content creation, and business insights directly in Telegram or WhatsApp Business. 
            <span className="block mt-2 text-lg text-primary font-medium">We handle setup • You keep your data private • One platform replaces 5+ tools</span>
          </p>
          
          {/* Integration highlight */}
          <div className={`flex flex-wrap justify-center items-center gap-4 mb-8 text-sm text-muted-foreground transition-all duration-700 delay-800 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex items-center gap-2 bg-card/60 backdrop-blur-sm px-3 py-2 rounded-full hover:bg-card/80 hover:scale-105 transition-all duration-300 hover:shadow-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-gentle-breathe"></div>
              <span>Works in Telegram</span>
            </div>
            <div className="flex items-center gap-2 bg-card/60 backdrop-blur-sm px-3 py-2 rounded-full hover:bg-card/80 hover:scale-105 transition-all duration-300 hover:shadow-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-gentle-breathe"></div>
              <span>WhatsApp Business Ready</span>
            </div>
            <div className="flex items-center gap-2 bg-card/60 backdrop-blur-sm px-3 py-2 rounded-full hover:bg-card/80 hover:scale-105 transition-all duration-300 hover:shadow-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-gentle-breathe"></div>
              <span>Full Setup Support</span>
            </div>
          </div>
          
          {/* CTA buttons */}
          <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 transition-all duration-700 delay-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Button 
              variant="hero" 
              size="lg" 
              className="text-lg px-8 py-4 hover:scale-105 transition-all duration-300 hover:shadow-2xl group relative overflow-hidden"
              onClick={() => navigate(user ? '/dashboard' : '/auth?tab=signup')}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <span className="relative z-10">{user ? 'Go to Dashboard' : 'Start Your Free Trial'}</span>
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4 hover:scale-105 transition-all duration-300 hover:bg-primary/5 hover:border-primary/30">
              Watch Demo
            </Button>
          </div>
          
          {/* Features preview */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto transition-all duration-700 delay-1200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex items-center justify-center gap-3 bg-card/80 backdrop-blur-sm rounded-lg p-4 shadow-soft hover:bg-card/90 hover:scale-105 transition-all duration-300 hover:shadow-xl group">
              <Zap className="w-6 h-6 text-primary group-hover:animate-gentle-breathe" />
              <span className="text-foreground font-medium">Automated Expense Tracking</span>
            </div>
            <div className="flex items-center justify-center gap-3 bg-card/80 backdrop-blur-sm rounded-lg p-4 shadow-soft hover:bg-card/90 hover:scale-105 transition-all duration-300 hover:shadow-xl group">
              <Sparkles className="w-6 h-6 text-accent group-hover:animate-gentle-breathe" />
              <span className="text-foreground font-medium">AI Content Strategy</span>
            </div>
            <div className="flex items-center justify-center gap-3 bg-card/80 backdrop-blur-sm rounded-lg p-4 shadow-soft hover:bg-card/90 hover:scale-105 transition-all duration-300 hover:shadow-xl group">
              <div className="w-6 h-6 bg-gradient-primary rounded-full flex items-center justify-center group-hover:animate-spin" style={{ animationDuration: '4s' }}>
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
