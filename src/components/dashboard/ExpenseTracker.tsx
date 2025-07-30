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
import { useCurrency } from "@/hooks/useCurrency";

interface Expense {
  id: string;
  amount: number;
  title?: string;
  description?: string;
  category: string;
  originalCategory?: string;
  date?: string;
  created_at?: string;
  receipt_url?: string;
  status?: string;
  user_id?: string;
}

export function ExpenseTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { formatAmount } = useCurrency();
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
      
      // Ensure user categories are loaded before fetching expenses
      if (userCategories.length === 0) {
        console.log('User categories not loaded yet, fetching categories first...');
        await fetchUserCategories();
      }
      
      // Fetch expenses from both ML API and Supabase
      const [mlApiResponse, supabaseResponse] = await Promise.all([
        fetch('https://dawoodAhmad12-ai-expense-backend.hf.space/expenses', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }),
        supabase.functions.invoke('get-user-expenses', {
          body: { userId: user?.id }
        })
      ]);
      
      let allExpenses: Expense[] = [];
      
      // Process ML API expenses
      if (mlApiResponse.ok) {
        const mlExpenses = await mlApiResponse.json();
        console.log('ML API expenses:', mlExpenses);
        allExpenses = [...allExpenses, ...mlExpenses];
      }
      
      // Process Supabase expenses
      if (supabaseResponse.data?.expenses) {
        const supabaseExpenses = supabaseResponse.data.expenses;
        console.log('Supabase expenses:', supabaseExpenses);
        allExpenses = [...allExpenses, ...supabaseExpenses];
      }
      
      console.log('Combined expenses:', allExpenses);
      
      // Remove duplicates based only on exact ID match (not amount/title)
      const uniqueExpenses = allExpenses.filter((expense, index, arr) => 
        arr.findIndex(e => e.id === expense.id) === index
      );
      
      // Map the categories and fix title/description field issues
      const mappedExpenses = uniqueExpenses.map((expense: Expense) => {
        // Fix title/description mapping issue - if title is empty but description exists, swap them
        let fixedExpense = { ...expense };
        if (!expense.title && expense.description) {
          fixedExpense = {
            ...expense,
            title: expense.description,
            description: ''
          };
        }
        
        return {
          ...fixedExpense,
          // Keep the original category for reference and create a mapped version
          originalCategory: fixedExpense.category,
          category: mapCategoryForDisplay(fixedExpense.category)
        };
      });
      
      // Sort expenses by date (latest first - newest at top)
      const sortedExpenses = mappedExpenses.sort((a, b) => {
        const dateA = new Date(a.date || a.created_at || 0);
        const dateB = new Date(b.date || b.created_at || 0);
        return dateA.getTime() - dateB.getTime(); // Reverse sort to fix display order
      });
      
      setExpenses(sortedExpenses || []);
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
    
    // Enhanced mapping for common ML categories to existing user categories
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
      'meals & entertainment': 'meals',
      
      // Travel variations
      'travel': 'travel',
      'transportation': 'travel',
      'hotel': 'travel',
      'flights': 'travel',
      'accommodation': 'travel',
      
      // Health & Wellness variations
      'health & wellness': 'other', // Map to other since it's not in default categories
      'health': 'other',
      'wellness': 'other',
      'medical': 'other',
      
      // Office/Business variations
      'office supplies': 'officesupplies',
      'supplies': 'officesupplies',
      'business': 'other',
      
      // Software variations
      'software': 'software',
      'technology': 'software',
      'tech': 'software',
      'subscription': 'software',
      
      // Marketing variations
      'marketing': 'marketing',
      'advertising': 'marketing',
      'promotion': 'marketing'
    };
    
    const normalizedCategory = normalizedMLCategory.toLowerCase();
    const mappedCategory = categoryMap[normalizedCategory];
    
    // If we have a mapping, use it
    if (mappedCategory) {
      return mappedCategory;
    }
    
    // Check if the category name matches any user category when spaces/symbols are removed
    const categoryKeyFromML = normalizedMLCategory.toLowerCase().replace(/[ &]/g, '');
    const matchingUserCategory = userCategories.find(
      cat => cat.toLowerCase().replace(/[ &]/g, '') === categoryKeyFromML
    );
    
    if (matchingUserCategory) {
      return matchingUserCategory.toLowerCase().replace(/[ &]/g, '');
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
      
      console.log('Creating manual expense via Supabase function:', {
        userId: user?.id,
        amount: parseFloat(formData.amount),
        title: formData.title,
        description: formData.description,
        category: fullCategoryName,
        date: formData.date
      });

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

      console.log('Supabase create-expense response:', { data, error });

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
      
      console.log('Updating expense via ML API - delete and recreate approach');
      
      // Step 1: Delete the existing expense from ML API
      const deleteResponse = await fetch(`https://dawoodAhmad12-ai-expense-backend.hf.space/expenses/${editingExpense.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!deleteResponse.ok) {
        throw new Error('Failed to delete old expense');
      }

      // Step 2: Create a new expense with updated data via Supabase function
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
    console.log('Editing expense:', expense);
    setEditingExpense(expense);
    
    // Handle date field - use date if available, otherwise use created_at
    const dateValue = expense.date || expense.created_at || new Date().toISOString().split('T')[0];
    
    setFormData({
      amount: expense.amount.toString(),
      title: expense.title || '',
      description: expense.description || '',
      category: expense.category || '',
      date: dateValue
    });
    
    console.log('Form data set to:', {
      amount: expense.amount.toString(),
      title: expense.title || '',
      description: expense.description || '',
      category: expense.category || '',
      date: dateValue
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
      console.log('Uploading receipt to ML API...');
      const response = await fetch('https://dawoodAhmad12-ai-expense-backend.hf.space/upload', {
        method: 'POST',
        body: formData,
      });

      console.log('ML API upload response status:', response.status);
      
      if (!response.ok) throw new Error('Failed to process receipt');
      const data = await response.json();
      
      console.log('ML API upload response data:', data);

      if (data?.amount && data?.category) {
        // Process the ML category and potentially create a new category
        const categoryResult = await mapCategoryFromML(data.category);
        
        // Log the extraction for debugging
        console.log('Receipt extraction result:', data);
        console.log('Category mapping result:', categoryResult);
        
        // Check for potential duplicates in existing expenses
        const isDuplicate = expenses.some(expense => 
          expense.amount === data.amount && 
          expense.title === data.title &&
          Math.abs(new Date(expense.created_at || expense.date || '').getTime() - new Date().getTime()) < 24 * 60 * 60 * 1000 // Within 24 hours
        );
        
        if (isDuplicate) {
          toast({
            title: "⚠️ Duplicate Receipt Warning",
            description: `Similar expense found, but added anyway: ${formatAmount(data.amount)} - ${categoryResult.categoryName}`,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Receipt Processed Successfully",
            description: `New expense added: ${formatAmount(data.amount)} - ${categoryResult.categoryName}${categoryResult.isNewCategory ? ' (New Category!)' : ''}`,
          });
        }
        
        // Always refresh expenses list and category summary (expense should be added regardless)
        await fetchExpenses();
        await fetchCategorySummary();
        
        // If a new category was created, refresh categories
        if (categoryResult.isNewCategory) {
          setTimeout(async () => {
            await fetchUserCategories();
          }, 500);
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
        categoryKey: existingCategory.toLowerCase().replace(/[ &]/g, ''), 
        categoryName: existingCategory,
        isNewCategory: false 
      };
    }
    
    // Enhanced mapping for common ML categories to existing user categories
    const categoryMap: Record<string, { key: string; name: string }> = {
      // Food & Dining variations
      'food & dining': { key: 'meals', name: 'Meals & Entertainment' },
      'food': { key: 'meals', name: 'Meals & Entertainment' },
      'restaurant': { key: 'meals', name: 'Meals & Entertainment' },
      'dining': { key: 'meals', name: 'Meals & Entertainment' },
      'meal': { key: 'meals', name: 'Meals & Entertainment' },
      'grocery': { key: 'meals', name: 'Meals & Entertainment' },
      'groceries': { key: 'meals', name: 'Meals & Entertainment' },
      'supermarket': { key: 'meals', name: 'Meals & Entertainment' },
      
      // Travel variations
      'travel': { key: 'travel', name: 'Travel' },
      'transportation': { key: 'travel', name: 'Travel' },
      'hotel': { key: 'travel', name: 'Travel' },
      'flights': { key: 'travel', name: 'Travel' },
      'accommodation': { key: 'travel', name: 'Travel' },
      
      // Office/Business variations
      'office supplies': { key: 'officesupplies', name: 'Office Supplies' },
      'supplies': { key: 'officesupplies', name: 'Office Supplies' },
      
      // Software variations
      'software': { key: 'software', name: 'Software' },
      'technology': { key: 'software', name: 'Software' },
      'tech': { key: 'software', name: 'Software' },
      'subscription': { key: 'software', name: 'Software' },
      
      // Marketing variations
      'marketing': { key: 'marketing', name: 'Marketing' },
      'advertising': { key: 'marketing', name: 'Marketing' },
      'promotion': { key: 'marketing', name: 'Marketing' }
    };
    
    const normalizedCategory = normalizedMLCategory.toLowerCase();
    const mappedCategory = categoryMap[normalizedCategory];
    
    // If we have a mapping, use it
    if (mappedCategory) {
      // Find the corresponding user category name
      const userCategory = userCategories.find(
        cat => cat.toLowerCase().replace(/[ &]/g, '') === mappedCategory.key
      );
      
      if (userCategory) {
        return { 
          categoryKey: mappedCategory.key, 
          categoryName: userCategory,
          isNewCategory: false 
        };
      }
    }
    
    // Check if the category name matches any user category when spaces/symbols are removed
    const categoryKeyFromML = normalizedMLCategory.toLowerCase().replace(/[ &]/g, '');
    const matchingUserCategory = userCategories.find(
      cat => cat.toLowerCase().replace(/[ &]/g, '') === categoryKeyFromML
    );
    
    if (matchingUserCategory) {
      return { 
        categoryKey: categoryKeyFromML, 
        categoryName: matchingUserCategory,
        isNewCategory: false 
      };
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
        categoryKey: normalizedMLCategory.toLowerCase().replace(/[ &]/g, ''), 
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
                          <div className="font-bold text-lg">{formatAmount(expense.amount)}</div>
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
                      <div className="text-sm text-muted-foreground">{formatAmount(displayTotal)} total</div>
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