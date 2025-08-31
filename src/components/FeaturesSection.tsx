
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
import { useScrollAnimation, useStaggeredAnimation } from "@/hooks/useScrollAnimation";
import expenseTrackingImg from "@/assets/expense-tracking.jpg";
import aiContentImg from "@/assets/ai-content.jpg";
import voiceModelImg from "@/assets/voice-model.jpg";

export const FeaturesSection = () => {
  const { elementRef: titleRef, isVisible: titleVisible } = useScrollAnimation({ threshold: 0.2 });
  const { containerRef: featuresRef, visibleItems: visibleFeatures } = useStaggeredAnimation(3, 200);
  const { containerRef: techRef, visibleItems: visibleTech } = useStaggeredAnimation(4, 150);

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
      logo: "https://i.pinimg.com/736x/82/3b/bd/823bbda0a0841434cc20752804e34127.jpg",
      description: "Advanced AI and ML services"
    },
    {
      name: "Firebase",
      icon: Database,
      logo: "https://firebase.google.com/static/images/brand-guidelines/logo-logomark.png",
      description: "Real-time database and hosting"
    },
    {
      name: "Vertex AI",
      icon: Cpu,
      logo: "https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/vertexai.png",
      description: "Unified ML platform"
    },
    {
      name: "Custom Models",
      icon: Brain,
      description: "Tailored AI solutions"
    }
  ];

  return (
    <section id="features" className="py-24 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">

      {/* Elegant geometric background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}></div>
        
        {/* Floating geometric shapes */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-500/8 to-purple-500/6 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-gradient-to-l from-emerald-500/6 to-blue-500/6 rounded-full blur-3xl animate-pulse-very-slow"></div>
        <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-gradient-to-r from-purple-500/4 to-pink-500/4 rounded-full blur-2xl animate-gentle-breathe"></div>
        
        {/* Subtle line patterns */}
        <div className="absolute top-1/4 left-1/3 w-px h-32 bg-gradient-to-b from-transparent via-slate-600/30 to-transparent rotate-12"></div>
        <div className="absolute bottom-1/4 right-1/3 w-px h-40 bg-gradient-to-b from-transparent via-slate-600/20 to-transparent -rotate-12"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div 
          ref={titleRef as React.RefObject<HTMLDivElement>}
          className={`text-center mb-16 transition-all duration-1000 ${titleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 animate-text-reveal leading-tight">
            <span className="text-slate-100">Three </span>
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent font-semibold">Powerful</span>
            <span className="text-slate-100"> AI Agents,</span>
            <span className="bg-gradient-to-r from-slate-300 to-slate-200 bg-clip-text text-transparent"> One Platform</span>
          </h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Our comprehensive suite of AI agents work together to transform how you manage your business, 
            from financial tracking to content creation and strategic planning.
          </p>
        </div>

        <div 
          ref={featuresRef as React.RefObject<HTMLDivElement>}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16"
        >
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className={`relative overflow-hidden bg-slate-800/60 backdrop-blur-sm border border-slate-700/40 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 group transform-gpu ${
                visibleFeatures.has(index) 
                  ? 'opacity-100 translate-y-0 rotate-0' 
                  : 'opacity-0 translate-y-12 rotate-1'
              } hover:scale-[1.02] hover:-translate-y-1`}
            >
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src={feature.image} 
                  alt={feature.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 filter group-hover:brightness-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-4 left-4">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center group-hover:scale-110 transition-all duration-300`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              
              <CardHeader className="relative z-10">
                <CardTitle className="text-xl font-bold text-slate-100 group-hover:text-blue-100 transition-colors">
                  {feature.title}
                </CardTitle>
                <CardDescription className="text-slate-300">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="relative z-10">
                <ul className="space-y-3 mb-6">
                  {feature.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300">{detail}</span>
                    </li>
                  ))}
                </ul>
                
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <span>Learn More</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Technology Stack */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-slate-100 mb-8 animate-text-reveal">
            Powered by Enterprise-Grade Technology
          </h3>
          <div 
            ref={techRef as React.RefObject<HTMLDivElement>}
            className="flex flex-wrap justify-center items-center gap-8"
          >
            {technologies.map((tech, index) => (
              <div 
                key={index} 
                className={`flex items-center gap-3 bg-slate-800/70 border border-slate-700/50 rounded-lg px-4 py-3 shadow-lg hover:shadow-xl hover:bg-slate-700/70 transition-all duration-500 transform-gpu hover:scale-105 group ${
                  visibleTech.has(index) 
                    ? 'opacity-100 translate-y-0 rotate-0' 
                    : 'opacity-0 translate-y-8 rotate-1'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                  tech.logo 
                    ? tech.name === "Vertex AI" 
                      ? 'bg-slate-900' 
                      : 'bg-slate-100'
                    : 'bg-gradient-to-br from-blue-500 to-purple-600'
                }`}>
                  {tech.logo ? (
                    <img 
                      src={tech.logo} 
                      alt={tech.name} 
                      className={`object-contain rounded ${
                        tech.name === "Firebase" ? "w-4.5 h-4.5" : tech.name === "Google Cloud AI" ? "w-8 h-8" : tech.name === "Vertex AI" ? "w-6 h-6" : "w-6.5 h-6.5"
                      }`}
                    />
                  ) : (
                    <tech.icon className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="text-left">
                  <span className="text-slate-200 font-medium block">{tech.name}</span>
                  <span className="text-slate-400 text-sm">{tech.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
