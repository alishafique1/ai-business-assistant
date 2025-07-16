
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

export const CTASection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <section className="py-24 bg-gradient-primary relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/5 rounded-full blur-xl"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Ready to Transform
            <br />
            Your Business?
          </h2>
          
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
            Join the AI revolution and let our intelligent agents handle the heavy lifting 
            while you focus on what matters most - growing your business.
          </p>
          
          {/* Features list */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="flex items-center justify-center gap-3 text-white">
              <CheckCircle className="w-6 h-6 text-white" />
              <span className="font-medium">Free 14-day trial</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-white">
              <CheckCircle className="w-6 h-6 text-white" />
              <span className="font-medium">No credit card required</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-white">
              <CheckCircle className="w-6 h-6 text-white" />
              <span className="font-medium">Cancel anytime</span>
            </div>
          </div>
          
          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-white/95 text-lg px-8 py-4 font-semibold shadow-hero"
              onClick={() => navigate(user ? "/dashboard" : "/auth")}
            >
              {user ? "Go to Dashboard" : "Start Your Free Trial"}
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-white/30 text-white bg-white/10 hover:bg-white/20 text-lg px-8 py-4"
            >
              Schedule a Demo
            </Button>
          </div>
          
          {/* Trust indicators */}
          <div className="mt-12 pt-8 border-t border-white/20">
            <p className="text-white/70 mb-6">Trusted by forward-thinking businesses</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-70">
              <div className="bg-white/20 px-6 py-3 rounded-lg backdrop-blur-sm">
                <span className="text-white font-medium">Enterprise Security</span>
              </div>
              <div className="bg-white/20 px-6 py-3 rounded-lg backdrop-blur-sm">
                <span className="text-white font-medium">GDPR Compliant</span>
              </div>
              <div className="bg-white/20 px-6 py-3 rounded-lg backdrop-blur-sm">
                <span className="text-white font-medium">24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
