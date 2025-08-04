import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, CheckCircle, ExternalLink, MessageCircle, Settings, Smartphone, Bot, Phone, Copy, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";

export function Integrations() {
  const { toast } = useToast();
  const [telegramConnected, setTelegramConnected] = useState(
    localStorage.getItem('telegram_connected') === 'true'
  );
  const [whatsappConnected, setWhatsappConnected] = useState(
    localStorage.getItem('whatsapp_connected') === 'true'
  );
  const [isContactingSupport, setIsContactingSupport] = useState(false);

  // Auto caller webhook URL - same as Contact Sales
  const AUTO_CALLER_WEBHOOK_URL = import.meta.env.VITE_AUTO_CALLER_WEBHOOK || 'https://your-auto-caller-webhook.com/api/call';

  const handleTelegramConnect = () => {
    const newState = !telegramConnected;
    setTelegramConnected(newState);
    localStorage.setItem('telegram_connected', newState.toString());
  };

  const handleWhatsappConnect = () => {
    const newState = !whatsappConnected;
    setWhatsappConnected(newState);
    localStorage.setItem('whatsapp_connected', newState.toString());
  };

  const handleContactSupport = async () => {
    setIsContactingSupport(true);
    
    try {
      const response = await fetch(AUTO_CALLER_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'integration_support_request',
          timestamp: new Date().toISOString(),
          source: 'integrations_setup_guide',
          user_agent: navigator.userAgent,
          referrer: document.referrer || 'direct'
        })
      });

      if (response.ok) {
        toast({
          title: "Support Call Requested! 📞",
          description: "Our integration specialist will contact you within 15 minutes during business hours.",
          duration: 5000,
        });
      } else {
        throw new Error('Failed to initiate support call');
      }
    } catch (error) {
      console.error('Error contacting support:', error);
      toast({
        title: "Support Request Error",
        description: "Unable to initiate call. Please email support@socialdots.ca or call (555) 123-4567",
        variant: "destructive",
        duration: 7000,
      });
    } finally {
      setIsContactingSupport(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
        duration: 2000,
      });
    });
  };

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
                    <Button className="w-full" onClick={handleTelegramConnect}>
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
                      <Button variant="outline" size="sm" onClick={handleTelegramConnect}>
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
                    <Button className="w-full" onClick={handleWhatsappConnect}>
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
                      <Button variant="outline" size="sm" onClick={handleWhatsappConnect}>
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

        <TabsContent value="setup" className="space-y-6">
          {/* Telegram Setup Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 text-white" />
                </div>
                Telegram Bot Integration Setup
              </CardTitle>
              <CardDescription>Complete guide to set up your Telegram AI Assistant bot</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Create Bot */}
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium mb-2">Create Your Telegram Bot</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Contact the BotFather on Telegram to create your personal AI assistant bot.
                    </p>
                    <div className="bg-muted p-4 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-mono">@BotFather</span>
                        <Button size="sm" variant="outline" onClick={() => copyToClipboard('@BotFather', 'BotFather username')}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Click to open BotFather and start creating your bot</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => window.open('https://t.me/BotFather', '_blank')}
                        className="w-full"
                      >
                        <ExternalLink className="h-3 w-3 mr-2" />
                        Open BotFather
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Step 2: Get Bot Token */}
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium mb-2">Configure Your Bot</h4>
                    <p className="text-sm text-muted-foreground mb-3">Send these commands to BotFather:</p>
                    <div className="bg-muted p-4 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <code className="text-sm">/newbot</code>
                        <Button size="sm" variant="outline" onClick={() => copyToClipboard('/newbot', 'Command')}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Create a new bot</p>
                      
                      <div className="pt-2">
                        <p className="text-sm">Give your bot a name like: <code className="bg-background px-1 rounded">My Business AI Assistant</code></p>
                        <p className="text-sm">Choose a username ending in 'bot': <code className="bg-background px-1 rounded">yourbusiness_ai_bot</code></p>
                      </div>
                      
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">BotFather will give you a <strong>bot token</strong> - save this securely!</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3: Set Bot Commands */}
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium mb-2">Set Bot Commands</h4>
                    <p className="text-sm text-muted-foreground mb-3">Configure your bot's menu commands:</p>
                    <div className="bg-muted p-4 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <code className="text-sm">/setcommands</code>
                        <Button size="sm" variant="outline" onClick={() => copyToClipboard('/setcommands', 'Command')}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">Then paste this commands list:</p>
                      <div className="bg-background p-2 rounded text-xs font-mono">
                        <div>start - Start using the AI assistant</div>
                        <div>help - Show available commands</div>
                        <div>expense - Log a new expense</div>
                        <div>summary - Get expense summary</div>
                        <div>settings - Update preferences</div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => copyToClipboard('start - Start using the AI assistant\nhelp - Show available commands\nexpense - Log a new expense\nsummary - Get expense summary\nsettings - Update preferences', 'Bot commands')}
                        className="w-full mt-2"
                      >
                        <Copy className="h-3 w-3 mr-2" />
                        Copy All Commands
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Step 4: Configure Webhook */}
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    4
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium mb-2">Connect to Our System</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Our support team will configure the webhook connection for you.
                    </p>
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-800">Professional Setup Required</p>
                          <p className="text-xs text-amber-700 mt-1">
                            Our team will handle the technical webhook configuration to ensure secure integration with your account.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* WhatsApp Setup Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <Smartphone className="h-4 w-4 text-white" />
                </div>
                WhatsApp Business Integration Setup
              </CardTitle>
              <CardDescription>Complete guide to set up WhatsApp Business API integration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: WhatsApp Business Account */}
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium mb-2">WhatsApp Business Account Required</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      You need a WhatsApp Business account to use API integration.
                    </p>
                    <div className="bg-muted p-4 rounded-lg space-y-3">
                      <p className="text-sm"><strong>Option 1:</strong> WhatsApp Business App</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => window.open('https://www.whatsapp.com/business/', '_blank')}
                        className="w-full"
                      >
                        <ExternalLink className="h-3 w-3 mr-2" />
                        Download WhatsApp Business
                      </Button>
                      
                      <Separator />
                      
                      <p className="text-sm"><strong>Option 2:</strong> WhatsApp Business Platform (Recommended)</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => window.open('https://business.whatsapp.com/', '_blank')}
                        className="w-full"
                      >
                        <ExternalLink className="h-3 w-3 mr-2" />
                        WhatsApp Business Platform
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Step 2: Meta Business Manager */}
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium mb-2">Set Up Meta Business Manager</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      WhatsApp Business API requires a Meta Business Manager account.
                    </p>
                    <div className="bg-muted p-4 rounded-lg space-y-3">
                      <p className="text-sm font-medium">Steps to complete:</p>
                      <ul className="text-sm space-y-1 ml-4">
                        <li>• Create Meta Business Manager account</li>
                        <li>• Add your business information</li>
                        <li>• Verify your business</li>
                        <li>• Add WhatsApp Business Account</li>
                      </ul>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => window.open('https://business.facebook.com/', '_blank')}
                        className="w-full"
                      >
                        <ExternalLink className="h-3 w-3 mr-2" />
                        Open Meta Business Manager
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Step 3: Phone Number */}
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium mb-2">Business Phone Number</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      You'll need a dedicated business phone number for WhatsApp Business API.
                    </p>
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Phone className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-800">Important Requirements</p>
                          <ul className="text-xs text-amber-700 mt-1 space-y-1">
                            <li>• Phone number must be dedicated to WhatsApp Business API only</li>
                            <li>• Cannot be used with regular WhatsApp or WhatsApp Business app</li>
                            <li>• Number verification required</li>
                            <li>• Consider getting a new number if needed</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 4: API Access */}
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    4
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium mb-2">WhatsApp Business API Setup</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Professional integration setup through Business Solution Provider.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Bot className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-800">Business Solution Provider Required</p>
                          <p className="text-xs text-blue-700 mt-1">
                            WhatsApp requires certified Business Solution Providers for API access. Our team partners with certified providers to set up your integration.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 5: Integration */}
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    5
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium mb-2">Connect to Our Platform</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Final integration with your AI Business Assistant.
                    </p>
                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>What we handle for you:</strong>
                      </p>
                      <ul className="text-xs text-green-700 mt-2 space-y-1">
                        <li>• Webhook configuration</li>
                        <li>• Message routing setup</li>
                        <li>• Security and encryption</li>
                        <li>• Testing and validation</li>
                        <li>• Ongoing support</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Support Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Integration Support
              </CardTitle>
              <CardDescription>Get professional help with your integration setup</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium">What Our Team Handles</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Complete bot setup and configuration</li>
                    <li>• Webhook integration and security</li>
                    <li>• WhatsApp Business API application</li>
                    <li>• Testing and troubleshooting</li>
                    <li>• Training on using your integrated system</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium">Timeline & Process</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• <strong>Telegram:</strong> 1-2 business days</li>
                    <li>• <strong>WhatsApp:</strong> 5-10 business days</li>
                    <li>• Dedicated integration specialist assigned</li>
                    <li>• Regular progress updates</li>
                    <li>• Post-setup support included</li>
                  </ul>
                </div>
              </div>
              
              <Separator />
              
              <div className="text-center space-y-3">
                <h4 className="font-medium">Ready to Get Started?</h4>
                <p className="text-sm text-muted-foreground">
                  Our integration specialists will guide you through the entire process and handle the technical setup.
                </p>
                <Button 
                  onClick={handleContactSupport}
                  disabled={isContactingSupport}
                  className="gap-2"
                >
                  {isContactingSupport ? (
                    <>
                      <Bot className="h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Phone className="h-4 w-4" />
                      Contact Integration Support
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Free consultation • Available during business hours • 15-minute response time
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}