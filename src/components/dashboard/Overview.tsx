import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, Bot, DollarSign, MessageSquare, Smartphone, TrendingUp, BookOpen, Sparkles, Stars, Zap, Brain } from "lucide-react";
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

  const fetchStats = useCallback(async () => {
    try {
      // Fetch expenses directly from ML API
      const expensesResponse = await fetch('https://dawoodAhmad12-ai-expense-backend.hf.space/expenses', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Fetch knowledge base entries
      const knowledgeResponse = await supabase.functions.invoke('get-knowledge-base-by-user', {
        body: { userId: user?.id }
      });
      
      if (expensesResponse.ok) {
        const expenses = await expensesResponse.json();
        console.log('Fetched expenses from ML API:', expenses);
        console.log('Number of expenses:', expenses.length);
        
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        console.log('Current month:', currentMonth, 'Current year:', currentYear);
        
        // Debug each expense
        expenses.forEach((expense: any, index: number) => {
          const dateStr = expense.date || expense.created_at;
          const expenseDate = new Date(dateStr);
          console.log(`Expense ${index + 1}:`, {
            title: expense.title,
            amount: expense.amount,
            date: expense.date,
            created_at: expense.created_at,
            usedDate: dateStr,
            expenseMonth: expenseDate.getMonth(),
            expenseYear: expenseDate.getFullYear(),
            isCurrentMonth: expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
          });
        });
        
        const monthlyExpenses = expenses
          .filter((expense: { date?: string; created_at?: string }) => {
            // Use date field if available, otherwise use created_at
            const dateStr = expense.date || expense.created_at;
            if (!dateStr) return false;
            const expenseDate = new Date(dateStr);
            return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
          })
          .reduce((sum: number, expense: { amount: number }) => sum + expense.amount, 0);
        
        console.log('Monthly expenses total:', monthlyExpenses);
        
        setStats(prev => ({
          ...prev,
          monthlyExpenses,
          totalExpenses: expenses.length
        }));
      } else {
        console.error('Failed to fetch expenses:', expensesResponse.status, expensesResponse.statusText);
      }
      
      console.log('Knowledge response full object:', knowledgeResponse);
      console.log('Knowledge response data:', knowledgeResponse.data);
      console.log('Knowledge response error:', knowledgeResponse.error);
      
      if (knowledgeResponse.data?.entries) {
        console.log('Knowledge entries array:', knowledgeResponse.data.entries);
        console.log('Knowledge entries count:', knowledgeResponse.data.entries.length);
        setStats(prev => ({
          ...prev,
          knowledgeEntries: knowledgeResponse.data.entries.length
        }));
      } else {
        console.log('No knowledge entries found or API error - setting to 0');
        setStats(prev => ({
          ...prev,
          knowledgeEntries: 0
        }));
      }
      
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [user]);

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

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Welcome Section with Surreal Design */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-accent to-primary p-8 text-white shadow-2xl animate-gradient">
        {/* Floating decorative elements */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl animate-float"></div>
        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/5 rounded-full blur-2xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-white/5 rounded-full blur-lg animate-pulse-glow"></div>
        
        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm animate-float">
              <Brain className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text">
                Your AI-Powered Business Hub
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Sparkles className="h-4 w-4 animate-pulse" />
                <span className="text-white/90 text-sm">Intelligent • Automated • Seamless</span>
              </div>
            </div>
          </div>
          
          <p className="text-white/90 mb-6 text-lg leading-relaxed">
            Experience the future of business management with AI that learns, adapts, and grows with you.
          </p>
          
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="secondary" 
              className="bg-white/90 text-primary hover:bg-white backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              onClick={() => onViewChange("integrations")}
            >
              <Zap className="h-4 w-4 mr-2" />
              Start Integration
            </Button>
            <Button 
              variant="outline" 
              className="border-white/50 bg-white/10 text-white hover:bg-white/20 hover:border-white/70 backdrop-blur-sm font-medium shadow-lg transition-all duration-300"
              onClick={() => onViewChange("assistant")}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Try AI Assistant
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats with Enhanced Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-surreal group hover:shadow-xl transition-all duration-500 hover:-translate-y-1 border-0 bg-gradient-to-br from-green-50 to-emerald-50/80 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Monthly Expenses
            </CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg group-hover:shadow-green-500/25 transition-all duration-300 group-hover:rotate-12">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700 dark:text-green-300 mb-1">
              ${stats.monthlyExpenses.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {stats.totalExpenses} total expenses
            </p>
          </CardContent>
        </Card>

        <Card className="card-surreal group hover:shadow-xl transition-all duration-500 hover:-translate-y-1 border-0 bg-gradient-to-br from-purple-50 to-violet-50/80 dark:from-purple-950/20 dark:to-violet-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
              Knowledge Base
            </CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-lg group-hover:shadow-purple-500/25 transition-all duration-300 group-hover:scale-110">
              <BookOpen className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700 dark:text-purple-300 mb-1">
              {stats.knowledgeEntries}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Brain className="h-3 w-3" />
              Knowledge entries stored
            </p>
          </CardContent>
        </Card>

        <Card className="card-surreal group hover:shadow-xl transition-all duration-500 hover:-translate-y-1 border-0 bg-gradient-to-br from-blue-50 to-indigo-50/80 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Integrations
            </CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300 group-hover:animate-pulse">
              <Smartphone className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-300 mb-1">
              {integrationCount}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Zap className="h-3 w-3" />
              {integrationCount === 0 ? "Set up platforms" : 
               integrationCount === 1 ? "1 platform connected" : 
               "2 platforms connected"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="card-surreal group hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-orange-50 to-amber-50/80 dark:from-orange-950/20 dark:to-amber-950/20 relative overflow-hidden">
          {/* Floating decorative elements */}
          <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-orange-400/20 to-amber-400/20 rounded-full blur-xl animate-pulse-slow"></div>
          
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg group-hover:shadow-orange-500/25 transition-all duration-300">
                <Zap className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent font-bold">
                  Quick Setup
                </span>
                <span className="text-xs text-muted-foreground">Launch in minutes</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 relative z-10">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/50 dark:bg-white/5 backdrop-blur-sm">
                <span className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-orange-600" />
                  Connect Telegram
                </span>
                <Badge variant={localStorage.getItem('telegram_connected') === 'true' ? "default" : "outline"} 
                       className={localStorage.getItem('telegram_connected') === 'true' ? "bg-green-500 animate-pulse-slow" : ""}>
                  {localStorage.getItem('telegram_connected') === 'true' ? "✓ Connected" : "Pending"}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/50 dark:bg-white/5 backdrop-blur-sm">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Bot className="h-4 w-4 text-orange-600" />
                  Voice Commands
                </span>
                <Badge variant={integrationCount > 0 ? "default" : "outline"}
                       className={integrationCount > 0 ? "bg-green-500 animate-pulse-slow" : ""}>
                  {integrationCount > 0 ? "✓ Ready" : "Pending"}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/50 dark:bg-white/5 backdrop-blur-sm">
                <span className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-orange-600" />
                  Expense Categories
                </span>
                <Badge variant="default" className="bg-green-500 animate-pulse-slow">
                  ✓ Complete
                </Badge>
              </div>
            </div>
            <Button 
              className="w-full mt-6 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              onClick={() => onViewChange("integrations")}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Start Setup Guide
            </Button>
          </CardContent>
        </Card>

        <Card className="card-surreal group hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-indigo-50 to-blue-50/80 dark:from-indigo-950/20 dark:to-blue-950/20 relative overflow-hidden">
          {/* Floating decorative elements */}
          <div className="absolute bottom-4 left-4 w-24 h-24 bg-gradient-to-br from-indigo-400/20 to-blue-400/20 rounded-full blur-xl animate-float" style={{animationDelay: '1s'}}></div>
          
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg group-hover:shadow-indigo-500/25 transition-all duration-300">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent font-bold">
                  AI Analytics
                </span>
                <span className="text-xs text-muted-foreground">Smart insights</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-center py-8">
              <div className="relative inline-block mb-4">
                <BarChart3 className="h-16 w-16 mx-auto text-indigo-400" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center animate-pulse-slow">
                  <Stars className="h-3 w-3 text-white" />
                </div>
              </div>
              <p className="font-medium text-indigo-700 dark:text-indigo-300 mb-2">
                AI Learning Mode
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Your assistant is getting smarter with every interaction
              </p>
              <div className="bg-gradient-to-r from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 rounded-lg p-3">
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Brain className="h-4 w-4 text-indigo-600" />
                  <span className="font-medium">Ready to learn from you</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}