
import { Brain, Menu, X, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
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
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              AI Business Hub
            </span>
          </div>

          <div className="hidden md:flex items-center">
            <div className="bg-muted/50 rounded-full p-1 flex items-center space-x-1">
              <a 
                href="#home" 
                className="relative px-4 py-2 rounded-full text-foreground/80 hover:text-foreground transition-colors hover:bg-background/50 before:content-[''] before:absolute before:top-0 before:left-1/2 before:-translate-x-1/2 before:w-8 before:h-1 before:bg-primary before:rounded-full before:opacity-100"
              >
                Home
              </a>
              <a 
                href="#features" 
                className="relative px-4 py-2 rounded-full text-foreground/80 hover:text-foreground transition-colors hover:bg-background/50 before:content-[''] before:absolute before:top-0 before:left-1/2 before:-translate-x-1/2 before:w-8 before:h-1 before:bg-primary before:rounded-full before:opacity-0 hover:before:opacity-100 before:transition-opacity"
              >
                About
              </a>
              <a 
                href="#benefits" 
                className="relative px-4 py-2 rounded-full text-foreground/80 hover:text-foreground transition-colors hover:bg-background/50 before:content-[''] before:absolute before:top-0 before:left-1/2 before:-translate-x-1/2 before:w-8 before:h-1 before:bg-primary before:rounded-full before:opacity-0 hover:before:opacity-100 before:transition-opacity"
              >
                Projects
              </a>
              <a 
                href="#pricing" 
                className="relative px-4 py-2 rounded-full text-foreground/80 hover:text-foreground transition-colors hover:bg-background/50 before:content-[''] before:absolute before:top-0 before:left-1/2 before:-translate-x-1/2 before:w-8 before:h-1 before:bg-primary before:rounded-full before:opacity-0 hover:before:opacity-100 before:transition-opacity"
              >
                Resume
              </a>
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
              <a 
                href="#home" 
                className="text-foreground/80 hover:text-foreground transition-colors py-2 px-3 rounded-md hover:bg-primary/10"
              >
                Home
              </a>
              <a 
                href="#features" 
                className="text-foreground/80 hover:text-foreground transition-colors py-2 px-3 rounded-md hover:bg-primary/10"
              >
                About
              </a>
              <a 
                href="#benefits" 
                className="text-foreground/80 hover:text-foreground transition-colors py-2 px-3 rounded-md hover:bg-primary/10"
              >
                Projects
              </a>
              <a 
                href="#pricing" 
                className="text-foreground/80 hover:text-foreground transition-colors py-2 px-3 rounded-md hover:bg-primary/10"
              >
                Resume
              </a>
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
