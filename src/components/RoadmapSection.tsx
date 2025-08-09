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
    <section className="py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Premium tech background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-gradient-to-r from-emerald-500/8 to-blue-500/8 rounded-full blur-3xl animate-slow-float"></div>
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-gradient-to-l from-blue-500/6 to-purple-500/6 rounded-full blur-3xl animate-pulse-very-slow"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-purple-500/4 to-pink-500/4 rounded-full blur-2xl animate-gentle-breathe"></div>
        <div className="absolute bottom-1/3 left-1/6 w-48 h-48 bg-gradient-to-r from-cyan-500/6 to-blue-500/6 rounded-full blur-xl animate-pulse-slow"></div>
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
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            <span className="text-white">Innovation Pipeline: </span>
            <span className="bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">Continuous AI Evolution</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Experience the future of business automation with our rapidly expanding AI ecosystem. 
            New intelligent capabilities deployed weekly, driven by cutting-edge research and enterprise feedback.
          </p>
        </div>

        {/* Current Features */}
        <div className="mb-16">
          <div className="flex items-center justify-center gap-4 mb-12">
            <h3 className="text-3xl font-bold text-white">Active Intelligence</h3>
            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 animate-pulse px-4 py-2 text-sm font-semibold">
              ✨ Production Ready
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {currentFeatures.map((feature, index) => (
              <Card key={index} className="bg-slate-800/60 backdrop-blur-sm border-emerald-500/20 hover:border-emerald-400/40 transition-all duration-500 relative overflow-hidden group hover:scale-105 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                <CardHeader className="pb-6 relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <Badge className="bg-emerald-500 text-white shadow-lg px-3 py-1 font-semibold">LIVE</Badge>
                  </div>
                  <CardTitle className="text-xl font-bold text-white group-hover:text-emerald-100 transition-colors duration-300">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <CardDescription className="text-gray-300 leading-relaxed">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Separator className="my-16" />

        {/* Upcoming Features */}
        <div>
          <div className="flex items-center justify-center gap-4 mb-12">
            <h3 className="text-3xl font-bold text-white">Future Intelligence</h3>
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30 animate-pulse px-4 py-2 text-sm font-semibold">
              🚀 In Development
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {upcomingFeatures.map((feature, index) => (
              <Card key={index} className="bg-slate-800/40 backdrop-blur-sm border-blue-500/20 hover:border-blue-400/40 transition-all duration-500 relative overflow-hidden group hover:scale-105 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                <CardHeader className="pb-6 relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <Badge variant="outline" className="border-blue-400/30 text-blue-300 bg-blue-500/10 px-3 py-1 font-semibold">{feature.category}</Badge>
                  </div>
                  <CardTitle className="text-xl font-bold text-white group-hover:text-blue-100 transition-colors duration-300 mb-3">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <CardDescription className="text-gray-300 leading-relaxed mb-4">{feature.description}</CardDescription>
                  <div className="flex items-center gap-2 bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                    <Zap className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-blue-300 font-semibold">{feature.eta}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Enhanced Value Proposition */}
        <div className="mt-20 text-center relative">
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-3xl p-12 border border-slate-700/30 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent rounded-3xl"></div>
            
            <h3 className="text-3xl font-bold text-white mb-6 relative z-10">
              <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">Enterprise Evolution</span> Without Enterprise Costs
            </h3>
            <p className="text-xl text-gray-300 mb-10 max-w-4xl mx-auto leading-relaxed relative z-10">
              Access the complete AI automation ecosystem with a single subscription. While competitors charge separately for each capability, 
              you receive unlimited intelligence tools with continuous upgrades.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto relative z-10">
              <div className="bg-slate-900/40 rounded-2xl p-6 border border-red-500/20 backdrop-blur-sm">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <span className="text-red-400 text-xl">❌</span>
                </div>
                <div className="font-bold text-red-400 mb-2 text-lg">Traditional Approach</div>
                <div className="text-gray-400 text-sm leading-relaxed">
                  $30-80/month per AI tool<br/>
                  Limited integrations<br/>
                  Fragmented workflows
                </div>
                <div className="text-red-300 font-semibold mt-3">$500+/month total cost</div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-6 border border-blue-400/30 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl"></div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 mx-auto shadow-lg relative z-10">
                  <span className="text-white text-xl">🚀</span>
                </div>
                <div className="font-bold text-blue-400 mb-2 text-lg relative z-10">Our Unified Platform</div>
                <div className="text-gray-300 text-sm leading-relaxed relative z-10">
                  Complete AI ecosystem<br/>
                  Seamless integration<br/>
                  Continuous updates
                </div>
                <div className="text-blue-300 font-semibold mt-3 relative z-10">One intelligent subscription</div>
              </div>
              
              <div className="bg-slate-900/40 rounded-2xl p-6 border border-emerald-500/20 backdrop-blur-sm">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <span className="text-emerald-400 text-xl">💰</span>
                </div>
                <div className="font-bold text-emerald-400 mb-2 text-lg">Your Strategic Advantage</div>
                <div className="text-gray-400 text-sm leading-relaxed">
                  85% cost optimization<br/>
                  Unified intelligence<br/>
                  Future-proof scaling
                </div>
                <div className="text-emerald-300 font-semibold mt-3">$400+ monthly savings</div>
              </div>
            </div>
            
            <div className="mt-10 relative z-10">
              <p className="text-blue-300 font-semibold text-lg">
                🎯 Early adopters lock in lifetime pricing with access to all future innovations
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}