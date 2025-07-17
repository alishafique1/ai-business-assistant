import { Brain, Menu, X, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

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
    <nav className={`fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50 transition-transform duration-300 ease-in-out ${
      isVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <button 
            onClick={handleLogoClick}
            disabled={isRefreshing}
            className={`flex items-center space-x-3 hover:opacity-80 transition-all duration-200 ${
              isRefreshing ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            <Brain className={`h-8 w-8 text-primary transition-transform duration-200 ${
              isRefreshing ? 'animate-spin' : ''
            }`} />
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              AI Business Hub
            </span>
          </button>

          <div className="hidden md:flex items-center">
            <div className="bg-background/90 backdrop-blur-sm border border-border/40 rounded-full p-1 flex items-center space-x-1 shadow-md">
              <button 
                onClick={scrollToTop}
                className="relative px-4 py-2 rounded-full text-foreground/80 hover:text-foreground transition-colors hover:bg-background/50 before:content-[''] before:absolute before:top-0 before:left-1/2 before:-translate-x-1/2 before:w-8 before:h-1 before:bg-primary before:rounded-full before:opacity-0 hover:before:opacity-100 before:transition-opacity"
              >
                Home
              </button>
              <button 
                onClick={() => scrollToSection('features')}
                className="relative px-4 py-2 rounded-full text-foreground/80 hover:text-foreground transition-colors hover:bg-background/50 before:content-[''] before:absolute before:top-0 before:left-1/2 before:-translate-x-1/2 before:w-8 before:h-1 before:bg-primary before:rounded-full before:opacity-0 hover:before:opacity-100 before:transition-opacity"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('benefits')}
                className="relative px-4 py-2 rounded-full text-foreground/80 hover:text-foreground transition-colors hover:bg-background/50 before:content-[''] before:absolute before:top-0 before:left-1/2 before:-translate-x-1/2 before:w-8 before:h-1 before:bg-primary before:rounded-full before:opacity-0 hover:before:opacity-100 before:transition-opacity"
              >
                Benefits
              </button>
              <button 
                onClick={() => scrollToSection('pricing')}
                className="relative px-4 py-2 rounded-full text-foreground/80 hover:text-foreground transition-colors hover:bg-background/50 before:content-[''] before:absolute before:top-0 before:left-1/2 before:-translate-x-1/2 before:w-8 before:h-1 before:bg-primary before:rounded-full before:opacity-0 hover:before:opacity-100 before:transition-opacity"
              >
                Pricing
              </button>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background border-border">
                  <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                    <User className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/auth")}>
                  Sign In
                </Button>
                <Button variant="hero" showHoverArrows onClick={() => navigate("/auth")}>
                  Get Started
                </Button>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-foreground" />
            ) : (
              <Menu className="h-6 w-6 text-foreground" />
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
                    <Button variant="hero" showHoverArrows onClick={() => navigate("/auth")}>
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
