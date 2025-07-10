import { Card, CardContent } from "@/components/ui/card";
import { 
  Clock, 
  TrendingUp, 
  Shield, 
  Zap,
  DollarSign,
  Users
} from "lucide-react";

export const BenefitsSection = () => {
  const benefits = [
    {
      icon: Clock,
      title: "Reclaim 12+ Hours Each Week",
      description: "Stop spending evenings sorting receipts and categorizing expenses. Our AI handles it in seconds, not hours.",
      stat: "From 3 hours to 15 minutes weekly",
      realExample: "Like having a full-time bookkeeper for $2/day"
    },
    {
      icon: DollarSign,
      title: "Catch Every Tax Deduction",
      description: "Never miss business expenses again. Our AI finds deductions you didn't even know existed.",
      stat: "Average $3,200 more in deductions",
      realExample: "One user recovered $8K in missed deductions"
    },
    {
      icon: TrendingUp,
      title: "Make Decisions with Real Data",
      description: "See exactly where your money goes with visual insights that actually make sense to busy entrepreneurs.",
      stat: "89% better spending awareness",
      realExample: "\"I finally understand my cash flow\" - Maria, Restaurant Owner"
    },
    {
      icon: Zap,
      title: "Content That Converts",
      description: "Stop staring at blank pages. Get marketing ideas trained on your specific business, not generic templates.",
      stat: "3x faster content creation",
      realExample: "Generated 30 social posts in 10 minutes"
    },
    {
      icon: Users,
      title: "Your 24/7 Business Assistant",
      description: "Voice-record ideas, meetings, or random thoughts. Turn them into actionable business strategies instantly.",
      stat: "Capture 100% of your ideas",
      realExample: "Never forget a client conversation again"
    },
    {
      icon: Shield,
      title: "Enterprise-Grade Security",
      description: "Your financial data is protected with bank-level encryption. Focus on growth, not security worries.",
      stat: "SOC 2 compliant infrastructure",
      realExample: "Trusted by 500+ businesses with sensitive data"
    }
  ];

  return (
    <section id="benefits" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Real Results from
            <span className="bg-gradient-primary bg-clip-text text-transparent"> Real Business Owners</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            These aren't hypothetical benefits. These are measurable improvements our users see in their first 30 days.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <Card key={index} className="relative group hover:shadow-feature transition-all duration-300 bg-card border-border/50">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-muted-foreground mb-3 leading-relaxed">
                      {benefit.description}
                    </p>
                    <div className="space-y-2">
                      <div className="inline-block bg-gradient-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                        {benefit.stat}
                      </div>
                      <p className="text-xs text-muted-foreground italic">
                        {benefit.realExample}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Social proof section */}
        <div className="mt-20 text-center">
          <div className="inline-flex items-center gap-2 bg-muted rounded-full px-6 py-3 mb-8">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-full border-2 border-background"></div>
              <div className="w-8 h-8 bg-gradient-primary rounded-full border-2 border-background"></div>
              <div className="w-8 h-8 bg-gradient-primary rounded-full border-2 border-background"></div>
              <div className="w-8 h-8 bg-gradient-primary rounded-full border-2 border-background flex items-center justify-center text-xs text-white font-medium">
                +50
              </div>
            </div>
            <span className="text-foreground font-medium">Early access users already saving time</span>
          </div>
          
          <blockquote className="text-xl md:text-2xl text-foreground font-medium max-w-4xl mx-auto mb-4">
            "I was drowning in receipts and spending entire weekends on bookkeeping. Now I just snap photos 
            and everything is categorized automatically. I got my weekends back and my accountant loves the organization."
          </blockquote>
          <cite className="text-muted-foreground">— Marcus Rodriguez, HVAC Business Owner (Saves 8 hours/week)</cite>
        </div>
      </div>
    </section>
  );
};