import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Bot, MessageSquare, Mic, Settings, Volume2, Send, Loader2, BarChart3, DollarSign, TrendingUp, Target, Smartphone, Mail, Star, PenTool, Users, Heart, Zap, CheckSquare, Cog, Calculator, PieChart, CreditCard, Search, Package, Palette } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Component to format AI assistant responses with proper structure
function FormattedAIContent({ content }: { content: string }) {
  // Enhanced formatting function for AI responses with markdown support
  const formatContent = (text: string) => {
    // Split content by double newlines to create sections
    const sections = text.split(/\n\s*\n/);
    
    return sections.map((section, sectionIndex) => {
      const trimmedSection = section.trim();
      if (!trimmedSection) return null;

      // Check for headers (lines that end with : or are in ALL CAPS or wrapped in **)
      const headerRegex = /^[A-Z\s]+:?\s*$|^.*:$|^\*\*.*\*\*$/;
      const lines = trimmedSection.split('\n');
      
      // Check if first line is a header
      const firstLine = lines[0]?.trim();
      const isHeader = headerRegex.test(firstLine) && lines.length > 1;
      
      if (isHeader) {
        const headerText = firstLine.replace(/:$/, '').replace(/^\*\*(.*)\*\*$/, '$1');
        const contentLines = lines.slice(1).filter(line => line.trim());
        
        return (
          <div key={sectionIndex} className="mb-4">
            <h4 className="font-semibold text-sm mb-3 text-primary">
              {headerText}
            </h4>
            <div className="ml-2">
              {contentLines.map((line, lineIndex) => {
                const trimmedLine = line.trim();
                if (!trimmedLine) return null;
                
                // Format the line with markdown support
                const formattedLine = formatMarkdown(trimmedLine);
                
                // Check for bullet points
                if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || /^\d+\./.test(trimmedLine)) {
                  return (
                    <div key={lineIndex} className="mb-2 text-sm leading-relaxed">
                      {formattedLine}
                    </div>
                  );
                }
                
                return (
                  <p key={lineIndex} className="mb-2 text-sm leading-relaxed">
                    {formattedLine}
                  </p>
                );
              })}
            </div>
          </div>
        );
      } else {
        // Regular paragraph or simple content
        const lines = trimmedSection.split('\n').filter(line => line.trim());
        
        return (
          <div key={sectionIndex} className="mb-4">
            {lines.map((line, lineIndex) => {
              const trimmedLine = line.trim();
              if (!trimmedLine) return null;
              
              // Format the line with markdown support
              const formattedLine = formatMarkdown(trimmedLine);
              
              // Check for bullet points
              if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || /^\d+\./.test(trimmedLine)) {
                return (
                  <div key={lineIndex} className="mb-2 text-sm leading-relaxed">
                    {formattedLine}
                  </div>
                );
              }
              
              return (
                <p key={lineIndex} className="mb-2 text-sm leading-relaxed">
                  {formattedLine}
                </p>
              );
            })}
          </div>
        );
      }
    }).filter(Boolean);
  };

  // Function to format markdown elements
  const formatMarkdown = (text: string) => {
    const parts = [];
    let currentIndex = 0;
    
    // Replace **bold** text
    const boldRegex = /\*\*(.*?)\*\*/g;
    let match;
    
    while ((match = boldRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > currentIndex) {
        parts.push(text.slice(currentIndex, match.index));
      }
      
      // Add the bold text
      parts.push(
        <strong key={`bold-${match.index}`} className="font-semibold">
          {match[1]}
        </strong>
      );
      
      currentIndex = match.index + match[0].length;
    }
    
    // Add any remaining text
    if (currentIndex < text.length) {
      parts.push(text.slice(currentIndex));
    }
    
    return parts.length > 1 ? parts : text;
  };

  return (
    <div className="space-y-2">
      {formatContent(content)}
    </div>
  );
}

export function AIAssistant() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [autoExpenseDetection, setAutoExpenseDetection] = useState(true);
  const [knowledgeBaseContext, setKnowledgeBaseContext] = useState<string>(() => {
    return localStorage.getItem('knowledgeBase_context') || '';
  });
  const [knowledgeBaseCached, setKnowledgeBaseCached] = useState<boolean>(() => {
    return localStorage.getItem('knowledgeBase_cached') === 'true';
  });
  
  // Voice suggestion recording states
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [voiceSuggestionLoading, setVoiceSuggestionLoading] = useState(false);

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch knowledge base context for AI with caching
  const fetchKnowledgeBaseContext = async (): Promise<string> => {
    // Return cached context if available
    if (knowledgeBaseCached && knowledgeBaseContext) {
      console.log('📦 Using cached knowledge base context');
      return knowledgeBaseContext;
    }

    if (!user?.id) {
      console.warn('No user ID available for knowledge base fetch');
      return '';
    }

    try {
      console.log('🔄 Fetching fresh knowledge base context...');
      const { data, error } = await supabase.functions.invoke('get-knowledge-base-by-user', {
        body: { userId: user.id }
      });
      
      if (error) {
        console.warn('Failed to fetch knowledge base context:', error);
        return '';
      }
      
      // Build context from knowledge base entries
      const contextItems = data?.entries?.map((entry: any) => 
        `${entry.title}: ${entry.content}`
      ) || [];
      
      const fullContext = contextItems.join('\n\n');
      
      // Cache the context
      localStorage.setItem('knowledgeBase_context', fullContext);
      localStorage.setItem('knowledgeBase_cached', 'true');
      setKnowledgeBaseContext(fullContext);
      setKnowledgeBaseCached(true);
      
      console.log('✅ Knowledge base context fetched and cached');
      return fullContext;
    } catch (error) {
      console.error('Error fetching knowledge base context:', error);
      return '';
    }
  };

  // Handle sending messages to AI
  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    try {
      // Get knowledge base context
      const kbContext = await fetchKnowledgeBaseContext();
      
      // Prepare the system prompt with knowledge base context
      let systemPrompt = `You are an AI business assistant. Be helpful, professional, and provide actionable insights.`;
      
      if (kbContext) {
        systemPrompt += `\n\nKnowledge Base Context:\n${kbContext}`;
      }

      // Use ML API endpoint for generating responses
      console.log('🤖 Sending message to ML API:', userMessage.content);
      
      const response = await fetch('https://socialdots-ai-expense-backend.hf.space/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: userMessage.content,
          user_id: user?.id || 'anonymous'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ ML API Error:', response.status, errorText);
        throw new Error(`Failed to get AI response: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ ML API Response:', data);
      
      const aiResponse = data.response || "I'm sorry, I couldn't process your request.";
      console.log('🎯 AI Response to display:', aiResponse);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to get response from AI assistant",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (action: string) => {

    let prompt = '';
    let contentType = '';
    
    switch (action) {
      case 'create-content':
        prompt = 'Help me create engaging content for my business social media. Give me 3 post ideas with captions.';
        contentType = 'social media content';
        break;
      case 'expense-insights':
        prompt = 'Analyze my business expenses and provide insights on spending patterns and cost optimization opportunities.';
        contentType = 'expense analysis';
        break;
      case 'business-insights':
        prompt = 'Give me insights and recommendations for improving my business operations.';
        contentType = 'report';
        break;
      
      // Business Operations
      case 'sales-analysis':
        prompt = 'Analyze my sales performance and suggest improvements. Include metrics, trends, and actionable recommendations.';
        contentType = 'sales analysis report';
        break;
      case 'cash-flow-review':
        prompt = 'Review my cash flow and provide financial recommendations. Include cash flow optimization strategies.';
        contentType = 'financial review';
        break;
      case 'growth-strategy':
        prompt = 'Help me create a comprehensive business growth plan with specific strategies and milestones.';
        contentType = 'growth strategy';
        break;
      case 'goal-setting':
        prompt = 'Help me set and track SMART business goals. Include short-term and long-term objectives.';
        contentType = 'goal setting guide';
        break;
      
      // Marketing & Branding
      case 'social-media-strategy':
        prompt = 'Create a comprehensive social media content calendar and strategy for my business.';
        contentType = 'social media strategy';
        break;
      case 'email-campaign':
        prompt = 'Draft an effective email marketing campaign including subject lines, content, and call-to-actions.';
        contentType = 'email marketing campaign';
        break;
      case 'brand-voice':
        prompt = 'Help me define my brand voice and messaging guidelines. Include tone, personality, and communication style.';
        contentType = 'brand voice guide';
        break;
      case 'blog-ideas':
        prompt = 'Generate creative and engaging blog post topics relevant to my industry and target audience.';
        contentType = 'blog content ideas';
        break;
      
      // Customer Management
      case 'customer-survey':
        prompt = 'Create comprehensive customer feedback survey questions to improve my products and services.';
        contentType = 'customer survey';
        break;
      case 'customer-support':
        prompt = 'Draft professional customer service response templates for common inquiries and issues.';
        contentType = 'customer support templates';
        break;
      case 'customer-retention':
        prompt = 'Suggest effective customer retention strategies to increase loyalty and reduce churn.';
        contentType = 'retention strategy';
        break;
      
      // Productivity & Operations
      case 'process-optimization':
        prompt = 'Help me streamline my business processes for maximum efficiency and productivity.';
        contentType = 'process optimization guide';
        break;
      case 'task-management':
        prompt = 'Create a comprehensive project management plan with timelines, milestones, and deliverables.';
        contentType = 'project management plan';
        break;
      case 'automation-ideas':
        prompt = 'Suggest specific tasks and processes I can automate in my business to save time and resources.';
        contentType = 'automation recommendations';
        break;
      
      // Financial Planning
      case 'budget-planning':
        prompt = 'Help me create a detailed monthly business budget including all revenue streams and expenses.';
        contentType = 'budget plan';
        break;
      case 'roi-analysis':
        prompt = 'Analyze return on investment for my business projects and suggest optimization strategies.';
        contentType = 'ROI analysis';
        break;
      case 'pricing-strategy':
        prompt = 'Help me optimize my pricing strategy based on market research, costs, and competitor analysis.';
        contentType = 'pricing strategy';
        break;
      
      // Industry-Specific
      case 'market-research':
        prompt = 'Conduct comprehensive competitor analysis and market research for my industry.';
        contentType = 'market research report';
        break;
      case 'product-development':
        prompt = 'Brainstorm innovative new product or service ideas based on market trends and customer needs.';
        contentType = 'product development ideas';
        break;
      case 'creative-brief':
        prompt = 'Create a detailed creative brief for my next marketing project including objectives, audience, and deliverables.';
        contentType = 'creative brief';
        break;
      
      default:
        return;
    }

    const actionMessage: Message = {
      id: Date.now().toString(),
      role: 'user', 
      content: prompt,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, actionMessage]);
    setIsLoading(true);

    try {
      // Get knowledge base context
      const kbContext = await fetchKnowledgeBaseContext();
      
      // Prepare system prompt based on action type
      let systemPrompt = `You are an AI business assistant. Provide ${contentType} that is practical and actionable.`;
      
      if (kbContext) {
        systemPrompt += `\n\nKnowledge Base Context:\n${kbContext}`;
      }

      // Use ML API endpoint for quick actions (except voice marketing ideas)
      let aiResponse = '';
      let contentTypeForAPI = '';
      
      // Determine content type and prompt for ML API
      switch (action) {
        case 'create-content':
          contentTypeForAPI = 'social media content';
          break;
        case 'expense-insights':
          contentTypeForAPI = 'business expense analysis';
          break;
        case 'business-insights':
          contentTypeForAPI = 'business insights report';
          break;
        default:
          contentTypeForAPI = 'general response';
      }

      // Get AI response from ML API
      console.log('🎯 Sending quick action to ML API:', prompt);
      
      const response = await fetch('https://socialdots-ai-expense-backend.hf.space/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          user_id: user?.id || 'anonymous'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Quick Action ML API Error:', response.status, errorText);
        throw new Error(`Failed to get AI response: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Quick Action ML API Response:', data);
      
      aiResponse = data.response || "I'm sorry, I couldn't process your request.";
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error with quick action:', error);
      toast({
        title: "Error",
        description: `Failed to get ${contentType} from AI assistant`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }  
  };

  // Voice suggestion recording functions
  const startVoiceRecording = async () => {
    try {
      setIsRecording(true);
      setVoiceSuggestionLoading(false);
      
      console.log('🎤 Starting voice recording for marketing suggestions...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });

      // Check for supported MIME types
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/wav'
      ];
      
      let mimeType = 'audio/webm';
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      console.log('🎵 Using MIME type:', mimeType);

      const audioChunks: Blob[] = [];
      const recorder = new MediaRecorder(stream, { 
        mimeType,
        audioBitsPerSecond: 128000
      });

      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      });

      recorder.addEventListener('stop', () => {
        const audioBlob = new Blob(audioChunks, { type: mimeType });
        stream.getTracks().forEach(track => track.stop());
        handleVoiceSuggestion(audioBlob);
      });

      recorder.start();
      setMediaRecorder(recorder);

      console.log('✅ Voice recording started successfully');
      toast({
        title: "Recording Started",
        description: "Speak your marketing idea request. Click stop when finished.",
      });

    } catch (error) {
      console.error('Error starting voice recording:', error);
      setIsRecording(false);
      toast({
        title: "Recording Error", 
        description: "Failed to start voice recording. Please check microphone permissions.",
        variant: "destructive",
      });
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      console.log('🛑 Stopping voice recording...');
      mediaRecorder.stop();
      setIsRecording(false);
      setVoiceSuggestionLoading(true);
      
      toast({
        title: "Processing...",
        description: "Processing your voice request for marketing ideas..."
      });
    }
  };

  const handleVoiceSuggestion = async (audioBlob: Blob) => {
    try {
      setVoiceSuggestionLoading(true);
      console.log('🎤 Processing voice suggestion...', { size: audioBlob.size, type: audioBlob.type });

      // Create FormData for the API call
      const formData = new FormData();
      formData.append('file', audioBlob, 'user_voice.wav');

      console.log('📤 Sending to voice-suggestion endpoint...');
      
      const response = await fetch('https://socialdots-ai-expense-backend.hf.space/voice-suggestion', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API Error (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Voice suggestion response:', result);

      // Handle the JSON response with text and audio
      if (result.full_text_response) {
        // Add the marketing suggestion to chat messages
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: result.full_text_response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);

        // Play the audio confirmation if available
        if (result.audio_base64) {
          playBase64Audio(result.audio_base64);
        }

        toast({
          title: "Marketing Idea Generated!",
          description: "Your personalized marketing suggestion is ready."
        });
      } else {
        throw new Error('No marketing suggestion received from API');
      }

    } catch (error) {
      console.error('Error processing voice suggestion:', error);
      toast({
        title: "Processing Error",
        description: "Failed to process your voice request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVoiceSuggestionLoading(false);
    }
  };

  // Function to decode and play Base64 audio
  const playBase64Audio = (base64String: string) => {
    try {
      console.log('🔊 Playing audio confirmation...');
      
      // Decode the Base64 string into binary data
      const binaryString = window.atob(base64String);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Create a Blob (like a temporary in-memory file)
      const audioBlob = new Blob([bytes], { type: 'audio/wav' });
      
      // Create a temporary URL for the Blob
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Create a new Audio object and play it
      const audio = new Audio(audioUrl);
      audio.play();
      
      console.log('✅ Audio confirmation played successfully');
    } catch (error) {
      console.error('Error playing audio confirmation:', error);
    }
  };

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col p-6">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div>
          <h2 className="text-3xl font-bold text-foreground">AI Assistant</h2>
          <p className="text-muted-foreground">Configure and interact with your AI business assistant</p>
        </div>
        <Badge variant="outline" className="gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          Ready
        </Badge>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 w-full h-full">
          {/* Chat Interface */}
          <div className="xl:col-span-3 min-h-0">
            <Card className="h-full flex flex-col min-h-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Chat with Your AI Assistant
                  </CardTitle>
                  <CardDescription>
                    Ask questions about expenses, get business insights, or request content creation
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col min-h-0">
                  <div className="flex-1 border rounded-lg p-4 mb-4 bg-muted/20 overflow-y-auto min-h-0">
                    {messages.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Start a conversation with your AI assistant</p>
                        <p className="text-sm">Try asking about expense categories or business insights</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[80%] rounded-lg p-3 ${
                              msg.role === 'user' 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted'
                            }`}>
                              {msg.role === 'assistant' ? (
                                <FormattedAIContent content={msg.content} />
                              ) : (
                                <p className="text-sm">{msg.content}</p>
                              )}
                              <div className="text-xs opacity-70 mt-1">
                                {msg.timestamp.toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Ask your AI assistant anything..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="min-h-[40px] resize-none"
                      onKeyDown={(e) => {
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
                      <Button 
                        size="sm" 
                        variant="outline"
                        disabled={true}
                        className="opacity-50 cursor-not-allowed"
                        title="Voice transcription - Coming soon"
                      >
                        <Mic className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="min-h-0">
              <Card className="h-full min-h-0">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                  <CardDescription>Get instant AI assistance for common tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {/* Active Quick Actions */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Active Actions</h4>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2"
                    onClick={() => handleQuickAction('create-content')}
                    disabled={isLoading}
                  >
                    <Bot className="h-4 w-4" />
                    Create Content
                  </Button>
                  <Button 
                    variant="outline" 
                    className={`w-full justify-start gap-2 ${isRecording ? 'bg-red-50 border-red-300 text-red-700' : ''}`}
                    onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                    disabled={voiceSuggestionLoading}
                  >
                    {voiceSuggestionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Mic className={`h-4 w-4 ${isRecording ? 'animate-pulse text-red-600' : ''}`} />
                    )}
                    {isRecording ? "Stop Recording" : "Voice Marketing Ideas"}
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
                </div>

                {/* Business Operations - Coming Soon */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Business Operations (Coming Soon)</h4>
                  <Button variant="outline" className="w-full justify-start gap-2 opacity-50" disabled>
                    <BarChart3 className="h-4 w-4" />
                    Sales Analysis
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2 opacity-50" disabled>
                    <DollarSign className="h-4 w-4" />
                    Cash Flow Review
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2 opacity-50" disabled>
                    <TrendingUp className="h-4 w-4" />
                    Growth Strategy
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2 opacity-50" disabled>
                    <Target className="h-4 w-4" />
                    Goal Setting
                  </Button>
                </div>

                {/* Marketing & Branding - Coming Soon */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Marketing & Branding (Coming Soon)</h4>
                  <Button variant="outline" className="w-full justify-start gap-2 opacity-50" disabled>
                    <Smartphone className="h-4 w-4" />
                    Social Media Strategy
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2 opacity-50" disabled>
                    <Mail className="h-4 w-4" />
                    Email Campaign
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2 opacity-50" disabled>
                    <Star className="h-4 w-4" />
                    Brand Voice
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2 opacity-50" disabled>
                    <PenTool className="h-4 w-4" />
                    Blog Ideas
                  </Button>
                </div>

                {/* Customer Management - Coming Soon */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Customer Management (Coming Soon)</h4>
                  <Button variant="outline" className="w-full justify-start gap-2 opacity-50" disabled>
                    <Users className="h-4 w-4" />
                    Customer Survey
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2 opacity-50" disabled>
                    <MessageSquare className="h-4 w-4" />
                    Customer Support
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2 opacity-50" disabled>
                    <Heart className="h-4 w-4" />
                    Customer Retention
                  </Button>
                </div>

                {/* Productivity & Operations - Coming Soon */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Productivity & Operations (Coming Soon)</h4>
                  <Button variant="outline" className="w-full justify-start gap-2 opacity-50" disabled>
                    <Zap className="h-4 w-4" />
                    Process Optimization
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2 opacity-50" disabled>
                    <CheckSquare className="h-4 w-4" />
                    Task Management
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2 opacity-50" disabled>
                    <Cog className="h-4 w-4" />
                    Automation Ideas
                  </Button>
                </div>

                {/* Financial Planning - Coming Soon */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Financial Planning (Coming Soon)</h4>
                  <Button variant="outline" className="w-full justify-start gap-2 opacity-50" disabled>
                    <Calculator className="h-4 w-4" />
                    Budget Planning
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2 opacity-50" disabled>
                    <PieChart className="h-4 w-4" />
                    ROI Analysis
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2 opacity-50" disabled>
                    <CreditCard className="h-4 w-4" />
                    Pricing Strategy
                  </Button>
                </div>

                {/* Industry-Specific - Coming Soon */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Industry-Specific (Coming Soon)</h4>
                  <Button variant="outline" className="w-full justify-start gap-2 opacity-50" disabled>
                    <Search className="h-4 w-4" />
                    Market Research
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2 opacity-50" disabled>
                    <Package className="h-4 w-4" />
                    Product Development
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2 opacity-50" disabled>
                    <Palette className="h-4 w-4" />
                    Creative Brief
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}