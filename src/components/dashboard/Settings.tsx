import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Bell, CreditCard, Lock, User, Trash2, Loader2, MapPin, Clock, AlertTriangle, Download, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { usePlan } from "@/hooks/usePlan";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProfileData {
  business_name: string;
  industry: string;
  timezone: string;
  currency: string;
  manual_timezone: boolean;
}

interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  daily_summaries: boolean;
  weekly_insights: boolean;
  monthly_reports: boolean;
  feature_updates: boolean;
}

export function Settings() {
  const { user, session } = useAuth();
  const { planData, upgradeToPro, downgradeToFree } = usePlan();
  const { toast } = useToast();
  
  // Profile state
  const [profileData, setProfileData] = useState<ProfileData>({
    business_name: '',
    industry: '',
    timezone: '',
    currency: 'usd',
    manual_timezone: false
  });
  
  // Auto-detected timezone
  const [autoDetectedTimezone, setAutoDetectedTimezone] = useState<string>('');
  
  // Original data for change detection
  const [originalProfileData, setOriginalProfileData] = useState<ProfileData>({
    business_name: '',
    industry: '',
    timezone: '',
    currency: 'usd',
    manual_timezone: false
  });
  const [originalNotifications, setOriginalNotifications] = useState<NotificationPreferences>({
    email_notifications: true,
    push_notifications: false,
    daily_summaries: true,
    weekly_insights: true,
    monthly_reports: false,
    feature_updates: true
  });

  // Currency to timezone mapping
  const currencyTimezoneMap = {
    'usd': 'America/New_York', // UTC-5 (EST)
    'eur': 'Europe/London',    // UTC+0 (GMT)
    'gbp': 'Europe/London',    // UTC+0 (GMT)
    'cad': 'America/Toronto',  // UTC-5 (EST)
    'aud': 'Australia/Sydney', // UTC+10
    'jpy': 'Asia/Tokyo',       // UTC+9
    'inr': 'Asia/Kolkata',     // UTC+5:30
    'cny': 'Asia/Shanghai'     // UTC+8
  };

  // Full timezone list
  const timezones = [
    { value: 'Pacific/Honolulu', label: 'Hawaii (UTC-10)' },
    { value: 'America/Anchorage', label: 'Alaska (UTC-9)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (UTC-8)' },
    { value: 'America/Denver', label: 'Mountain Time (UTC-7)' },
    { value: 'America/Chicago', label: 'Central Time (UTC-6)' },
    { value: 'America/New_York', label: 'Eastern Time (UTC-5)' },
    { value: 'America/Halifax', label: 'Atlantic Time (UTC-4)' },
    { value: 'America/St_Johns', label: 'Newfoundland (UTC-3:30)' },
    { value: 'America/Sao_Paulo', label: 'Brazil (UTC-3)' },
    { value: 'Atlantic/South_Georgia', label: 'South Georgia (UTC-2)' },
    { value: 'Atlantic/Azores', label: 'Azores (UTC-1)' },
    { value: 'Europe/London', label: 'GMT/UTC (UTC+0)' },
    { value: 'Europe/Berlin', label: 'Central European Time (UTC+1)' },
    { value: 'Europe/Helsinki', label: 'Eastern European Time (UTC+2)' },
    { value: 'Europe/Moscow', label: 'Moscow Time (UTC+3)' },
    { value: 'Asia/Dubai', label: 'Gulf Standard Time (UTC+4)' },
    { value: 'Asia/Kolkata', label: 'India Standard Time (UTC+5:30)' },
    { value: 'Asia/Dhaka', label: 'Bangladesh Time (UTC+6)' },
    { value: 'Asia/Bangkok', label: 'Indochina Time (UTC+7)' },
    { value: 'Asia/Shanghai', label: 'China Standard Time (UTC+8)' },
    { value: 'Asia/Tokyo', label: 'Japan Standard Time (UTC+9)' },
    { value: 'Australia/Sydney', label: 'Australian Eastern Time (UTC+10)' },
    { value: 'Pacific/Noumea', label: 'New Caledonia Time (UTC+11)' },
    { value: 'Pacific/Auckland', label: 'New Zealand Time (UTC+12)' }
  ];
  
  // Notification state
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    email_notifications: true,
    push_notifications: false,
    daily_summaries: true,
    weekly_insights: true,
    monthly_reports: false,
    feature_updates: true
  });
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Change password states
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Detect user's timezone and set defaults
  useEffect(() => {
    const detectTimezone = () => {
      try {
        const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setAutoDetectedTimezone(detectedTimezone);
        console.log('Auto-detected timezone:', detectedTimezone);
        
        // Set default timezone only if not manually set
        if (!profileData.manual_timezone && !profileData.timezone) {
          setProfileData(prev => ({ ...prev, timezone: detectedTimezone }));
        }
      } catch (error) {
        console.error('Failed to detect timezone:', error);
        // Fallback to UTC
        setAutoDetectedTimezone('UTC');
        if (!profileData.manual_timezone && !profileData.timezone) {
          setProfileData(prev => ({ ...prev, timezone: 'UTC' }));
        }
      }
    };

    detectTimezone();
  }, []);

  // Fetch user profile data on component mount
  useEffect(() => {
    if (user?.id) {
      fetchUserProfile();
      fetchNotificationPreferences();
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update timezone when currency changes (if not manually set)
  useEffect(() => {
    if (!profileData.manual_timezone && profileData.currency) {
      const defaultTimezone = currencyTimezoneMap[profileData.currency as keyof typeof currencyTimezoneMap];
      if (defaultTimezone) {
        setProfileData(prev => ({ ...prev, timezone: defaultTimezone }));
      }
    }
  }, [profileData.currency, profileData.manual_timezone]);

  const fetchUserProfile = async () => {
    try {
      console.log('Fetching profile for user:', user?.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('business_name, industry')
        .eq('user_id', user?.id)
        .single();

      console.log('Profile fetch result:', { data, error });

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        console.log('Setting profile data:', data);
        const newProfileData = {
          ...profileData,
          business_name: data.business_name || '',
          industry: data.industry || ''
        };
        setProfileData(newProfileData);
        setOriginalProfileData(newProfileData);
      } else {
        console.log('No profile data found');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationPreferences = async () => {
    try {
      // Try to get notification preferences from localStorage
      const storedNotifications = localStorage.getItem(`notifications_${user?.id}`);
      if (storedNotifications) {
        const notificationData = JSON.parse(storedNotifications);
        setNotifications(notificationData);
        setOriginalNotifications(notificationData);
      }
      
      // Try to get other preferences from localStorage
      const storedPreferences = localStorage.getItem(`preferences_${user?.id}`);
      if (storedPreferences) {
        const prefs = JSON.parse(storedPreferences);
        const updatedProfileData = {
          ...profileData,
          timezone: prefs.timezone || autoDetectedTimezone || 'UTC',
          currency: prefs.currency || 'usd',
          manual_timezone: prefs.manual_timezone || false
        };
        setProfileData(updatedProfileData);
        setOriginalProfileData(updatedProfileData);
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    }
  };

  const saveProfile = async () => {
    if (!user?.id) return;

    // Basic validation
    if (!profileData.business_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Business name is required.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      
      console.log('Saving profile data:', {
        user_id: user.id,
        business_name: profileData.business_name.trim(),
        industry: profileData.industry
      });

      // Try to insert or update profile data
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      let saveResult;
      if (existingProfile) {
        // Update existing profile
        saveResult = await supabase
          .from('profiles')
          .update({
            business_name: profileData.business_name.trim(),
            industry: profileData.industry,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .select();
      } else {
        // Insert new profile
        saveResult = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            business_name: profileData.business_name.trim(),
            industry: profileData.industry
          })
          .select();
      }

      const { data, error } = saveResult;

      console.log('Save result:', { data, error });

      if (error) throw error;

      // Save notification preferences to localStorage for now
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(notifications));
      
      // Save other preferences to localStorage
      localStorage.setItem(`preferences_${user.id}`, JSON.stringify({
        timezone: profileData.timezone,
        currency: profileData.currency,
        manual_timezone: profileData.manual_timezone
      }));

      toast({
        title: "Settings Saved",
        description: "Your profile settings have been updated successfully."
      });

      // Update original data to reflect the saved state
      setOriginalProfileData(profileData);
      setOriginalNotifications(notifications);

    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: `Failed to save settings: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const updateProfileField = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const updateNotificationField = (field: keyof NotificationPreferences, value: boolean) => {
    setNotifications(prev => ({ ...prev, [field]: value }));
  };

  // Function to check if profile has changed
  const hasProfileChanged = (): boolean => {
    return (
      profileData.business_name !== originalProfileData.business_name ||
      profileData.timezone !== originalProfileData.timezone ||
      profileData.currency !== originalProfileData.currency ||
      profileData.manual_timezone !== originalProfileData.manual_timezone
    );
  };

  // Function to check if notifications have changed
  const hasNotificationsChanged = (): boolean => {
    return (
      notifications.email_notifications !== originalNotifications.email_notifications ||
      notifications.push_notifications !== originalNotifications.push_notifications ||
      notifications.daily_summaries !== originalNotifications.daily_summaries ||
      notifications.weekly_insights !== originalNotifications.weekly_insights ||
      notifications.monthly_reports !== originalNotifications.monthly_reports ||
      notifications.feature_updates !== originalNotifications.feature_updates
    );
  };

  const handleManualTimezoneToggle = (checked: boolean) => {
    setProfileData(prev => {
      const newData = { ...prev, manual_timezone: checked };
      
      // If switching to auto mode, set to detected or currency-based timezone
      if (!checked) {
        const currencyBasedTimezone = currencyTimezoneMap[prev.currency as keyof typeof currencyTimezoneMap];
        newData.timezone = autoDetectedTimezone || currencyBasedTimezone || 'UTC';
      }
      
      return newData;
    });
  };

  const handleCurrencyChange = (currency: string) => {
    setProfileData(prev => {
      const newData = { ...prev, currency };
      
      // If not manual timezone, update timezone based on currency
      if (!prev.manual_timezone) {
        const defaultTimezone = currencyTimezoneMap[currency as keyof typeof currencyTimezoneMap];
        if (defaultTimezone) {
          newData.timezone = defaultTimezone;
        }
      }
      
      return newData;
    });
  };

  const handleUpgradePlan = () => {
    if (planData.plan === 'free') {
      upgradeToPro();
      toast({
        title: "Upgraded to Pro!",
        description: "You now have access to unlimited receipts and premium features.",
      });
    } else {
      toast({
        title: "Already Pro",
        description: "You're already on the Pro plan with all premium features.",
      });
    }
  };

  const handleDowngradePlan = () => {
    if (planData.plan === 'pro') {
      downgradeToFree();
      toast({
        title: "Downgraded to Free",
        description: "You've been downgraded to the Free plan.",
        variant: "destructive"
      });
    }
  };

  const handleAddPayment = () => {
    toast({
      title: "Payment Method",
      description: "Payment integration will be available soon.",
    });
  };

  const handleChangePassword = () => {
    setShowPasswordDialog(true);
  };

  const handlePasswordChange = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error", 
        description: "New passwords don't match",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    try {
      setChangingPassword(true);

      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully",
      });

      // Reset form and close dialog
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordDialog(false);

    } catch (error) {
      console.error('Password change error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive"
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const fetchAllUserData = async () => {
    try {
      // Fetch all user data from different sources
      const [expenses, profile, notifications] = await Promise.all([
        // Fetch expenses from Supabase
        supabase.from('business_expenses').select('*').eq('user_id', user?.id),
        // Profile is already in state
        Promise.resolve({ data: profileData, error: null }),
        // Notifications are already in state  
        Promise.resolve({ data: notifications, error: null })
      ]);

      return {
        profile: profile.data,
        notifications: notifications.data,
        expenses: expenses.data || [],
        exportDate: new Date().toISOString(),
        exportedBy: user?.email || 'Unknown',
        totalExpenses: expenses.data?.length || 0,
        totalExpenseAmount: expenses.data?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  };

  const downloadDataAsJSON = async () => {
    try {
      const data = await fetchAllUserData();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "JSON Data Downloaded",
        description: "Your complete user data has been downloaded as JSON.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download JSON data. Please try again.",
        variant: "destructive"
      });
    }
  };

  const downloadDataAsCSV = async () => {
    try {
      const data = await fetchAllUserData();
      
      // Create CSV content for expenses
      const csvHeaders = ['Date', 'Title', 'Description', 'Amount', 'Category', 'Vendor'];
      const csvRows = [csvHeaders.join(',')];
      
      data.expenses.forEach(expense => {
        const row = [
          expense.created_at || expense.date || '',
          `"${(expense.title || '').replace(/"/g, '""')}"`,
          `"${(expense.description || '').replace(/"/g, '""')}"`,
          expense.amount || 0,
          `"${(expense.category || '').replace(/"/g, '""')}"`,
          `"${(expense.vendor || '').replace(/"/g, '""')}"`,
        ];
        csvRows.push(row.join(','));
      });

      // Add summary information
      csvRows.push('');
      csvRows.push('Summary Information');
      csvRows.push(`Business Name,"${data.profile?.business_name || ''}"`);
      csvRows.push(`Industry,"${data.profile?.industry || ''}"`);
      csvRows.push(`Total Expenses,${data.totalExpenses}`);
      csvRows.push(`Total Amount,${data.totalExpenseAmount}`);
      csvRows.push(`Export Date,"${data.exportDate}"`);
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expenses-data-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "CSV Data Downloaded",
        description: "Your expense data has been downloaded as CSV.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download CSV data. Please try again.",
        variant: "destructive"
      });
    }
  };

  const downloadDataAsPDF = async () => {
    try {
      const data = await fetchAllUserData();
      
      // Create HTML content for PDF conversion
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>User Data Export</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .section { margin-bottom: 30px; }
            .expense-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .expense-table th, .expense-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .expense-table th { background-color: #f2f2f2; }
            .summary { background: #e8f5e8; padding: 15px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>User Data Export</h1>
            <p><strong>Business:</strong> ${data.profile?.business_name || 'N/A'}</p>
            <p><strong>Industry:</strong> ${data.profile?.industry || 'N/A'}</p>
            <p><strong>Export Date:</strong> ${new Date(data.exportDate).toLocaleDateString()}</p>
          </div>
          
          <div class="section">
            <h2>Expense Summary</h2>
            <div class="summary">
              <p><strong>Total Expenses:</strong> ${data.totalExpenses}</p>
              <p><strong>Total Amount:</strong> $${data.totalExpenseAmount.toFixed(2)}</p>
            </div>
          </div>
          
          <div class="section">
            <h2>Expenses</h2>
            <table class="expense-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Category</th>
                  <th>Vendor</th>
                </tr>
              </thead>
              <tbody>
                ${data.expenses.map(expense => `
                  <tr>
                    <td>${new Date(expense.created_at || expense.date || '').toLocaleDateString()}</td>
                    <td>${expense.title || ''}</td>
                    <td>${expense.description || ''}</td>
                    <td>$${(expense.amount || 0).toFixed(2)}</td>
                    <td>${expense.category || ''}</td>
                    <td>${expense.vendor || ''}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </body>
        </html>
      `;
      
      // Create a new window to print/save as PDF
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Wait for content to load then trigger print
        setTimeout(() => {
          printWindow.print();
        }, 500);
        
        toast({
          title: "PDF Generation",
          description: "PDF print dialog has been opened. Choose 'Save as PDF' in print options.",
        });
      } else {
        throw new Error('Popup blocked');
      }
    } catch (error) {
      toast({
        title: "PDF Generation Failed",
        description: "Failed to generate PDF. Please try again or use CSV download.",
        variant: "destructive"
      });
    }
  };

  // Test function to debug what's available
  const testDeletionMethods = async () => {
    try {
      console.log('=== TEST BUTTON CLICKED ===');
      
      if (!user?.id) {
        console.log('❌ No user ID found');
        toast({
          title: "Test Failed",
          description: "No user ID available for testing",
          variant: "destructive"
        });
        return;
      }
      
      console.log('✅ User ID:', user.id);
      console.log('✅ Session token present:', !!session?.access_token);
      
      toast({
        title: "Running Tests",
        description: "Check console for detailed results...",
      });
      
      console.log('=== TESTING DELETION METHODS ===');
      
      // Test 1: Check if edge function exists
      console.log('🔍 Test 1: Edge function...');
      try {
        const { data, error } = await supabase.functions.invoke('delete-account', {
          headers: { 'Authorization': `Bearer ${session?.access_token}` }
        });
        console.log('✅ Edge function response:', { data, error });
        if (error) {
          console.log('❌ Edge function error details:', error);
        }
      } catch (e) {
        console.log('❌ Edge function exception:', e);
      }
      
      // Test 2: Check if stored procedure exists
      console.log('🔍 Test 2: Stored procedure...');
      try {
        const { data, error } = await supabase.rpc('delete_user_account', { 
          target_user_id: user.id 
        });
        console.log('✅ Stored procedure response:', { data, error });
        if (error) {
          console.log('❌ Stored procedure error details:', error);
        }
      } catch (e) {
        console.log('❌ Stored procedure exception:', e);
      }
      
      // Test 3: Check auth deletion RPC
      console.log('🔍 Test 3: Auth deletion RPC...');
      try {
        const { data, error } = await supabase.rpc('delete_auth_user_direct', { 
          target_user_id: user.id 
        });
        console.log('✅ Auth deletion RPC response:', { data, error });
        if (error) {
          console.log('❌ Auth deletion RPC error details:', error);
        }
      } catch (e) {
        console.log('❌ Auth deletion RPC exception:', e);
      }
      
      // Test 4: Check new simple-delete-account function
      console.log('🔍 Test 4: New simple delete account function...');
      try {
        const { data, error } = await supabase.functions.invoke('simple-delete-account', {
          headers: { 'Authorization': `Bearer ${session?.access_token}` }
        });
        console.log('✅ Simple delete account response:', { data, error });
        console.log('Simple delete account data:', JSON.stringify(data, null, 2));
        console.log('Simple delete account error:', JSON.stringify(error, null, 2));
        
        if (error) {
          console.log('❌ Simple delete account error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
        }
        if (data && data.success) {
          console.log('🚨 WARNING: This would have deleted your auth user! (Test successful)');
          console.log('✅ NEW EDGE FUNCTION IS WORKING! You can now delete your account properly.');
        } else if (data && !data.success) {
          console.log('❌ Simple delete function returned failure:', data.error);
        }
      } catch (e) {
        console.log('❌ Simple delete account exception:', e);
        console.log('❌ Exception details:', {
          name: e.name,
          message: e.message,
          stack: e.stack
        });
      }
      
      console.log('=== TESTS COMPLETED ===');
      
      toast({
        title: "Tests Completed",
        description: "Check browser console (F12) for detailed results",
        variant: "default"
      });
      
    } catch (error) {
      console.error('❌ Test function failed completely:', error);
      toast({
        title: "Test Function Failed",
        description: error.message || "Unknown error occurred",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.id) return;

    try {
      setDeleting(true);
      
      console.log('=== STARTING SIMPLIFIED ACCOUNT DELETION ===');
      console.log('User ID:', user.id);
      
      toast({
        title: "Deleting Account",
        description: "Clearing your data and attempting to delete your account...",
      });

      // Step 1: Clear local storage
      try {
        localStorage.removeItem(`notifications_${user.id}`);
        localStorage.removeItem(`preferences_${user.id}`);
        localStorage.removeItem(`knowledge_base_${user.id}`);
        Object.keys(localStorage).forEach(key => {
          if (key.includes(user.id)) {
            localStorage.removeItem(key);
          }
        });
        console.log('✅ LocalStorage cleared');
      } catch (error) {
        console.warn('⚠️ Error clearing localStorage:', error);
      }

      // Step 2: Delete user data from all tables (client-side)
      console.log('🗑️ Deleting user data from database tables...');
      const tablesToClean = [
        'messages',
        'conversations', 
        'business_expenses',
        'business_outcomes',
        'client_metrics',
        'expenses',
        'knowledge_base_entries',
        'clients',
        'integrations',
        'ai_settings',
        'profiles'
      ];

      let totalDeleted = 0;
      for (const table of tablesToClean) {
        try {
          console.log(`Deleting from ${table}...`);
          const { error, count } = await supabase
            .from(table)
            .delete({ count: 'exact' })
            .eq('user_id', user.id);
          
          if (error && error.code !== 'PGRST116') {
            console.warn(`⚠️ Warning deleting from ${table}:`, error);
          } else {
            const deletedCount = count || 0;
            totalDeleted += deletedCount;
            console.log(`✅ Deleted ${deletedCount} rows from ${table}`);
          }
        } catch (error) {
          console.error(`❌ Error deleting from ${table}:`, error);
        }
      }

      // Step 3: Delete storage files
      console.log('🗑️ Deleting user files from storage...');
      const buckets = ['receipts', 'avatars', 'documents'];
      let totalFilesDeleted = 0;
      
      for (const bucket of buckets) {
        try {
          const { data: files, error: listError } = await supabase.storage
            .from(bucket)
            .list(user.id);
          
          if (listError && listError.message !== 'The resource was not found') {
            console.warn(`⚠️ Warning listing files in ${bucket}:`, listError);
            continue;
          }

          if (files && files.length > 0) {
            const filePaths = files.map(file => `${user.id}/${file.name}`);
            const { error: deleteError } = await supabase.storage
              .from(bucket)
              .remove(filePaths);
            
            if (deleteError) {
              console.warn(`⚠️ Warning deleting files from ${bucket}:`, deleteError);
            } else {
              totalFilesDeleted += files.length;
              console.log(`✅ Deleted ${files.length} files from ${bucket}`);
            }
          }
        } catch (error) {
          console.error(`❌ Error deleting from storage ${bucket}:`, error);
        }
      }

      console.log(`📊 Data cleanup complete: ${totalDeleted} records, ${totalFilesDeleted} files deleted`);

      // Step 4: Try multiple methods to delete the auth user
      console.log('🔐 Attempting to delete auth user using multiple methods...');
      
      let authUserDeleted = false;
      
      // Method 1: Try the simple edge function
      console.log('Method 1: Trying simple-delete-account edge function...');
      try {
        const { data: authResult, error: authError } = await supabase.functions.invoke('simple-delete-account', {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          }
        });

        console.log('Edge function auth deletion response:', { authResult, authError });

        if (!authError && authResult && authResult.success) {
          console.log('✅ Method 1 succeeded! Auth user deleted via edge function');
          authUserDeleted = true;
        } else {
          console.log('❌ Method 1 failed:', authError || authResult);
        }
      } catch (authDeleteError) {
        console.log('❌ Method 1 exception:', authDeleteError);
      }

      // Method 2: Try direct API call if edge function failed
      if (!authUserDeleted) {
        console.log('Method 2: Trying direct auth deletion API...');
        try {
          // Make a direct call to Supabase's auth admin endpoint
          const response = await fetch(`${supabase.supabaseUrl}/auth/v1/admin/users/${user.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${session?.access_token}`,
              'apikey': supabase.supabaseKey,
              'Content-Type': 'application/json'
            }
          });

          console.log('Direct API response status:', response.status);
          
          if (response.ok) {
            console.log('✅ Method 2 succeeded! Auth user deleted via direct API');
            authUserDeleted = true;
          } else {
            const responseText = await response.text();
            console.log('❌ Method 2 failed with status:', response.status, responseText);
          }
        } catch (directApiError) {
          console.log('❌ Method 2 exception:', directApiError);
        }
      }

      // Method 3: Try using Supabase's auth.admin (if available)
      if (!authUserDeleted) {
        console.log('Method 3: Trying supabase.auth.admin.deleteUser...');
        try {
          const { error: adminError } = await supabase.auth.admin.deleteUser(user.id);
          
          if (!adminError) {
            console.log('✅ Method 3 succeeded! Auth user deleted via admin client');
            authUserDeleted = true;
          } else {
            console.log('❌ Method 3 failed:', adminError);
          }
        } catch (adminException) {
          console.log('❌ Method 3 exception:', adminException);
        }
      }

      // Show results and handle next steps
      if (authUserDeleted) {
        toast({
          title: "🎉 Account Completely Deleted!",
          description: "Your account and all data have been permanently deleted. You cannot log back in.",
          variant: "destructive"
        });
        
        console.log('✅ SUCCESS: Complete account deletion - user can no longer log in');
        
        // Wait longer before redirect since user is deleted
        setTimeout(() => {
          window.location.href = '/';
        }, 4000);
        
      } else {
        console.log('⚠️ Auth user deletion failed with all methods');
        
        toast({
          title: "⚠️ Partial Deletion Complete",
          description: "Your data was cleared but the login account remains. You've been signed out.",
          variant: "destructive"
        });

        // Sign out since auth deletion failed
        await supabase.auth.signOut({ scope: 'global' });
        
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      }

      console.log(`📊 Final result - Auth user deleted: ${authUserDeleted}`);

    } catch (error) {
      console.error('❌ Account deletion failed:', error);
      
      try {
        await supabase.auth.signOut({ scope: 'global' });
        toast({
          title: "Partial Deletion",
          description: "Some data was cleared. You've been signed out. Contact support if needed.",
          variant: "destructive"
        });
        
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } catch (signOutError) {
        console.error('❌ Error signing out:', signOutError);
        toast({
          title: "Deletion Failed",
          description: "Please clear your browser data and contact support.",
          variant: "destructive"
        });
      }
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Settings</h2>
        <p className="text-muted-foreground">Manage your account and application preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="privacy">Privacy & Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your personal and business information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" value={user?.email || ""} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-name">Business Name <span className="text-destructive">*</span></Label>
                  <Input 
                    id="business-name" 
                    placeholder="Enter your business name"
                    value={profileData.business_name}
                    onChange={(e) => updateProfileField('business_name', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="industry" className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    Industry
                    <Badge variant="outline" className="text-xs">From Onboarding</Badge>
                  </Label>
                  <Input 
                    id="industry"
                    value={profileData.industry || 'Not set during onboarding'}
                    disabled
                    className="bg-muted cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">
                    Industry is set during onboarding and cannot be changed here.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Default Currency</Label>
                  <Select 
                    value={profileData.currency}
                    onValueChange={handleCurrencyChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">USD ($) - United States Dollar</SelectItem>
                      <SelectItem value="eur">EUR (€) - Euro</SelectItem>
                      <SelectItem value="gbp">GBP (£) - British Pound</SelectItem>
                      <SelectItem value="cad">CAD (C$) - Canadian Dollar</SelectItem>
                      <SelectItem value="aud">AUD (A$) - Australian Dollar</SelectItem>
                      <SelectItem value="jpy">JPY (¥) - Japanese Yen</SelectItem>
                      <SelectItem value="inr">INR (₹) - Indian Rupee</SelectItem>
                      <SelectItem value="cny">CNY (¥) - Chinese Yuan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="manual-timezone"
                      checked={profileData.manual_timezone}
                      onCheckedChange={handleManualTimezoneToggle}
                    />
                    <Label htmlFor="manual-timezone" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Set timezone manually
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {profileData.manual_timezone 
                      ? 'You can manually select any timezone from the list below.' 
                      : `Using ${autoDetectedTimezone ? 'auto-detected' : 'currency-based'} timezone. Check the box above to override.`
                    }
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Timezone
                    {!profileData.manual_timezone && (
                      <Badge variant="secondary" className="text-xs">
                        {autoDetectedTimezone ? 'Auto-detected' : 'Currency-based'}
                      </Badge>
                    )}
                  </Label>
                  <Select 
                    value={profileData.timezone}
                    onValueChange={(value) => updateProfileField('timezone', value)}
                    disabled={!profileData.manual_timezone}
                  >
                    <SelectTrigger className={!profileData.manual_timezone ? 'bg-muted cursor-not-allowed' : ''}>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!profileData.manual_timezone && (
                    <p className="text-xs text-muted-foreground">
                      Current: {profileData.timezone} 
                      {autoDetectedTimezone && autoDetectedTimezone === profileData.timezone && ' (auto-detected)'}
                      {!autoDetectedTimezone && ' (based on selected currency)'}
                    </p>
                  )}
                </div>
              </div>

              <Button 
                onClick={saveProfile}
                disabled={saving || !hasProfileChanged()}
                className="gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive updates and summaries via email</p>
                </div>
                <Switch 
                  id="email-notifications"
                  checked={notifications.email_notifications}
                  onCheckedChange={(checked) => updateNotificationField('email_notifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Browser notifications for important updates</p>
                </div>
                <Switch 
                  id="push-notifications"
                  checked={notifications.push_notifications}
                  onCheckedChange={(checked) => updateNotificationField('push_notifications', checked)}
                />
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Email Frequency</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Daily expense summaries</span>
                    <Switch 
                      checked={notifications.daily_summaries}
                      onCheckedChange={(checked) => updateNotificationField('daily_summaries', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Weekly business insights</span>
                    <Switch 
                      checked={notifications.weekly_insights}
                      onCheckedChange={(checked) => updateNotificationField('weekly_insights', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Monthly reports</span>
                    <Switch 
                      checked={notifications.monthly_reports}
                      onCheckedChange={(checked) => updateNotificationField('monthly_reports', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Feature updates</span>
                    <Switch 
                      checked={notifications.feature_updates}
                      onCheckedChange={(checked) => updateNotificationField('feature_updates', checked)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Button 
                  onClick={saveProfile}
                  disabled={saving || !hasNotificationsChanged()}
                  className="gap-2"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? "Saving..." : "Save Notification Preferences"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Billing Information
              </CardTitle>
              <CardDescription>Manage your subscription and payment details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{planData.planLabel} Plan</h4>
                    <Badge 
                      variant={planData.plan === 'pro' ? 'default' : 'outline'}
                      className={planData.plan === 'pro' 
                        ? 'bg-gradient-to-r from-primary to-accent text-white' 
                        : ''
                      }
                    >
                      Current Plan
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {planData.plan === 'pro' 
                      ? 'Premium features with unlimited usage' 
                      : 'Basic features with limited usage'
                    }
                  </p>
                </div>
                <div className="flex gap-2">
                  {planData.plan === 'free' ? (
                    <Button onClick={handleUpgradePlan}>Upgrade to Pro</Button>
                  ) : (
                    <>
                      <Button variant="outline" onClick={handleDowngradePlan}>Downgrade</Button>
                      <Button disabled>Current Plan</Button>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Payment Method</h4>
                <div className="p-4 border rounded-lg bg-muted/20">
                  <p className="text-sm text-muted-foreground">No payment method on file</p>
                  <Button variant="outline" className="mt-2" onClick={handleAddPayment}>Add Payment Method</Button>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Billing History</h4>
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No billing history yet</p>
                  <p className="text-sm">Upgrade to a paid plan to see your invoices here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Privacy & Security
              </CardTitle>
              <CardDescription>Control your data and security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Data Privacy</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Share usage analytics</span>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Personalized AI recommendations</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Voice data retention (30 days)</span>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Security</h4>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" onClick={handleChangePassword}>
                    Change Password
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Download My Data
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={downloadDataAsJSON}>
                        <FileText className="h-4 w-4 mr-2" />
                        Download as JSON
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={downloadDataAsCSV}>
                        <FileText className="h-4 w-4 mr-2" />
                        Download as CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={downloadDataAsPDF}>
                        <FileText className="h-4 w-4 mr-2" />
                        Download as PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="outline" className="w-full justify-start" disabled>
                    Two-Factor Authentication (Coming Soon)
                  </Button>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium text-destructive">Danger Zone</h4>
                <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-destructive">Delete Account</p>
                        <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={testDeletionMethods}
                          className="text-orange-600 border-orange-600 hover:bg-orange-50"
                        >
                          Test Methods
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" className="gap-2" disabled={deleting}>
                              {deleting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                              {deleting ? "Deleting..." : "Delete Account"}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                                <AlertTriangle className="h-5 w-5" />
                                Delete Account Permanently
                              </AlertDialogTitle>
                              <AlertDialogDescription className="space-y-2">
                                <p>
                                  This action <strong>cannot be undone</strong>. This will permanently delete your account and remove all of your data from our servers.
                                </p>
                                <p>The following data will be permanently deleted:</p>
                                <ul className="list-disc list-inside space-y-1 text-sm">
                                  <li>Your profile and business information</li>
                                  <li>All expense records and receipts</li>
                                  <li>Business metrics and outcomes</li>
                                  <li>Knowledge base entries</li>
                                  <li>All chat histories and AI interactions</li>
                                  <li>Notification preferences and settings</li>
                                </ul>
                                <p className="font-medium text-destructive">
                                  Are you absolutely sure you want to delete your account?
                                </p>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleDeleteAccount}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                disabled={deleting}
                              >
                                {deleting ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Deleting Account...
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Yes, Delete My Account
                                  </>
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your new password below. Your new password must be at least 6 characters long.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowPasswordDialog(false);
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handlePasswordChange}
              disabled={changingPassword || !passwordData.newPassword || !passwordData.confirmPassword}
            >
              {changingPassword && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {changingPassword ? "Changing..." : "Change Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}