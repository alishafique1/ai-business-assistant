import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
    title: "Ready to Go!",
    description: "Start using your AI business assistant",
    icon: Rocket
  }
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    businessName: "",
    industry: "",
    businessSize: "",
    primaryUse: "",
    integration: "",
    aiName: "",
    responseStyle: "",
    categories: ""
  });
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      navigate("/dashboard");
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
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => updateFormData("businessName", e.target.value)}
                    placeholder="Enter your business name"
                  />
                </div>
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Select onValueChange={(value) => updateFormData("industry", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consulting">Consulting</SelectItem>
                      <SelectItem value="ecommerce">E-commerce</SelectItem>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="services">Professional Services</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="businessSize">Business Size</Label>
                  <Select onValueChange={(value) => updateFormData("businessSize", value)}>
                    <SelectTrigger>
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
                </div>
                <div>
                  <Label htmlFor="primaryUse">Primary Use Case</Label>
                  <Select onValueChange={(value) => updateFormData("primaryUse", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="What will you primarily use this for?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense-tracking">Expense Tracking</SelectItem>
                      <SelectItem value="customer-support">Customer Support</SelectItem>
                      <SelectItem value="lead-generation">Lead Generation</SelectItem>
                      <SelectItem value="order-management">Order Management</SelectItem>
                      <SelectItem value="appointment-booking">Appointment Booking</SelectItem>
                      <SelectItem value="general-assistance">General Business Assistance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="aiName">AI Assistant Name</Label>
                  <Input
                    id="aiName"
                    value={formData.aiName}
                    onChange={(e) => updateFormData("aiName", e.target.value)}
                    placeholder="e.g., Alex, BusinessBot, Assistant"
                  />
                </div>
                <div>
                  <Label htmlFor="responseStyle">Response Style</Label>
                  <Select onValueChange={(value) => updateFormData("responseStyle", value)}>
                    <SelectTrigger>
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
                <div>
                  <Label htmlFor="categories">Default Expense Categories</Label>
                  <Textarea
                    id="categories"
                    value={formData.categories}
                    onChange={(e) => updateFormData("categories", e.target.value)}
                    placeholder="e.g., Travel, Meals, Office Supplies, Marketing, Software"
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Separate categories with commas. You can always modify these later.
                  </p>
                </div>
              </div>
            )}

            {currentStep === 4 && (
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
                    <li>• Connect your {formData.integration === 'telegram' ? 'Telegram' : 'WhatsApp Business'} account</li>
                    <li>• Configure your voice commands</li>
                    <li>• Set up expense categories</li>
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
              <Button onClick={handleNext}>
                {currentStep === steps.length ? "Go to Dashboard" : "Next"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}