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
    <section className="py-24 bg-gradient-subtle">
      <div className="container mx-auto px-6">
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
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200">
              Ready to Use
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {currentFeatures.map((feature, index) => (
              <Card key={index} className="border-emerald-200 bg-emerald-50/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <Badge className="bg-emerald-500 text-white">Live</Badge>
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
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
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              In Development
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingFeatures.map((feature, index) => (
              <Card key={index} className="border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-feature">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <Badge variant="outline">{feature.category}</Badge>
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-3">{feature.description}</CardDescription>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-sm text-primary font-medium">{feature.eta}</span>
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