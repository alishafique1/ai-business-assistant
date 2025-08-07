import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Component to format AI assistant responses with proper structure
function FormattedAIContent({ content }: { content: string }) {
  // Enhanced formatting function for AI responses
  const formatContent = (text: string) => {
    // Split content by double newlines to create sections
    const sections = text.split(/\n\s*\n/);
    
    return sections.map((section, sectionIndex) => {
      const trimmedSection = section.trim();
      if (!trimmedSection) return null;

      // Check for headers (lines that end with : or are in ALL CAPS)
      const headerRegex = /^[A-Z\s]+:?\s*$|^.*:$/;
      const lines = trimmedSection.split('\n');
      
      // Check if first line is a header
      const firstLine = lines[0]?.trim();
      const isHeader = headerRegex.test(firstLine) && lines.length > 1;
      
      if (isHeader) {
        const headerText = firstLine.replace(/:$/, '');
        const contentLines = lines.slice(1).filter(line => line.trim());
        
        return (
          <div key={sectionIndex} className="mb-4">
            <h4 className="font-semibold text-sm mb-3 text-primary">
              {headerText}
            </h4>
            <div className="ml-2">
              {contentLines.map((line, lineIndex) => {
                const trimmedLine = line.trim();
                
                // Check if this line is a list item
                if (/^[\d\w]*[\.\)\-\*•]\s/.test(trimmedLine)) {
                  const cleanedLine = trimmedLine.replace(/^[\d\w]*[\.\)\-\*•]\s*/, '').trim();
                  return (
                    <div key={lineIndex} className="mb-1 pl-4 relative">
                      <span className="absolute left-0 top-0 text-primary">•</span>
                      <span className="text-sm">{cleanedLine}</span>
                    </div>
                  );
                } else {
                  return (
                    <p key={lineIndex} className="text-sm mb-2 leading-relaxed">
                      {trimmedLine}
                    </p>
                  );
                }
              })}
            </div>
          </div>
        );
      }
      
      // Check if section is a list (multiple lines with list markers)
      const listItemRegex = /^[\d\w]*[\.\)\-\*•]\s/;
      const isList = lines.length > 1 && lines.filter(line => line.trim()).some(line => listItemRegex.test(line.trim()));
      
      if (isList) {
        // Handle as a list
        const listItems = lines
          .filter(line => line.trim())
          .map((line, lineIndex) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return null;
            
            // Check if this is a list item or just text
            if (listItemRegex.test(trimmedLine)) {
              const cleanedLine = trimmedLine.replace(/^[\d\w]*[\.\)\-\*•]\s*/, '').trim();
              return (
                <div key={lineIndex} className="mb-2 pl-4 relative">
                  <span className="absolute left-0 top-0 text-primary">•</span>
                  <span className="text-sm">{cleanedLine}</span>
                </div>
              );
            } else {
              // Non-list line within a list section
              return (
                <p key={lineIndex} className="text-sm mb-2 leading-relaxed">
                  {trimmedLine}
                </p>
              );
            }
          })
          .filter(Boolean);

        return (
          <div key={sectionIndex} className="mb-4">
            {listItems}
          </div>
        );
      } else {
        // Handle as paragraph(s)
        const paragraphLines = lines.filter(line => line.trim());
        
        return (
          <div key={sectionIndex} className="mb-4">
            {paragraphLines.map((line, lineIndex) => {
              const trimmedLine = line.trim();
              
              // Check if line might be a subheading (shorter, ends with :)
              if (trimmedLine.endsWith(':') && trimmedLine.length < 50) {
                return (
                  <h5 key={lineIndex} className="font-medium text-sm mb-2 text-foreground">
                    {trimmedLine.replace(/:$/, '')}
                  </h5>
                );
              }
              
              return (
                <p key={lineIndex} className="text-sm mb-2 leading-relaxed">
                  {trimmedLine}
                </p>
              );
            })}
          </div>
        );
      }
    }).filter(Boolean);
  };

  return (
    <div className="formatted-ai-content">
      {formatContent(content)}
    </div>
  );
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant. I can help you with document management, business questions, and more. How can I assist you today?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Set conversation ID for the chat session
  useEffect(() => {
    if (user) {
      // Generate a simple conversation ID based on user and timestamp
      setConversationId(`${user.id}-${Date.now()}`);
    }
  }, [user]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: userMessage.content,
          conversationId,
          userId: user.id
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AI Assistant
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground ml-auto'
                      : 'bg-muted'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <FormattedAIContent content={message.content} />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}
                  <p className={`text-xs mt-1 opacity-70 ${
                    message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>

                {message.role === 'user' && (
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Typing...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isLoading || !user}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading || !user}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          {!user && (
            <p className="text-xs text-muted-foreground mt-2">
              Please sign in to use the AI assistant
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}