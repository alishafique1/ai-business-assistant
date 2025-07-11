import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, CheckCircle, ExternalLink, MessageCircle, Settings, Smartphone } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function Integrations() {
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [whatsappConnected, setWhatsappConnected] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Integrations</h2>
        <p className="text-muted-foreground">Connect your favorite apps and services to enhance your AI assistant</p>
      </div>

      <Tabs defaultValue="messaging" className="space-y-6">
        <TabsList>
          <TabsTrigger value="messaging">Messaging Apps</TabsTrigger>
          <TabsTrigger value="business">Business Tools</TabsTrigger>
          <TabsTrigger value="setup">Setup Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="messaging" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Telegram Integration */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <MessageCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle>Telegram</CardTitle>
                      <CardDescription>Connect your Telegram account</CardDescription>
                    </div>
                  </div>
                  <Badge variant={telegramConnected ? "default" : "outline"}>
                    {telegramConnected ? "Connected" : "Not Connected"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!telegramConnected ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Chat with your AI assistant directly in Telegram. Send voice messages, images, and text commands.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="telegram-username">Telegram Username</Label>
                      <Input id="telegram-username" placeholder="@yourusername" />
                    </div>
                    <Button className="w-full" onClick={() => setTelegramConnected(true)}>
                      Connect Telegram
                    </Button>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Successfully connected to Telegram</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You can now send commands to @YourAIAssistantBot on Telegram
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Test Connection
                      </Button>
                      <Button variant="outline" size="sm">
                        Disconnect
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* WhatsApp Integration */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <Smartphone className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle>WhatsApp Business</CardTitle>
                      <CardDescription>Connect WhatsApp Business API</CardDescription>
                    </div>
                  </div>
                  <Badge variant={whatsappConnected ? "default" : "outline"}>
                    {whatsappConnected ? "Connected" : "Not Connected"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!whatsappConnected ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Use your existing WhatsApp Business account to interact with your AI assistant.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp-number">Business Phone Number</Label>
                      <Input id="whatsapp-number" placeholder="+1 (555) 123-4567" />
                    </div>
                    <Button className="w-full" onClick={() => setWhatsappConnected(true)}>
                      Connect WhatsApp Business
                    </Button>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Successfully connected to WhatsApp Business</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Send messages to your AI assistant through WhatsApp
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Test Connection
                      </Button>
                      <Button variant="outline" size="sm">
                        Disconnect
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="business" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gmail Integration */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                      G
                    </div>
                    <div>
                      <CardTitle>Gmail</CardTitle>
                      <CardDescription>Auto-detect receipts in email</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline">Coming Soon</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Automatically scan your Gmail for receipts and expense-related emails. Extract expense data and categorize automatically.
                </p>
                <Button variant="outline" disabled className="w-full">
                  Connect Gmail
                </Button>
              </CardContent>
            </Card>

            {/* Calendar Integration */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle>Calendar Sync</CardTitle>
                      <CardDescription>Context-aware expense tracking</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline">Coming Soon</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Sync with your calendar to automatically associate expenses with meetings, travel, and events for better categorization.
                </p>
                <Button variant="outline" disabled className="w-full">
                  Connect Calendar
                </Button>
              </CardContent>
            </Card>

            {/* Accounting Software */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                      <Settings className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle>Accounting Software</CardTitle>
                      <CardDescription>QuickBooks, Xero integration</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline">Enterprise</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Sync expenses directly to your accounting software. Available in Enterprise plan.
                </p>
                <Button variant="outline" disabled className="w-full">
                  Upgrade for Integration
                </Button>
              </CardContent>
            </Card>

            {/* CRM Integration */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                      <ExternalLink className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle>CRM Integration</CardTitle>
                      <CardDescription>Salesforce, HubSpot sync</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline">Enterprise</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect client expenses to CRM records for better client profitability tracking.
                </p>
                <Button variant="outline" disabled className="w-full">
                  Upgrade for Integration
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="setup">
          <Card>
            <CardHeader>
              <CardTitle>Integration Setup Guide</CardTitle>
              <CardDescription>Step-by-step instructions to get started</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium">Choose Your Platform</h4>
                    <p className="text-sm text-muted-foreground">
                      Start with either Telegram or WhatsApp Business - you can add both later.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium">Connect Your Account</h4>
                    <p className="text-sm text-muted-foreground">
                      Follow the connection flow to link your messaging account securely.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium">Test Your Connection</h4>
                    <p className="text-sm text-muted-foreground">
                      Send a test message to ensure everything is working correctly.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    4
                  </div>
                  <div>
                    <h4 className="font-medium">Start Using Voice Commands</h4>
                    <p className="text-sm text-muted-foreground">
                      Begin tracking expenses with natural voice commands and messages.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Need Help?</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Our team provides full setup support to get you started quickly.
                </p>
                <Button variant="outline">Contact Support</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}