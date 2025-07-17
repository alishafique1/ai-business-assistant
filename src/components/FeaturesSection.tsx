
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Receipt, 
  BarChart3, 
  Sparkles, 
  MessageSquare, 
  Mic, 
  Brain,
  ArrowRight,
  CheckCircle,
  Cloud,
  Database,
  Cpu,
  Zap
} from "lucide-react";
import expenseTrackingImg from "@/assets/expense-tracking.jpg";
import aiContentImg from "@/assets/ai-content.jpg";
import voiceModelImg from "@/assets/voice-model.jpg";

export const FeaturesSection = () => {
  const features = [
    {
      icon: Receipt,
      title: "Automated Expense Tracking",
      description: "Upload receipts and let AI handle the rest",
      details: [
        "OCR data extraction with Google Cloud Vision AI",
        "AI-powered categorization and verification",
        "Visual analytics dashboard with export options",
        "Real-time financial insights"
      ],
      gradient: "from-blue-500 to-cyan-500",
      image: expenseTrackingImg
    },
    {
      icon: Sparkles,
      title: "AI Content & Strategy Assistant",
      description: "Custom-trained models for unique marketing ideas",
      details: [
        "Secure business knowledge base integration",
        "Interactive AI chat interface",
        "Contextual content generation",
        "Social media, blogs, email, and ad copy"
      ],
      gradient: "from-purple-500 to-pink-500",
      image: aiContentImg
    },
    {
      icon: Mic,
      title: "Voice AI Assistant",
      description: "Record, transcribe, and get intelligent insights",
      details: [
        "Voice recording and transcription",
        "RAG-powered knowledge storage",
        "Intelligent idea generation",
        "Interactive voice conversations"
      ],
      gradient: "from-emerald-500 to-teal-500",
      image: voiceModelImg
    }
  ];

  const technologies = [
    {
      name: "Google Cloud AI",
      icon: Cloud,
      description: "Advanced AI and ML services"
    },
    {
      name: "Firebase",
      icon: Database,
      description: "Real-time database and hosting"
    },
    {
      name: "Vertex AI",
      icon: Cpu,
      description: "Unified ML platform"
    },
    {
      name: "Custom Models",
      icon: Brain,
      description: "Tailored AI solutions"
    }
  ];

  return (
    <section id="features" className="py-24 bg-gradient-feature">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Three Powerful AI Agents,
            <span className="bg-gradient-primary bg-clip-text text-transparent"> One Platform</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our comprehensive suite of AI agents work together to transform how you manage your business, 
            from financial tracking to content creation and strategic planning.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="relative overflow-hidden bg-card/90 backdrop-blur-sm border-0 shadow-feature hover:shadow-hero transition-all duration-300 group">
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src={feature.image} 
                  alt={feature.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              
              <CardHeader className="relative z-10">
                <CardTitle className="text-xl font-bold text-foreground">
                  {feature.title}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="relative z-10">
                <ul className="space-y-3 mb-6">
                  {feature.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">{detail}</span>
                    </li>
                  ))}
                </ul>
                
                <Button variant="feature" className="w-full">
                  Learn More
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Technology Stack */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-foreground mb-8">
            Powered by Enterprise-Grade Technology
          </h3>
          <div className="flex flex-wrap justify-center items-center gap-8">
            {technologies.map((tech, index) => (
              <div key={index} className="flex items-center gap-3 bg-card/60 backdrop-blur-sm rounded-lg px-4 py-3 shadow-soft hover:shadow-feature transition-all duration-300">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <tech.icon className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <span className="text-foreground font-medium block">{tech.name}</span>
                  <span className="text-muted-foreground text-sm">{tech.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
