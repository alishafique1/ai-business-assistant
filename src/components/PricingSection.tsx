import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, DollarSign, Clock, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function PricingSection() {
  const [isContactingSupport, setIsContactingSupport] = useState(false);
  const { toast } = useToast();

  // Auto caller webhook URL - you can customize this
  const AUTO_CALLER_WEBHOOK_URL = import.meta.env.VITE_AUTO_CALLER_WEBHOOK || 'https://your-auto-caller-webhook.com/api/call';

  const handleContactSales = async () => {
    setIsContactingSupport(true);
    
    try {
      const response = await fetch(AUTO_CALLER_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'enterprise_contact_sales',
          timestamp: new Date().toISOString(),
          source: 'pricing_page',
          plan: 'Enterprise',
          user_agent: navigator.userAgent,
          referrer: document.referrer || 'direct'
        })
      });

      if (response.ok) {
        toast({
          title: "Call Request Initiated! 📞",
          description: "Our sales team will contact you within 15 minutes during business hours.",
          duration: 5000,
        });
      } else {
        throw new Error('Failed to initiate call');
      }
    } catch (error) {
      console.error('Error contacting sales:', error);
      toast({
        title: "Call Request Error",
        description: "Unable to initiate call. Please email hr@socialdots.ca or call (555) 123-4567",
        variant: "destructive",
        duration: 7000,
      });
    } finally {
      setIsContactingSupport(false);
    }
  };

  const plans = [
    {
      name: "Free Forever",
      price: "$0",
      period: "/month",
      description: "Perfect for trying out our AI magic",
      features: [
        "5 receipt uploads per month",
        "Basic expense categorization",
        "Simple expense reports",
        "Email support",
        "Basic AI content suggestions (5/month)"
      ],
      limitations: [
        "Limited to 5 receipts monthly",
        "Basic analytics only",
        "No export features"
      ],
      cta: "Start Free Today",
      popular: false,
      highlight: "No credit card required"
    },
    {
      name: "Business Pro",
      price: "$29",
      period: "/month",
      description: "Complete AI business assistant with unlimited features",
      features: [
        "Unlimited AI expense tracking & categorization",
        "Voice assistant with unlimited recording",
        "Complete AI content generation suite",
        "Advanced business analytics & insights",
        "WhatsApp & Telegram integration",
        "Receipt photo processing with AI",
        "Priority email & chat support",
        "Custom expense categories & rules"
      ],
      savings: "Replace ChatGPT Plus + Claude + expense apps + content tools",
      cta: "Lock In Pre-Launch Price",
      popular: true,
      highlight: "Limited Time: Lifetime Rate"
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "Advanced features for growing businesses",
      features: [
        "Everything in Business Pro",
        "Custom AI model training for your industry",
        "Advanced integrations (Xero, FreshBooks, etc.)",
        "Dedicated account manager",
        "24/7 phone support",
        "Unlimited user accounts",
        "Advanced security & compliance",
        "Custom reporting & analytics",
        "API access for custom integrations"
      ],
      cta: "Contact Sales",
      popular: false,
      highlight: "Custom pricing"
    }
  ];

  return (
    <section id="pricing" className="py-24 bg-gradient-to-br from-background via-secondary/20 to-primary/10 relative overflow-hidden">
      {/* Sophisticated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-gradient-to-r from-accent/12 to-primary/8 rounded-full blur-3xl animate-gentle-beat-2s"></div>
        <div className="absolute bottom-40 left-20 w-60 h-60 bg-gradient-to-l from-primary/10 to-accent/6 rounded-full blur-2xl animate-pulse-slow"></div>
      </div>
      
      {/* Elegant grid pattern */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: `
          linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
          linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px'
      }}></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Pre-Launch Pricing:
            <span className="bg-gradient-primary bg-clip-text text-transparent"> Lock In Lifetime Rates</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Early adopters get all current AND future AI features at today's prices. No price increases, ever.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative border-border/50 transition-all duration-300 overflow-visible ${
                plan.popular 
                  ? 'ring-2 ring-primary shadow-hero scale-105 border-primary/50' 
                  : index === 0 
                    ? 'border-muted-foreground/20 hover:border-primary/30 hover:shadow-soft' 
                    : 'hover:border-primary/50 hover:shadow-feature'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="bg-gradient-primary text-white px-6 py-2 rounded-full text-sm font-medium shadow-lg">
                    Popular
                  </span>
                </div>
              )}
              
              {index === 0 && (
                <div className="absolute -top-4 right-4 z-10">
                  <span className="bg-emerald-500 text-white px-4 py-1.5 rounded-full text-xs font-medium shadow-lg">
                    No Credit Card
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <CardDescription className="mt-2 min-h-[3rem] flex items-center">
                  {plan.description}
                </CardDescription>
                {plan.savings && (
                  <div className="mt-3 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <p className="text-sm text-emerald-700 font-medium">{plan.savings}</p>
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.limitations && (
                  <div className="pt-3 border-t border-border">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Free plan limitations:</p>
                    <ul className="space-y-1">
                      {plan.limitations.map((limitation, limIndex) => (
                        <li key={limIndex} className="flex items-center text-sm text-muted-foreground">
                          <span className="w-2 h-2 bg-muted-foreground/40 rounded-full mr-3 flex-shrink-0"></span>
                          {limitation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <Button 
                  variant={plan.popular ? "hero" : index === 0 ? "secondary" : "outline"} 
                  className={`w-full ${index === 0 ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : ''}`}
                  size="lg"
                  onClick={plan.name === "Enterprise" ? handleContactSales : undefined}
                  disabled={plan.name === "Enterprise" && isContactingSupport}
                >
                  {plan.name === "Enterprise" && isContactingSupport ? "Initiating Call..." : plan.cta}
                </Button>

                {index === 0 && (
                  <p className="text-center text-xs text-muted-foreground mt-2">
                    Upgrade anytime to unlock unlimited features
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-muted/50 rounded-2xl p-8 max-w-4xl mx-auto mb-8">
            <h3 className="text-2xl font-bold text-foreground mb-4">Pre-Launch Benefits: More Features Coming Weekly</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div className="space-y-3">
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-emerald-500 mr-2" />
                  <span className="text-foreground">Your data never leaves our secure servers</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-emerald-500 mr-2" />
                  <span className="text-foreground">All future AI features included free</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-emerald-500 mr-2" />
                  <span className="text-foreground">Lifetime pricing protection</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-emerald-500 mr-2" />
                  <span className="text-foreground">Cancel subscriptions to 5+ AI tools</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-emerald-500 mr-2" />
                  <span className="text-foreground">Priority support & feature requests</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-emerald-500 mr-2" />
                  <span className="text-foreground">Early access to beta features</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="flex items-center justify-center space-x-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="text-foreground">14-day money-back guarantee</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Clock className="h-5 w-5 text-primary" />
              <span className="text-foreground">Cancel anytime, keep your data</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-foreground">Migrate from any accounting tool</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
