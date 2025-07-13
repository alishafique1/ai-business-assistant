import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap, Play } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Scene3D } from "./Scene3D";
import modernHeroBg from "@/assets/modern-hero-bg.jpg";
import laptopWorkspace from "@/assets/laptop-workspace.jpg";

export const HeroSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Modern background with gradient overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${modernHeroBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/80 to-background/95" />
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-accent/5" />
      
      {/* 3D Scene */}
      <Scene3D />
      
      {/* Floating particles effect */}
      <div className="absolute inset-0 opacity-30">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>
      
      <div className="container mx-auto px-6 relative z-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-screen py-20">
          {/* Left side - Content */}
          <div className="text-left space-y-8 animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-primary/10 backdrop-blur-sm text-primary px-4 py-2 rounded-full text-sm font-medium border border-primary/20">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span>✨ No App Downloads • AI-Powered</span>
            </div>
            
            {/* Main heading */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="text-foreground">Your AI Business</span>
              <br />
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Assistant
              </span>
              <br />
              <span className="text-muted-foreground text-3xl md:text-4xl lg:text-5xl">
                Right Where You Work
              </span>
            </h1>
            
            {/* Subheading */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
              Transform your business operations with AI-powered expense tracking, content creation, and insights—all delivered through Telegram or WhatsApp Business.
            </p>
            
            {/* Features pills */}
            <div className="flex flex-wrap gap-3">
              {[
                { icon: Zap, text: "Instant Setup", color: "text-primary" },
                { icon: Sparkles, text: "AI-Powered", color: "text-accent" },
                { text: "Privacy First", color: "text-secondary" }
              ].map((feature, i) => (
                <div 
                  key={i}
                  className="flex items-center gap-2 bg-card/80 backdrop-blur-sm px-4 py-2 rounded-full border border-border/50 hover:border-primary/30 transition-all duration-300 hover:scale-105"
                >
                  {feature.icon && <feature.icon className={`w-4 h-4 ${feature.color}`} />}
                  <span className="text-sm font-medium text-foreground">{feature.text}</span>
                </div>
              ))}
            </div>
            
            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button 
                variant="hero" 
                size="lg" 
                className="text-lg px-8 py-4 group shadow-xl hover:shadow-2xl transition-all duration-300"
                onClick={() => navigate(user ? '/dashboard' : '/onboarding')}
              >
                {user ? 'Go to Dashboard' : 'Start Free Trial'}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-4 group backdrop-blur-sm border-2 hover:bg-primary/5"
              >
                <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Watch Demo
              </Button>
            </div>
            
            {/* Stats */}
            <div className="flex items-center gap-8 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Setup in 2 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span>Works instantly</span>
              </div>
            </div>
          </div>
          
          {/* Right side - Visual */}
          <div className="relative lg:block hidden">
            <div className="relative animate-fade-in" style={{ animationDelay: '0.3s' }}>
              {/* Main image */}
              <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                <img 
                  src={laptopWorkspace} 
                  alt="Modern workspace with AI assistant"
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-card/90 backdrop-blur-lg rounded-xl p-4 shadow-xl border border-primary/20 animate-bounce">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">AI Active</span>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 bg-accent/10 backdrop-blur-lg rounded-xl p-4 shadow-xl border border-accent/20 animate-pulse">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium">Smart Insights</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};