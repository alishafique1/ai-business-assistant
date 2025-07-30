import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, Mic, Plus, Receipt, Tag, Trash2, Edit3, Camera, Upload } from "lucide-react";
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
  originalCategory?: string;
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
  const [categorySummary, setCategorySummary] = useState<Record<string, { total: number; count: number }>>({});
  const [userCategories, setUserCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      fetchCategorySummary();
      fetchUserCategories();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchExpenses = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const response = await fetch('https://dawoodAhmad12-ai-expense-backend.hf.space/expenses', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch expenses');
      const data = await response.json();
      
      // Map the categories from ML API to our frontend category keys
      const mappedExpenses = data.map((expense: Expense) => ({
        ...expense,
        // Keep the original category for reference and create a mapped version
        originalCategory: expense.category,
        category: mapCategoryForDisplay(expense.category)
      }));
      
      setExpenses(mappedExpenses || []);
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

  const mapCategoryForDisplay = (mlCategory: string): string => {
    if (!mlCategory) return 'other';
    
    const normalizedMLCategory = mlCategory.trim();
    
    // First, check if this exact category exists in user's categories (case-insensitive)
    const existingCategory = userCategories.find(
      cat => cat.toLowerCase() === normalizedMLCategory.toLowerCase()
    );
    
    if (existingCategory) {
      // Return the category key for the existing category
      return existingCategory.toLowerCase().replace(/ & | /g, '');
    }
    
    // Map common ML categories to existing user categories
    const categoryMap: Record<string, string> = {
      // Food & Dining variations
      'food & dining': 'meals',
      'food': 'meals',
      'restaurant': 'meals',
      'dining': 'meals',
      'meal': 'meals',
      'grocery': 'meals',
      'groceries': 'meals',
      'supermarket': 'meals',
    };
    
    const normalizedCategory = normalizedMLCategory.toLowerCase();
    const mappedCategory = categoryMap[normalizedCategory];
    
    // If we have a mapping and the mapped category exists in user categories, use it
    if (mappedCategory) {
      const mappedExists = userCategories.find(
        cat => cat.toLowerCase().replace(/ & | /g, '') === mappedCategory
      );
      if (mappedExists) {
        return mappedCategory;
      }
    }
    
    // If the category was created dynamically, return its key
    const dynamicCategory = userCategories.find(
      cat => cat.toLowerCase() === normalizedMLCategory.toLowerCase()
    );
    
    if (dynamicCategory) {
      return dynamicCategory.toLowerCase().replace(/ & | /g, '');
    }
    
    // Fallback to other
    return 'other';
  };

  const fetchCategorySummary = async () => {
    try {
      const response = await fetch('https://dawoodAhmad12-ai-expense-backend.hf.space/summary', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.warn('Summary endpoint not available, using local calculations');
        return;
      }
      const data = await response.json();
      setCategorySummary(data || {});
    } catch (error) {
      console.error('Error fetching category summary:', error);
      // Don't show error toast for summary as it's not critical
      // Fall back to local calculations
    }
  };

  const fetchUserCategories = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('ai_settings')
        .select('system_prompt')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.warn('No user categories found, using defaults');
        setUserCategories(['Meals & Entertainment', 'Travel', 'Office Supplies', 'Marketing', 'Software', 'Other']);
        return;
      }
      
      if (data?.system_prompt) {
        // Extract categories from the system prompt that contains: "categorizing expenses into: Category1, Category2, etc."
        const categoriesMatch = data.system_prompt.match(/categorizing expenses into:\s*([^.]+)/i);
        if (categoriesMatch) {
          const categoriesString = categoriesMatch[1].trim();
          const categories = categoriesString.split(',').map(cat => cat.trim()).filter(cat => cat.length > 0);
          
          // Always ensure "Other" is included as fallback
          if (!categories.some(cat => cat.toLowerCase() === 'other')) {
            categories.push('Other');
          }
          
          setUserCategories(categories);
        } else {
          // Fallback to default categories
          setUserCategories(['Meals & Entertainment', 'Travel', 'Office Supplies', 'Marketing', 'Software', 'Other']);
        }
      } else {
        // Fallback to default categories
        setUserCategories(['Meals & Entertainment', 'Travel', 'Office Supplies', 'Marketing', 'Software', 'Other']);
      }
    } catch (error) {
      console.error('Error fetching user categories:', error);
      // Fallback to default categories
      setUserCategories(['Meals & Entertainment', 'Travel', 'Office Supplies', 'Marketing', 'Software', 'Other']);
    }
  };

  const addNewCategory = async (newCategory: string) => {
    if (!user?.id || !newCategory) return false;
    
    // Check if category already exists (case-insensitive)
    const categoryExists = userCategories.some(
      cat => cat.toLowerCase() === newCategory.toLowerCase()
    );
    
    if (categoryExists) {
      return false; // Category already exists
    }
    
    try {
      // Add the new category to the current list
      const updatedCategories = [...userCategories];
      // Insert before "Other" if it exists, otherwise add to end
      const otherIndex = updatedCategories.findIndex(cat => cat.toLowerCase() === 'other');
      if (otherIndex !== -1) {
        updatedCategories.splice(otherIndex, 0, newCategory);
      } else {
        updatedCategories.push(newCategory);
        updatedCategories.push('Other'); // Ensure Other is at the end
      }
      
      // Get current ai_settings
      const { data: currentSettings, error: fetchError } = await supabase
        .from('ai_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (fetchError) {
        console.error('Error fetching current settings:', fetchError);
        return false;
      }
      
      // Update the system prompt with new categories
      const categoriesString = updatedCategories.join(', ');
      let updatedSystemPrompt = currentSettings.system_prompt;
      
      if (updatedSystemPrompt) {
        // Replace the categories part in the existing system prompt
        updatedSystemPrompt = updatedSystemPrompt.replace(
          /categorizing expenses into:\s*([^.]+)/i,
          `categorizing expenses into: ${categoriesString}`
        );
      }
      
      // Update the database
      const { error: updateError } = await supabase
        .from('ai_settings')
        .update({
          system_prompt: updatedSystemPrompt
        })
        .eq('user_id', user.id);
      
      if (updateError) {
        console.error('Error updating categories:', updateError);
        return false;
      }
      
      // Update local state
      setUserCategories(updatedCategories);
      console.log(`Added new category: ${newCategory}`);
      return true;
      
    } catch (error) {
      console.error('Error adding new category:', error);
      return false;
    }
  };

  const findAndUpdateRecentExpense = async (originalCategory: string, newCategoryKey: string, amount: number) => {
    try {
      // Get the most recent expenses to find the one we just created
      const response = await fetch('https://dawoodAhmad12-ai-expense-backend.hf.space/expenses', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch expenses');
      const allExpenses = await response.json();
      
      // Find the most recent expense with matching category and amount
      const recentExpense = allExpenses.find((expense: Expense) => 
        expense.category === originalCategory && 
        expense.amount === amount &&
        // Check if it was created recently (within last 30 seconds)
        new Date().getTime() - new Date(expense.created_at).getTime() < 30000
      );
      
      if (recentExpense) {
        console.log(`Found recent expense ${recentExpense.id} to update category from "${originalCategory}" to "${newCategoryKey}"`);
        
        // Since your API doesn't have an update endpoint, we'll need to work with what we have
        // The expense will remain with the original category name in the database
        // but our frontend will map it correctly when displaying
        
        return recentExpense.id;
      }
      
      return null;
    } catch (error) {
      console.error('Error finding recent expense:', error);
      return null;
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
      
      // Convert category key back to full category name
      const fullCategoryName = userCategories.find(cat => 
        cat.toLowerCase().replace(/ & | /g, '') === formData.category
      ) || formData.category;
      
      const { data, error } = await supabase.functions.invoke('create-expense', {
        body: {
          userId: user?.id,
          amount: parseFloat(formData.amount),
          title: formData.title,
          description: formData.description,
          category: fullCategoryName,
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
      await fetchCategorySummary();
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
      
      // Convert category key back to full category name
      const fullCategoryName = userCategories.find(cat => 
        cat.toLowerCase().replace(/ & | /g, '') === formData.category
      ) || formData.category;
      
      const { data, error } = await supabase.functions.invoke('update-expense', {
        body: {
          expenseId: editingExpense.id,
          userId: user?.id,
          amount: parseFloat(formData.amount),
          title: formData.title,
          description: formData.description,
          category: fullCategoryName,
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
      await fetchCategorySummary();
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
      const response = await fetch(`https://dawoodAhmad12-ai-expense-backend.hf.space/expenses/${expenseId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to delete expense');
      
      toast({
        title: "Success",
        description: "Expense deleted successfully"
      });
      
      await fetchExpenses();
      await fetchCategorySummary();
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

  const handleReceiptUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file (JPG, PNG, etc.)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 10MB",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploadingReceipt(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

      // Call ML model to extract expense data
      const response = await fetch('https://dawoodAhmad12-ai-expense-backend.hf.space/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to process receipt');
      const data = await response.json();

      if (data?.amount && data?.category) {
        // Process the ML category and potentially create a new category
        const categoryResult = await mapCategoryFromML(data.category);
        
        toast({
          title: "Receipt Processed",
          description: `Extracted: $${data.amount} - ${categoryResult.categoryName}${categoryResult.isNewCategory ? ' (New Category!)' : ''}`,
        });

        // Log the extraction for debugging
        console.log('Receipt extraction result:', data);
        console.log('Category mapping result:', categoryResult);
        
        // If a new category was created, we need to refresh categories and then expenses
        if (categoryResult.isNewCategory) {
          // Wait a moment for the category to be fully processed
          setTimeout(async () => {
            await fetchUserCategories();
            await fetchExpenses();
            await fetchCategorySummary();
          }, 500);
        } else {
          // Refresh expenses list and category summary since ML API already created the expense
          await fetchExpenses();
          await fetchCategorySummary();
        }
      } else {
        toast({
          title: "No Data Found",
          description: "Could not extract expense data from this receipt",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error processing receipt:', error);
      toast({
        title: "Processing Failed",
        description: "Failed to process receipt. Please try again or enter manually.",
        variant: "destructive"
      });
    } finally {
      setUploadingReceipt(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const mapCategoryFromML = async (mlCategory: string): Promise<{ categoryKey: string; categoryName: string; isNewCategory: boolean }> => {
    if (!mlCategory) return { categoryKey: 'other', categoryName: 'Other', isNewCategory: false };
    
    const normalizedMLCategory = mlCategory.trim();
    
    // First, check if this exact category already exists in user's categories (case-insensitive)
    const existingCategory = userCategories.find(
      cat => cat.toLowerCase() === normalizedMLCategory.toLowerCase()
    );
    
    if (existingCategory) {
      // Return the exact case from user's categories
      return { 
        categoryKey: existingCategory.toLowerCase().replace(/ & | /g, ''), 
        categoryName: existingCategory,
        isNewCategory: false 
      };
    }
    
    // Map common ML categories to existing user categories
    const categoryMap: Record<string, string> = {
      // Food & Dining variations
      'food & dining': 'meals',
      'food': 'meals',
      'restaurant': 'meals',
      'dining': 'meals',
      'meal': 'meals',
      'grocery': 'meals',
      'groceries': 'meals',
      'supermarket': 'meals',
    };
    
    const normalizedCategory = normalizedMLCategory.toLowerCase();
    const mappedCategory = categoryMap[normalizedCategory];
    
    // If we have a mapping and the mapped category exists in user categories, use it
    if (mappedCategory) {
      const mappedExists = userCategories.find(
        cat => cat.toLowerCase().replace(/ & | /g, '') === mappedCategory
      );
      if (mappedExists) {
        return { 
          categoryKey: mappedCategory, 
          categoryName: mappedExists,
          isNewCategory: false 
        };
      }
    }
    
    // If no mapping exists, create a new category with the original ML category name
    const categoryAdded = await addNewCategory(normalizedMLCategory);
    
    if (categoryAdded) {
      toast({
        title: "New Category Created",
        description: `Added "${normalizedMLCategory}" to your categories`,
      });
      
      // Return the normalized key for the new category
      return { 
        categoryKey: normalizedMLCategory.toLowerCase().replace(/ & | /g, ''), 
        categoryName: normalizedMLCategory,
        isNewCategory: true 
      };
    }
    
    // Fallback to "other" if category creation failed
    return { categoryKey: 'other', categoryName: 'Other', isNewCategory: false };
  };

  const handlePhotoUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Expense Tracker</h2>
          <p className="text-muted-foreground">Track and categorize your business expenses with AI assistance</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) {
            resetForm();
            setIsRecording(false);
          }
        }}>
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
                Choose how you'd like to add your expense
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Primary Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={handleVoiceRecord}
                  disabled={isRecording}
                >
                  <Mic className={`h-6 w-6 ${isRecording ? 'animate-pulse text-red-500' : ''}`} />
                  <span className="text-sm">{isRecording ? 'Recording...' : 'Voice Entry'}</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={handlePhotoUpload}
                  disabled={uploadingReceipt}
                >
                  {uploadingReceipt ? (
                    <>
                      <Upload className="h-6 w-6 animate-spin" />
                      <span className="text-sm">Processing...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="h-6 w-6" />
                      <span className="text-sm">Upload Receipt</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleReceiptUpload}
                className="hidden"
              />
              
              {/* Show manual form only if data is populated from receipt or user wants manual entry */}
              {(formData.amount || formData.title || formData.category !== '') && (
                <>
                  <div className="text-center text-sm text-muted-foreground border-t pt-4">
                    Review and edit extracted data
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
                          {userCategories.map((category) => {
                            const categoryKey = category.toLowerCase().replace(/ & | /g, '');
                            return (
                              <SelectItem key={categoryKey} value={categoryKey}>
                                {category}
                              </SelectItem>
                            );
                          })}
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

                  <div className="space-y-2">
                    <Label htmlFor="modal-description">Description</Label>
                    <Input 
                      id="modal-description" 
                      placeholder="Additional details"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="modal-date">Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="modal-date" 
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
                </>
              )}
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
                      {userCategories.map((category) => {
                        const categoryKey = category.toLowerCase().replace(/ & | /g, '');
                        return (
                          <SelectItem key={categoryKey} value={categoryKey}>
                            {category}
                          </SelectItem>
                        );
                      })}
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
                {userCategories.map((category) => {
                  const categoryKey = category.toLowerCase().replace(/ & | /g, '');
                  const categoryExpenses = expenses.filter(exp => exp.category === categoryKey);
                  const categoryTotal = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
                  
                  // Use API summary data if available, otherwise fallback to local calculation
                  const summaryData = categorySummary[categoryKey] || categorySummary[category];
                  const displayTotal = summaryData?.total ?? categoryTotal;
                  const displayCount = summaryData?.count ?? categoryExpenses.length;
                  
                  return (
                    <div key={category} className="p-3 border rounded-lg hover:bg-muted/50">
                      <div className="font-medium">{category}</div>
                      <div className="text-sm text-muted-foreground">${displayTotal.toFixed(2)} total</div>
                      <div className="text-xs text-muted-foreground">{displayCount} expenses</div>
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
                    {userCategories.map((category) => {
                      const categoryKey = category.toLowerCase().replace(/ & | /g, '');
                      return (
                        <SelectItem key={categoryKey} value={categoryKey}>
                          {category}
                        </SelectItem>
                      );
                    })}
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