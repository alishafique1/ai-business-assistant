import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, Bot, DollarSign, MessageSquare, Smartphone, TrendingUp } from "lucide-react";

export function Overview() {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-primary rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome to Your AI Business Assistant</h2>
        <p className="text-white/90 mb-4">
          Get started by setting up your Telegram or WhatsApp integration, then begin tracking expenses with voice commands.
        </p>
        <Button variant="secondary" className="bg-white text-primary hover:bg-white/90">
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
            <div className="text-2xl font-bold">$0.00</div>
            <p className="text-xs text-muted-foreground">Start tracking your expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">AI Interactions</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Voice commands processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Integrations</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Set up Telegram or WhatsApp</p>
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
              <Badge variant="outline">Pending</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Configure Voice Commands</span>
              <Badge variant="outline">Pending</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Set Expense Categories</span>
              <Badge variant="outline">Pending</Badge>
            </div>
            <Button className="w-full mt-4">Start Setup Guide</Button>
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