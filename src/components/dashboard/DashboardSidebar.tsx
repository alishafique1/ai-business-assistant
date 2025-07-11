import { BarChart3, Bot, Home, Settings, Smartphone, Wallet } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

type DashboardView = "overview" | "expenses" | "assistant" | "integrations" | "settings";

interface DashboardSidebarProps {
  activeView: DashboardView;
  onViewChange: (view: DashboardView) => void;
}

const menuItems = [
  { id: "overview", title: "Overview", icon: Home },
  { id: "expenses", title: "Expense Tracker", icon: Wallet },
  { id: "assistant", title: "AI Assistant", icon: Bot },
  { id: "integrations", title: "Integrations", icon: Smartphone },
  { id: "settings", title: "Settings", icon: Settings },
];

export function DashboardSidebar({ activeView, onViewChange }: DashboardSidebarProps) {
  const { state } = useSidebar();

  return (
    <Sidebar className={state === "collapsed" ? "w-16" : "w-64"} collapsible="icon">
      <SidebarTrigger className="m-2 self-end" />
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onViewChange(item.id as DashboardView)}
                    className={`${
                      activeView === item.id 
                        ? "bg-primary/10 text-primary font-medium" 
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {state !== "collapsed" && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}