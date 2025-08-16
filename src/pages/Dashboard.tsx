import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ExpenseTracker } from "@/components/dashboard/ExpenseTracker";
import { AIAssistant } from "@/components/dashboard/AIAssistant";
import { Integrations } from "@/components/dashboard/Integrations";
import { Settings } from "@/components/dashboard/Settings";
import { Overview } from "@/components/dashboard/Overview";
import { KnowledgeBase } from "@/components/dashboard/KnowledgeBase";
import { SidebarProvider } from "@/components/ui/sidebar";
import SubscriptionGate from "@/components/SubscriptionGate";
import SubscriptionManager from "@/components/SubscriptionManager";

type DashboardView = "overview" | "expenses" | "knowledge" | "assistant" | "integrations" | "settings";

const Dashboard = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<DashboardView>("overview");

  const renderContent = () => {
    switch (activeView) {
      case "overview":
        return <Overview onViewChange={setActiveView} />;
      case "expenses":
        return <ExpenseTracker />;
      case "knowledge":
        return <KnowledgeBase />;
      case "assistant":
        return <AIAssistant />;
      case "integrations":
        return (
          <SubscriptionGate 
            feature="Advanced Integrations" 
            description="Connect with external tools and services with Business Pro subscription."
          >
            <Integrations />
          </SubscriptionGate>
        );
      case "settings":
        return (
          <div className="space-y-6">
            <SubscriptionManager />
            <Settings />
          </div>
        );
      default:
        return <Overview />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background/98 to-background relative overflow-hidden">
        {/* Enhanced animated background with color shifting */}
        <div className="fixed inset-0 animate-color-shift"></div>
        
        {/* Additional floating background elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-slow-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 rounded-full blur-3xl animate-slow-float" style={{animationDelay: '6s'}}></div>
          <div className="absolute top-3/4 left-3/4 w-48 h-48 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-slow-float" style={{animationDelay: '3s'}}></div>
          <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-2xl animate-slow-float" style={{animationDelay: '9s'}}></div>
        </div>
        
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 opacity-[0.015] bg-[radial-gradient(circle_at_1px_1px,_hsl(var(--primary))_1px,_transparent_0)] bg-[length:32px_32px]"></div>
        
        <DashboardSidebar activeView={activeView} onViewChange={setActiveView} />
        <div className="flex-1 flex flex-col relative z-10">
          <DashboardHeader />
          <main className="flex-1 p-6 backdrop-blur-[0.5px]">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;