import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare, 
  FileText, 
  Clock, 
  CheckCircle, 
  Star, 
  Phone,
  Mail,
  Calendar,
  Download,
  Archive,
  Upload,
  Bot,
  CreditCard,
  Edit
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DocumentUpload } from "@/components/client/DocumentUpload";
import { AIChat } from "@/components/client/AIChat";
import { supabase } from "@/integrations/supabase/client";

export default function ClientDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedData, setEditedData] = useState({
    name: "Sarah Johnson",
    email: "sarah@example.com",
    phone: "+1 (555) 123-4567"
  });

  // Mock client data
  const clientData = {
    name: "Sarah Johnson",
    email: "sarah@example.com",
    phone: "+1 (555) 123-4567",
    memberSince: "January 2024",
    status: "Active"
  };

  const recentInteractions = [
    {
      id: 1,
      type: "AI Chat",
      message: "Asked about expense tracking for business trip",
      time: "2 hours ago",
      status: "completed"
    },
    {
      id: 2,
      type: "Document Request",
      message: "Monthly expense report generated",
      time: "1 day ago",
      status: "completed"
    },
    {
      id: 3,
      type: "Support",
      message: "Question about WhatsApp integration",
      time: "3 days ago",
      status: "resolved"
    }
  ];

  const documents = [
    {
      id: 1,
      name: "December 2024 Expense Report",
      type: "PDF",
      size: "245 KB",
      date: "Dec 30, 2024"
    },
    {
      id: 2,
      name: "AI Assistant Setup Guide",
      type: "PDF",
      size: "1.2 MB",
      date: "Dec 15, 2024"
    },
    {
      id: 3,
      name: "Integration Instructions",
      type: "PDF",
      size: "890 KB",
      date: "Dec 10, 2024"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src="/placeholder-avatar.jpg" />
                <AvatarFallback>SJ</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">Welcome back, {clientData.name}</h1>
                <p className="text-muted-foreground">Client Portal • Member since {clientData.memberSince}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                {clientData.status}
              </Badge>
              <Button variant="outline" size="sm">
                <Phone className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="chat">AI Chat</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">AI Interactions</p>
                      <p className="text-2xl font-bold">47</p>
                    </div>
                    <MessageSquare className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Documents</p>
                      <p className="text-2xl font-bold">12</p>
                    </div>
                    <FileText className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Requests Completed</p>
                      <p className="text-2xl font-bold">23</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Satisfaction</p>
                      <div className="flex items-center gap-1">
                        <p className="text-2xl font-bold">4.9</p>
                        <Star className="w-5 h-5 text-yellow-500 fill-current" />
                      </div>
                    </div>
                    <Star className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Interactions</CardTitle>
                  <CardDescription>Your latest AI assistant conversations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentInteractions.map((interaction) => (
                    <div key={interaction.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{interaction.type}</span>
                          <Badge variant="outline">
                            {interaction.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{interaction.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{interaction.time}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks and shortcuts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setActiveTab("chat")}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Start AI Conversation
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setActiveTab("upload")}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setActiveTab("documents")}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View Documents
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Consultation
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AI Assistant Tab */}
          <TabsContent value="chat" className="space-y-6">
            <div className="max-w-4xl mx-auto">
              <AIChat />
            </div>
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  External Platform Integration
                </CardTitle>
                <CardDescription>
                  Your AI assistant is also available through other platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Card className="border-dashed hover:border-primary/50 transition-colors cursor-pointer">
                    <CardContent className="p-6 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                        <MessageSquare className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Telegram</h3>
                        <p className="text-sm text-muted-foreground">
                          Chat with your AI assistant on Telegram
                        </p>
                      </div>
                      <Button size="sm">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Open Telegram
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-dashed hover:border-primary/50 transition-colors cursor-pointer">
                    <CardContent className="p-6 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                        <MessageSquare className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">WhatsApp</h3>
                        <p className="text-sm text-muted-foreground">
                          Get assistance through WhatsApp messages
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Open WhatsApp
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Documents</CardTitle>
                <CardDescription>
                  Access reports, guides, and other documents generated for you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{doc.name}</h4>
                          <p className="text-sm text-muted-foreground">{doc.size} • {doc.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Archive className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Document Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <DocumentUpload />
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Current Plan */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Current Plan
                  </CardTitle>
                  <CardDescription>Your active subscription details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">Premium Plan</h3>
                      <Badge className="bg-primary/10 text-primary border-primary/20">Active</Badge>
                    </div>
                    <p className="text-muted-foreground text-sm mb-3">
                      Full access to AI assistant, unlimited documents, and priority support
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold">$79<span className="text-lg font-normal">/month</span></span>
                      <span className="text-sm text-muted-foreground">Renews Jan 15, 2025</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Button 
                      className="w-full" 
                      onClick={async () => {
                        try {
                          const { data } = await supabase.functions.invoke('customer-portal');
                          if (data?.url) {
                            window.open(data.url, '_blank');
                          }
                        } catch (error) {
                          console.error('Error opening customer portal:', error);
                        }
                      }}
                    >
                      Manage Subscription
                    </Button>
                    <Button variant="outline" className="w-full">
                      View Invoice History
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                  <CardDescription>Your default payment method</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <CreditCard className="w-8 h-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">•••• •••• •••• 4242</p>
                      <p className="text-sm text-muted-foreground">Expires 12/2027</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    Update Payment Method
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Cancellation Policy */}
            <Card>
              <CardHeader>
                <CardTitle>Cancellation Policy</CardTitle>
                <CardDescription>Important information about subscription changes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                  <h4 className="font-semibold text-amber-800 mb-2">30-Day Notice Required</h4>
                  <p className="text-sm text-amber-700 mb-3">
                    To cancel your subscription, please provide at least 30 days notice before your next billing cycle. 
                    This ensures you have uninterrupted access to your data and services during the transition period.
                  </p>
                  <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                    <li>Cancellation requests must be submitted 30 days before renewal</li>
                    <li>You'll continue to have access until the end of your current billing period</li>
                    <li>All data will be retained for 90 days after cancellation</li>
                    <li>Refunds are not available for partial billing periods</li>
                  </ul>
                </div>
                
                <div className="flex gap-3">
                  <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                    Request Cancellation
                  </Button>
                  <Button variant="outline">
                    Contact Support
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Billing History */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Invoices</CardTitle>
                <CardDescription>Your billing history and payment records</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { date: "Dec 15, 2024", amount: "$79.00", status: "Paid", invoice: "INV-2024-12-001" },
                    { date: "Nov 15, 2024", amount: "$79.00", status: "Paid", invoice: "INV-2024-11-001" },
                    { date: "Oct 15, 2024", amount: "$79.00", status: "Paid", invoice: "INV-2024-10-001" }
                  ].map((invoice, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">{invoice.invoice}</p>
                          <p className="text-sm text-muted-foreground">{invoice.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{invoice.amount}</p>
                        <Badge variant="outline" className="text-green-600 border-green-200">
                          {invoice.status}
                        </Badge>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Your account details and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src="/placeholder-avatar.jpg" />
                    <AvatarFallback className="text-lg">SJ</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{isEditingProfile ? editedData.name : clientData.name}</h3>
                    <p className="text-muted-foreground">Premium Client</p>
                  </div>
                </div>

                {/* Contact Details Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                        <Edit className="w-4 h-4" />
                        Full Name
                      </Label>
                      {isEditingProfile ? (
                        <Input
                          id="name"
                          value={editedData.name}
                          onChange={(e) => setEditedData({...editedData, name: e.target.value})}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground px-3 py-2 bg-muted/50 rounded-md">{clientData.name}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email
                      </Label>
                      {isEditingProfile ? (
                        <Input
                          id="email"
                          type="email"
                          value={editedData.email}
                          onChange={(e) => setEditedData({...editedData, email: e.target.value})}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground px-3 py-2 bg-muted/50 rounded-md">{clientData.email}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Phone
                      </Label>
                      {isEditingProfile ? (
                        <Input
                          id="phone"
                          type="tel"
                          value={editedData.phone}
                          onChange={(e) => setEditedData({...editedData, phone: e.target.value})}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground px-3 py-2 bg-muted/50 rounded-md">{clientData.phone}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Member Since</p>
                        <p className="text-sm text-muted-foreground">{clientData.memberSince}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Status</p>
                        <p className="text-sm text-muted-foreground">{clientData.status}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <div className="flex flex-col sm:flex-row gap-3">
                    {isEditingProfile ? (
                      <>
                        <Button 
                          onClick={() => {
                            // Here you would save to backend
                            setIsEditingProfile(false);
                          }}
                        >
                          Save Changes
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setEditedData({
                              name: clientData.name,
                              email: clientData.email,
                              phone: clientData.phone
                            });
                            setIsEditingProfile(false);
                          }}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => setIsEditingProfile(true)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    )}
                    
                    <Button 
                      variant="outline"
                      onClick={() => setActiveTab("billing")}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Billing & Payment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}