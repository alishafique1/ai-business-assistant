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
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

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
                if (/^[\d\w]*[.)\-*•]\s/.test(trimmedLine)) {
                  const cleanedLine = trimmedLine.replace(/^[\d\w]*[.)\-*•]\s*/, '').trim();
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
      const listItemRegex = /^[\d\w]*[.)\-*•]\s/;
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
              const cleanedLine = trimmedLine.replace(/^[\d\w]*[.)\-*•]\s*/, '').trim();
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

export function AIAssistant() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
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

  // Fetch knowledge base context for AI with caching
  const fetchKnowledgeBaseContext = async (): Promise<string> => {
    // Return cached context if available
    if (knowledgeBaseCached && knowledgeBaseContext) {
      console.log('📋 Using cached knowledge base context');
      return knowledgeBaseContext;
    }
    
    try {
      console.log('🔍 Generating knowledge base context from user data...');
      
      // Use localStorage data instead of external API
      const storedEntries = localStorage.getItem('knowledgeBase_entries');
      
      if (!storedEntries) {
        console.warn('No knowledge base entries found in localStorage');
        return '';
      }
      
      const userEntries = JSON.parse(storedEntries);
      console.log('✅ Found', userEntries.length, 'knowledge base entries');
      
      // Generate formatted context for AI
      let context = "=== USER BUSINESS CONTEXT ===\n\n";
      
      userEntries.forEach((entry, index) => {
        context += `Business ${index + 1}:\n`;
        context += `Company: ${entry.business_name}\n`;
        context += `Industry: ${entry.industry}\n`;
        context += `Target Audience: ${entry.target_audience}\n`;
        context += `Products & Services: ${entry.products_services}\n\n`;
      });
      
      context += "=== INSTRUCTIONS FOR AI ===\n";
      context += "Use this business context to provide personalized advice and recommendations.\n";
      context += "Reference the user's specific industry, target audience, and services when relevant.\n";
      
      if (context && context.length > 10) {
        console.log('📝 Generated knowledge base context (length:', context.length, 'chars)');
        // Cache the context
        setKnowledgeBaseContext(context);
        setKnowledgeBaseCached(true);
        localStorage.setItem('knowledgeBase_context', context);
        localStorage.setItem('knowledgeBase_cached', 'true');
        return context;
      } else {
        console.warn('⚠️ Knowledge base context is empty or too short');
        return '';
      }
    } catch (error) {
      console.warn('❌ Failed to fetch knowledge base context:', error);
      
      // Fallback: Try to generate context from localStorage entries
      try {
        const storedEntries = localStorage.getItem('knowledgeBase_entries');
        if (storedEntries) {
          const entries = JSON.parse(storedEntries);
          if (entries.length > 0) {
            const context = entries.map((entry: { business_name: string; industry: string; target_audience: string; products_services: string }) => 
              `Business: ${entry.business_name}\nIndustry: ${entry.industry}\nTarget Audience: ${entry.target_audience}\nProducts/Services: ${entry.products_services}`
            ).join('\n\n');
            console.log('📋 Using localStorage fallback context');
            return context;
          }
        }
      } catch (fallbackError) {
        console.warn('Failed to use localStorage fallback:', fallbackError);
      }
      
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
        ? `BUSINESS CONTEXT: ${knowledgeContext}\n\n---\n\nUSER REQUEST: ${userMessage.content}\n\nPlease use the business context above to provide personalized, relevant responses.`
        : userMessage.content;
      
      const response = await fetch('https://socialdots-ai-expense-backend.hf.space/generate', {
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

  // Content creation prompts
  const contentCreationPrompts = [
    "Could you please provide more details about the topic you want me to create content on?",
    "What is the main subject or theme you would like the content to focus on?", 
    "Who is the target audience for this content?",
    "What is the purpose of this content – to inform, persuade, entertain, or educate?",
    "Do you have a preferred tone or style for the content (formal, casual, professional, etc.)?",
    "How long should the content be – a short post, an article, or a detailed report?",
    "Are there any key points, keywords, or ideas that must be included?",
    "Do you want the content to be SEO-friendly, or just general writing?",
    "Should the content include examples, statistics, or references to support the information?",
    "When do you need the content to be completed, and will it be for online or offline use?"
  ];

  // Fetch expense data from both ML API and Supabase
  const fetchExpenseData = async () => {
    try {
      console.log('Fetching expense data from ML API and Supabase...');
      
      const [mlApiResponse, summaryResponse, businessExpensesResponse] = await Promise.all([
        fetch(`https://socialdots-ai-expense-backend.hf.space/get-my-expenses/${user?.id}`),
        fetch('https://socialdots-ai-expense-backend.hf.space/summary'),
        supabase
          .from('business_expenses')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
      ]);

      let allExpenses: Array<Record<string, unknown>> = [];
      let summaryData = {};

      // Process ML API expenses
      if (mlApiResponse.ok) {
        const mlExpenses = await mlApiResponse.json();
        console.log('ML API expenses:', mlExpenses);
        allExpenses = [...allExpenses, ...mlExpenses];
      } else {
        console.warn('Failed to fetch ML API expenses:', mlApiResponse.status);
      }

      // Process business_expenses from Supabase
      if (businessExpensesResponse.data) {
        const businessExpenses = businessExpensesResponse.data.map((expense: Record<string, unknown>) => ({
          ...expense,
          // Map business_expenses fields to match ML API format for consistency
          date: expense.expense_date,
          title: expense.description,
          amount: expense.amount
        }));
        console.log('Supabase business expenses:', businessExpenses);
        allExpenses = [...allExpenses, ...businessExpenses];
      }

      // Remove duplicates based on ID
      const expenses = allExpenses.filter((expense, index, arr) => 
        arr.findIndex(e => e.id === expense.id) === index
      );

      // Process summary
      if (summaryResponse.ok) {
        summaryData = await summaryResponse.json();
        console.log('Summary data:', summaryData);
      } else {
        console.warn('Failed to fetch summary:', summaryResponse.status);
        // Generate summary from expenses if API summary is not available
        if (expenses.length > 0) {
          const categoryTotals: Record<string, number> = {};
          expenses.forEach((expense: { category?: string; amount?: number }) => {
            const category = expense.category || 'Uncategorized';
            categoryTotals[category] = (categoryTotals[category] || 0) + (expense.amount || 0);
          });
          summaryData = { categories: categoryTotals };
        }
      }

      console.log('Combined expenses for AI:', expenses);
      return { expenses, summary: summaryData };
    } catch (error) {
      console.error('Error fetching expense data:', error);
      return { expenses: [], summary: {} };
    }
  };

  // Quick action handlers
  const handleQuickAction = async (actionType: string) => {
    let prompt = '';
    let contentType = '';
    
    switch (actionType) {
      case 'expense-summary': {
        // Fetch expense data and send directly as assistant message
        const expenseData = await fetchExpenseData();
        
        let assistantContent = '';
        
        // Check if there are any expenses  
        if (!expenseData.expenses || expenseData.expenses.length === 0) {
          assistantContent = `I don't see any expenses logged in your system yet. To get started with expense tracking and analysis, you can:

1. **Add your first expense** by going to the Expense Tracker section
2. **Upload receipt images** for automatic categorization  
3. **Manually log expenses** with categories like meals, travel, office supplies, etc.

Once you have some expense data, I'll be able to provide detailed analysis including monthly spending patterns, category breakdowns, budget recommendations, cost optimization insights, and tax-deductible expense identification.

Would you like me to help you set up your first expense entry or explain how the expense tracking system works?`;
        } else {
          // Calculate summary statistics
          const totalAmount = expenseData.expenses.reduce((sum: number, expense: { amount?: number }) => sum + (expense.amount || 0), 0);
          const expenseCount = expenseData.expenses.length;
          const avgExpense = totalAmount / expenseCount;
          
          // Calculate category breakdown
          const categoryTotals: Record<string, { amount: number; count: number }> = {};
          expenseData.expenses.forEach((expense: { category?: string; amount?: number }) => {
            const category = expense.category || 'Uncategorized';
            if (!categoryTotals[category]) {
              categoryTotals[category] = { amount: 0, count: 0 };
            }
            categoryTotals[category].amount += (expense.amount || 0);
            categoryTotals[category].count += 1;
          });
          
          // Sort categories by total amount (highest first)
          const sortedCategories = Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b.amount - a.amount);
          
          // Get recent expenses (last 5)
          const recentExpenses = expenseData.expenses
            .sort((a: { created_at?: string; date?: string }, b: { created_at?: string; date?: string }) => {
              const dateA = new Date(a.created_at || a.date || 0);
              const dateB = new Date(b.created_at || b.date || 0);
              return dateB.getTime() - dateA.getTime();
            })
            .slice(0, 5);
          
          // Create formatted summary
          assistantContent = `# 💰 Expense Summary

## 📊 Overview
• **Total Expenses:** ${expenseCount}
• **Total Amount:** $${totalAmount.toFixed(2)}
• **Average per Expense:** $${avgExpense.toFixed(2)}

## 📈 Category Breakdown
${sortedCategories.map(([category, data]) => {
  const percentage = ((data.amount / totalAmount) * 100).toFixed(1);
  return `• **${category}:** $${data.amount.toFixed(2)} (${data.count} expenses, ${percentage}%)`;
}).join('\n')}

## 🕒 Recent Expenses
${recentExpenses.map((expense: { title?: string; description?: string; amount?: number; category?: string; date?: string; created_at?: string }, index: number) => {
  const date = expense.date || expense.created_at;
  const formattedDate = date ? new Date(date).toLocaleDateString() : 'No date';
  return `${index + 1}. **${expense.title || expense.description || 'Unnamed expense'}**
   $${(expense.amount || 0).toFixed(2)} • ${expense.category || 'Uncategorized'} • ${formattedDate}`;
}).join('\n\n')}

## 💡 Insights
${sortedCategories.length > 0 ? `• Your highest spending category is **${sortedCategories[0][0]}** with $${sortedCategories[0][1].amount.toFixed(2)}` : ''}
${totalAmount > 1000 ? '• Consider reviewing expenses over $1,000 for potential cost savings' : ''}
${sortedCategories.length > 3 ? '• You have expenses across multiple categories - good diversification!' : ''}
${expenseCount > 10 ? '• Great job tracking your expenses regularly!' : '• Try to log more expenses for better insights'}`;
        }
        
        // Send the message directly from assistant
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: assistantContent,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
        return; // Exit early, don't proceed with normal flow
      }
      case 'create-content': {
        // Select random content creation prompt and send as assistant message
        const randomPrompt = contentCreationPrompts[Math.floor(Math.random() * contentCreationPrompts.length)];
        
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: randomPrompt,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
        return; // Exit early, don't proceed with normal flow
      }
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
        ? `BUSINESS CONTEXT: ${knowledgeContext}\n\n---\n\nUSER REQUEST: ${prompt}\n\nPlease use the business context above to provide personalized, relevant responses.`
        : prompt;
      
      const response = await fetch('https://socialdots-ai-expense-backend.hf.space/generate', {
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
          sampleRate: 44100,
        } 
      });

      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/mp4';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/wav';
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      const audioChunks: BlobPart[] = [];

      recorder.addEventListener('dataavailable', event => {
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
                              {msg.role === 'assistant' ? (
                                <FormattedAIContent content={msg.content} />
                              ) : (
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                              )}
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
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                        disabled={voiceSuggestionLoading}
                        className={isRecording ? "bg-red-100 border-red-300 text-red-700 hover:bg-red-200" : ""}
                      >
                        {voiceSuggestionLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Mic className={`h-4 w-4 ${isRecording ? 'animate-pulse' : ''}`} />
                        )}
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

              <div className="space-y-2">
                <Label>Voice Language</Label>
                <Button variant="outline" className="w-full justify-start">
                  English (US)
                </Button>
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