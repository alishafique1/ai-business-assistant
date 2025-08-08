import { Card, CardContent } from "@/components/ui/card";
import { 
  Clock, 
  TrendingUp, 
  Shield, 
  Zap,
  DollarSign,
  Users
} from "lucide-react";
import { useScrollAnimation, useStaggeredAnimation } from "@/hooks/useScrollAnimation";

export const BenefitsSection = () => {
  const { elementRef: titleRef, isVisible: titleVisible } = useScrollAnimation({ threshold: 0.2 });
  const { containerRef: benefitsRef, visibleItems: visibleBenefits } = useStaggeredAnimation(6, 150);

  const benefits = [
    {
      icon: DollarSign,
      title: "Replace 5+ Expensive AI Subscriptions",
      description: "Stop paying $20/month for ChatGPT, $20 for Claude, $30 for expense apps, $25 for content tools. Get everything for less.",
      stat: "Save $95+ monthly on AI tools",
      realExample: "One platform vs $1,140/year in separate subscriptions"
    },
    {
      icon: Shield,
      title: "Your Data Stays Yours, Always",
      description: "We don't store your business data with OpenAI, Google, or any third-party AI company. Full privacy guaranteed.",
      stat: "100% data ownership",
      realExample: "Bank-level encryption, zero AI company data sharing"
    },
    {
      icon: Clock,
      title: "Reclaim 12+ Hours Each Week",
      description: "Stop spending evenings sorting receipts and creating content. Our AI handles it in seconds, not hours.",
      stat: "From 3 hours to 15 minutes weekly",
      realExample: "Like having a full-time assistant for $1.30/day"
    },
    {
      icon: TrendingUp,
      title: "New AI Features Added Weekly",
      description: "This is just the beginning. We're constantly adding new AI capabilities based on user feedback and needs.",
      stat: "Pre-launch: Lock in lifetime pricing",
      realExample: "Early adopters get all future features included"
    },
    {
      icon: Zap,
      title: "Content That Actually Converts",
      description: "No generic ChatGPT responses. Our AI learns your business voice and creates content that sounds like you.",
      stat: "3x better than generic AI tools",
      realExample: "Trained on YOUR business, not random internet data"
    },
    {
      icon: Users,
      title: "Your 24/7 Business Brain",
      description: "Voice-record ideas, meetings, or thoughts. Turn them into actionable strategies without losing context.",
      stat: "Never lose another great idea",
      realExample: "Like having a business partner who never forgets"
    }
  ];

  return (
    <section id="benefits" className="py-24 bg-gradient-to-br from-background via-primary/5 to-accent/10 relative overflow-hidden">

      {/* Elegant floating elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-l from-accent/8 to-primary/8 rounded-full blur-3xl animate-pulse-very-slow"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-radial from-primary/5 to-transparent rounded-full animate-gentle-breathe"></div>
      </div>
      
      {/* Subtle dot pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--primary)) 1px, transparent 0)',
        backgroundSize: '40px 40px'
      }}></div>

      <div className="container mx-auto px-6 relative z-10">
        <div 
          ref={titleRef as React.RefObject<HTMLDivElement>}
          className={`text-center mb-16 transition-all duration-1000 ${titleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 animate-text-reveal">
            Why Pay Multiple AI Companies When
            <span className="bg-gradient-primary bg-clip-text text-transparent"> One Platform Does It All?</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Early access users are already saving hundreds monthly while keeping their data private and secure.
          </p>
        </div>

        <div 
          ref={benefitsRef as React.RefObject<HTMLDivElement>}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {benefits.map((benefit, index) => (
            <Card 
              key={index} 
              className={`relative group hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 bg-card border-border/50 hover:scale-102 hover:-translate-y-1 transform-gpu ${
                visibleBenefits.has(index) 
                  ? 'opacity-100 translate-y-0 rotate-0' 
                  : 'opacity-0 translate-y-8 rotate-1'
              }`}
            >
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:brightness-110 group-hover:scale-110">
                    <benefit.icon className="w-6 h-6 text-white transition-transform duration-300" />
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
            <span className="text-foreground font-medium">Early access users already saving money & time</span>
          </div>
          
          <blockquote className="text-xl md:text-2xl text-foreground font-medium max-w-4xl mx-auto mb-4">
            "I was paying $75/month for ChatGPT Plus, Claude, and two other business apps. This platform does everything 
            for $39 and keeps my data private. Plus they keep adding features every week!"
          </blockquote>
          <cite className="text-muted-foreground">— Jennifer Kim, Marketing Agency Owner (Early Access User)</cite>
        </div>
      </div>
    </section>
  );
};