
import { Button } from "@/components/ui/button";
import { Mail, Linkedin } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

// Custom X (Twitter) icon component
const XIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// Custom Instagram icon component
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
  isEmail?: boolean;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

export const Footer = () => {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const { toast } = useToast();

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setIsSubscribing(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      console.log('Environment check:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
        url: supabaseUrl?.substring(0, 30) + '...',
      });

      // Check if environment variables are set
      if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your_supabase_url_here')) {
        console.log('Newsletter subscription (demo mode):', email.toLowerCase().trim());
        toast({
          title: "Demo Mode - Subscription Received! 🎉",
          description: "Environment variables not configured. Check console for details.",
          duration: 5000,
        });
        setEmail('');
        return;
      }

      // Real Supabase integration
      console.log('Attempting Supabase connection...');
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);

      console.log('Inserting subscription for:', email.toLowerCase().trim());
      
      const { data, error } = await supabase
        .from('newsletter_subscriptions')
        .insert({
          email: email.toLowerCase().trim(),
          source: 'website_footer',
          user_agent: navigator.userAgent,
        })
        .select();

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Supabase error details:', error);
        
        if (error.code === '23505' || error.message?.includes('duplicate')) {
          toast({
            title: "Already Subscribed",
            description: "This email is already subscribed to our newsletter.",
            variant: "destructive",
          });
          return;
        }
        
        if (error.message?.includes('relation "newsletter_subscriptions" does not exist')) {
          toast({
            title: "Database Setup Required",
            description: "The newsletter table hasn't been created yet. Please run the SQL script in Supabase.",
            variant: "destructive",
          });
          return;
        }
        
        throw error;
      }

      toast({
        title: "Successfully Subscribed! 🎉",
        description: "Thank you for subscribing to our newsletter. You'll hear from us soon!",
        duration: 5000,
      });
      setEmail('');

    } catch (error) {
      console.error('Newsletter subscription error:', error);
      toast({
        title: "Subscription Failed",
        description: `Error: ${error.message || 'Unknown error'}. Check console for details.`,
        variant: "destructive",
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  const footerSections: FooterSection[] = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "#features" },
        { label: "Pricing", href: "#pricing" },
        { label: "Security", href: "#security" }
      ]
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "https://socialdots.ca/about/", external: true },
        { label: "Blog", href: "https://socialdots.ca/blog/", external: true },
        { label: "Contact", href: "mailto:hr@socialdots.ca", isEmail: true }
      ]
    }
  ];

  return (
    <footer className="bg-foreground text-background py-8">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-6">
          {/* Brand section */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-sm"></div>
              </div>
              <span className="text-xl font-bold">Expenzify</span>
            </div>
            <p className="text-background/70 mb-6 max-w-md">
              Comprehensive AI platform designed to transform how small businesses 
              manage operations, track expenses, and create content strategies.
            </p>
            <div className="flex gap-4">
              <Button 
                size="sm" 
                variant="ghost" 
                className="w-10 h-10 p-0 text-background hover:text-foreground"
                onClick={() => window.open('https://x.com/SocialDotsCa', '_blank')}
              >
                <XIcon className="w-5 h-5" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="w-10 h-10 p-0 text-background hover:text-foreground"
                onClick={() => window.open('https://www.linkedin.com/company/socialdotsca/posts/?feedView=all', '_blank')}
              >
                <Linkedin className="w-5 h-5" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="w-10 h-10 p-0 text-background hover:text-foreground"
                onClick={() => window.open('https://www.instagram.com/socialdots.ca/', '_blank')}
              >
                <InstagramIcon className="w-5 h-5" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="w-10 h-10 p-0 text-background hover:text-foreground"
                onClick={() => window.open('https://mail.google.com/mail/?view=cm&fs=1&to=hr@socialdots.ca', '_blank')}
              >
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
                    {link.external ? (
                      <button
                        onClick={() => window.open(link.href, '_blank')}
                        className="text-background/70 hover:text-background transition-colors cursor-pointer"
                      >
                        {link.label}
                      </button>
                    ) : link.isEmail ? (
                      <button
                        onClick={() => window.open('https://mail.google.com/mail/?view=cm&fs=1&to=hr@socialdots.ca', '_blank')}
                        className="text-background/70 hover:text-background transition-colors cursor-pointer"
                      >
                        {link.label}
                      </button>
                    ) : (
                      <a 
                        href={link.href}
                        className="text-background/70 hover:text-background transition-colors"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter signup */}
        <div className="border-t border-background/20 pt-6 mb-4">
          <div className="max-w-md">
            <h3 className="font-semibold text-background mb-2">Stay updated</h3>
            <p className="text-background/70 mb-4">
              Get the latest updates on new features and AI innovations.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 rounded-md bg-background/10 text-background placeholder-background/50 border border-background/20 focus:outline-none focus:border-background/40"
                disabled={isSubscribing}
                required
              />
              <Button 
                type="submit"
                variant="outline" 
                className="border-background text-foreground bg-background hover:bg-foreground hover:text-background hover:border-background transition-all duration-300"
                disabled={isSubscribing}
              >
                {isSubscribing ? 'Subscribing...' : 'Subscribe'}
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-background/20 pt-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-background/70 text-sm">
            © 2025 Expenzify. All rights reserved.
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
