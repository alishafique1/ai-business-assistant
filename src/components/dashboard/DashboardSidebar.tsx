import { BarChart3, Bot, Home, Settings, Smartphone, Wallet, BookOpen, Sparkles, Brain, Zap } from "lucide-react";
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

type DashboardView = "overview" | "expenses" | "knowledge" | "assistant" | "integrations" | "settings";

interface DashboardSidebarProps {
  activeView: DashboardView;
  onViewChange: (view: DashboardView) => void;
}

const menuItems = [
  { id: "overview", title: "Overview", icon: Home, color: "from-blue-500 to-indigo-600", bgGlow: "bg-blue-500/20" },
  { id: "expenses", title: "Expense Tracker", icon: Wallet, color: "from-green-500 to-emerald-600", bgGlow: "bg-green-500/20" },
  { id: "knowledge", title: "Knowledge Base", icon: BookOpen, color: "from-purple-500 to-violet-600", bgGlow: "bg-purple-500/20" },
  { id: "assistant", title: "AI Assistant", icon: Brain, color: "from-pink-500 to-rose-600", bgGlow: "bg-pink-500/20" },
  { id: "integrations", title: "Integrations", icon: Zap, color: "from-orange-500 to-amber-600", bgGlow: "bg-orange-500/20" },
  { id: "settings", title: "Settings", icon: Settings, color: "from-gray-500 to-slate-600", bgGlow: "bg-gray-500/20" },
];

export function DashboardSidebar({ activeView, onViewChange }: DashboardSidebarProps) {
  const { state } = useSidebar();

  return (
    <Sidebar 
      className={`${state === "collapsed" ? "w-16" : "w-64"} bg-gradient-to-b from-sidebar-background via-sidebar-background/95 to-sidebar-background/90 backdrop-blur-xl border-r border-sidebar-border/50`} 
      collapsible="icon"
    >
      {/* Decorative header */}
      <div className="relative p-4 border-b border-sidebar-border/30">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg"></div>
        <div className="relative flex items-center gap-2">
          {state !== "collapsed" && (
            <>
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-lg">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-sm font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  AI Hub
                </h2>
                <p className="text-xs text-muted-foreground">Business Assistant</p>
              </div>
            </>
          )}
        </div>
        <SidebarTrigger className="absolute top-2 right-2 h-6 w-6" />
      </div>
      
      <SidebarContent className="px-2 pt-6">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-3">
              {menuItems.map((item, index) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onViewChange(item.id as DashboardView)}
                    className={`group relative overflow-hidden transition-all duration-500 rounded-2xl border border-transparent hover:border-white/10 ${
                      activeView === item.id 
                        ? `bg-gradient-to-r ${item.color} text-white shadow-xl shadow-current/30 scale-105 transform` 
                        : "hover:bg-sidebar-accent/50 hover:scale-[1.03] hover:shadow-lg"
                    } ${state === "collapsed" ? "justify-center" : "justify-start"} flex items-center gap-3 p-3`}
                    style={{
                      animationDelay: `${index * 100}ms`
                    }}
                  >
                    {/* Background glow effect for active item */}
                    {activeView === item.id && (
                      <div className={`absolute inset-0 ${item.bgGlow} blur-xl opacity-40 group-hover:opacity-60 transition-opacity`}></div>
                    )}
                    
                    {/* Enhanced geometric background pattern */}
                    <div className="absolute inset-0 opacity-5">
                      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_2px_2px,_currentColor_1px,_transparent_0)] bg-[length:16px_16px]"></div>
                    </div>
                    
                    {/* Icon with enhanced creative styling */}
                    <div className={`relative flex items-center justify-center transition-all duration-300 ${
                      state === "collapsed" ? "w-8 h-8" : "w-10 h-10"
                    } rounded-xl ${
                      activeView === item.id 
                        ? "bg-white/25 backdrop-blur-sm shadow-lg transform rotate-6 group-hover:rotate-12" 
                        : "group-hover:bg-white/10 group-hover:rotate-3"
                    }`}>
                      <item.icon className={`${state === "collapsed" ? "h-4 w-4" : "h-5 w-5"} transition-transform group-hover:scale-110`} />
                      
                      {/* Decorative corner dots */}
                      {activeView === item.id && (
                        <>
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-white/40 rounded-full animate-pulse-slow"></div>
                          <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-white/30 rounded-full animate-pulse-slow" style={{animationDelay: '1s'}}></div>
                        </>
                      )}
                    </div>
                    
                    {/* Text with enhanced creative styling */}
                    {state !== "collapsed" && (
                      <div className="relative flex-1 flex flex-col">
                        <span className={`font-semibold transition-all duration-300 ${
                          activeView === item.id 
                            ? "text-white drop-shadow-sm" 
                            : "group-hover:translate-x-1"
                        }`}>
                          {item.title}
                        </span>
                        {activeView === item.id && (
                          <span className="text-xs text-white/70 font-medium animate-fade-in">
                            Active
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Active indicator line */}
                    {activeView === item.id && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/50 rounded-r-full animate-pulse-slow"></div>
                    )}
                    
                    {/* Enhanced hover shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent -skew-x-12 group-hover:animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Decorative bottom element */}
        {state !== "collapsed" && (
          <div className="mt-auto p-4">
            <div className="relative p-3 rounded-xl bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 border border-primary/20">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl blur-sm"></div>
              <div className="relative text-center">
                <Bot className="h-6 w-6 mx-auto mb-2 text-primary animate-pulse" />
                <p className="text-xs font-medium text-primary">AI Powered</p>
                <p className="text-xs text-muted-foreground">Always Learning</p>
              </div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}