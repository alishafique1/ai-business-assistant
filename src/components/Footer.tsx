
import { Button } from "@/components/ui/button";
import { Mail, Twitter, Linkedin, Github } from "lucide-react";

export const Footer = () => {
  const footerSections = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "#features" },
        { label: "Pricing", href: "#pricing" },
        { label: "API", href: "#api" },
        { label: "Security", href: "#security" }
      ]
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "#about" },
        { label: "Blog", href: "#blog" },
        { label: "Careers", href: "#careers" },
        { label: "Contact", href: "#contact" }
      ]
    },
    {
      title: "Resources",
      links: [
        { label: "Documentation", href: "#docs" },
        { label: "Help Center", href: "#help" },
        { label: "Community", href: "#community" },
        { label: "Tutorials", href: "#tutorials" }
      ]
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "#privacy" },
        { label: "Terms of Service", href: "#terms" },
        { label: "Cookie Policy", href: "#cookies" },
        { label: "GDPR", href: "#gdpr" }
      ]
    }
  ];

  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand section */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-sm"></div>
              </div>
              <span className="text-xl font-bold">BusinessAI</span>
            </div>
            <p className="text-background/70 mb-6 max-w-md">
              Comprehensive AI platform designed to transform how small businesses 
              manage operations, track expenses, and create content strategies.
            </p>
            <div className="flex gap-4">
              <Button size="sm" variant="ghost" className="w-10 h-10 p-0 text-background hover:text-foreground">
                <Twitter className="w-5 h-5" />
              </Button>
              <Button size="sm" variant="ghost" className="w-10 h-10 p-0 text-background hover:text-foreground">
                <Linkedin className="w-5 h-5" />
              </Button>
              <Button size="sm" variant="ghost" className="w-10 h-10 p-0 text-background hover:text-foreground">
                <Github className="w-5 h-5" />
              </Button>
              <Button size="sm" variant="ghost" className="w-10 h-10 p-0 text-background hover:text-foreground">
                <Mail className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Footer links */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold text-background mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a 
                      href={link.href}
                      className="text-background/70 hover:text-background transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter signup */}
        <div className="border-t border-background/20 pt-8 mb-8">
          <div className="max-w-md">
            <h3 className="font-semibold text-background mb-2">Stay updated</h3>
            <p className="text-background/70 mb-4">
              Get the latest updates on new features and AI innovations.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 rounded-md bg-background/10 text-background placeholder-background/50 border border-background/20 focus:outline-none focus:border-background/40"
              />
              <Button 
                variant="outline" 
                className="border-background text-foreground bg-background hover:bg-foreground hover:text-background hover:border-background transition-all duration-300"
              >
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-background/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-background/70 text-sm">
            © 2024 BusinessAI. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-background/70">
            <span>Made with ❤️ for small businesses</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>All systems operational</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
