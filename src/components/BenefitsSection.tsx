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
      title: "Comprehensive Cost Optimization",
      description: "Eliminate multiple AI subscriptions and consolidate your business intelligence tools into one powerful platform. Achieve significant operational savings while enhancing capabilities.",
      stat: "Up to 85% cost reduction",
      realExample: "Replace $1,200+/year in separate tools with one unified solution"
    },
    {
      icon: Shield,
      title: "Enterprise-Grade Data Security",
      description: "Your sensitive business data remains completely secure with zero third-party AI sharing. Industry-leading encryption ensures complete confidentiality and compliance.",
      stat: "100% data sovereignty",
      realExample: "Bank-level security with full audit trails and compliance reporting"
    },
    {
      icon: Clock,
      title: "Operational Efficiency Revolution",
      description: "Automate time-consuming business processes with intelligent workflows. Transform manual tasks into instant, accurate operations that scale with your growth.",
      stat: "90% time savings on routine tasks",
      realExample: "Transform 15-hour weekly processes into 30-minute automated workflows"
    },
    {
      icon: TrendingUp,
      title: "Continuous Innovation Pipeline",
      description: "Access cutting-edge AI capabilities as they're released. Our rapid development cycle ensures you're always leveraging the latest business intelligence technologies.",
      stat: "Weekly feature releases",
      realExample: "Priority access to advanced AI models and business tools"
    },
    {
      icon: Zap,
      title: "Intelligent Content Generation",
      description: "Deploy AI that understands your brand voice, industry nuances, and business objectives. Generate high-converting content that resonates with your target audience.",
      stat: "300% engagement improvement",
      realExample: "Custom-trained models deliver personalized, on-brand content at scale"
    },
    {
      icon: Users,
      title: "Strategic Decision Intelligence",
      description: "Transform insights, meetings, and strategic thoughts into actionable business intelligence. Never lose valuable ideas or strategic opportunities again.",
      stat: "Comprehensive idea capture",
      realExample: "AI-powered strategic analysis from voice recordings and documents"
    }
  ];

  return (
    <section id="benefits" className="py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">

      {/* Premium floating elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-l from-emerald-500/8 to-blue-500/8 rounded-full blur-3xl animate-pulse-very-slow"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-gradient-to-r from-purple-500/6 to-pink-500/6 rounded-full blur-2xl animate-gentle-breathe"></div>
        <div className="absolute bottom-1/3 left-1/4 w-48 h-48 bg-gradient-to-r from-cyan-500/8 to-blue-500/8 rounded-full blur-xl animate-pulse-slow"></div>
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
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 animate-text-reveal leading-tight">
            <span className="text-white">Transform Your Business with </span>
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-emerald-400 bg-clip-text text-transparent">Intelligent Automation</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Join forward-thinking businesses that have already eliminated expensive subscriptions, 
            streamlined operations, and secured their competitive advantage with our unified AI platform.
          </p>
        </div>

        <div 
          ref={benefitsRef as React.RefObject<HTMLDivElement>}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {benefits.map((benefit, index) => (
            <Card 
              key={index} 
              className={`relative group hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-500 bg-slate-800/80 backdrop-blur-sm border-slate-700/50 hover:border-blue-500/30 hover:scale-105 hover:-translate-y-2 transform-gpu ${
                visibleBenefits.has(index) 
                  ? 'opacity-100 translate-y-0 rotate-0' 
                  : 'opacity-0 translate-y-8 rotate-1'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative">
                <div className="flex items-start gap-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-lg">
                    <benefit.icon className="w-7 h-7 text-white transition-transform duration-300" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-100 transition-colors duration-300">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-300 mb-4 leading-relaxed text-sm">
                      {benefit.description}
                    </p>
                    <div className="space-y-3">
                      <div className="inline-block bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-200 px-4 py-2 rounded-full text-sm font-semibold border border-blue-500/30">
                        {benefit.stat}
                      </div>
                      <p className="text-xs text-gray-400 italic leading-relaxed bg-slate-900/30 p-3 rounded-lg border-l-2 border-blue-500/50">
                        {benefit.realExample}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Enhanced social proof section */}
        <div className="mt-24 text-center">
          <div className="inline-flex items-center gap-3 bg-slate-800/60 backdrop-blur-sm rounded-full px-8 py-4 mb-12 border border-slate-600/30">
            <div className="flex -space-x-3">
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face&auto=format" 
                alt="Business Owner - John" 
                className="w-10 h-10 rounded-full border-2 border-slate-700 shadow-lg object-cover"
              />
              <img 
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=40&h=40&fit=crop&crop=face&auto=format" 
                alt="CFO - Maria" 
                className="w-10 h-10 rounded-full border-2 border-slate-700 shadow-lg object-cover"
              />
              <img 
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face&auto=format" 
                alt="Founder - Alex" 
                className="w-10 h-10 rounded-full border-2 border-slate-700 shadow-lg object-cover"
              />
              <img 
                src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=40&h=40&fit=crop&crop=face&auto=format" 
                alt="Director - Michael" 
                className="w-10 h-10 rounded-full border-2 border-slate-700 shadow-lg object-cover"
              />
              <img 
                src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=40&h=40&fit=crop&crop=face&auto=format" 
                alt="Manager - Lisa" 
                className="w-10 h-10 rounded-full border-2 border-slate-700 shadow-lg object-cover"
              />
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full border-2 border-slate-700 flex items-center justify-center text-xs text-white font-bold shadow-lg">
                +145
              </div>
            </div>
            <span className="text-white font-semibold text-lg">Enterprise clients optimizing operations</span>
          </div>
          
          <div className="max-w-5xl mx-auto bg-slate-800/40 backdrop-blur-sm rounded-2xl p-8 border border-slate-600/30 shadow-2xl">
            <blockquote className="text-xl md:text-2xl text-white font-medium leading-relaxed mb-6 italic">
              "I was paying $75/month for ChatGPT Plus, Claude, and two other business apps. This platform does everything 
              for $39 and keeps my data private. Plus they keep adding features every week!"
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <img 
                src="https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=48&h=48&fit=crop&crop=face&auto=format" 
                alt="Jennifer Kim" 
                className="w-12 h-12 rounded-full object-cover border-2 border-slate-600"
              />
              <div className="text-left">
                <cite className="text-gray-300 font-semibold block">Jennifer Kim</cite>
                <p className="text-blue-400 text-sm">Marketing Agency Owner • Early Adopter</p>
              </div>
            </div>
          </div>
          
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">85%</div>
              <p className="text-gray-400">Average cost savings</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">150+</div>
              <p className="text-gray-400">Business transformations</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">24/7</div>
              <p className="text-gray-400">AI-powered operations</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};