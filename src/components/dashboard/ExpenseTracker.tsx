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
import { useReceiptLimit } from "@/hooks/useReceiptLimit";
import { usePlan } from "@/hooks/usePlan";
import { useTimezone } from "@/hooks/useTimezone";
import { useNotifications } from "@/hooks/useNotifications";
import { ExpenseHistory } from "./ExpenseHistory";
import { CategoryExpenseHistory } from "./CategoryExpenseHistory";

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
  const { planData } = usePlan();
  const { canAddReceipt, remainingReceipts, incrementCount, limitData, loading: limitLoading, error: limitError, liveTimer, formatTimeRemaining, shouldShowTimer } = useReceiptLimit();
  const { formatExpenseDate, formatDateTime, getCurrentDate, getTimezoneDisplay } = useTimezone();
  const { notifyExpenseAdded, notifyLargeExpense, notifyDuplicateExpense, notifyReceiptProcessed } = useNotifications();
  // const [isRecording, setIsRecording] = useState(false); // Replaced by isVoiceRecording
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categorySummary, setCategorySummary] = useState<Record<string, { total: number; count: number }>>({});
  const [userCategories, setUserCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Voice recording states
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [voiceResponse, setVoiceResponse] = useState<string>('');
  const [processingVoice, setProcessingVoice] = useState(false);

  const [formData, setFormData] = useState({
    amount: '',
    title: '',
    description: '',
    category: '',
    customCategory: '',
    date: new Date().toISOString().split('T')[0] // Safe fallback
  });

  // Debug logging for form data changes
  console.log('📋 CURRENT FORM DATA STATE:', formData);

  useEffect(() => {
    if (user) {
      fetchExpenses();
      fetchCategorySummary();
      fetchUserCategories();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update form date when timezone becomes available
  useEffect(() => {
    if (user && getCurrentDate) {
      try {
        const timezoneAwareDate = getCurrentDate();
        setFormData(prev => ({ ...prev, date: timezoneAwareDate }));
      } catch (error) {
        console.warn('Failed to get timezone-aware date:', error);
        // Keep the fallback date
      }
    }
  }, [user, getCurrentDate]);

  const fetchExpenses = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Ensure user categories are loaded before fetching expenses
      if (userCategories.length === 0) {
        console.log('User categories not loaded yet, fetching categories first...');
        await fetchUserCategories();
      }
      
      // Fetch expenses from both ML API and business_expenses table
      const [mlApiResponse, supabaseResponse] = await Promise.all([
        fetch(`https://socialdots-ai-expense-backend.hf.space/get-my-expenses/${user.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }),
        supabase
          .from('business_expenses')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
      ]);
      
      let allExpenses: Expense[] = [];
      
      // Process ML API expenses
      if (mlApiResponse.ok) {
        const mlExpenses = await mlApiResponse.json();
        console.log('🔍 ML API RESPONSE - Raw expenses:', mlExpenses);
        console.log('🔍 ML API RESPONSE - Type:', typeof mlExpenses, 'Is Array:', Array.isArray(mlExpenses));
        
        if (Array.isArray(mlExpenses) && mlExpenses.length > 0) {
          console.log('🔍 ML API RESPONSE - First expense sample:', {
            id: mlExpenses[0].id,
            title: mlExpenses[0].title,
            amount: mlExpenses[0].amount,
            category: mlExpenses[0].category,
            date: mlExpenses[0].date,
            created_at: mlExpenses[0].created_at,
            dateType: typeof mlExpenses[0].date,
            createdAtType: typeof mlExpenses[0].created_at
          });
        }
        
        // Force ALL ML API expenses to use today's date if created recently
        const todayDate = getCurrentDate();
        const fixedMLExpenses = mlExpenses.map((expense: Expense) => {
          // Apply character limits to existing ML API expenses
          let processedExpense = {
            ...expense,
            title: expense.title ? expense.title.slice(0, 75) : expense.title,
            description: expense.description ? expense.description.slice(0, 150) : expense.description
          };
          
          // Check if this is a recent ML expense (likely from receipt upload)
          const expenseTime = new Date(processedExpense.created_at || processedExpense.date || '').getTime();
          const currentTime = new Date().getTime();
          const twentyFourHoursAgo = currentTime - (24 * 60 * 60 * 1000);
          const isRecentExpense = expenseTime > twentyFourHoursAgo;
          
          // Transform recent ML expenses to use Digital Receipt format (assumes recent expenses are from photo uploads)
          if (isRecentExpense) {
            // Use the actual expense timestamp, not current time
            // This shows when the receipt was actually processed/logged
            const expenseTimestamp = new Date(processedExpense.created_at || processedExpense.date || new Date());  
            const dateTimeString = formatDateTime(expenseTimestamp);
            
            // Move original title to description and create standardized title
            const originalTitle = processedExpense.title || '';
            const originalDescription = processedExpense.description || '';
            
            // Combine original title and description for the new description
            let combinedDescription = '';
            if (originalTitle && originalDescription) {
              combinedDescription = `${originalTitle} - ${originalDescription}`;
            } else if (originalTitle) {
              combinedDescription = originalTitle;
            } else if (originalDescription) {
              combinedDescription = originalDescription;
            }
            
            processedExpense = {
              ...processedExpense,
              title: `Digital Receipt: ${dateTimeString}`.slice(0, 75),
              description: combinedDescription.slice(0, 150),
              // Use today's date for recent ML expenses to fix timezone issues
              // This ensures they appear on the correct day in user's timezone
              date: todayDate
            };
            
            console.log('🕐 Transformed ML expense with logged time:', {
              originalTitle,
              newTitle: processedExpense.title,
              newDescription: processedExpense.description,
              originalMLTimestamp: expense.created_at || expense.date,
              originalMLTimeHour: new Date(expense.created_at || expense.date || '').getHours(),
              fixedDate: todayDate,
              loggedTime: dateTimeString,
              actualExpenseTimestamp: expenseTimestamp.toISOString(),
              userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            });
          }
          
          return processedExpense;
        });
        
        // Additional timezone fix for all ML expenses
        const timezoneFixedExpenses = fixedMLExpenses.map((expense) => {
          // For ML API expenses, ensure the date is properly handled for user's timezone
          if (expense.date && typeof expense.date === 'string') {
            try {
              const expenseDate = new Date(expense.date);
              // Check if this date seems to be in UTC but should be in local timezone
              const now = new Date();
              const timeDiff = now.getTime() - expenseDate.getTime();
              const isWithinLast3Days = timeDiff >= 0 && timeDiff <= (3 * 24 * 60 * 60 * 1000);
              
              if (isWithinLast3Days) {
                // For recent expenses, use the current date to fix timezone issues
                expense.date = getCurrentDate();
                console.log('🕐 Applied timezone fix to recent ML expense:', {
                  expenseId: expense.id,
                  originalDate: expenseDate.toISOString(),
                  fixedDate: expense.date,
                  userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                });
              }
            } catch (error) {
              console.warn('Error processing ML expense date:', error);
              // Fallback to current date
              expense.date = getCurrentDate();
            }
          }
          return expense;
        });
        
        allExpenses = [...allExpenses, ...timezoneFixedExpenses];
      }
      
      // Process business_expenses from Supabase
      if (supabaseResponse.data) {
        const businessExpenses = supabaseResponse.data.map((expense: {
          id: string;
          amount: number;
          expense_date: string;
          description: string;
          category: string;
          created_at: string;
          user_id: string;
        }) => {
          // Parse the combined description field back into title and description
          let title = '';
          let description = '';
          
          if (expense.description) {
            if (expense.description.includes('|')) {
              // New format with separator: "title|description"
              const parts = expense.description.split('|');
              title = parts[0] || '';
              description = parts[1] || '';
            } else if (expense.description.includes(' - ')) {
              // Old format with dash separator: "title - description"
              const parts = expense.description.split(' - ');
              title = parts[0] || '';
              description = parts.slice(1).join(' - ') || ''; // Join in case there are multiple dashes
            } else {
              // Just title, no description
              title = expense.description;
              description = '';
            }
          }
          
          const result = {
            ...expense,
            // Map business_expenses fields to match expected Expense interface and apply character limits
            date: expense.expense_date,
            title: title.slice(0, 75),
            description: description.slice(0, 150),
            amount: expense.amount,
            category: expense.category
          };
          
          console.log('Processing business expense from database:', {
            id: expense.id,
            originalExpenseDate: expense.expense_date,
            mappedDate: result.date,
            originalCategory: expense.category,
            finalCategory: result.category,
            title: result.title,
            FULL_EXPENSE_DATA: expense
          });
          
          // Debug logging for expenses with descriptions only
          if (description && description.trim()) {
            console.log('Expense with description found:', {
              originalDescription: expense.description,
              parsedTitle: title,
              parsedDescription: description
            });
          }
          
          return result;
        });
        console.log('Business expenses:', businessExpenses);
        allExpenses = [...allExpenses, ...businessExpenses];
      }
      
      console.log(`🔍 COMBINED EXPENSES DEBUG:`, {
        total: allExpenses.length,
        supabaseExpenses: supabaseResponse.data?.length || 0,
        sampleExpense: allExpenses.length > 0 ? {
          id: allExpenses[0].id,
          title: allExpenses[0].title,
          date: allExpenses[0].date,
          created_at: allExpenses[0].created_at,
          category: allExpenses[0].category,
          isMLExpense: !(allExpenses[0].id && allExpenses[0].id.length === 36 && allExpenses[0].id.includes('-'))
        } : null
      });
      
      // Remove duplicates - both exact ID matches and functional duplicates (same amount, similar time)
      const uniqueExpenses = allExpenses.filter((expense, index, arr) => {
        // First check for exact ID duplicates
        const isFirstOccurrenceById = arr.findIndex(e => e.id === expense.id) === index;
        if (!isFirstOccurrenceById) {
          return false;
        }
        
        // Check for functional duplicates: same amount, created within a few minutes of each other
        const duplicates = arr.filter(other => 
          other.id !== expense.id &&
          Math.abs(other.amount - expense.amount) < 0.01 && // Same amount (within 1 cent)
          Math.abs(
            new Date(expense.created_at || expense.date || '').getTime() - 
            new Date(other.created_at || other.date || '').getTime()
          ) < 5 * 60 * 1000 // Within 5 minutes
        );
        
        if (duplicates.length > 0) {
          // If we have duplicates, keep the one with the best time (not 5am)
          const expenseHour = new Date(expense.created_at || expense.date || '').getHours();
          const isBadTime = expenseHour === 5; // Specifically filter out 5am times
          
          // Check if any duplicate has better time
          const hasGoodDuplicate = duplicates.some(dup => {
            const dupHour = new Date(dup.created_at || dup.date || '').getHours();
            return dupHour !== 5; // Any time other than 5am is better
          });
          
          if (isBadTime && hasGoodDuplicate) {
            console.log('Filtering out expense with 5am timestamp (duplicate found):', {
              badExpense: {
                id: expense.id,
                time: expenseHour + ':00',
                amount: expense.amount,
                title: expense.title?.substring(0, 50)
              }
            });
            return false; // Filter out the 5am expense
          }
        }
        
        return true;
      });
      
      console.log(`After deduplication and time filtering: ${uniqueExpenses.length} unique expenses`);
      
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
        
        // Determine if this expense is from business_expenses (manual entry) or ML API
        // Supabase UUIDs are 36 characters and have dashes, ML API IDs are typically numeric or short strings
        const isManualExpense = typeof fixedExpense.id === 'string' && 
                                (fixedExpense.id.length === 36 && fixedExpense.id.includes('-'));
        
        console.log('Expense category processing:', {
          expenseId: fixedExpense.id,
          originalCategory: fixedExpense.category,
          isManualExpense,
          title: fixedExpense.title
        });
        
        // For ML API expenses (receipt uploads), preserve the original category name
        // Don't apply category mapping as we want to show the ML returned category
        const finalCategory = fixedExpense.category;
        
        console.log('Final category result:', {
          expenseId: fixedExpense.id,
          originalCategory: fixedExpense.category,
          finalCategory,
          preservedMLCategory: !isManualExpense
        });
        
        return {
          ...fixedExpense,
          // Keep the original category for reference
          originalCategory: fixedExpense.category,
          // Preserve all categories as-is (both manual and ML API)
          category: finalCategory
        };
      });
      
      // Sort expenses by date (latest first - newest at top)
      const sortedExpenses = mappedExpenses.sort((a, b) => {
        const dateA = new Date(a.date || a.created_at || 0);
        const dateB = new Date(b.date || b.created_at || 0);
        return dateB.getTime() - dateA.getTime(); // Latest to oldest (descending)
      });
      
      console.log(`Final processed expenses: ${sortedExpenses.length} displayed`);
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
    console.log('mapCategoryForDisplay called with:', {
      mlCategory,
      userCategories
    });
    
    if (!mlCategory) {
      console.log('mapCategoryForDisplay: no category provided, returning other');
      return 'other';
    }
    
    const normalizedMLCategory = mlCategory.trim();
    
    // First, check if this exact category exists in user's categories (case-insensitive)
    const existingCategory = userCategories.find(
      cat => cat.toLowerCase() === normalizedMLCategory.toLowerCase()
    );
    
    if (existingCategory) {
      // Return the existing category name (not the key)
      console.log('mapCategoryForDisplay: found existing category:', existingCategory);
      return existingCategory;
    }
    
    // Enhanced mapping for common ML categories to existing user categories
    const categoryMap: Record<string, string> = {
      // Food & Dining variations
      'meals': 'Meals',
      'food & dining': 'Meals',
      'food': 'Meals',
      'restaurant': 'Meals',
      'dining': 'Meals',
      'meal': 'Meals',
      'grocery': 'Meals',
      'groceries': 'Meals',
      'supermarket': 'Meals',
      
      // Entertainment variations
      'entertainment': 'Entertainment',
      'fun': 'Entertainment',
      'movie': 'Entertainment',
      'movies': 'Entertainment',
      'theater': 'Entertainment',
      'game': 'Entertainment',
      'games': 'Entertainment',
      'amusement': 'Entertainment',
      'concert': 'Entertainment',
      'event': 'Entertainment',
      'events': 'Entertainment',
      
      // Travel variations
      'travel': 'Travel',
      'transportation': 'Travel',
      'hotel': 'Travel',
      'flights': 'Travel',
      'accommodation': 'Travel',
      
      // Health & Wellness variations
      'health & wellness': 'other', // Map to other since it's not in default categories
      'health': 'other',
      'wellness': 'other',
      'medical': 'other',
      
      // Office/Business variations
      'office supplies': 'Office Supplies',
      'supplies': 'Office Supplies',
      'business': 'other',
      
      // Software variations
      'software': 'Software',
      'technology': 'Software',
      'tech': 'Software',
      'subscription': 'Software',
      
      // Marketing variations
      'marketing': 'Marketing',
      'advertising': 'Marketing',
      'promotion': 'Marketing'
    };
    
    const normalizedCategory = normalizedMLCategory.toLowerCase();
    const mappedCategory = categoryMap[normalizedCategory];
    
    // If we have a mapping, use it
    if (mappedCategory) {
      console.log('mapCategoryForDisplay: found mapped category:', mappedCategory);
      return mappedCategory;
    }
    
    // Check if the category name matches any user category when spaces/symbols are removed
    const categoryKeyFromML = normalizedMLCategory.toLowerCase().replace(/[ &]/g, '');
    const matchingUserCategory = userCategories.find(
      cat => cat.toLowerCase().replace(/[ &]/g, '') === categoryKeyFromML
    );
    
    if (matchingUserCategory) {
      return matchingUserCategory;
    }
    
    // For completely new categories, return the original ML category name (it will be added to user categories)
    console.log('mapCategoryForDisplay: returning new category name:', normalizedMLCategory);
    return normalizedMLCategory;
  };

  const fetchCategorySummary = async () => {
    try {
      const response = await fetch('https://socialdots-ai-expense-backend.hf.space/summary', {
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
        setUserCategories(['Meals', 'Entertainment', 'Travel', 'Office Supplies', 'Marketing', 'Software', 'Other']);
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
          setUserCategories(['Meals', 'Entertainment', 'Travel', 'Office Supplies', 'Marketing', 'Software', 'Other']);
        }
      } else {
        // Fallback to default categories
        setUserCategories(['Meals', 'Entertainment', 'Travel', 'Office Supplies', 'Marketing', 'Software', 'Other']);
      }
    } catch (error) {
      console.error('Error fetching user categories:', error);
      // Fallback to default categories
      setUserCategories(['Meals & Entertainment', 'Travel', 'Office Supplies', 'Marketing', 'Software', 'Other']);
    }
  };

  const addNewCategory = async (newCategory: string) => {
    console.log('addNewCategory called with:', {
      newCategory,
      userId: user?.id,
      currentUserCategories: userCategories
    });
    
    if (!user?.id || !newCategory) {
      console.log('addNewCategory failed: missing user or category');
      return false;
    }
    
    // Check if category already exists (case-insensitive)
    const categoryExists = userCategories.some(
      cat => cat.toLowerCase() === newCategory.toLowerCase()
    );
    
    if (categoryExists) {
      console.log('addNewCategory failed: category already exists');
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
      console.log(`Successfully added new category: ${newCategory}`, {
        updatedCategories,
        updatedSystemPrompt: updatedSystemPrompt.substring(0, 200) + '...'
      });
      return true;
      
    } catch (error) {
      console.error('Error adding new category:', error);
      return false;
    }
  };

  const findAndUpdateRecentExpense = async (originalCategory: string, newCategoryKey: string, amount: number) => {
    try {
      // Get the most recent expenses to find the one we just created
      const response = await fetch(`https://socialdots-ai-expense-backend.hf.space/get-my-expenses/${user?.id}`, {
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
    console.log('🔥 CREATE EXPENSE FUNCTION CALLED - FORM DATA:', formData);
    
    if (!formData.amount || !formData.title || !formData.category) {
      toast({
        title: "Error", 
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Validate custom category when "other" is selected
    if (formData.category === 'other' && !formData.customCategory?.trim()) {
      toast({
        title: "Error", 
        description: "Please enter a custom category name",
        variant: "destructive"
      });
      return;
    }


    try {
      setLoading(true);
      
      // Handle custom category or convert category key back to full category name
      let categoryToStore;
      if (formData.category === 'other' && formData.customCategory?.trim()) {
        // Use the custom category name and add it to user categories
        categoryToStore = formData.customCategory.trim();
        
        // Add the new category to the user's category list
        const categoryAdded = await addNewCategory(categoryToStore);
        if (categoryAdded) {
          toast({
            title: "New Category Created",
            description: `Added "${categoryToStore}" to your categories`,
          });
          // Refresh categories in the background
          setTimeout(async () => {
            await fetchUserCategories();
          }, 500);
        }
      } else {
        // Convert category key back to full category name
        const fullCategoryName = userCategories.find(cat => 
          cat.toLowerCase().replace(/ & | /g, '') === formData.category
        ) || formData.category;
        
        // Since business_expenses table accepts any string for category, 
        // we should preserve the user's exact category selection
        categoryToStore = fullCategoryName;
      }
      
      console.log('Category preservation:', { 
        formDataCategory: formData.category, 
        categoryToStore 
      });

      // Use the user-selected date from the form, fallback to today if not set
      const expenseDate = formData.date || getCurrentDate();
      
      // Debug logging for date handling
      console.log('DATE HANDLING DEBUG - MANUAL EXPENSE:', {
        formDataDate: formData.date,
        formDataDateType: typeof formData.date,
        todaysDate: getCurrentDate(),
        finalExpenseDate: expenseDate,
        dateSource: formData.date ? 'user-selected' : 'fallback-today',
        formDataFull: formData
      });
      
      // Store both title and description in the description field, but in a parseable format
      const combinedDescription = formData.description 
        ? `${formData.title}|${formData.description}` 
        : formData.title;
      
      console.log('Creating manual expense via business_expenses table:', {
        description: combinedDescription,
        amount: parseFloat(formData.amount),
        category: categoryToStore,
        expense_date: expenseDate,
        user_id: user.id
      });
      
      // Ensure date is stored without timezone conversion issues
      const { data, error } = await supabase
        .from('business_expenses')
        .insert({
          description: combinedDescription,
          amount: parseFloat(formData.amount),
          category: categoryToStore, // Use the preserved category name
          expense_date: expenseDate, // Use user-selected date (format: YYYY-MM-DD)
          user_id: user.id
        })
        .select()
        .single();

      console.log('Supabase business_expenses insert response:', { data, error });
      
      if (data) {
        console.log('🔍 WHAT WAS ACTUALLY STORED IN DATABASE:', {
          sentDate: expenseDate,
          storedDate: data.expense_date,
          storedData: data
        });
      }

      if (error) throw error;
      
      // Send notifications for the new expense
      if (data) {
        try {
          const newExpense = {
            id: data.id,
            title: combinedDescription,
            amount: parseFloat(formData.amount),
            category: categoryToStore,
            date: expenseDate
          };
          
          // Send expense added notification
          await notifyExpenseAdded(newExpense);
          
          // Check for large expense alert
          await notifyLargeExpense(newExpense);
          
          // Check for potential duplicates
          const duplicateCheck = expenses.filter(expense => 
            Math.abs(expense.amount - newExpense.amount) < 0.01 &&
            expense.category === newExpense.category &&
            expense.date === newExpense.date
          );
          
          if (duplicateCheck.length > 0) {
            await notifyDuplicateExpense(newExpense, duplicateCheck);
          }
          
          console.log('✅ Expense notifications sent');
        } catch (notificationError) {
          console.error('❌ Failed to send expense notifications:', notificationError);
          // Don't break the flow if notifications fail
        }
      }
      
      toast({
        title: "Success",
        description: "Expense created successfully"
      });
      
      // Increment receipt count for free users
      console.log('Calling incrementCount() for manual expense...');
      const incrementResult = await incrementCount();
      console.log('incrementCount() result:', incrementResult);
      
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

    // Validate custom category when "other" is selected
    if (formData.category === 'other' && !formData.customCategory?.trim()) {
      toast({
        title: "Error", 
        description: "Please enter a custom category name",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      // Handle custom category or convert category key back to full category name
      let categoryToStore;
      if (formData.category === 'other' && formData.customCategory?.trim()) {
        // Use the custom category name and add it to user categories
        categoryToStore = formData.customCategory.trim();
        
        // Add the new category to the user's category list
        const categoryAdded = await addNewCategory(categoryToStore);
        if (categoryAdded) {
          toast({
            title: "New Category Created",
            description: `Added "${categoryToStore}" to your categories`,
          });
          // Refresh categories in the background
          setTimeout(async () => {
            await fetchUserCategories();
          }, 500);
        }
      } else {
        // Convert category key back to full category name
        const fullCategoryName = userCategories.find(cat => 
          cat.toLowerCase().replace(/ & | /g, '') === formData.category
        ) || formData.category;
      
        // Since business_expenses table accepts any string for category, 
        // we should preserve the user's exact category selection
        categoryToStore = fullCategoryName;
      }
      
      console.log('Updating expense - smart delete and recreate approach');
      
      // Step 1: Determine expense type and delete appropriately
      const isManualExpense = typeof editingExpense.id === 'string' && 
                             (editingExpense.id.length === 36 && editingExpense.id.includes('-'));
      
      console.log('Update expense type detection:', {
        expenseId: editingExpense.id,
        isManualExpense,
        idLength: editingExpense.id.length,
        hasUUIDFormat: editingExpense.id.includes('-')
      });

      if (isManualExpense) {
        // Delete from business_expenses table (manual expense)
        console.log('Deleting manual expense from business_expenses table');
        const { error: supabaseDeleteError } = await supabase
          .from('business_expenses')
          .delete()
          .eq('id', editingExpense.id);

        if (supabaseDeleteError) {
          console.error('Failed to delete from business_expenses:', supabaseDeleteError);
          throw new Error(`Failed to delete manual expense: ${supabaseDeleteError.message}`);
        }
        console.log('Manual expense deleted from business_expenses successfully');
      } else {
        // Delete from both ML API and business_expenses (ML-processed expense)
        console.log('Deleting ML-processed expense from both sources');
        
        // Try ML API first
        const deleteResponse = await fetch(`https://socialdots-ai-expense-backend.hf.space/expenses/${editingExpense.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!deleteResponse.ok) {
          console.log('ML API delete failed, continuing with business_expenses delete');
        } else {
          console.log('ML API expense deleted successfully');
        }

        // Also try to delete from business_expenses (ML-processed expenses are now saved there too)
        const { error: supabaseDeleteError } = await supabase
          .from('business_expenses')
          .delete()
          .eq('id', editingExpense.id);

        if (supabaseDeleteError) {
          console.log('business_expenses delete failed (might not exist there):', supabaseDeleteError);
          // Don't throw error - ML expense might only exist in ML API
        } else {
          console.log('business_expenses expense deleted successfully');
        }
      }

      // Use the user-selected date from the form, fallback to today if not set
      const expenseDate = formData.date || getCurrentDate();

      // Step 2: Create a new expense with updated data via business_expenses table
      // Store both title and description in the description field, but in a parseable format
      const combinedDescription = formData.description 
        ? `${formData.title}|${formData.description}` 
        : formData.title;
      
      const { data, error } = await supabase
        .from('business_expenses')
        .insert({
          description: combinedDescription,
          amount: parseFloat(formData.amount),
          category: categoryToStore, // Use the preserved category name
          expense_date: expenseDate, // Use user-selected date
          user_id: user.id
        })
        .select()
        .single();

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
    // Always use today's date when resetting the form
    setFormData({
      amount: '',
      title: '',
      description: '',
      category: '',
      customCategory: '',
      date: getCurrentDate()
    });
  };

  const handleEdit = (expense: Expense) => {
    console.log('Editing expense:', expense);
    setEditingExpense(expense);
    
    // Handle date field - use date if available, otherwise use created_at, fallback to today
    const dateValue = expense.date || expense.created_at || getCurrentDate();
    
    setFormData({
      amount: expense.amount.toString(),
      title: expense.title || '',
      description: expense.description || '',
      category: expense.category || '',
      customCategory: '',
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
      console.log('Attempting to delete expense with ID:', expenseId);
      
      // Try to delete from business_expenses table first (for manual expenses)
      const { error: supabaseError } = await supabase
        .from('business_expenses')
        .delete()
        .eq('id', expenseId);

      if (supabaseError) {
        console.log('Not found in business_expenses, trying ML API:', supabaseError);
        
        // If not found in Supabase, try ML API
        const response = await fetch(`https://socialdots-ai-expense-backend.hf.space/expenses/${expenseId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('ML API delete failed:', errorText);
          throw new Error(`Failed to delete expense from both Supabase and ML API: ${errorText}`);
        }
        console.log('ML API expense deleted successfully');
      } else {
        console.log('Business expense deleted from Supabase successfully');
      }
      
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
        description: `Failed to delete expense: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Voice recording functions
  const playBase64Audio = (base64String: string) => {
    try {
      // 1. Decode the Base64 string into binary data
      const binaryString = window.atob(base64String);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      // 2. Create a Blob (like a temporary in-memory file)
      const audioBlob = new Blob([bytes], { type: 'audio/wav' });
      // 3. Create a temporary URL for the Blob
      const audioUrl = URL.createObjectURL(audioBlob);
      // 4. Create a new Audio object and play it
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      toast({
        title: "Audio Error",
        description: "Failed to play audio response",
        variant: "destructive"
      });
    }
  };

  const startVoiceRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          title: "Not Supported",
          description: "Voice recording is not supported in your browser",
          variant: "destructive"
        });
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      const chunks: BlobPart[] = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        await processVoiceRecording(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsVoiceRecording(true);
      
      toast({
        title: "Recording Started",
        description: "Speak your expense suggestion now. Click again to stop."
      });
      
    } catch (error) {
      console.error('Error starting voice recording:', error);
      toast({
        title: "Recording Error",
        description: "Failed to start voice recording. Please check microphone permissions.",
        variant: "destructive"
      });
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsVoiceRecording(false);
      setProcessingVoice(true);
      
      toast({
        title: "Processing",
        description: "Processing your voice recording..."
      });
    }
  };

  const processVoiceRecording = async (audioBlob: Blob) => {
    try {
      setProcessingVoice(true);
      
      // Create FormData for the API call
      const formData = new FormData();
      formData.append('file', audioBlob, 'user_voice.wav');
      
      console.log('Sending voice recording to API...');
      
      const response = await fetch('https://socialdots-ai-expense-backend.hf.space/voice-suggestion', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Voice API response:', result);
      
      // Handle the response
      if (result.full_text_response) {
        setVoiceResponse(result.full_text_response);
        toast({
          title: "Voice Processed",
          description: "Got your expense suggestion! Check the response below."
        });
        
        // Play the audio confirmation if available
        if (result.audio_base64) {
          playBase64Audio(result.audio_base64);
        }
      } else {
        throw new Error('No response received from voice processing');
      }
      
    } catch (error) {
      console.error('Error processing voice recording:', error);
      toast({
        title: "Processing Error",
        description: "Failed to process voice recording. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingVoice(false);
    }
  };

  const handleVoiceRecord = () => {
    if (isVoiceRecording) {
      stopVoiceRecording();
    } else {
      startVoiceRecording();
    }
  };

  const clearVoiceResponse = () => {
    setVoiceResponse('');
  };

  const handleReceiptUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check receipt limit for free users
    if (!canAddReceipt) {
      toast({
        title: "Expense Limit Reached",
        description: `You've reached your limit of ${limitData?.monthly_limit} expenses. The counter resets every 10 minutes for testing. Upgrade to Pro for unlimited access.`,
        variant: "destructive"
      });
      // Clear the file input
      if (event.target) event.target.value = '';
      return;
    }

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
      const uploadStartTime = Date.now(); // Track upload time for notifications
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

      // Call ML model to extract expense data
      console.log('Uploading receipt to ML API...');
      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      const response = await fetch('https://socialdots-ai-expense-backend.hf.space/upload', {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type - let browser set it with boundary for FormData
        },
        mode: 'cors', // Explicitly set CORS mode
        credentials: 'omit' // Don't include credentials for cross-origin requests
      });

      console.log('ML API upload response status:', response.status);
      console.log('ML API upload response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('ML API Error Response:', errorText);
        console.error('Response status:', response.status);
        console.error('Response statusText:', response.statusText);
        throw new Error(`API Error (${response.status}): ${errorText}`);
      }
      
      const responseText = await response.text();
      console.log('Raw API response:', responseText);
      console.log('Raw API response length:', responseText.length);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        console.error('Raw response was:', responseText);
        throw new Error('Invalid JSON response from API');
      }
      
      console.log('ML API upload response data:', data);
      console.log('Data type:', typeof data, 'Is array:', Array.isArray(data));
      
      // Handle array response from ML API
      const responseData = Array.isArray(data) ? data[0] : data;
      console.log('🔍 UPLOAD DEBUG - Processed response data:', responseData);
      console.log('🔍 UPLOAD DEBUG - Amount check:', {
        amount: responseData?.amount,
        amountType: typeof responseData?.amount,
        amountNotUndefined: responseData?.amount !== undefined,
        amountNotNull: responseData?.amount !== null,
        category: responseData?.category,
        categoryExists: !!responseData?.category
      });

      // Enhanced validation with better error messages
      const hasValidAmount = responseData?.amount !== undefined && responseData?.amount !== null;
      const hasValidCategory = responseData?.category && responseData?.category.trim() !== '';
      
      console.log('🔍 DETAILED VALIDATION CHECK:', {
        responseData: responseData,
        hasValidAmount,
        hasValidCategory,
        amount: responseData?.amount,
        amountType: typeof responseData?.amount,
        category: responseData?.category,
        categoryType: typeof responseData?.category
      });

      if (hasValidAmount && hasValidCategory) {
        console.log('✅ UPLOAD DEBUG - Validation passed, processing expense...');
        try {
          // Create digital receipt description with the logging date (current date when expense is being logged)
          const loggingTime = new Date(); // Current datetime when expense is being logged to database
          const dateOnlyString = formatExpenseDate(loggingTime); // Use date-only format for receipts
          
          // Move ML-generated title to description and create new standardized format
          const mlGeneratedTitle = responseData.title || '';
          const mlGeneratedDescription = responseData.description || '';
          
          // Create the main description with Digital Receipt title format (date only)
          let combinedDescription = `Digital Receipt: ${dateOnlyString}`;
          
          // Add ML-generated content if available
          if (mlGeneratedTitle || mlGeneratedDescription) {
            combinedDescription += ' - ';
            if (mlGeneratedTitle && mlGeneratedDescription) {
              combinedDescription += `${mlGeneratedTitle} - ${mlGeneratedDescription}`;
            } else if (mlGeneratedTitle) {
              combinedDescription += mlGeneratedTitle;
            } else if (mlGeneratedDescription) {
              combinedDescription += mlGeneratedDescription;
            }
          }
          
          // Apply character limits for database storage
          responseData.description = combinedDescription.slice(0, 200); // Increased limit for full description
          responseData.title = `Digital Receipt: ${dateOnlyString}`.slice(0, 75); // Keep for compatibility
          
          // Debug logging for receipt processing
          console.log('Receipt processing - Original ML data:', {
            originalTitle: mlGeneratedTitle,
            originalDescription: mlGeneratedDescription,
            originalTimestamp: responseData.created_at || responseData.date
          });
          console.log('Receipt processing - Final formatted data (with logging date only):', {
            loggingDateOnly: dateOnlyString,
            newTitle: responseData.title,
            newDescription: responseData.description,
            loggingTime: loggingTime.toISOString(),
            userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          });
          
          // Properly map ML category to user categories
          const mlReturnedCategory = responseData.category;
          console.log('ML API returned category:', mlReturnedCategory);
          
          // Map the ML category to a proper user category
          const mappedCategory = mapCategoryForDisplay(mlReturnedCategory);
          
          if (mappedCategory && mappedCategory !== 'other') {
            responseData.category = mappedCategory;
            console.log('Mapped ML category successfully:', {
              originalMLCategory: mlReturnedCategory,
              mappedCategory: mappedCategory
            });
          } else {
            // Fallback to "other" only if mapping fails
            responseData.category = 'other';
            responseData.mlCategoryName = mlReturnedCategory;
            console.log('Failed to map ML category, using "other":', {
              originalMLCategory: mlReturnedCategory,
              expenseCategory: responseData.category,
              customCategoryName: responseData.mlCategoryName
            });
          }
        
        // Log the extraction for debugging
        console.log('Receipt extraction result:', responseData);
        
        // Fix timezone issue for ML API expenses
        // The ML API might return UTC timestamps, but we want them to show in user's local timezone
        if (responseData.created_at || responseData.date) {
          // Always use current local date for picture uploads to avoid timezone confusion
          // This ensures the expense appears on the correct day in the user's timezone
          const todayDate = getCurrentDate();
          const originalDate = responseData.date || responseData.created_at;
          
          console.log(`🕐 TIMEZONE FIX - ML API date handling:`, {
            originalMLDate: originalDate,
            originalMLDateType: typeof originalDate,
            userLocalDate: todayDate,
            userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            reason: 'Using current local date to fix timezone issues with ML API'
          });
          
          // Override with current local date to ensure it shows today
          responseData.date = todayDate;
        } else {
          const todayDate = getCurrentDate();
          responseData.date = todayDate;
          console.log(`ML API didn't provide date, using today: ${todayDate}`);
        }
        
        // Check for potential duplicates in existing expenses
        const isDuplicate = expenses.some(expense => 
          expense.amount === responseData.amount && 
          expense.title === responseData.title &&
          Math.abs(new Date(expense.created_at || expense.date || '').getTime() - new Date().getTime()) < 24 * 60 * 60 * 1000 // Within 24 hours
        );
        
        // Send notifications for receipt processing
        try {
          const receiptExpense = {
            id: responseData.id,
            title: responseData.title || 'Receipt expense',
            amount: responseData.amount,
            category: mlReturnedCategory,
            date: responseData.date
          };
          
          // Send receipt processed notification
          await notifyReceiptProcessed(receiptExpense, {
            originalCategory: mlReturnedCategory,
            confidence: responseData.confidence,
            processingTime: Date.now() - uploadStartTime
          });
          
          // Send expense added notification
          await notifyExpenseAdded(receiptExpense);
          
          // Check for large expense alert
          await notifyLargeExpense(receiptExpense);
          
          // Check for duplicate and send notification if needed
          if (isDuplicate) {
            const duplicates = expenses.filter(expense => 
              expense.amount === responseData.amount && 
              expense.title === responseData.title
            );
            await notifyDuplicateExpense(receiptExpense, duplicates);
          }
          
          console.log('✅ Receipt processing notifications sent');
        } catch (notificationError) {
          console.error('❌ Failed to send receipt processing notifications:', notificationError);
          // Don't break the flow if notifications fail
        }
        
        if (isDuplicate) {
          toast({
            title: "⚠️ Duplicate Receipt Warning",
            description: `Similar expense found, but added anyway: ${formatAmount(responseData.amount)} - Category: ${mlReturnedCategory}`,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Receipt Processed Successfully",
            description: `New expense added: ${formatAmount(responseData.amount)} - Category: ${mlReturnedCategory}`,
          });
        }
        
        // Save the expense to the database
        console.log('💾 Saving ML processed expense to database...');
        console.log('💾 Save data:', {
          description: responseData.description, // Already formatted with "Digital Receipt: <datetime>"
          amount: parseFloat(responseData.amount),
          category: mlReturnedCategory, // Use the original ML category name (not the mapped key)
          expense_date: responseData.date,
          user_id: user.id
        });

        const { data: savedExpense, error: saveError } = await supabase
          .from('business_expenses')
          .insert({
            description: responseData.description, // Already formatted with "Digital Receipt: <datetime>"
            amount: parseFloat(responseData.amount),
            category: mlReturnedCategory, // Use the original ML category name (not the mapped key)
            expense_date: responseData.date, // Use formatted date
            user_id: user.id
            // Note: business_expenses table doesn't have a 'title' field, only 'description'
          })
          .select()
          .single();

        if (saveError) {
          console.error('❌ Error saving ML expense to database:', saveError);
          toast({
            title: "Save Error", 
            description: "Receipt processed but failed to save to database. Please try manual entry.",
            variant: "destructive"
          });
          return;
        }

        console.log('✅ ML expense saved to database:', savedExpense);

        // Increment receipt count for free users
        console.log('Calling incrementCount() for photo upload...');
        const incrementResult = await incrementCount();
        console.log('incrementCount() result for photo:', incrementResult);
        
        // Add the category to user categories if it doesn't exist
        // This ensures new ML categories appear in the Categories tab
        const categoryExists = userCategories.some(
          cat => cat.toLowerCase() === mlReturnedCategory.toLowerCase()
        );
        
        if (!categoryExists) {
          console.log('Adding new ML category to user categories:', mlReturnedCategory);
          const categoryAdded = await addNewCategory(mlReturnedCategory);
          if (categoryAdded) {
            toast({
              title: "New Category Created",
              description: `Added "${mlReturnedCategory}" to your categories`,
            });
            // Refresh categories
            setTimeout(async () => {
              await fetchUserCategories();
            }, 500);
          }
        }
        
        // Always refresh expenses list and category summary (expense should be added regardless)
        await fetchExpenses();
        await fetchCategorySummary();
        } catch (processingError) {
          console.error('Error processing receipt data:', processingError);
          toast({
            title: "Processing Error",
            description: "Failed to process receipt data. Please try manual entry.",
            variant: "destructive"
          });
        }
      } else {
        console.log('❌ UPLOAD DEBUG - Validation failed:', {
          hasAmount: hasValidAmount,
          hasCategory: hasValidCategory,
          actualAmount: responseData?.amount,
          actualCategory: responseData?.category,
          fullResponseData: responseData
        });
        // Determine specific error message based on what's missing
        let errorMessage = "Could not extract expense data from this receipt. ";
        const missingParts = [];
        if (!hasValidAmount) missingParts.push('amount');
        if (!hasValidCategory) missingParts.push('category');
        
        if (missingParts.length > 0) {
          errorMessage += `Missing ${missingParts.join(' and ')} information. Please try manual entry.`;
        } else {
          errorMessage += "Please try manual entry.";
        }
        
        toast({
          title: "No Data Found",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error processing receipt:', error);
      
      let errorMessage = "Failed to process receipt. Please try again or enter manually.";
      let errorTitle = "Processing Failed";
      
      if (error instanceof Error) {
        if (error.message.includes('API Error')) {
          errorTitle = "API Error";
          errorMessage = `Server error: ${error.message}. The AI service may be temporarily unavailable.`;
        } else if (error.message.includes('Invalid JSON')) {
          errorTitle = "Response Error";
          errorMessage = "Received invalid response from AI service. Please try again.";
        } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
          errorTitle = "Network Error";
          errorMessage = "Cannot reach the AI service. Please check your internet connection and try again.";
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
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
      'food & dining': { key: 'meals', name: 'Meals' },
      'food': { key: 'meals', name: 'Meals' },
      'restaurant': { key: 'meals', name: 'Meals' },
      'dining': { key: 'meals', name: 'Meals' },
      'meal': { key: 'meals', name: 'Meals' },
      'grocery': { key: 'meals', name: 'Meals' },
      'groceries': { key: 'meals', name: 'Meals' },
      'supermarket': { key: 'meals', name: 'Meals' },
      
      // Entertainment variations
      'entertainment': { key: 'entertainment', name: 'Entertainment' },
      'fun': { key: 'entertainment', name: 'Entertainment' },
      'movie': { key: 'entertainment', name: 'Entertainment' },
      'movies': { key: 'entertainment', name: 'Entertainment' },
      'theater': { key: 'entertainment', name: 'Entertainment' },
      'game': { key: 'entertainment', name: 'Entertainment' },
      'games': { key: 'entertainment', name: 'Entertainment' },
      'amusement': { key: 'entertainment', name: 'Entertainment' },
      'concert': { key: 'entertainment', name: 'Entertainment' },
      'event': { key: 'entertainment', name: 'Entertainment' },
      'events': { key: 'entertainment', name: 'Entertainment' },
      
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
          {user && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2">
                <Badge 
                  variant={planData.plan === 'pro' ? 'default' : 'secondary'} 
                  className={`text-xs px-2 py-1 ${
                    planData.plan === 'pro' 
                      ? 'bg-gradient-to-r from-primary to-accent text-white' 
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {planData.planLabel} Plan
                </Badge>
                {planData.plan === 'free' && (
                  <Badge variant={canAddReceipt ? "secondary" : "destructive"} className="text-sm font-medium">
                    {limitData?.current_count || 0}/{limitData?.monthly_limit || 5} expenses used
                    {!canAddReceipt && " - Limit reached!"}
                  </Badge>
                )}
              </div>
              {shouldShowTimer && (
                <p className="text-xs text-muted-foreground animate-pulse">
                  ⏰ Resets in {formatTimeRemaining(liveTimer)}
                </p>
              )}
              {limitLoading && (
                <p className="text-xs text-muted-foreground">
                  Loading limit data...
                </p>
              )}
              {limitError && (
                <p className="text-xs text-red-500">
                  Error: {limitError}
                </p>
              )}
            </div>
          )}
        </div>
        <Dialog open={showAddDialog} onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) {
            resetForm();
            setIsRecording(false);
          } else {
            // When opening the dialog, ensure form is reset to today's date
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button 
              className="gap-2" 
              disabled={!canAddReceipt}
              onClick={() => {
                if (!canAddReceipt) {
                  toast({
                    title: "Expense Limit Reached",
                    description: `You've reached your limit of ${limitData?.monthly_limit} expenses. The counter resets every 10 minutes for testing. Upgrade to Pro for unlimited access.`,
                    variant: "destructive"
                  });
                }
              }}
            >
              <Plus className="h-4 w-4" />
              {canAddReceipt ? 'Add Expense' : `Limit Reached (${limitData?.current_count}/${limitData?.monthly_limit})`}
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
                  disabled={processingVoice || !canAddReceipt}
                >
                  <Mic className={`h-6 w-6 ${isVoiceRecording ? 'animate-pulse text-red-500' : !canAddReceipt ? 'opacity-50' : processingVoice ? 'animate-spin' : ''}`} />
                  <span className="text-sm">
                    {processingVoice 
                      ? 'Processing...' 
                      : isVoiceRecording 
                      ? 'Recording...' 
                      : !canAddReceipt 
                      ? 'Limit Reached' 
                      : 'Voice Entry'
                    }
                  </span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={handlePhotoUpload}
                  disabled={uploadingReceipt || !canAddReceipt}
                >
                  {uploadingReceipt ? (
                    <>
                      <Upload className="h-6 w-6 animate-spin" />
                      <span className="text-sm">Processing...</span>
                    </>
                  ) : !canAddReceipt ? (
                    <>
                      <Camera className="h-6 w-6 opacity-50" />
                      <span className="text-sm">Limit Reached</span>
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
                        onValueChange={(value) => {
                          setFormData({...formData, category: value, customCategory: ''});
                        }}
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
                      {formData.category === 'other' && (
                        <div className="mt-2">
                          <Input
                            placeholder="Enter custom category name"
                            value={formData.customCategory}
                            onChange={(e) => setFormData({...formData, customCategory: e.target.value})}
                            className={formData.category === 'other' && !formData.customCategory?.trim() ? "border-red-300 focus:border-red-500" : ""}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="modal-title">Title</Label>
                    <Input 
                      id="modal-title" 
                      placeholder="Expense title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value.slice(0, 75)})}
                      maxLength={75}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {formData.title.length}/75 characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="modal-description">Description</Label>
                    <Input 
                      id="modal-description" 
                      placeholder="Additional details"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value.slice(0, 150)})}
                      maxLength={150}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {formData.description.length}/150 characters
                    </p>
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
                        onChange={(e) => {
                          console.log('📅 MODAL DATE INPUT CHANGED:', e.target.value);
                          setFormData({...formData, date: e.target.value});
                        }}
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
                Voice Expense Suggestions
              </CardTitle>
              <CardDescription>
                Record your voice to get AI-powered marketing ideas and expense suggestions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <Button
                  onClick={handleVoiceRecord}
                  variant={isVoiceRecording ? "destructive" : "default"}
                  className="gap-2"
                  disabled={processingVoice}
                >
                  <Mic className={`h-4 w-4 ${isVoiceRecording ? "animate-pulse" : ""}`} />
                  {processingVoice 
                    ? "Processing..." 
                    : isVoiceRecording 
                    ? "Stop Recording" 
                    : "Record Expense"
                  }
                </Button>
                
                {isVoiceRecording && (
                  <Badge variant="destructive" className="animate-pulse">
                    🎤 Recording...
                  </Badge>
                )}
                
                {processingVoice && (
                  <Badge variant="secondary" className="animate-pulse">
                    🤖 Processing...
                  </Badge>
                )}
              </div>

              {/* Voice Response Display */}
              {voiceResponse && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">AI Response:</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearVoiceResponse}
                      className="h-6 w-6 p-0"
                    >
                      ×
                    </Button>
                  </div>
                  <div className="text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {voiceResponse}
                  </div>
                </div>
              )}

              {!isVoiceRecording && !processingVoice && !voiceResponse && (
                <p className="text-sm text-muted-foreground">
                  Click "Record Expense" and speak about your business expenses or marketing ideas. 
                  The AI will provide detailed suggestions and play an audio confirmation.
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
              {!canAddReceipt && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm font-medium text-destructive">
                    Manual entry disabled - Receipt limit reached ({limitData?.current_count}/{limitData?.monthly_limit})
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upgrade to Pro for unlimited entries or wait for reset.
                  </p>
                </div>
              )}
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
                      disabled={!canAddReceipt}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => {
                      setFormData({...formData, category: value, customCategory: ''});
                    }}
                    disabled={!canAddReceipt}
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
                  {formData.category === 'other' && (
                    <div className="mt-2">
                      <Input
                        placeholder="Enter custom category name"
                        value={formData.customCategory}
                        onChange={(e) => setFormData({...formData, customCategory: e.target.value})}
                        disabled={!canAddReceipt}
                        className={formData.category === 'other' && !formData.customCategory?.trim() ? "border-red-300 focus:border-red-500" : ""}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input 
                  id="title" 
                  placeholder="Expense title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value.slice(0, 75)})}
                  disabled={!canAddReceipt}
                  maxLength={75}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {formData.title.length}/75 characters
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input 
                  id="description" 
                  placeholder="What was this expense for?"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value.slice(0, 150)})}
                  disabled={!canAddReceipt}
                  maxLength={150}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {formData.description.length}/150 characters
                </p>
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
                    onChange={(e) => {
                      console.log('📅 DATE INPUT CHANGED:', e.target.value);
                      setFormData({...formData, date: e.target.value});
                    }}
                  />
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={createExpense}
                disabled={loading || !canAddReceipt}
              >
                {loading ? "Adding..." : !canAddReceipt ? `Limit Reached (${limitData?.current_count}/${limitData?.monthly_limit})` : "Add Expense"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <ExpenseHistory 
            expenses={expenses}
            loading={loading}
            onEdit={handleEdit}
            onDelete={deleteExpense}
          />
        </TabsContent>

        <TabsContent value="categories">
          {selectedCategory ? (
            <CategoryExpenseHistory 
              category={selectedCategory}
              expenses={expenses}
              onBack={() => setSelectedCategory(null)}
              onEdit={handleEdit}
              onDelete={deleteExpense}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Expense Categories
                </CardTitle>
                <CardDescription>Click on a category to view detailed expense history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(() => {
                    // Get all unique categories from actual expenses (both keys and full names)
                    const expenseCategories = [...new Set(expenses.map(exp => exp.category).filter(Boolean))];
                    console.log('Expense categories found:', expenseCategories);
                    console.log('User categories from settings:', userCategories);
                    
                    // Create a comprehensive category mapping
                    const categoryDisplayMap = new Map<string, { displayName: string; key: string }>();
                    
                    // Add user categories to the map
                    userCategories.forEach(userCat => {
                      if (userCat.toLowerCase() !== 'other') {
                        const key = userCat.toLowerCase().replace(/[ &]/g, '');
                        categoryDisplayMap.set(key, { displayName: userCat, key });
                        categoryDisplayMap.set(userCat.toLowerCase(), { displayName: userCat, key });
                        categoryDisplayMap.set(userCat, { displayName: userCat, key });
                      }
                    });
                    
                    // Add expense categories that might not be in user categories (new ML categories)
                    expenseCategories.forEach(expCat => {
                      if (expCat.toLowerCase() !== 'other') {
                        const key = expCat.toLowerCase().replace(/[ &]/g, '');
                        // If not already in map, add it
                        if (!categoryDisplayMap.has(key) && !categoryDisplayMap.has(expCat)) {
                          // Try to find a proper display name
                          const properDisplayName = userCategories.find(uc => 
                            uc.toLowerCase().replace(/[ &]/g, '') === key
                          ) || expCat;
                          
                          categoryDisplayMap.set(key, { displayName: properDisplayName, key });
                          categoryDisplayMap.set(expCat.toLowerCase(), { displayName: properDisplayName, key });
                          categoryDisplayMap.set(expCat, { displayName: properDisplayName, key });
                        }
                      }
                    });
                    
                    // Get unique categories for display
                    const uniqueCategories = Array.from(new Set(
                      Array.from(categoryDisplayMap.values()).map(cat => cat.displayName)
                    ));
                    
                    console.log('Final categories for display:', uniqueCategories);
                    
                    return uniqueCategories.map((displayName) => {
                      const categoryInfo = categoryDisplayMap.get(displayName);
                      if (!categoryInfo) return null;
                      
                      // Match expenses using flexible matching
                      const categoryExpenses = expenses.filter(exp => {
                        if (!exp.category) return false;
                        const expCat = exp.category;
                        const expKey = expCat.toLowerCase().replace(/[ &]/g, '');
                        const targetKey = categoryInfo.key;
                        
                        return expCat === displayName || 
                               expCat === targetKey || 
                               expKey === targetKey ||
                               expCat.toLowerCase() === displayName.toLowerCase();
                      });
                      
                      const categoryTotal = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
                      
                      // Only show categories that have expenses
                      if (categoryExpenses.length === 0) return null;
                      
                      // Use API summary data if available, otherwise fallback to local calculation
                      const summaryData = categorySummary[categoryInfo.key] || categorySummary[displayName];
                      const displayTotal = summaryData?.total ?? categoryTotal;
                      const displayCount = summaryData?.count ?? categoryExpenses.length;
                      
                      console.log(`Category "${displayName}" has ${categoryExpenses.length} expenses, total: ${displayTotal}`);
                      
                      return (
                        <div 
                          key={displayName} 
                          className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors hover:border-primary/50"
                          onClick={() => setSelectedCategory(displayName)}
                        >
                          <div className="font-medium">{displayName}</div>
                          <div className="text-sm text-muted-foreground">{formatAmount(displayTotal)} total</div>
                          <div className="text-xs text-muted-foreground">{displayCount} expenses</div>
                        </div>
                      );
                    }).filter(Boolean);
                  })()}
                </div>
              </CardContent>
            </Card>
          )}
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
                  onValueChange={(value) => {
                    setFormData({...formData, category: value, customCategory: ''});
                  }}
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
                {formData.category === 'other' && (
                  <div className="mt-2">
                    <Input
                      placeholder="Enter custom category name"
                      value={formData.customCategory}
                      onChange={(e) => setFormData({...formData, customCategory: e.target.value})}
                      className={formData.category === 'other' && !formData.customCategory?.trim() ? "border-red-300 focus:border-red-500" : ""}
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input 
                id="edit-title" 
                placeholder="Expense title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value.slice(0, 75)})}
                maxLength={75}
              />
              <p className="text-xs text-muted-foreground text-right">
                {formData.title.length}/75 characters
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input 
                id="edit-description" 
                placeholder="What was this expense for?"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value.slice(0, 150)})}
                maxLength={150}
              />
              <p className="text-xs text-muted-foreground text-right">
                {formData.description.length}/150 characters
              </p>
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