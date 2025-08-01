import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Bot, MessageSquare, Mic, Settings, Volume2, Send, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function AIAssistant() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [autoExpenseDetection, setAutoExpenseDetection] = useState(true);
  const [knowledgeBaseContext, setKnowledgeBaseContext] = useState<string>("");

  // Fetch knowledge base context for AI
  const fetchKnowledgeBaseContext = async (): Promise<string> => {
    try {
      console.log('Fetching knowledge base context for AI...');
      const response = await fetch('https://dawoodAhmad12-ai-expense-backend.hf.space/get-knowledge-base');
      
      if (!response.ok) {
        console.warn('Knowledge base context not available:', response.status);
        return '';
      }
      
      const data = await response.json();
      console.log('Knowledge base context fetched:', data);
      
      // The API might return different formats, handle gracefully
      return data.formatted_knowledge || data.content || data.knowledge_base || JSON.stringify(data);
    } catch (error) {
      console.warn('Failed to fetch knowledge base context:', error);
      return '';
    }
  };

  // Helper function to detect content type from user message
  const detectContentType = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('blog post') || lowerMessage.includes('article')) {
      return 'blog post';
    } else if (lowerMessage.includes('email') || lowerMessage.includes('message')) {
      return 'email';
    } else if (lowerMessage.includes('social media') || lowerMessage.includes('post') || lowerMessage.includes('linkedin') || lowerMessage.includes('twitter')) {
      return 'social media post';
    } else if (lowerMessage.includes('report') || lowerMessage.includes('analysis')) {
      return 'report';
    } else if (lowerMessage.includes('proposal') || lowerMessage.includes('pitch')) {
      return 'business proposal';
    } else {
      return 'general response';
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || isLoading || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      console.log('Sending message to ML API:', userMessage.content);
      
      // Fetch fresh knowledge base context for this request
      const knowledgeContext = await fetchKnowledgeBaseContext();
      
      // Detect content type based on user message
      const contentType = detectContentType(userMessage.content);
      
      // Enhanced prompt with knowledge base context
      const enhancedPrompt = knowledgeContext 
        ? `Context about my business: ${knowledgeContext}\n\nUser request: ${userMessage.content}`
        : userMessage.content;
      
      const response = await fetch('https://dawoodAhmad12-ai-expense-backend.hf.space/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          content_type: contentType
        })
      });

      console.log('ML API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('ML API error:', errorText);
        throw new Error(`Failed to generate response: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('ML API response data:', data);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.generated_content || data.content || data.response || 'Sorry, I could not generate a response.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Quick action handlers
  const handleQuickAction = async (actionType: string) => {
    let prompt = '';
    let contentType = '';
    
    switch (actionType) {
      case 'expense-summary':
        prompt = 'Please provide a summary of my recent expenses and spending patterns.';
        contentType = 'report';
        break;
      case 'create-content':
        prompt = 'Help me create engaging content for my business marketing.';
        contentType = 'blog post';
        break;
      case 'business-insights':
        prompt = 'Give me insights and recommendations for improving my business operations.';
        contentType = 'report';
        break;
      case 'voice-commands':
        prompt = 'Show me examples of voice commands I can use with the AI assistant.';
        contentType = 'general response';
        break;
      default:
        return;
    }
    
    // Set the message and trigger send
    setMessage(prompt);
    
    // Auto-send the message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      console.log('Sending quick action to ML API:', prompt);
      
      // Fetch fresh knowledge base context for this request
      const knowledgeContext = await fetchKnowledgeBaseContext();
      
      // Enhanced prompt with knowledge base context
      const enhancedPrompt = knowledgeContext 
        ? `Context about my business: ${knowledgeContext}\n\nUser request: ${prompt}`
        : prompt;
      
      const response = await fetch('https://dawoodAhmad12-ai-expense-backend.hf.space/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          content_type: contentType
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ML API error:', errorText);
        throw new Error(`Failed to generate response: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('ML API response data:', data);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.generated_content || data.content || data.response || 'Sorry, I could not generate a response.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error with quick action:', error);
      toast({
        title: "Error",
        description: "Failed to process quick action. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }  
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">AI Assistant</h2>
          <p className="text-muted-foreground">Configure and interact with your AI business assistant</p>
        </div>
        <Badge variant="outline" className="gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          Ready
        </Badge>
      </div>

      <Tabs defaultValue="chat" className="space-y-6">
        <TabsList>
          <TabsTrigger value="chat">Chat Interface</TabsTrigger>
          <TabsTrigger value="voice">Voice Settings</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chat Interface */}
            <div className="lg:col-span-2">
              <Card className="h-[500px] flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Chat with Your AI Assistant
                  </CardTitle>
                  <CardDescription>
                    Ask questions about expenses, get business insights, or request content creation
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="flex-1 border rounded-lg p-4 mb-4 bg-muted/20 overflow-y-auto max-h-[300px]">
                    {messages.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Start a conversation with your AI assistant</p>
                        <p className="text-sm">Try asking about expense categories or business insights</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((msg) => (
                          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-lg px-3 py-2 ${
                              msg.role === 'user' 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted'
                            }`}>
                              <p className="text-sm">{msg.content}</p>
                            </div>
                          </div>
                        ))}
                        {isLoading && (
                          <div className="flex gap-3 justify-start">
                            <div className="bg-muted rounded-lg px-3 py-2">
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-sm">Thinking...</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Textarea 
                      placeholder="Type your message or question..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="min-h-[60px]"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    <div className="flex flex-col gap-2">
                      <Button size="sm" onClick={sendMessage} disabled={!message.trim() || isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                      <Button size="sm" variant="outline">
                        <Mic className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common AI assistant tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => handleQuickAction('expense-summary')}
                  disabled={isLoading}
                >
                  <Bot className="h-4 w-4" />
                  Expense Summary
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => handleQuickAction('create-content')}
                  disabled={isLoading}
                >
                  <MessageSquare className="h-4 w-4" />
                  Create Content
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => handleQuickAction('business-insights')}
                  disabled={isLoading}
                >
                  <Settings className="h-4 w-4" />
                  Business Insights
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => handleQuickAction('voice-commands')}
                  disabled={isLoading}
                >
                  <Volume2 className="h-4 w-4" />
                  Voice Commands
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="voice">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Voice Settings
              </CardTitle>
              <CardDescription>Configure voice recognition and response settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="voice-enabled">Enable Voice Recognition</Label>
                  <p className="text-sm text-muted-foreground">Allow voice commands through Telegram/WhatsApp</p>
                </div>
                <Switch 
                  id="voice-enabled"
                  checked={voiceEnabled}
                  onCheckedChange={setVoiceEnabled}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Voice Language</Label>
                  <Button variant="outline" className="w-full justify-start">
                    English (US)
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Response Style</Label>
                  <Button variant="outline" className="w-full justify-start">
                    Professional
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Voice Commands Examples:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• "Add $25 lunch expense at Joe's Cafe"</li>
                  <li>• "Show me this month's travel expenses"</li>
                  <li>• "Create a LinkedIn post about productivity"</li>
                  <li>• "What's my total expenses this week?"</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation">
          <Card>
            <CardHeader>
              <CardTitle>AI Automation Settings</CardTitle>
              <CardDescription>Configure automatic AI behaviors and responses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-expense">Auto Expense Detection</Label>
                  <p className="text-sm text-muted-foreground">Automatically detect and categorize expenses from messages</p>
                </div>
                <Switch 
                  id="auto-expense"
                  checked={autoExpenseDetection}
                  onCheckedChange={setAutoExpenseDetection}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="smart-categorization">Smart Categorization</Label>
                  <p className="text-sm text-muted-foreground">AI suggests expense categories based on context</p>
                </div>
                <Switch id="smart-categorization" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="receipt-ocr">Receipt OCR Processing</Label>
                  <p className="text-sm text-muted-foreground">Extract expense data from receipt images automatically</p>
                </div>
                <Switch id="receipt-ocr" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="business-insights">Daily Business Insights</Label>
                  <p className="text-sm text-muted-foreground">Receive daily summaries and spending insights</p>
                </div>
                <Switch id="business-insights" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}