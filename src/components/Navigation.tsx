
import { Brain, Menu, X, LogOut, User, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [sparkleAnimation, setSparkleAnimation] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show navbar when at the top or scrolling up
      if (currentScrollY < 10 || currentScrollY < lastScrollY) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 80) {
        // Hide navbar when scrolling down (after 80px to avoid flickering)
        setIsVisible(false);
        setIsMenuOpen(false); // Close mobile menu when hiding
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLogoClick = () => {
    setIsRefreshing(true);
    
    // Add visual feedback with a brief delay
    setTimeout(() => {
      window.location.href = '/';
    }, 200);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[9999] bg-background/95 backdrop-blur-md border-b border-border/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-500 ease-out ${
      isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-90'
    } hover:bg-background/98 hover:shadow-[0_12px_40px_rgb(0,0,0,0.15)] relative overflow-visible`}>
      {/* Animated background particles */}
      <div className="absolute inset-0 opacity-30 transition-opacity duration-1000">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full"
            style={{
              left: `${10 + i * 15}%`,
              top: `${20 + (i % 2) * 60}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${8 + i}s`,
            }}
          />
        ))}
      </div>
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="group">
            <button 
              onClick={handleLogoClick}
              disabled={isRefreshing}
              className={`flex items-center space-x-3 hover:opacity-80 transition-all duration-300 hover:scale-105 ${
                isRefreshing ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
            <div className="relative">
              <Brain className={`h-8 w-8 text-primary transition-all duration-500 ${
                isRefreshing ? 'animate-spin' : 'group-hover:rotate-12 group-hover:scale-110'
              }`} />
              {/* Sparkle effect on hover */}
              <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-accent opacity-0 group-hover:opacity-100 transition-all duration-500" />
            </div>
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent group-hover:drop-shadow-sm transition-all duration-500 group-hover:scale-105 relative">
              AI Business Hub
              {/* Subtle glow effect */}
              <span className="absolute inset-0 bg-gradient-primary bg-clip-text text-transparent opacity-0 group-hover:opacity-50 blur-sm transition-all duration-500">
                AI Business Hub
              </span>
            </span>
          </button>
          </div>

          <div className="hidden md:flex items-center">
            <div className="bg-background/90 backdrop-blur-sm border border-border/40 rounded-full p-1 flex items-center space-x-1 shadow-md hover:shadow-lg transition-all duration-500 hover:scale-105 relative group/nav overflow-hidden">
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 opacity-0 group-hover/nav:opacity-100 transition-all duration-500 animate-gradient"></div>
              <button 
                onClick={scrollToTop}
                className="relative px-4 py-2 rounded-full text-foreground/80 hover:text-foreground transition-all duration-500 hover:bg-background/70 hover:scale-110 group/btn z-10 before:content-[''] before:absolute before:top-0 before:left-1/2 before:-translate-x-1/2 before:w-8 before:h-1 before:bg-primary before:rounded-full before:opacity-0 hover:before:opacity-100 before:transition-all before:duration-500 after:content-[''] after:absolute after:inset-0 after:bg-gradient-to-r after:from-primary/10 after:to-accent/10 after:rounded-full after:opacity-0 after:scale-75 hover:after:opacity-100 hover:after:scale-100 after:transition-all after:duration-500"
              >
                <span className="group-hover/btn:drop-shadow-sm relative z-10">Home</span>
              </button>
              <button 
                onClick={() => scrollToSection('features')}
                className="relative px-4 py-2 rounded-full text-foreground/80 hover:text-foreground transition-all duration-500 hover:bg-background/70 hover:scale-110 group/btn z-10 before:content-[''] before:absolute before:top-0 before:left-1/2 before:-translate-x-1/2 before:w-8 before:h-1 before:bg-primary before:rounded-full before:opacity-0 hover:before:opacity-100 before:transition-all before:duration-500 after:content-[''] after:absolute after:inset-0 after:bg-gradient-to-r after:from-primary/10 after:to-accent/10 after:rounded-full after:opacity-0 after:scale-75 hover:after:opacity-100 hover:after:scale-100 after:transition-all after:duration-500"
              >
                <span className="group-hover/btn:drop-shadow-sm relative z-10">Features</span>
              </button>
              <button 
                onClick={() => scrollToSection('benefits')}
                className="relative px-4 py-2 rounded-full text-foreground/80 hover:text-foreground transition-all duration-500 hover:bg-background/70 hover:scale-110 group/btn z-10 before:content-[''] before:absolute before:top-0 before:left-1/2 before:-translate-x-1/2 before:w-8 before:h-1 before:bg-primary before:rounded-full before:opacity-0 hover:before:opacity-100 before:transition-all before:duration-500 after:content-[''] after:absolute after:inset-0 after:bg-gradient-to-r after:from-primary/10 after:to-accent/10 after:rounded-full after:opacity-0 after:scale-75 hover:after:opacity-100 hover:after:scale-100 after:transition-all after:duration-500"
              >
                <span className="group-hover/btn:drop-shadow-sm relative z-10">Benefits</span>
              </button>
              <button 
                onClick={() => scrollToSection('pricing')}
                className="relative px-4 py-2 rounded-full text-foreground/80 hover:text-foreground transition-all duration-500 hover:bg-background/70 hover:scale-110 group/btn z-10 before:content-[''] before:absolute before:top-0 before:left-1/2 before:-translate-x-1/2 before:w-8 before:h-1 before:bg-primary before:rounded-full before:opacity-0 hover:before:opacity-100 before:transition-all before:duration-500 after:content-[''] after:absolute after:inset-0 after:bg-gradient-to-r after:from-primary/10 after:to-accent/10 after:rounded-full after:opacity-0 after:scale-75 hover:after:opacity-100 hover:after:scale-100 after:transition-all after:duration-500"
              >
                <span className="group-hover/btn:drop-shadow-sm relative z-10">Pricing</span>
              </button>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button 
                  className="flex items-center space-x-2 hover:scale-105 transition-all duration-300 hover:bg-primary/10 px-3 py-2 rounded-md cursor-pointer border border-transparent hover:border-primary/20"
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                >
                  <User className="h-4 w-4 transition-transform duration-300" />
                  <span className="text-sm font-medium">{user.email?.split('@')[0] || 'User'}</span>
                  <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isUserDropdownOpen && (
                  <div 
                    className="w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg" 
                    style={{
                      zIndex: 999999, 
                      position: 'fixed',
                      top: '60px',
                      right: '16px'
                    }}
                  >
                    <div className="py-2">
                      <button
                        onClick={() => {
                          navigate("/dashboard");
                          setIsUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center"
                      >
                        <User className="mr-2 h-4 w-4" />
                        Dashboard
                      </button>
                      <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                      <button
                        onClick={() => {
                          signOut();
                          setIsUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Button variant="ghost" onClick={() => navigate("/auth")} className="hover:scale-105 transition-all duration-300 hover:bg-primary/5 hover:text-foreground relative z-10">
                  Sign In
                </Button>
                <div className="group">
                  <Button variant="hero" showHoverArrows onClick={() => navigate("/auth?tab=signup")} className="hover:scale-105 transition-all duration-300 hover:shadow-lg relative overflow-hidden">
                    <span className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    <span className="relative z-10">Get Started</span>
                  </Button>
                </div>
              </div>
            )}
          </div>

          <button
            className="md:hidden p-2 hover:bg-primary/10 rounded-lg transition-all duration-300 hover:scale-110"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-foreground transition-transform duration-200 rotate-90" />
            ) : (
              <Menu className="h-6 w-6 text-foreground transition-transform duration-200" />
            )}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50">
            <div className="flex flex-col space-y-2">
              <button 
                onClick={scrollToTop}
                className="text-foreground/80 hover:text-foreground transition-colors py-2 px-3 rounded-md hover:bg-primary/10 text-left"
              >
                Home
              </button>
              <button 
                onClick={() => scrollToSection('features')}
                className="text-foreground/80 hover:text-foreground transition-colors py-2 px-3 rounded-md hover:bg-primary/10 text-left"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('benefits')}
                className="text-foreground/80 hover:text-foreground transition-colors py-2 px-3 rounded-md hover:bg-primary/10 text-left"
              >
                Benefits
              </button>
              <button 
                onClick={() => scrollToSection('pricing')}
                className="text-foreground/80 hover:text-foreground transition-colors py-2 px-3 rounded-md hover:bg-primary/10 text-left"
              >
                Pricing
              </button>
              <div className="flex flex-col space-y-2 pt-4 border-t border-border/50">
                {user ? (
                  <>
                    <div className="flex items-center space-x-2 px-3 py-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{user.email?.split('@')[0] || 'User'}</span>
                    </div>
                    <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                      Dashboard
                    </Button>
                    <Button variant="outline" onClick={signOut}>
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" onClick={() => navigate("/auth")}>
                      Sign In
                    </Button>
                    <Button variant="hero" showHoverArrows onClick={() => navigate("/auth?tab=signup")}>
                      Get Started
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
