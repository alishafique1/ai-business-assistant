import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, DollarSign, Clock, TrendingUp } from "lucide-react";

export default function PricingSection() {
  const plans = [
    {
      name: "Starter",
      price: "$29",
      period: "/month",
      description: "Perfect for small businesses just getting started",
      features: [
        "50 receipts per month",
        "Basic expense categorization",
        "Simple analytics dashboard",
        "Email support",
        "1 user account"
      ],
      popular: false
    },
    {
      name: "Professional",
      price: "$79",
      period: "/month",
      description: "Everything you need to scale your business",
      features: [
        "Unlimited receipt processing",
        "AI content generation",
        "Voice assistant access",
        "Advanced analytics",
        "Priority support",
        "Up to 5 user accounts",
        "Custom integrations"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "Advanced features for larger organizations",
      features: [
        "Everything in Professional",
        "Custom AI model training",
        "Dedicated account manager",
        "24/7 phone support",
        "Unlimited user accounts",
        "Advanced security features",
        "API access"
      ],
      popular: false
    }
  ];

  return (
    <section id="pricing" className="py-24 bg-gradient-subtle">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Simple, Transparent
            <span className="bg-gradient-primary bg-clip-text text-transparent"> Pricing</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose the perfect plan for your business. All plans include a 14-day free trial with no credit card required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative border-border/50 hover:border-primary/50 transition-all duration-300 ${
                plan.popular ? 'ring-2 ring-primary shadow-hero scale-105' : 'hover:shadow-feature'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-primary text-white px-4 py-2 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <CardDescription className="mt-2">
                  {plan.description}
                </CardDescription>
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
                
                <Button 
                  variant={plan.popular ? "hero" : "outline"} 
                  className="w-full"
                  size="lg"
                >
                  {plan.price === "Custom" ? "Contact Sales" : "Start Free Trial"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="flex items-center justify-center space-x-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="text-foreground">No setup fees</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Clock className="h-5 w-5 text-primary" />
              <span className="text-foreground">Cancel anytime</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-foreground">Scale as you grow</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}