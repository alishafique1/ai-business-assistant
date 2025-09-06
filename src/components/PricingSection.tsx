import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Check, DollarSign, Clock, TrendingUp, ChevronDown, Mail, Phone, PhoneOff } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useRetellCall } from "@/hooks/useRetellCall";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { STRIPE_PRICE_IDS } from "@/lib/stripe";

export default function PricingSection() {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { state: callState, initiateCall, endCall } = useRetellCall();
  const { state: checkoutState, createCheckoutSession } = useStripeCheckout();
  

  // Retell AI Agent ID from environment variables
  const RETELL_AGENT_ID = import.meta.env.VITE_RETELL_AGENT_ID;

  const handleContactSales = async () => {
    if (!RETELL_AGENT_ID) {
      toast({
        title: "Configuration Error",
        description: "Voice calling is not configured. Please email us directly at hr@socialdots.com",
        variant: "destructive",
        duration: 7000,
      });
      return;
    }

    try {
      await initiateCall({
        agentId: RETELL_AGENT_ID,
        customerName: user?.user_metadata?.full_name || 'Enterprise Prospect',
        customerEmail: user?.email,
        metadata: {
          source: 'pricing_page',
          plan: 'Enterprise',
          user_agent: navigator.userAgent,
          referrer: document.referrer || 'direct'
        }
      });
    } catch (error) {
      console.error('Error initiating voice call:', error);
    }
  };

  const handleEmailContact = () => {
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=hr@socialdots.com&su=Enterprise%20Plan%20Inquiry&body=Hi,%0D%0A%0D%0AI'm%20interested%20in%20learning%20more%20about%20your%20Enterprise%20plan.%0D%0A%0D%0APlease%20contact%20me%20to%20discuss%20further.%0D%0A%0D%0AThank%20you!`;
    window.open(gmailUrl, '_blank');
  };

  const handleFreePlanClick = () => {
    if (user) {
      // User is already signed in, navigate to dashboard
      navigate("/dashboard");
    } else {
      // User is not signed in, redirect to signup page
      navigate("/auth?tab=signup");
    }
  };

  const handleBusinessProClick = async () => {
    if (!user) {
      // Redirect to signup first
      navigate("/auth?tab=signup");
      return;
    }

    if (!STRIPE_PRICE_IDS.BUSINESS_PRO) {
      toast({
        title: "Configuration Error",
        description: "Payment system is not configured. Please contact support.",
        variant: "destructive",
        duration: 7000,
      });
      return;
    }

    await createCheckoutSession({
      priceId: STRIPE_PRICE_IDS.BUSINESS_PRO,
      planName: "Business Pro",
      metadata: {
        plan_type: "business_pro",
        source: "pricing_page",
      },
    });
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
      cta: user ? "Current Plan" : "Start Free Today",
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
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-gradient-to-r from-emerald-500/6 to-blue-500/6 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-gradient-to-l from-blue-500/4 to-purple-500/4 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-purple-500/3 to-pink-500/3 rounded-full blur-2xl"></div>
        <div className="absolute bottom-1/3 left-1/6 w-48 h-48 bg-gradient-to-r from-cyan-500/4 to-blue-500/4 rounded-full blur-xl"></div>
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
              className={`relative overflow-visible group ${
                plan.popular 
                  ? 'bg-gradient-to-br from-white via-blue-200 to-indigo-100 border-2 border-blue-500 shadow-xl shadow-blue-500/30 scale-105' 
                  : index === 0 
                    ? 'bg-slate-800/60 border-emerald-500/20' 
                    : 'bg-slate-800/40 border-slate-700/30'
              } backdrop-blur-sm`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}
              
              {index === 0 && (
                <div className="absolute -top-4 right-4 z-10">
                  <span className="bg-emerald-500 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg">
                    No Credit Card
                  </span>
                </div>
              )}
              
              
              
              <CardHeader className="text-center pb-8 relative z-10">
                <CardTitle className={`text-2xl font-bold ${
                  plan.popular ? 'text-black' : 'text-white'
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
                
{plan.name === "Enterprise" ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline"
                        className="w-full"
                        size="lg"
                        disabled={callState.isInitiating || callState.isCallActive}
                      >
                        {callState.isInitiating ? "Connecting..." : 
                         callState.isCallActive ? "Call Active" : 
                         plan.cta}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="center">
                      <DropdownMenuItem onClick={handleEmailContact} className="cursor-pointer">
                        <Mail className="mr-2 h-4 w-4" />
                        Email hr@socialdots.com
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={handleContactSales} 
                        className="cursor-pointer"
                        disabled={callState.isInitiating || callState.isCallActive}
                      >
                        <Phone className="mr-2 h-4 w-4" />
                        Have a live call
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button 
                    variant={plan.popular ? "hero" : index === 0 ? "secondary" : "outline"} 
                    className={`w-full ${
                      index === 0 
                        ? user 
                          ? 'bg-gray-500 hover:bg-gray-600 text-white cursor-default' 
                          : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        : ''
                    }`}
                    size="lg"
                    onClick={
                      plan.name === "Business Pro"
                        ? handleBusinessProClick
                        : index === 0 
                          ? handleFreePlanClick 
                          : undefined
                    }
                    disabled={
                      (plan.name === "Business Pro" && checkoutState.isLoading) ||
                      (index === 0 && user)
                    }
                  >
                    {plan.name === "Business Pro" && checkoutState.isLoading ? "Processing..." : plan.cta}
                  </Button>
                )}

                {plan.name === "Enterprise" && callState.isCallActive && (
                  <Button 
                    variant="destructive"
                    className="w-full mt-3"
                    size="lg"
                    onClick={endCall}
                  >
                    <PhoneOff className="mr-2 h-4 w-4" />
                    End Call
                  </Button>
                )}

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
          
        </div>
      </div>
    </section>
  );
}
