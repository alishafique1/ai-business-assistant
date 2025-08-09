
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { ThreeJSBackground } from "@/components/ThreeJSBackground";

export const HeroSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Three.js Background */}
      <ThreeJSBackground />
      
      {/* Subtle overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/10 to-background/30"></div>
      
      <div className={`container mx-auto px-6 text-center relative z-20 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="max-w-4xl mx-auto">
          {/* Badge - Made more prominent */}
          <div className="inline-flex items-center gap-3 bg-primary/15 text-primary px-6 py-3 rounded-full text-base md:text-lg font-bold mb-6 shadow-feature border border-primary/20 animate-gentle-beat-1s">
            <span className="w-3 h-3 bg-primary rounded-full animate-gentle-beat-1s"></span>
            No App Download Required • Works in Telegram & WhatsApp
          </div>
          
          {/* Main heading with subtle text animations */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
            <span className={`inline-block transition-all duration-800 delay-200 text-white hover:scale-102 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              Your AI Business Assistant
            </span>
            <br />
            <span className={`bg-gradient-primary bg-clip-text text-transparent inline-block transition-all duration-800 delay-400 hover:scale-102 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
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
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full hover:bg-white hover:scale-105 transition-all duration-300 hover:shadow-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Works in Telegram</span>
            </div>
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full hover:bg-white hover:scale-105 transition-all duration-300 hover:shadow-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>WhatsApp Business Ready</span>
            </div>
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full hover:bg-white hover:scale-105 transition-all duration-300 hover:shadow-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
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
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
              <span className="relative z-10">{user ? 'Go to Dashboard' : 'Start Your Free Trial'}</span>
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-4 hover:scale-105 transition-all duration-300 hover:bg-primary/5 hover:border-primary/30"
              onClick={() => setShowVideo(!showVideo)}
            >
              {showVideo ? 'Hide Demo' : 'Watch Demo'}
            </Button>
          </div>
          
          {/* YouTube Video Embed */}
          {showVideo && (
            <div className="mt-8 mb-8">
              <div className="max-w-4xl mx-auto">
                <div className="relative w-full" style={{ paddingBottom: '56.25%' /* 16:9 aspect ratio */ }}>
                  <iframe
                    className="absolute top-0 left-0 w-full h-full rounded-lg shadow-2xl"
                    src="https://www.youtube.com/embed/t1DUYoLwYmU?autoplay=1&rel=0"
                    title="Demo Video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Features preview */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto transition-all duration-700 delay-1200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex items-center justify-center gap-3 bg-card/80 backdrop-blur-sm rounded-lg p-4 shadow-soft hover:bg-card/90 hover:scale-105 transition-all duration-300 hover:shadow-xl group">
              <Zap className="w-6 h-6 text-primary" />
              <span className="text-foreground font-medium">Automated Expense Tracking</span>
            </div>
            <div className="flex items-center justify-center gap-3 bg-card/80 backdrop-blur-sm rounded-lg p-4 shadow-soft hover:bg-card/90 hover:scale-105 transition-all duration-300 hover:shadow-xl group">
              <Sparkles className="w-6 h-6 text-accent" />
              <span className="text-foreground font-medium">AI Content Strategy</span>
            </div>
            <div className="flex items-center justify-center gap-3 bg-card/80 backdrop-blur-sm rounded-lg p-4 shadow-soft hover:bg-card/90 hover:scale-105 transition-all duration-300 hover:shadow-xl group">
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
