
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Sparkles, Star, Zap, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

export const CTASection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [sparklePositions, setSparklePositions] = useState<Array<{x: number, y: number, id: number}>>([]);
  const sectionRef = useRef<HTMLElement>(null);

  // Google Calendar configuration - you can customize this
  const BOSS_CALENDAR_URL = import.meta.env.VITE_BOSS_CALENDAR_URL || 'https://calendly.com/your-boss-calendar';

  const handleScheduleDemo = () => {
    // Open the calendar in a new tab
    window.open(BOSS_CALENDAR_URL, '_blank');
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    const element = document.getElementById('cta-section');
    if (element) observer.observe(element);

    // Mouse move handler for dynamic effects
    const handleMouseMove = (e: MouseEvent) => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        setMousePosition({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100,
        });
      }
    };

    // Generate sparkle positions
    const generateSparkles = () => {
      const newSparkles = Array.from({ length: 8 }, (_, i) => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        id: i,
      }));
      setSparklePositions(newSparkles);
    };

    generateSparkles();
    const sparkleInterval = setInterval(generateSparkles, 8000);

    if (sectionRef.current) {
      sectionRef.current.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      observer.disconnect();
      clearInterval(sparkleInterval);
      if (sectionRef.current) {
        sectionRef.current.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, []);

  return (
    <section ref={sectionRef} id="cta-section" className="py-24 bg-gradient-primary relative overflow-hidden">
      {/* Elegant animated background */}
      <div className="absolute inset-0">
        {/* Premium floating orbs */}
        <div className="absolute top-20 left-20 w-80 h-80 bg-gradient-to-r from-white/15 to-white/10 rounded-full blur-3xl animate-sophisticated-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-l from-white/12 to-white/8 rounded-full blur-3xl animate-elegant-float"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-radial-gradient from-white/10 to-transparent rounded-full animate-premium-glow"></div>
        {/* Interactive mouse-following elements */}
        <div 
          className="absolute w-72 h-72 bg-gradient-to-r from-white/8 to-white/12 rounded-full blur-3xl transition-all duration-1000 ease-out"
          style={{
            left: `${mousePosition.x * 0.5}%`,
            top: `${mousePosition.y * 0.5}%`,
            transform: 'translate(-50%, -50%)',
          }}
        />
        
        {/* Elegant floating particles */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full animate-elegant-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${6 + i * 0.5}s`
            }}
          />
        ))}
        
        {/* Sparkle effects */}
        {sparklePositions.map((sparkle) => (
          <Sparkles
            key={sparkle.id}
            className="absolute w-4 h-4 text-white/30"
            style={{
              left: `${sparkle.x}%`,
              top: `${sparkle.y}%`,
            }}
          />
        ))}
        
        {/* Geometric shapes */}
        {[...Array(6)].map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute animate-slow-float"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 2) * 60}%`,
              animationDelay: `${i * 2}s`,
              animationDuration: `${20 + i * 3}s`,
            }}
          >
            <Star className="w-3 h-3 text-white/20" />
          </div>
        ))}
      </div>
      
      {/* Background decoration */}
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/5 rounded-full blur-xl"></div>
      <div className="absolute top-1/2 left-1/2 w-20 h-20 border-2 border-white/20 rounded-full animate-spin" style={{ animationDuration: '20s' }}></div>
      <div className="absolute top-1/4 left-3/4 w-16 h-16 border border-white/10 rounded-lg rotate-45"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className={`text-4xl md:text-6xl font-bold text-white mb-6 transition-all duration-1000 relative leading-tight ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <span className="inline-block hover:scale-105 transition-transform duration-500 group relative">
              Transform Your Business Into
              <Zap className="absolute -top-2 -right-2 w-6 h-6 text-yellow-300 opacity-0 group-hover:opacity-100 transition-all duration-500" />
            </span>
            <br />
            <span className="inline-block hover:scale-105 transition-transform duration-500 delay-100 group relative bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
              An AI-Powered Enterprise
              <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-blue-200 opacity-0 group-hover:opacity-100 transition-all duration-500" />
            </span>
          </h2>
          
          <p className={`text-xl md:text-2xl text-white/90 mb-8 max-w-4xl mx-auto transition-all duration-1000 delay-300 relative group hover:text-white leading-relaxed ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            Join the intelligence revolution that's reshaping business operations. Our unified AI ecosystem eliminates 
            manual workflows, automates complex processes, and delivers enterprise-grade insights—allowing you to scale 
            efficiently while maintaining complete data sovereignty.
            {/* Subtle glow effect on hover */}
            <span className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg -z-10 blur-xl"></span>
          </p>
          
          {/* Enhanced features list */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex items-center justify-center gap-3 text-white hover:scale-110 transition-all duration-500 group relative">
              <CheckCircle className="w-6 h-6 text-emerald-300 group-hover:text-emerald-200 transition-all duration-300" />
              <span className="font-semibold group-hover:drop-shadow-md relative z-10">Risk-Free 14-Day Trial</span>
              {/* Hover background */}
              <div className="absolute inset-0 bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -m-2 blur-sm"></div>
            </div>
            <div className="flex items-center justify-center gap-3 text-white hover:scale-110 transition-all duration-500 group relative">
              <CheckCircle className="w-6 h-6 text-emerald-300 group-hover:text-emerald-200 transition-all duration-300" />
              <span className="font-semibold group-hover:drop-shadow-md relative z-10">Instant Access • No Card</span>
              {/* Hover background */}
              <div className="absolute inset-0 bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -m-2 blur-sm"></div>
            </div>
            <div className="flex items-center justify-center gap-3 text-white hover:scale-110 transition-all duration-500 group relative">
              <CheckCircle className="w-6 h-6 text-emerald-300 group-hover:text-emerald-200 transition-all duration-300" />
              <span className="font-semibold group-hover:drop-shadow-md relative z-10">Cancel Anytime • Full Control</span>
              {/* Hover background */}
              <div className="absolute inset-0 bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -m-2 blur-sm"></div>
            </div>
          </div>
          
          {/* CTA buttons */}
          <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-white/95 text-lg px-10 py-4 font-bold shadow-hero hover:scale-110 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden"
              onClick={() => navigate(user ? "/dashboard" : "/auth?tab=signup")}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/15 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-gradient"></span>
              <span className="relative z-10 group-hover:drop-shadow-sm transition-all duration-300">{user ? "Access Your Dashboard" : "Start Your AI Transformation"}</span>
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 group-hover:scale-110 transition-all duration-500" />
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-white/40 text-white bg-white/10 hover:bg-white/20 text-lg px-8 py-4 hover:scale-105 hover:border-white/60 transition-all duration-500 relative overflow-hidden group font-semibold"
              onClick={handleScheduleDemo}
            >
              <Calendar className="w-5 h-5 mr-2 group-hover:rotate-12 group-hover:scale-110 transition-all duration-500" />
              <span className="relative z-10 group-hover:drop-shadow-sm transition-all duration-300">Book Expert Consultation</span>
              {/* Subtle shimmer */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
            </Button>
          </div>
          
          {/* Enhanced trust indicators */}
          <div className={`mt-12 pt-8 border-t border-white/30 transition-all duration-1000 delay-900 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="text-white/80 mb-6 text-lg font-medium">Trusted by innovative enterprises worldwide</p>
            <div className="flex flex-wrap justify-center items-center gap-6 opacity-90">
              <div className="bg-white/25 px-6 py-3 rounded-xl backdrop-blur-sm hover:bg-white/35 hover:scale-105 transition-all duration-500 group relative overflow-hidden hover:-translate-y-1 border border-white/10">
                <span className="text-white font-bold group-hover:drop-shadow-md relative z-10">Bank-Level Security</span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
              <div className="bg-white/25 px-6 py-3 rounded-xl backdrop-blur-sm hover:bg-white/35 hover:scale-105 transition-all duration-500 group relative overflow-hidden hover:-translate-y-1 border border-white/10">
                <span className="text-white font-bold group-hover:drop-shadow-md relative z-10">SOC 2 Compliant</span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
              <div className="bg-white/25 px-6 py-3 rounded-xl backdrop-blur-sm hover:bg-white/35 hover:scale-105 transition-all duration-500 group relative overflow-hidden hover:-translate-y-1 border border-white/10">
                <span className="text-white font-bold group-hover:drop-shadow-md relative z-10">Enterprise Support</span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
