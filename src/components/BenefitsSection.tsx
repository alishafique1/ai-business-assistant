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
      title: "Save 10+ Hours Weekly",
      description: "Automate tedious administrative tasks and focus on growing your business",
      stat: "85% reduction in manual work"
    },
    {
      icon: TrendingUp,
      title: "Boost Revenue Growth",
      description: "Data-driven insights and AI-generated strategies to accelerate business growth",
      stat: "Average 23% revenue increase"
    },
    {
      icon: DollarSign,
      title: "Reduce Operating Costs",
      description: "Cut down on administrative costs and subscription fees with our all-in-one platform",
      stat: "Save $500+ monthly"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level security with Google Cloud infrastructure and Firebase authentication",
      stat: "99.9% uptime guarantee"
    },
    {
      icon: Zap,
      title: "Instant AI Insights",
      description: "Get immediate answers and actionable insights from your business data",
      stat: "Real-time processing"
    },
    {
      icon: Users,
      title: "Scale Your Team",
      description: "AI agents that work 24/7 to support your growing business needs",
      stat: "Unlimited AI assistance"
    }
  ];

  return (
    <section id="benefits" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Transform Your Business with
            <span className="bg-gradient-primary bg-clip-text text-transparent"> Measurable Results</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Join thousands of small businesses already using our AI platform to streamline operations, 
            increase efficiency, and drive sustainable growth.
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
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      {benefit.description}
                    </p>
                    <div className="inline-block bg-gradient-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                      {benefit.stat}
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
            "This AI platform has completely transformed how we manage our business. 
            The automated expense tracking alone saves us hours every week."
          </blockquote>
          <cite className="text-muted-foreground">— Sarah Chen, Founder at TechStart Solutions</cite>
        </div>
      </div>
    </section>
  );
};