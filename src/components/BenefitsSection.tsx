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
    <section id="benefits" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Why Pay Multiple AI Companies When
            <span className="bg-gradient-primary bg-clip-text text-transparent"> One Platform Does It All?</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Early access users are already saving hundreds monthly while keeping their data private and secure.
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