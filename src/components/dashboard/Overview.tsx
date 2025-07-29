import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, Bot, DollarSign, MessageSquare, Smartphone, TrendingUp, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface OverviewProps {
  onViewChange: (view: "overview" | "expenses" | "knowledge" | "assistant" | "integrations" | "settings") => void;
}

export function Overview({ onViewChange }: OverviewProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    monthlyExpenses: 0,
    totalExpenses: 0,
    knowledgeEntries: 0,
    aiInteractions: 0
  });
  const [integrationCount, setIntegrationCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
    
    // Check integration status
    const checkIntegrations = () => {
      let count = 0;
      if (localStorage.getItem('telegram_connected') === 'true') count++;
      if (localStorage.getItem('whatsapp_connected') === 'true') count++;
      setIntegrationCount(count);
    };
    
    checkIntegrations();
    
    // Listen for storage changes
    const handleStorageChange = () => {
      checkIntegrations();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user, fetchStats]);

  const fetchStats = useCallback(async () => {
    try {
      // Fetch expenses
      const expensesResponse = await supabase.functions.invoke('get-user-expenses', {
        body: { userId: user?.id }
      });
      
      // Fetch knowledge base entries
      const knowledgeResponse = await supabase.functions.invoke('get-knowledge-base-by-user', {
        body: { userId: user?.id }
      });
      
      if (expensesResponse.data?.expenses) {
        const expenses = expensesResponse.data.expenses;
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const monthlyExpenses = expenses
          .filter((expense: { date: string }) => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
          })
          .reduce((sum: number, expense: { amount: number }) => sum + expense.amount, 0);
          
        setStats(prev => ({
          ...prev,
          monthlyExpenses,
          totalExpenses: expenses.length
        }));
      }
      
      if (knowledgeResponse.data?.entries) {
        setStats(prev => ({
          ...prev,
          knowledgeEntries: knowledgeResponse.data.entries.length
        }));
      }
      
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-primary rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome to Your AI Business Assistant</h2>
        <p className="text-white/90 mb-4">
          Get started by setting up your Telegram or WhatsApp integration, then begin tracking expenses with voice commands.
        </p>
        <Button 
          variant="secondary" 
          className="bg-white text-primary hover:bg-white/90"
          onClick={() => onViewChange("integrations")}
        >
          Set Up Integration
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.monthlyExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{stats.totalExpenses} total expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Knowledge Base</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.knowledgeEntries}</div>
            <p className="text-xs text-muted-foreground">Knowledge entries stored</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Integrations</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{integrationCount}</div>
            <p className="text-xs text-muted-foreground">
              {integrationCount === 0 ? "Set up Telegram or WhatsApp" : 
               integrationCount === 1 ? "1 platform connected" : 
               "2 platforms connected"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Quick Setup
            </CardTitle>
            <CardDescription>
              Get your AI assistant running in minutes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Connect Telegram</span>
              <Badge variant={localStorage.getItem('telegram_connected') === 'true' ? "default" : "outline"}>
                {localStorage.getItem('telegram_connected') === 'true' ? "Connected" : "Pending"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Configure Voice Commands</span>
              <Badge variant={integrationCount > 0 ? "default" : "outline"}>
                {integrationCount > 0 ? "Ready" : "Pending"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Set Expense Categories</span>
              <Badge variant="default">Complete</Badge>
            </div>
            <Button 
              className="w-full mt-4"
              onClick={() => onViewChange("integrations")}
            >
              Start Setup Guide
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Your latest AI assistant interactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No activity yet</p>
              <p className="text-sm">Start using your AI assistant to see activity here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}