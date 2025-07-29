import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, Mic, Plus, Receipt, Tag, Trash2, Edit3 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";

interface Expense {
  id: string;
  amount: number;
  title: string;
  description?: string;
  category: string;
  date: string;
  receipt_url?: string;
  status: string;
  created_at: string;
}

export function ExpenseTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    title: '',
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (user) {
      fetchExpenses();
    }
  }, [user]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('get-user-expenses', {
        body: { userId: user?.id }
      });
      
      if (error) throw error;
      setExpenses(data.expenses || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast({
        title: "Error",
        description: "Failed to fetch expenses",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createExpense = async () => {
    if (!formData.amount || !formData.title || !formData.category) {
      toast({
        title: "Error", 
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('create-expense', {
        body: {
          userId: user?.id,
          amount: parseFloat(formData.amount),
          title: formData.title,
          description: formData.description,
          category: formData.category,
          date: formData.date
        }
      });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Expense created successfully"
      });
      
      resetForm();
      setShowAddDialog(false);
      await fetchExpenses();
    } catch (error) {
      console.error('Error creating expense:', error);
      toast({
        title: "Error",
        description: "Failed to create expense",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateExpense = async () => {
    if (!editingExpense || !formData.amount || !formData.title || !formData.category) {
      toast({
        title: "Error", 
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('update-expense', {
        body: {
          expenseId: editingExpense.id,
          userId: user?.id,
          amount: parseFloat(formData.amount),
          title: formData.title,
          description: formData.description,
          category: formData.category,
          date: formData.date
        }
      });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Expense updated successfully"
      });
      
      resetForm();
      setEditingExpense(null);
      await fetchExpenses();
    } catch (error) {
      console.error('Error updating expense:', error);
      toast({
        title: "Error",
        description: "Failed to update expense",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      title: '',
      description: '',
      category: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      amount: expense.amount.toString(),
      title: expense.title,
      description: expense.description || '',
      category: expense.category,
      date: expense.date
    });
  };

  const deleteExpense = async (expenseId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.functions.invoke('delete-expense', {
        body: { expenseId, userId: user?.id }
      });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Expense deleted successfully"
      });
      
      await fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceRecord = async () => {
    // Check if integrations are set up
    const integrationConnected = localStorage.getItem('telegram_connected') === 'true' || 
                                localStorage.getItem('whatsapp_connected') === 'true';
    
    if (!integrationConnected) {
      toast({
        title: "Integration Required",
        description: "Please set up Telegram or WhatsApp integration first",
        variant: "destructive"
      });
      return;
    }

    setIsRecording(!isRecording);
    
    if (!isRecording) {
      toast({
        title: "Voice Recording Started",
        description: "Send a voice message via your connected app or speak now"
      });
      
      // Simulate voice recording timeout
      setTimeout(() => {
        if (isRecording) {
          setIsRecording(false);
          toast({
            title: "Recording Stopped",
            description: "Processing your voice command..."
          });
        }
      }, 30000); // 30 second timeout
    } else {
      toast({
        title: "Recording Stopped",
        description: "Processing your voice command..."
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Expense Tracker</h2>
          <p className="text-muted-foreground">Track and categorize your business expenses with AI assistance</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
              <DialogDescription>
                Quick expense entry with voice or photo options
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2"
                  onClick={handleVoiceRecord}
                >
                  <Mic className="h-4 w-4" />
                  Voice Entry
                </Button>
                <Button variant="outline" className="flex-1 gap-2">
                  <Receipt className="h-4 w-4" />
                  Photo Upload
                </Button>
              </div>
              
              <div className="text-center text-sm text-muted-foreground">
                or fill out manually below
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="modal-amount">Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="modal-amount" 
                      placeholder="0.00" 
                      className="pl-9"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modal-category">Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({...formData, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meals">Meals</SelectItem>
                      <SelectItem value="travel">Travel</SelectItem>
                      <SelectItem value="office">Office</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="software">Software</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="modal-title">Title</Label>
                <Input 
                  id="modal-title" 
                  placeholder="Expense title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setShowAddDialog(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={createExpense}
                  disabled={loading}
                >
                  {loading ? "Adding..." : "Add Expense"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="add" className="space-y-6">
        <TabsList>
          <TabsTrigger value="add">Add Expense</TabsTrigger>
          <TabsTrigger value="history">Expense History</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="add" className="space-y-6">
          {/* Voice Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Voice Expense Entry
              </CardTitle>
              <CardDescription>
                Say something like "Add $25 lunch expense at Joe's Cafe for client meeting"
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Button
                  onClick={handleVoiceRecord}
                  variant={isRecording ? "destructive" : "default"}
                  className="gap-2"
                >
                  <Mic className={`h-4 w-4 ${isRecording ? "animate-pulse" : ""}`} />
                  {isRecording ? "Stop Recording" : "Start Voice Entry"}
                </Button>
                {isRecording && (
                  <Badge variant="destructive" className="animate-pulse">
                    Recording...
                  </Badge>
                )}
              </div>
              {!isRecording && (
                <p className="text-sm text-muted-foreground mt-3">
                  Connect your Telegram or WhatsApp to enable voice commands from those apps
                </p>
              )}
            </CardContent>
          </Card>

          {/* Manual Entry Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Manual Entry
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="amount" 
                      placeholder="0.00" 
                      className="pl-9"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({...formData, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meals">Meals & Entertainment</SelectItem>
                      <SelectItem value="travel">Travel</SelectItem>
                      <SelectItem value="office">Office Supplies</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="software">Software</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input 
                  id="title" 
                  placeholder="Expense title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input 
                  id="description" 
                  placeholder="What was this expense for?"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="date" 
                    type="date" 
                    className="pl-9"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={createExpense}
                disabled={loading}
              >
                {loading ? "Adding..." : "Add Expense"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Expense History</CardTitle>
              <CardDescription>Your recent business expenses</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p>Loading expenses...</p>
                </div>
              ) : expenses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No expenses tracked yet</p>
                  <p className="text-sm">Add your first expense to see it here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {expenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <h4 className="font-medium">{expense.title}</h4>
                            <p className="text-sm text-muted-foreground">{expense.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          <Badge variant="outline">{expense.category}</Badge>
                          <span className="text-sm text-muted-foreground">{expense.date}</span>
                          <Badge variant={expense.status === 'approved' ? 'default' : 'secondary'}>
                            {expense.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-bold text-lg">${expense.amount.toFixed(2)}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEdit(expense)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => deleteExpense(expense.id)}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Expense Categories
              </CardTitle>
              <CardDescription>Manage your expense categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {["Meals & Entertainment", "Travel", "Office Supplies", "Marketing", "Software", "Other"].map((category) => {
                  const categoryExpenses = expenses.filter(exp => exp.category === category.toLowerCase().replace(/ & | /g, ''));
                  const categoryTotal = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
                  
                  return (
                    <div key={category} className="p-3 border rounded-lg hover:bg-muted/50">
                      <div className="font-medium">{category}</div>
                      <div className="text-sm text-muted-foreground">${categoryTotal.toFixed(2)} this month</div>
                      <div className="text-xs text-muted-foreground">{categoryExpenses.length} expenses</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Expense Dialog */}
      <Dialog open={!!editingExpense} onOpenChange={(open) => {
        if (!open) {
          setEditingExpense(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>
              Update expense details
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-amount">Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="edit-amount" 
                    placeholder="0.00" 
                    className="pl-9"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData({...formData, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meals">Meals</SelectItem>
                    <SelectItem value="travel">Travel</SelectItem>
                    <SelectItem value="office">Office</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="software">Software</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input 
                id="edit-title" 
                placeholder="Expense title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input 
                id="edit-description" 
                placeholder="What was this expense for?"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-date">Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="edit-date" 
                  type="date" 
                  className="pl-9"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setEditingExpense(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1" 
                onClick={updateExpense}
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Expense"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}