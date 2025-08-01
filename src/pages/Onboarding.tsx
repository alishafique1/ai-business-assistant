import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Check, MessageSquare, Bot, Settings, Rocket } from "lucide-react";

const steps = [
  {
    id: 1,
    title: "Business Information",
    description: "Tell us about your business",
    icon: Settings
  },
  {
    id: 2,
    title: "Choose Integration",
    description: "Connect Telegram or WhatsApp Business",
    icon: MessageSquare
  },
  {
    id: 3,
    title: "AI Configuration",
    description: "Customize your AI assistant",
    icon: Bot
  },
  {
    id: 4,
    title: "Knowledge Base",
    description: "Build your business knowledge base",
    icon: Settings
  },
  {
    id: 5,
    title: "Ready to Go!",
    description: "Start using your AI business assistant",
    icon: Rocket
  }
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasShownConfirmationToast, setHasShownConfirmationToast] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    industry: "",
    customIndustry: "",
    businessSize: "",
    integration: "",
    // WhatsApp config
    whatsappVerifyToken: "",
    whatsappAccessToken: "",
    whatsappPhoneNumberId: "",
    // Telegram config
    telegramBotToken: "",
    telegramWebhookSecret: "",
    aiName: "",
    responseStyle: "",
    categories: "",
    knowledgeBusinessName: "",
    knowledgeIndustry: "",
    targetAudience: "",
    productsServices: ""
  });
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Handle email confirmation redirect and auto-populate business name
  useEffect(() => {
    const handleAuthRedirect = async () => {
      // Check for error parameters in URL
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      const error = urlParams.get('error') || hashParams.get('error');
      const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');
      const errorCode = urlParams.get('error_code') || hashParams.get('error_code');

      if (error) {
        console.error('Auth error from URL:', { error, errorDescription, errorCode });
        
        if (!hasShownConfirmationToast) {
          if (errorCode === 'otp_expired' || errorDescription?.includes('expired')) {
            toast({
              title: "Link Expired",
              description: "The email confirmation link has expired. Please request a new one from the sign-in page.",
              variant: "destructive",
            });
            // Redirect to auth page after a delay
            setTimeout(() => {
              navigate('/auth?tab=signup');
            }, 3000);
          } else {
            toast({
              title: "Authentication Error",
              description: errorDescription || "There was an issue with email confirmation. Please try again.",
              variant: "destructive",
            });
          }
          setHasShownConfirmationToast(true);
        }
        return;
      }

      // Check for successful session
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Error getting session:', sessionError);
        if (!hasShownConfirmationToast) {
          toast({
            title: "Session Error",
            description: "Unable to verify your session. Please try signing in again.",
            variant: "destructive",
          });
          setHasShownConfirmationToast(true);
        }
      } else if (data.session && !hasShownConfirmationToast) {
        toast({
          title: "Email Confirmed!",
          description: "Your email has been successfully confirmed. Let's complete your setup.",
        });
        setHasShownConfirmationToast(true);
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    handleAuthRedirect();
  }, [toast, navigate, hasShownConfirmationToast]);

  // Auto-populate business name and industry from user metadata
  useEffect(() => {
    console.log('User data for auto-population:', user);
    console.log('User metadata:', user?.user_metadata);
    
    // Auto-populate business name in step 1 from signup data
    if (user?.user_metadata?.business_name && !formData.businessName) {
      console.log('Auto-populating business name in step 1:', user.user_metadata.business_name);
      updateFormData("businessName", user.user_metadata.business_name);
    }
    
    // Auto-populate knowledge base business name from step 1 or user metadata
    const businessNameSource = formData.businessName || user?.user_metadata?.business_name;
    if (businessNameSource && !formData.knowledgeBusinessName) {
      console.log('Auto-populating knowledge base business name:', businessNameSource);
      updateFormData("knowledgeBusinessName", businessNameSource);
    }
    
    // Auto-populate knowledge base industry from step 1
    const industrySource = formData.industry === "other" ? formData.customIndustry : formData.industry;
    if (industrySource && !formData.knowledgeIndustry) {
      console.log('Auto-populating knowledge base industry:', industrySource);
      updateFormData("knowledgeIndustry", industrySource);
    }
  }, [user, formData.businessName, formData.knowledgeBusinessName, formData.industry, formData.customIndustry, formData.knowledgeIndustry]);

  const saveKnowledgeBase = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save knowledge base",
        variant: "destructive",
      });
      return false;
    }

    try {
      console.log('Attempting to save knowledge base data to ML API:', {
        business_name: formData.knowledgeBusinessName,
        industry: formData.knowledgeIndustry,
        target_audience: formData.targetAudience,
        products_services: formData.productsServices,
      });

      // Save business information using ML API
      const response = await fetch('https://dawoodAhmad12-ai-expense-backend.hf.space/knowledge-base', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          business_name: formData.knowledgeBusinessName,
          industry: formData.knowledgeIndustry,
          target_audience: formData.targetAudience,
          products_services: formData.productsServices
        })
      });

      console.log('ML API POST response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ML API POST error:', errorText);
        throw new Error(`Failed to save knowledge base entry: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Knowledge base entry created successfully via ML API:', result);

      toast({
        title: "Knowledge Base Saved!",
        description: "Your business information has been saved to your knowledge base.",
      });

      return true;
    } catch (error) {
      console.error('Knowledge base error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save knowledge base",
        variant: "destructive",
      });
      return false;
    }
  };

  const saveOnboardingData = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to complete onboarding",
        variant: "destructive",
      });
      return false;
    }

    try {
      setIsLoading(true);

      // Create or update profile with business information
      const industryValue = formData.industry === "other" ? formData.customIndustry : formData.industry;
      
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          business_name: formData.businessName,
          industry: industryValue,
        })
        .eq('user_id', user.id);

      if (profileError) {
        throw profileError;
      }

      // Create or update AI settings with default categories
      const defaultCategories = 'Meals, Entertainment, Travel, Office Supplies, Marketing, Software, Other';
      const systemPrompt = `You are ${formData.aiName}, a helpful AI business assistant for ${formData.businessName}. 
Your response style is ${formData.responseStyle}. 
Help with business operations and categorize expenses into: ${defaultCategories}.`;

      const { error: aiError } = await supabase
        .from('ai_settings')
        .upsert({
          user_id: user.id,
          system_prompt: systemPrompt,
          response_style: formData.responseStyle,
          ai_name: formData.aiName,
        })
        .eq('user_id', user.id);

      if (aiError) {
        throw aiError;
      }

      // Create integration if selected (but not if skipped)
      if (formData.integration && formData.integration !== 'skip') {
        const integrationData: any = {
          user_id: user.id,
          type: formData.integration.toLowerCase(),
          name: formData.integration,
          enabled: true,
        };

        // Add configuration data based on integration type
        if (formData.integration === 'whatsapp') {
          integrationData.config = {
            verify_token: formData.whatsappVerifyToken,
            access_token: formData.whatsappAccessToken,
            phone_number_id: formData.whatsappPhoneNumberId,
          };
        } else if (formData.integration === 'telegram') {
          integrationData.config = {
            bot_token: formData.telegramBotToken,
            webhook_secret: formData.telegramWebhookSecret,
          };
        }

        const { error: integrationError } = await supabase
          .from('integrations')
          .insert(integrationData);

        if (integrationError) {
          console.error('Integration error:', integrationError);
          // Don't fail the entire onboarding if integration fails
        }
      }

      toast({
        title: "Onboarding Complete!",
        description: "Your AI business assistant is now set up and ready to use.",
      });

      return true;
    } catch (error) {
      console.error('Onboarding error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to complete onboarding",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 4) {
      // Save knowledge base data when leaving step 4
      const success = await saveKnowledgeBase();
      if (success) {
        setCurrentStep(currentStep + 1);
      }
    } else if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding by saving data
      const success = await saveOnboardingData();
      if (success) {
        navigate("/dashboard");
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Check if current step can proceed
  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1: // Business Information step
        const industryValue = formData.industry === "other" ? formData.customIndustry : formData.industry;
        return !!(
          formData.businessName?.trim() &&
          industryValue?.trim() &&
          formData.businessSize?.trim()
        );
      
      case 2: // Integration step
        // Next button should only be enabled if integration is selected AND configured
        if (!formData.integration || formData.integration === 'skip') return false;
        if (formData.integration === 'whatsapp') {
          return !!(
            formData.whatsappVerifyToken?.trim() && 
            formData.whatsappAccessToken?.trim() && 
            formData.whatsappPhoneNumberId?.trim()
          );
        }
        if (formData.integration === 'telegram') {
          return !!(
            formData.telegramBotToken?.trim() && 
            formData.telegramWebhookSecret?.trim()
          );
        }
        return false;
      
      case 3: // AI Configuration step
        return !!(
          formData.aiName?.trim() &&
          formData.responseStyle?.trim()
        );
      
      case 4: // Knowledge Base step
        return !!(
          formData.targetAudience?.trim() &&
          formData.productsServices?.trim()
        );
      
      default:
        return true;
    }
  };

  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to Your AI Business Assistant</h1>
          <p className="text-muted-foreground mb-6">Let's get you set up in just a few minutes</p>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">Step {currentStep} of {steps.length}</p>
        </div>

        {/* Step Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
                    ${isActive ? 'border-primary bg-primary text-primary-foreground' : 
                      isCompleted ? 'border-primary bg-primary text-primary-foreground' : 
                      'border-muted-foreground text-muted-foreground'}
                  `}>
                    {isCompleted ? <Check className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-12 h-0.5 mx-2 ${isCompleted ? 'bg-primary' : 'bg-muted'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].title}</CardTitle>
            <CardDescription>{steps[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="businessName">Business Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => updateFormData("businessName", e.target.value)}
                    placeholder="Enter your business name"
                    className={!formData.businessName?.trim() ? "border-red-300 focus:border-red-500" : ""}
                  />
                  {formData.businessName && user?.user_metadata?.business_name === formData.businessName && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ✓ Auto-filled from your signup information. You can edit this if needed.
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="industry">Industry <span className="text-red-500">*</span></Label>
                  <Select value={formData.industry} onValueChange={(value) => {
                    updateFormData("industry", value);
                    if (value !== "other") {
                      updateFormData("customIndustry", "");
                    }
                  }}>
                    <SelectTrigger className={!formData.industry ? "border-red-300 focus:border-red-500" : ""}>
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consulting">Consulting</SelectItem>
                      <SelectItem value="ecommerce">E-commerce</SelectItem>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="services">Professional Services</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.industry === "other" && (
                    <div className="mt-2">
                      <Input
                        placeholder="Please specify your industry"
                        value={formData.customIndustry}
                        onChange={(e) => updateFormData("customIndustry", e.target.value)}
                        className={formData.industry === "other" && !formData.customIndustry?.trim() ? "border-red-300 focus:border-red-500" : ""}
                      />
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="businessSize">Business Size <span className="text-red-500">*</span></Label>
                  <Select value={formData.businessSize} onValueChange={(value) => updateFormData("businessSize", value)}>
                    <SelectTrigger className={!formData.businessSize ? "border-red-300 focus:border-red-500" : ""}>
                      <SelectValue placeholder="Select business size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solo">Solo entrepreneur</SelectItem>
                      <SelectItem value="small">Small team (2-10 people)</SelectItem>
                      <SelectItem value="medium">Medium business (11-50 people)</SelectItem>
                      <SelectItem value="large">Large business (50+ people)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <Label>Choose Your Integration Platform</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <Card 
                      className={`cursor-pointer transition-colors ${formData.integration === 'telegram' ? 'border-primary bg-primary/10' : ''}`}
                      onClick={() => updateFormData("integration", "telegram")}
                    >
                      <CardContent className="p-6 text-center">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 text-primary" />
                        <h3 className="font-semibold mb-2">Telegram</h3>
                        <p className="text-sm text-muted-foreground">
                          Free, secure, and works worldwide. Perfect for personal and business use.
                        </p>
                      </CardContent>
                    </Card>
                    <Card 
                      className={`cursor-pointer transition-colors ${formData.integration === 'whatsapp' ? 'border-primary bg-primary/10' : ''}`}
                      onClick={() => updateFormData("integration", "whatsapp")}
                    >
                      <CardContent className="p-6 text-center">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 text-primary" />
                        <h3 className="font-semibold mb-2">WhatsApp Business</h3>
                        <p className="text-sm text-muted-foreground">
                          Connect with the platform your customers already use daily.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Skip Option */}
                  <div className="mt-6 p-4 border border-dashed border-muted-foreground/30 rounded-lg">
                    <div className="text-center space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Not ready to integrate yet?
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          updateFormData("integration", "skip");
                          setCurrentStep(currentStep + 1);
                        }}
                        className="border-dashed"
                      >
                        Skip for now - I'll set this up later
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        You can configure integration later from the dashboard
                      </p>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Setup Instructions */}
                {formData.integration === 'whatsapp' && (
                  <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-4">WhatsApp Business API Setup</h3>
                    <div className="space-y-4 text-sm text-blue-800">
                      <div>
                        <h4 className="font-medium mb-2">Step 1: Create a Meta Business Account</h4>
                        <p>Visit <a href="https://business.facebook.com" target="_blank" rel="noopener noreferrer" className="underline">business.facebook.com</a> and create an account if you don't have one.</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Step 2: Set up WhatsApp Business API</h4>
                        <p>Go to Meta for Developers, create an app, and add WhatsApp Business API product.</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Step 3: Get your credentials</h4>
                        <p>From your WhatsApp Business API dashboard, copy the required tokens and IDs below.</p>
                      </div>
                    </div>
                    
                    <div className="mt-6 space-y-4">
                      <div>
                        <Label htmlFor="whatsappVerifyToken">WhatsApp Verify Token</Label>
                        <Input
                          id="whatsappVerifyToken"
                          value={formData.whatsappVerifyToken}
                          onChange={(e) => updateFormData("whatsappVerifyToken", e.target.value)}
                          placeholder="Custom token you choose for webhook verification"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Create a custom token for webhook verification</p>
                      </div>
                      <div>
                        <Label htmlFor="whatsappAccessToken">WhatsApp Access Token</Label>
                        <Input
                          id="whatsappAccessToken"
                          value={formData.whatsappAccessToken}
                          onChange={(e) => updateFormData("whatsappAccessToken", e.target.value)}
                          placeholder="From Meta Business account"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Get this from your Meta Business account dashboard</p>
                      </div>
                      <div>
                        <Label htmlFor="whatsappPhoneNumberId">WhatsApp Phone Number ID</Label>
                        <Input
                          id="whatsappPhoneNumberId"
                          value={formData.whatsappPhoneNumberId}
                          onChange={(e) => updateFormData("whatsappPhoneNumberId", e.target.value)}
                          placeholder="From WhatsApp Business API setup"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Find this in your WhatsApp Business API configuration</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Telegram Setup Instructions */}
                {formData.integration === 'telegram' && (
                  <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-4">Telegram Bot Setup</h3>
                    <div className="space-y-4 text-sm text-blue-800">
                      <div>
                        <h4 className="font-medium mb-2">Step 1: Create a Telegram Bot</h4>
                        <p>Message <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="underline">@BotFather</a> on Telegram and use the /newbot command.</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Step 2: Get Bot Token</h4>
                        <p>After creating your bot, @BotFather will provide you with a bot token. Copy this token.</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Step 3: Configure Webhook</h4>
                        <p>Create a custom webhook secret for security. This can be any random string you choose.</p>
                      </div>
                    </div>
                    
                    <div className="mt-6 space-y-4">
                      <div>
                        <Label htmlFor="telegramBotToken">Telegram Bot Token</Label>
                        <Input
                          id="telegramBotToken"
                          value={formData.telegramBotToken}
                          onChange={(e) => updateFormData("telegramBotToken", e.target.value)}
                          placeholder="From @BotFather when you create the bot"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Get this from @BotFather after creating your bot</p>
                      </div>
                      <div>
                        <Label htmlFor="telegramWebhookSecret">Telegram Webhook Secret</Label>
                        <Input
                          id="telegramWebhookSecret"
                          value={formData.telegramWebhookSecret}
                          onChange={(e) => updateFormData("telegramWebhookSecret", e.target.value)}
                          placeholder="Custom secret for webhook security"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Create a custom secret for webhook security</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="aiName">AI Assistant Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="aiName"
                    value={formData.aiName}
                    onChange={(e) => updateFormData("aiName", e.target.value)}
                    placeholder="e.g., Alex, BusinessBot, Assistant"
                    className={!formData.aiName?.trim() ? "border-red-300 focus:border-red-500" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="responseStyle">Response Style <span className="text-red-500">*</span></Label>
                  <Select value={formData.responseStyle} onValueChange={(value) => updateFormData("responseStyle", value)}>
                    <SelectTrigger className={!formData.responseStyle ? "border-red-300 focus:border-red-500" : ""}>
                      <SelectValue placeholder="How should your AI respond?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional & Formal</SelectItem>
                      <SelectItem value="friendly">Friendly & Casual</SelectItem>
                      <SelectItem value="concise">Concise & Direct</SelectItem>
                      <SelectItem value="detailed">Detailed & Helpful</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg border">
                  <h4 className="font-medium mb-2">Default Expense Categories</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    We've set up basic categories for you. You can edit, create, and remove them from the dashboard settings.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['Meals', 'Entertainment', 'Travel', 'Office Supplies', 'Marketing', 'Software', 'Other'].map((category) => (
                      <span key={category} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="mb-4">
                  <p className="text-muted-foreground">
                    Help your AI assistant understand your business better by providing detailed information that will be used to give you more personalized responses.
                  </p>
                </div>
                <div>
                  <Label htmlFor="knowledgeBusinessName">Business Name</Label>
                  <Input
                    id="knowledgeBusinessName"
                    value={formData.knowledgeBusinessName}
                    disabled
                    placeholder="Business name will be auto-filled from step 1"
                    className="bg-muted cursor-not-allowed"
                  />
                  {formData.knowledgeBusinessName && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ✓ Auto-filled from step 1. To change this, go back to Business Information step.
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="knowledgeIndustry">Industry</Label>
                  <Input
                    id="knowledgeIndustry"
                    value={formData.knowledgeIndustry}
                    disabled
                    placeholder="Industry will be auto-filled from step 1"
                    className="bg-muted cursor-not-allowed"
                  />
                  {formData.knowledgeIndustry && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ✓ Auto-filled from step 1. To change this, go back to Business Information step.
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="targetAudience">Target Audience <span className="text-red-500">*</span></Label>
                  <Textarea
                    id="targetAudience"
                    value={formData.targetAudience}
                    onChange={(e) => updateFormData("targetAudience", e.target.value)}
                    placeholder="Describe your target customers and their characteristics"
                    rows={3}
                    className={!formData.targetAudience?.trim() ? "border-red-300 focus:border-red-500" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="productsServices">Products/Services <span className="text-red-500">*</span></Label>
                  <Textarea
                    id="productsServices"
                    value={formData.productsServices}
                    onChange={(e) => updateFormData("productsServices", e.target.value)}
                    placeholder="Describe your products or services in detail"
                    rows={4}
                    className={!formData.productsServices?.trim() ? "border-red-300 focus:border-red-500" : ""}
                  />
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="text-center space-y-6">
                <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <Rocket className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">You're All Set!</h3>
                  <p className="text-muted-foreground">
                    Your AI business assistant is configured and ready to help you manage expenses, 
                    interact with customers, and streamline your business operations.
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Next Steps:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {formData.integration === 'skip' ? (
                      <li>• Set up your integration platform when ready (Telegram or WhatsApp Business)</li>
                    ) : (
                      <li>• Test out your {formData.integration === 'telegram' ? 'Telegram' : 'WhatsApp Business'} integration</li>
                    )}
                    <li>• Configure your voice commands</li>
                    <li>• Start tracking your business expenses</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              <div className="flex flex-col items-end">
                <Button onClick={handleNext} disabled={isLoading || !canProceedToNextStep()}>
                  {isLoading ? "Setting up..." : 
                   currentStep === 4 ? "Save Knowledge Base" :
                   currentStep === steps.length ? "Complete Setup" : "Next"}
                </Button>
                {currentStep === 2 && !canProceedToNextStep() && formData.integration && formData.integration !== 'skip' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Please fill in all {formData.integration === 'whatsapp' ? 'WhatsApp' : 'Telegram'} configuration fields
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}