import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Zap, 
  Brain, 
  MessageSquare, 
  BarChart3,
  Calendar,
  Mic2,
  FileText,
  TrendingUp,
  Shield,
  Sparkles
} from "lucide-react";

export default function RoadmapSection() {
  const currentFeatures = [
    {
      icon: FileText,
      title: "AI Expense Tracking",
      description: "OCR receipt scanning with smart categorization",
      status: "Live"
    },
    {
      icon: Brain,
      title: "Content Generation",
      description: "Business-specific content creation and strategy",
      status: "Live"
    },
    {
      icon: Mic2,
      title: "Voice Assistant",
      description: "Record, transcribe, and generate insights",
      status: "Live"
    }
  ];

  const upcomingFeatures = [
    {
      icon: BarChart3,
      title: "Advanced Analytics Dashboard",
      description: "Predictive spending insights and cash flow forecasting",
      eta: "Next 2 weeks",
      category: "Analytics"
    },
    {
      icon: MessageSquare,
      title: "AI Email Assistant",
      description: "Draft professional emails and responses automatically",
      eta: "Next 3 weeks",
      category: "Communication"
    },
    {
      icon: Calendar,
      title: "Smart Scheduling AI",
      description: "Optimize your calendar and suggest meeting times",
      eta: "Next 4 weeks",
      category: "Productivity"
    },
    {
      icon: TrendingUp,
      title: "Revenue Optimization AI",
      description: "Identify growth opportunities and pricing strategies",
      eta: "Next 6 weeks",
      category: "Growth"
    },
    {
      icon: Shield,
      title: "Advanced Security Suite",
      description: "Enhanced data protection and compliance tools",
      eta: "Next 8 weeks",
      category: "Security"
    },
    {
      icon: Sparkles,
      title: "Custom AI Model Training",
      description: "Train AI specifically on your business data and processes",
      eta: "Next 10 weeks",
      category: "AI/ML"
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-muted/30 via-background to-accent/8 relative overflow-hidden">
      {/* Tech-inspired background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-1/4 w-64 h-64 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-full blur-3xl animate-slow-float"></div>
        <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-gradient-to-l from-blue-500/8 to-emerald-500/8 rounded-full blur-3xl animate-pulse-very-slow"></div>
        <div className="absolute top-1/3 right-10 w-48 h-48 bg-gradient-to-br from-accent/12 to-primary/8 rounded-full blur-2xl animate-gentle-breathe"></div>
      </div>
      
      {/* Subtle circuit pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `
          radial-gradient(circle at 25% 25%, hsl(var(--emerald-500) / 0.3) 2px, transparent 3px),
          linear-gradient(90deg, hsl(var(--primary) / 0.2) 1px, transparent 1px),
          linear-gradient(hsl(var(--accent) / 0.2) 1px, transparent 1px)
        `,
        backgroundSize: '80px 80px, 40px 40px, 40px 40px'
      }}></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            What's Coming Next:
            <span className="bg-gradient-primary bg-clip-text text-transparent"> Your AI Keeps Getting Smarter</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            This is just the beginning. We're shipping new AI capabilities every week based on user feedback and business needs.
          </p>
        </div>

        {/* Current Features */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <h3 className="text-2xl font-bold text-foreground">Live Right Now</h3>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200 animate-pulse">
              Ready to Use
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {currentFeatures.map((feature, index) => (
              <Card key={index} className="border-emerald-200 bg-emerald-50/50 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-emerald-500/5 animate-pulse"></div>
                <CardHeader className="pb-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <Badge className="bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)] animate-pulse">Live</Badge>
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Separator className="my-16" />

        {/* Upcoming Features */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <h3 className="text-2xl font-bold text-foreground">Coming Soon</h3>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 animate-pulse">
              In Development
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingFeatures.map((feature, index) => (
              <Card key={index} className="border-blue-200 bg-blue-50/30 shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-blue-500/5 animate-pulse"></div>
                <CardHeader className="pb-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.4)]">
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <Badge variant="outline" className="border-blue-300 text-blue-700">{feature.category}</Badge>
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <CardDescription className="mb-3">{feature.description}</CardDescription>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-600 font-medium">{feature.eta}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Value Proposition */}
        <div className="mt-16 text-center bg-muted/30 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-foreground mb-4">
            Early Adopters Get Everything Free
          </h3>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
            Every feature on this roadmap is included in your subscription at no extra cost. 
            While others charge separately for each AI tool, you get the complete suite.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto text-sm">
            <div className="bg-background rounded-lg p-4">
              <div className="font-semibold text-foreground mb-1">Traditional Approach</div>
              <div className="text-muted-foreground">Pay $20-50/month for each AI tool</div>
            </div>
            <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
              <div className="font-semibold text-primary mb-1">Our Platform</div>
              <div className="text-foreground">One price, unlimited AI capabilities</div>
            </div>
            <div className="bg-background rounded-lg p-4">
              <div className="font-semibold text-foreground mb-1">Your Savings</div>
              <div className="text-muted-foreground">$200+ monthly vs separate tools</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}