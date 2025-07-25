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

type DashboardView = "overview" | "expenses" | "knowledge" | "assistant" | "integrations" | "settings";

const Dashboard = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<DashboardView>("overview");

  const renderContent = () => {
    switch (activeView) {
      case "overview":
        return <Overview />;
      case "expenses":
        return <ExpenseTracker />;
      case "knowledge":
        return <KnowledgeBase />;
      case "assistant":
        return <AIAssistant />;
      case "integrations":
        return <Integrations />;
      case "settings":
        return <Settings />;
      default:
        return <Overview />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar activeView={activeView} onViewChange={setActiveView} />
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          <main className="flex-1 p-6">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;