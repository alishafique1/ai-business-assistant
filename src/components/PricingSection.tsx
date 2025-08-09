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
    <section id="pricing" className="py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Premium background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-gradient-to-r from-emerald-500/6 to-blue-500/6 rounded-full blur-3xl animate-slow-float"></div>
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-gradient-to-l from-blue-500/4 to-purple-500/4 rounded-full blur-3xl animate-pulse-very-slow"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-purple-500/3 to-pink-500/3 rounded-full blur-2xl animate-gentle-breathe"></div>
        <div className="absolute bottom-1/3 left-1/6 w-48 h-48 bg-gradient-to-r from-cyan-500/4 to-blue-500/4 rounded-full blur-xl animate-pulse-slow"></div>
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
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            <span className="text-white">Exclusive Launch Pricing: </span>
            <span className="bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">Lifetime Value Lock</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Secure permanent access to our complete AI ecosystem at today's rates. Early adopters receive all future innovations, 
            advanced capabilities, and enterprise features without price increases—guaranteed for life.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative transition-all duration-500 overflow-visible group ${
                plan.popular 
                  ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30 shadow-xl shadow-blue-500/20 scale-105 hover:scale-110' 
                  : index === 0 
                    ? 'bg-slate-800/60 border-emerald-500/20 hover:border-emerald-400/40 hover:shadow-lg hover:shadow-emerald-500/20 hover:scale-105' 
                    : 'bg-slate-800/40 border-slate-700/30 hover:border-blue-400/40 hover:shadow-lg hover:shadow-blue-500/20 hover:scale-105'
              } backdrop-blur-sm`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg animate-pulse">
                    🚀 Most Popular
                  </span>
                </div>
              )}
              
              {index === 0 && (
                <div className="absolute -top-4 right-4 z-10">
                  <span className="bg-emerald-500 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg">
                    ✨ No Credit Card
                  </span>
                </div>
              )}
              
              {index === 2 && (
                <div className="absolute -top-4 right-4 z-10">
                  <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg">
                    💼 Enterprise
                  </span>
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"></div>
              
              <CardHeader className="text-center pb-8 relative z-10">
                <CardTitle className={`text-2xl font-bold transition-colors duration-300 ${
                  plan.popular ? 'text-black group-hover:text-gray-800' : 'text-white group-hover:text-blue-100'
                }`}>{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className={`text-4xl font-bold ${plan.popular ? 'text-black' : 'text-white'}`}>{plan.price}</span>
                  <span className={`${plan.popular ? 'text-gray-600' : 'text-gray-400'}`}>{plan.period}</span>
                </div>
                <CardDescription className={`mt-2 min-h-[3rem] flex items-center leading-relaxed ${
                  plan.popular ? 'text-gray-700' : 'text-gray-300'
                }`}>
                  {plan.description}
                </CardDescription>
                {plan.savings && (
                  <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg backdrop-blur-sm">
                    <p className={`text-sm font-semibold ${
                      plan.popular ? 'text-emerald-700' : 'text-emerald-300'
                    }`}>{plan.savings}</p>
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-6 relative z-10">
                <ul className="space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-emerald-400 mr-3 flex-shrink-0 mt-0.5" />
                      <span className={`leading-relaxed ${
                        plan.popular ? 'text-gray-800' : 'text-gray-300'
                      }`}>{feature}</span>
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

        <div className="mt-20 text-center">
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-3xl p-10 max-w-6xl mx-auto mb-12 border border-slate-700/30 shadow-2xl relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent rounded-3xl"></div>
            
            <h3 className="text-3xl font-bold text-white mb-8 relative z-10">
              <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">Exclusive Early Adopter</span> Advantages
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left relative z-10">
              <div className="space-y-5">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 mr-4">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <div>
                    <span className="text-white font-semibold">Enterprise-Grade Security</span>
                    <p className="text-gray-300 text-sm mt-1">Your data never leaves our secure servers with bank-level encryption</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 mr-4">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <div>
                    <span className="text-white font-semibold">Unlimited Future Innovations</span>
                    <p className="text-gray-300 text-sm mt-1">All AI features, models, and capabilities included at no extra cost</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 mr-4">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <div>
                    <span className="text-white font-semibold">Lifetime Price Protection</span>
                    <p className="text-gray-300 text-sm mt-1">Lock in today's rates permanently, regardless of market changes</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-5">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 mr-4">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <div>
                    <span className="text-white font-semibold">Replace Multiple Subscriptions</span>
                    <p className="text-gray-300 text-sm mt-1">Cancel 5+ separate AI tools and consolidate into one platform</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 mr-4">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <div>
                    <span className="text-white font-semibold">VIP Support & Priority</span>
                    <p className="text-gray-300 text-sm mt-1">Direct feature requests, priority support, and exclusive access</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 mr-4">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <div>
                    <span className="text-white font-semibold">Beta Access & Early Features</span>
                    <p className="text-gray-300 text-sm mt-1">First access to cutting-edge AI capabilities before public release</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-2xl border border-emerald-500/20 relative z-10">
              <p className="text-emerald-300 font-bold text-lg">
                🎯 Limited Time: Lock in your lifetime rate before our public launch
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="flex items-center justify-center space-x-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="text-white">14-day money-back guarantee</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Clock className="h-5 w-5 text-primary" />
              <span className="text-white">Cancel anytime, keep your data</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-white">Migrate from any accounting tool</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
