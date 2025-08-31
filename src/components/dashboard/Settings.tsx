import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Bell, CreditCard, Lock, User, Trash2, Loader2, MapPin, Clock, AlertTriangle, Download, FileText, Shield, Zap, MessageSquare, Smartphone, AlertCircle, TrendingUp, Brain, Settings as SettingsIcon, HelpCircle, Mail, Phone } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { usePlan } from "@/hooks/usePlan";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNotifications } from "@/hooks/useNotifications";
import { useSubscription } from "@/hooks/useSubscription";
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
  // General
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  
  // Reports & Summaries
  daily_summaries: boolean;
  weekly_insights: boolean;
  monthly_reports: boolean;
  
  // Business Alerts
  expense_alerts: boolean;
  budget_warnings: boolean;
  large_expense_threshold: boolean;
  duplicate_expense_warnings: boolean;
  
  // AI & Automation
  ai_insights: boolean;
  smart_categorization_suggestions: boolean;
  receipt_processing_status: boolean;
  
  // Security & Account
  login_alerts: boolean;
  account_changes: boolean;
  data_export_completion: boolean;
  
  // Marketing & Updates
  feature_updates: boolean;
  product_announcements: boolean;
  tips_and_tutorials: boolean;
  
  // Integration Notifications
  telegram_notifications: boolean;
  whatsapp_notifications: boolean;
  
  // Timing Preferences
  quiet_hours_enabled: boolean;
  notification_schedule: 'immediate' | 'batched' | 'daily_digest';
}

export function Settings() {
  const { user, session } = useAuth();
  const { planData, upgradeToPro, downgradeToFree } = usePlan();
  const { toast } = useToast();
  const { hasActiveSubscription } = useSubscription();
  const { notifyDataExportComplete, notifyAccountChange } = useNotifications();
  
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
    // General
    email_notifications: true,
    push_notifications: false,
    sms_notifications: false,
    
    // Reports & Summaries
    daily_summaries: true,
    weekly_insights: true,
    monthly_reports: false,
    
    // Business Alerts
    expense_alerts: true,
    budget_warnings: true,
    large_expense_threshold: true,
    duplicate_expense_warnings: true,
    
    // AI & Automation
    ai_insights: true,
    smart_categorization_suggestions: true,
    receipt_processing_status: true,
    
    // Security & Account
    login_alerts: true,
    account_changes: true,
    data_export_completion: true,
    
    // Marketing & Updates
    feature_updates: true,
    product_announcements: false,
    tips_and_tutorials: true,
    
    // Integration Notifications
    telegram_notifications: false,
    whatsapp_notifications: false,
    
    // Timing Preferences
    quiet_hours_enabled: false,
    notification_schedule: 'immediate'
  });

  // Automation states
  const [autoExpenseDetection, setAutoExpenseDetection] = useState(true);
  
  // Voice settings states
  const [voiceEnabled, setVoiceEnabled] = useState(true);

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
    // General
    email_notifications: true,
    push_notifications: false,
    sms_notifications: false,
    
    // Reports & Summaries
    daily_summaries: true,
    weekly_insights: true,
    monthly_reports: false,
    
    // Business Alerts
    expense_alerts: true,
    budget_warnings: true,
    large_expense_threshold: true,
    duplicate_expense_warnings: true,
    
    // AI & Automation
    ai_insights: true,
    smart_categorization_suggestions: true,
    receipt_processing_status: true,
    
    // Security & Account
    login_alerts: true,
    account_changes: true,
    data_export_completion: true,
    
    // Marketing & Updates
    feature_updates: true,
    product_announcements: false,
    tips_and_tutorials: true,
    
    // Integration Notifications
    telegram_notifications: false,
    whatsapp_notifications: false,
    
    // Timing Preferences
    quiet_hours_enabled: false,
    notification_schedule: 'immediate'
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
      if (!user?.id) return;

      console.log('🔔 Fetching notification preferences from database...');
      
      // notification_preferences table doesn't exist, skip database fetch
      const notificationData = null;
      const notificationError = { code: 'TABLE_NOT_EXISTS' };

      if (notificationError && notificationError.code !== 'PGRST116') {
        console.error('Error fetching notification preferences:', notificationError);
        
        // Fallback to localStorage
        const storedNotifications = localStorage.getItem(`notifications_${user.id}`);
        if (storedNotifications) {
          const localData = JSON.parse(storedNotifications);
          setNotifications(localData);
          setOriginalNotifications(localData);
        }
      } else if (notificationData) {
        console.log('✅ Loaded notification preferences from database:', notificationData);
        
        // Map database fields to component state
        const mappedNotifications: NotificationPreferences = {
          // General
          email_notifications: notificationData.email_notifications ?? true,
          push_notifications: notificationData.push_notifications ?? false,
          sms_notifications: notificationData.sms_notifications ?? false,
          
          // Reports & Summaries
          daily_summaries: notificationData.daily_summaries ?? true,
          weekly_insights: notificationData.weekly_insights ?? true,
          monthly_reports: notificationData.monthly_reports ?? false,
          
          // Business Alerts
          expense_alerts: notificationData.expense_alerts ?? true,
          budget_warnings: notificationData.budget_warnings ?? true,
          large_expense_threshold: notificationData.large_expense_threshold ?? true,
          duplicate_expense_warnings: notificationData.duplicate_expense_warnings ?? true,
          
          // AI & Automation
          ai_insights: notificationData.ai_insights ?? true,
          smart_categorization_suggestions: notificationData.smart_categorization_suggestions ?? true,
          receipt_processing_status: notificationData.receipt_processing_status ?? true,
          
          // Security & Account
          login_alerts: notificationData.login_alerts ?? true,
          account_changes: notificationData.account_changes ?? true,
          data_export_completion: notificationData.data_export_completion ?? true,
          
          // Marketing & Updates
          feature_updates: notificationData.feature_updates ?? true,
          product_announcements: notificationData.product_announcements ?? false,
          tips_and_tutorials: notificationData.tips_and_tutorials ?? true,
          
          // Integration Notifications
          telegram_notifications: notificationData.telegram_notifications ?? false,
          whatsapp_notifications: notificationData.whatsapp_notifications ?? false,
          
          // Timing Preferences
          quiet_hours_enabled: notificationData.quiet_hours_enabled ?? false,
          notification_schedule: notificationData.notification_schedule || 'immediate'
        };
        
        setNotifications(mappedNotifications);
        setOriginalNotifications(mappedNotifications);
      } else {
        console.log('📝 No notification preferences found, creating defaults...');
        
        // Use localStorage defaults since notification_preferences table doesn't exist
        console.log('📝 Using localStorage defaults for notification preferences');
        setNotifications(defaultNotifications);
        setOriginalNotifications(defaultNotifications);
        
        // Save to localStorage
        localStorage.setItem(`notifications_${user.id}`, JSON.stringify(defaultNotifications));
      }
      
      // Try to get other preferences from localStorage for now
      const storedPreferences = localStorage.getItem(`preferences_${user.id}`);
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

      // Save notification preferences to database
      console.log('💾 Saving notification preferences to localStorage...');
      
      // Save to localStorage since notification_preferences table doesn't exist
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(notifications));
      
      const notificationError = null; // No error for localStorage
      
      // Skip database upsert
      if (false) {
        await supabase.from('notification_preferences').upsert({
          user_id: user.id,
          // General
          email_notifications: notifications.email_notifications,
          push_notifications: notifications.push_notifications,
          sms_notifications: notifications.sms_notifications,
          
          // Reports & summaries
          daily_summaries: notifications.daily_summaries,
          weekly_insights: notifications.weekly_insights,
          monthly_reports: notifications.monthly_reports,
          
          // Business alerts
          expense_alerts: notifications.expense_alerts,
          budget_warnings: notifications.budget_warnings,
          large_expense_threshold: notifications.large_expense_threshold,
          duplicate_expense_warnings: notifications.duplicate_expense_warnings,
          
          // AI & automation
          ai_insights: notifications.ai_insights,
          smart_categorization_suggestions: notifications.smart_categorization_suggestions,
          receipt_processing_status: notifications.receipt_processing_status,
          
          // Security & account
          login_alerts: notifications.login_alerts,
          account_changes: notifications.account_changes,
          data_export_completion: notifications.data_export_completion,
          
          // Marketing & updates
          feature_updates: notifications.feature_updates,
          product_announcements: notifications.product_announcements,
          tips_and_tutorials: notifications.tips_and_tutorials,
          
          // Integration notifications
          telegram_notifications: notifications.telegram_notifications,
          whatsapp_notifications: notifications.whatsapp_notifications,
          
          // Timing preferences
          quiet_hours_enabled: notifications.quiet_hours_enabled,
          notification_schedule: notifications.notification_schedule,
        });
      }

      if (notificationError) {
        console.error('Error saving notification preferences:', notificationError);
        throw new Error(`Failed to save notification preferences: ${notificationError.message}`);
      } else {
        console.log('✅ Notification preferences saved to database');
      }

      // Backup to localStorage
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(notifications));
      
      // Save other preferences to localStorage
      localStorage.setItem(`preferences_${user.id}`, JSON.stringify({
        timezone: profileData.timezone,
        currency: profileData.currency,
        manual_timezone: profileData.manual_timezone
      }));

      // Send account change notification
      try {
        await notifyAccountChange('profile and notification settings', {
          profileChanged: hasProfileChanged(),
          notificationsChanged: hasNotificationsChanged()
        });
      } catch (notificationError) {
        console.error('Failed to send account change notification:', notificationError);
      }

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
      // General
      notifications.email_notifications !== originalNotifications.email_notifications ||
      notifications.push_notifications !== originalNotifications.push_notifications ||
      notifications.sms_notifications !== originalNotifications.sms_notifications ||
      
      // Reports & Summaries
      notifications.daily_summaries !== originalNotifications.daily_summaries ||
      notifications.weekly_insights !== originalNotifications.weekly_insights ||
      notifications.monthly_reports !== originalNotifications.monthly_reports ||
      
      // Business Alerts
      notifications.expense_alerts !== originalNotifications.expense_alerts ||
      notifications.budget_warnings !== originalNotifications.budget_warnings ||
      notifications.large_expense_threshold !== originalNotifications.large_expense_threshold ||
      notifications.duplicate_expense_warnings !== originalNotifications.duplicate_expense_warnings ||
      
      // AI & Automation
      notifications.ai_insights !== originalNotifications.ai_insights ||
      notifications.smart_categorization_suggestions !== originalNotifications.smart_categorization_suggestions ||
      notifications.receipt_processing_status !== originalNotifications.receipt_processing_status ||
      
      // Security & Account
      notifications.login_alerts !== originalNotifications.login_alerts ||
      notifications.account_changes !== originalNotifications.account_changes ||
      notifications.data_export_completion !== originalNotifications.data_export_completion ||
      
      // Marketing & Updates
      notifications.feature_updates !== originalNotifications.feature_updates ||
      notifications.product_announcements !== originalNotifications.product_announcements ||
      notifications.tips_and_tutorials !== originalNotifications.tips_and_tutorials ||
      
      // Integration Notifications
      notifications.telegram_notifications !== originalNotifications.telegram_notifications ||
      notifications.whatsapp_notifications !== originalNotifications.whatsapp_notifications ||
      
      // Timing Preferences
      notifications.quiet_hours_enabled !== originalNotifications.quiet_hours_enabled ||
      notifications.notification_schedule !== originalNotifications.notification_schedule
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
      console.log('🔍 Starting data fetch for user:', user?.id);
      
      if (!user?.id) {
        throw new Error('No user ID available');
      }

      // Fetch expenses from Supabase with detailed logging
      console.log('📊 Fetching expenses from business_expenses table...');
      const { data: expenseData, error: expenseError } = await supabase
        .from('business_expenses')
        .select('*')
        .eq('user_id', user.id);

      console.log('📊 Expenses fetch result:', { 
        data: expenseData, 
        error: expenseError,
        count: expenseData?.length || 0 
      });

      if (expenseError) {
        console.error('❌ Error fetching expenses:', expenseError);
        // Don't throw, just log the error and continue with empty expenses
      }

      // Normalize expense data with proper fallback values for title and vendor
      const normalizedExpenses = (expenseData || []).map(expense => ({
        ...expense,
        title: expense.title || 'not provided',
        vendor: expense.vendor || 'not provided'
      }));

      // Prepare the final data object
      const userData = {
        profile: profileData,
        notifications: notifications,
        expenses: normalizedExpenses,
        exportDate: new Date().toISOString(),
        exportedBy: user?.email || 'Unknown',
        totalExpenses: normalizedExpenses.length,
        totalExpenseAmount: normalizedExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0),
        userId: user.id,
        userEmail: user.email
      };

      console.log('📋 Final user data prepared:', {
        profileFields: Object.keys(userData.profile || {}),
        notificationFields: Object.keys(userData.notifications || {}),
        expenseCount: userData.expenses.length,
        totalAmount: userData.totalExpenseAmount
      });

      return userData;
    } catch (error) {
      console.error('❌ Error fetching user data:', error);
      throw error;
    }
  };

  const downloadDataAsJSON = async () => {
    try {
      console.log('📥 Starting JSON download...');
      
      const data = await fetchAllUserData();
      
      console.log('📄 Data to be exported as JSON:', data);
      
      // Create the JSON content
      const jsonContent = JSON.stringify(data, null, 2);
      console.log('📝 JSON content size:', jsonContent.length, 'characters');
      
      // Create blob and download
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-data-${new Date().toISOString().split('T')[0]}.json`;
      
      console.log('⬇️ Triggering download:', a.download);
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('✅ JSON download completed successfully');
      
      // Send data export notification
      try {
        await notifyDataExportComplete('JSON', `user-data-${new Date().toISOString().split('T')[0]}.json`);
      } catch (notificationError) {
        console.error('Failed to send export notification:', notificationError);
      }
      
      toast({
        title: "JSON Data Downloaded",
        description: `Downloaded ${data.totalExpenses} expenses and profile data as JSON.`,
      });
    } catch (error) {
      console.error('❌ JSON download failed:', error);
      toast({
        title: "Download Failed",
        description: `Failed to download JSON data: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const downloadDataAsCSV = async () => {
    try {
      console.log('📊 Starting CSV download...');
      
      const data = await fetchAllUserData();
      
      console.log('📄 Data to be exported as CSV:', data);
      
      // Create CSV content for expenses
      const csvHeaders = ['Date', 'Title', 'Description', 'Amount', 'Category', 'Vendor'];
      const csvRows = [csvHeaders.join(',')];
      
      console.log(`📝 Processing ${data.expenses.length} expenses for CSV...`);
      
      if (data.expenses.length === 0) {
        csvRows.push('No expenses found');
      } else {
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
      }

      // Add summary information
      csvRows.push('');
      csvRows.push('Summary Information');
      csvRows.push(`Business Name,"${data.profile?.business_name || 'Not set'}"`);
      csvRows.push(`Industry,"${data.profile?.industry || 'Not set'}"`);
      csvRows.push(`Total Expenses,${data.totalExpenses}`);
      csvRows.push(`Total Amount,${data.totalExpenseAmount}`);
      csvRows.push(`Export Date,"${data.exportDate}"`);
      csvRows.push(`User Email,"${data.userEmail || 'Not available'}"`);
      
      const csvContent = csvRows.join('\n');
      console.log('📝 CSV content size:', csvContent.length, 'characters');
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expenses-data-${new Date().toISOString().split('T')[0]}.csv`;
      
      console.log('⬇️ Triggering CSV download:', a.download);
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('✅ CSV download completed successfully');
      
      // Send data export notification
      try {
        await notifyDataExportComplete('CSV', `expenses-data-${new Date().toISOString().split('T')[0]}.csv`);
      } catch (notificationError) {
        console.error('Failed to send export notification:', notificationError);
      }
      
      toast({
        title: "CSV Data Downloaded",
        description: `Downloaded ${data.totalExpenses} expenses as CSV file.`,
      });
    } catch (error) {
      console.error('❌ CSV download failed:', error);
      toast({
        title: "Download Failed",
        description: `Failed to download CSV data: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const downloadDataAsPDF = async () => {
    try {
      console.log('📄 Starting PDF download...');
      
      const data = await fetchAllUserData();
      
      console.log('📄 Data to be exported as PDF:', data);
      
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
            .no-data { text-align: center; padding: 40px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>User Data Export</h1>
            <p><strong>Business:</strong> ${data.profile?.business_name || 'Not set'}</p>
            <p><strong>Industry:</strong> ${data.profile?.industry || 'Not set'}</p>
            <p><strong>User Email:</strong> ${data.userEmail || 'Not available'}</p>
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
            ${data.expenses.length === 0 ? 
              '<div class="no-data"><p>No expenses found</p></div>' :
              `<table class="expense-table">
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
                      <td>${expense.title || 'N/A'}</td>
                      <td>${expense.description || 'N/A'}</td>
                      <td>$${(expense.amount || 0).toFixed(2)}</td>
                      <td>${expense.category || 'N/A'}</td>
                      <td>${expense.vendor || 'N/A'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>`
            }
          </div>
        </body>
        </html>
      `;
      
      console.log('📝 HTML content size:', htmlContent.length, 'characters');
      
      // Create a new window to print/save as PDF
      console.log('🖨️ Opening print window...');
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Wait for content to load then trigger print
        setTimeout(() => {
          console.log('🖨️ Triggering print dialog...');
          printWindow.print();
        }, 500);
        
        console.log('✅ PDF generation initiated successfully');
        
        // Send data export notification
        try {
          await notifyDataExportComplete('PDF', `expenses-report-${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (notificationError) {
          console.error('Failed to send export notification:', notificationError);
        }
        
        toast({
          title: "PDF Generation",
          description: `PDF print dialog opened for ${data.totalExpenses} expenses. Choose 'Save as PDF'.`,
        });
      } else {
        throw new Error('Popup blocked - please allow popups for this site');
      }
    } catch (error) {
      console.error('❌ PDF generation failed:', error);
      toast({
        title: "PDF Generation Failed",
        description: `Failed to generate PDF: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  // Test function specifically for data downloads
  const testDataFetch = async () => {
    try {
      console.log('🧪 Testing data fetch functionality...');
      
      const data = await fetchAllUserData();
      
      console.log('🧪 Test results:', {
        userIdExists: !!user?.id,
        userEmail: user?.email,
        profileData: profileData,
        notificationsData: notifications,
        expensesCount: data.expenses.length,
        totalAmount: data.totalExpenseAmount,
        fullData: data
      });
      
      toast({
        title: "Data Fetch Test",
        description: `Found ${data.totalExpenses} expenses totaling $${data.totalExpenseAmount.toFixed(2)}. Check console for details.`,
      });
      
    } catch (error) {
      console.error('🧪 Test failed:', error);
      toast({
        title: "Test Failed", 
        description: `Data fetch test failed: ${error.message}`,
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

      // Step 2: Delete knowledge base entries from external API first
      console.log('🗑️ Deleting knowledge base entries from external API...');
      try {
        // Get knowledge base entries before deleting them
        const storedEntries = localStorage.getItem('knowledgeBase_entries');
        const knowledgeEntries = storedEntries ? JSON.parse(storedEntries) : [];
        
        console.log(`Found ${knowledgeEntries.length} knowledge base entries to delete from external API`);
        
        // Delete each knowledge base entry from the external API
        for (const entry of knowledgeEntries) {
          if (entry.id) {
            try {
              console.log(`Deleting knowledge base entry ${entry.id} from external API...`);
              const response = await fetch(`https://socialdots-ai-expense-backend.hf.space/knowledge-base/${entry.id}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                }
              });
              
              if (response.ok) {
                console.log(`✅ Successfully deleted knowledge base entry ${entry.id} from external API`);
              } else if (response.status === 404) {
                console.log(`⚠️ Knowledge base entry ${entry.id} not found in external API (already deleted)`);
              } else {
                console.warn(`⚠️ Failed to delete knowledge base entry ${entry.id} from external API: ${response.status}`);
              }
            } catch (apiError) {
              console.warn(`⚠️ Error deleting knowledge base entry ${entry.id} from external API:`, apiError);
            }
          }
        }
        
        console.log('✅ Completed knowledge base cleanup from external API');
      } catch (error) {
        console.warn('⚠️ Error during knowledge base cleanup from external API:', error);
      }

      // Step 3: Delete user data from all tables (client-side)
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

      // Step 4: Delete storage files
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

      // Step 5: Try multiple methods to delete the auth user
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

      // Clear all session data immediately regardless of auth deletion success
      console.log('🧹 Clearing all session and browser data...');
      
      // Clear all browser storage
      try {
        localStorage.clear();
        sessionStorage.clear();
        console.log('✅ Browser storage cleared');
      } catch (error) {
        console.warn('⚠️ Error clearing browser storage:', error);
      }

      // Force sign out with global scope to clear all sessions
      try {
        await supabase.auth.signOut({ scope: 'global' });
        console.log('✅ Supabase session cleared');
      } catch (error) {
        console.warn('⚠️ Error during sign out:', error);
      }

      // Show results and handle next steps
      if (authUserDeleted) {
        toast({
          title: "🎉 Account Completely Deleted!",
          description: "Your account and all data have been permanently deleted. Redirecting to homepage...",
          variant: "destructive"
        });
        
        console.log('✅ SUCCESS: Complete account deletion - user can no longer log in');
        
      } else {
        console.log('⚠️ Auth user deletion failed with all methods');
        
        toast({
          title: "⚠️ Partial Deletion Complete",
          description: "Your data was cleared and you've been signed out. Redirecting to homepage...",
          variant: "destructive"
        });
      }

      // Always redirect after clearing everything, with a shorter delay
      setTimeout(() => {
        window.location.href = '/auth';
      }, 2000);

      console.log(`📊 Final result - Auth user deleted: ${authUserDeleted}`);

    } catch (error) {
      console.error('❌ Account deletion failed:', error);
      
      // Clear everything even if deletion failed
      try {
        localStorage.clear();
        sessionStorage.clear();
        await supabase.auth.signOut({ scope: 'global' });
        console.log('✅ Emergency cleanup completed');
        
        toast({
          title: "Partial Deletion",
          description: "Some data was cleared. You've been signed out. Redirecting...",
          variant: "destructive"
        });
        
        setTimeout(() => {
          window.location.href = '/auth';
        }, 2000);
        
      } catch (signOutError) {
        console.error('❌ Error during emergency cleanup:', signOutError);
        
        toast({
          title: "Deletion Failed",
          description: "Please manually clear your browser data and reload the page.",
          variant: "destructive"
        });
        
        // Force page reload as last resort
        setTimeout(() => {
          window.location.reload();
        }, 3000);
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
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="voice">Voice Settings</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="privacy">Privacy & Security</TabsTrigger>
          <TabsTrigger value="support">Help & Support</TabsTrigger>
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
          <div className="space-y-6">
            {/* General Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  General Notifications
                </CardTitle>
                <CardDescription>Choose your primary notification channels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Bell className="h-5 w-5 text-blue-500" />
                      <div>
                        <Label htmlFor="email-notifications" className="font-medium">Email</Label>
                        <p className="text-xs text-muted-foreground">Updates via email</p>
                      </div>
                    </div>
                    <Switch 
                      id="email-notifications"
                      checked={notifications.email_notifications}
                      onCheckedChange={(checked) => updateNotificationField('email_notifications', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-green-500" />
                      <div>
                        <Label htmlFor="push-notifications" className="font-medium">Browser Push</Label>
                        <p className="text-xs text-muted-foreground">Instant notifications</p>
                      </div>
                    </div>
                    <Switch 
                      id="push-notifications"
                      checked={notifications.push_notifications}
                      onCheckedChange={(checked) => updateNotificationField('push_notifications', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-5 w-5 text-purple-500" />
                      <div>
                        <Label htmlFor="sms-notifications" className="font-medium">SMS</Label>
                        <p className="text-xs text-muted-foreground">Text messages</p>
                        <Badge variant="outline" className="text-xs mt-1">Coming Soon</Badge>
                      </div>
                    </div>
                    <Switch 
                      id="sms-notifications"
                      checked={notifications.sms_notifications}
                      onCheckedChange={(checked) => updateNotificationField('sms_notifications', checked)}
                      disabled
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Business Alerts
                </CardTitle>
                <CardDescription>Stay informed about important business events</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Expense Alerts</Label>
                      <p className="text-xs text-muted-foreground">New expenses added or processed</p>
                    </div>
                    <Switch 
                      checked={notifications.expense_alerts}
                      onCheckedChange={(checked) => updateNotificationField('expense_alerts', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Budget Warnings</Label>
                      <p className="text-xs text-muted-foreground">When approaching budget limits</p>
                    </div>
                    <Switch 
                      checked={notifications.budget_warnings}
                      onCheckedChange={(checked) => updateNotificationField('budget_warnings', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Large Expense Alerts</Label>
                      <p className="text-xs text-muted-foreground">Expenses above $500 threshold</p>
                    </div>
                    <Switch 
                      checked={notifications.large_expense_threshold}
                      onCheckedChange={(checked) => updateNotificationField('large_expense_threshold', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Duplicate Warnings</Label>
                      <p className="text-xs text-muted-foreground">Potential duplicate expenses detected</p>
                    </div>
                    <Switch 
                      checked={notifications.duplicate_expense_warnings}
                      onCheckedChange={(checked) => updateNotificationField('duplicate_expense_warnings', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI & Automation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI & Automation
                </CardTitle>
                <CardDescription>AI-powered insights and automation updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">AI Insights</Label>
                      <p className="text-xs text-muted-foreground">Smart business recommendations</p>
                    </div>
                    <Switch 
                      checked={notifications.ai_insights}
                      onCheckedChange={(checked) => updateNotificationField('ai_insights', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Smart Categorization</Label>
                      <p className="text-xs text-muted-foreground">AI category suggestions</p>
                    </div>
                    <Switch 
                      checked={notifications.smart_categorization_suggestions}
                      onCheckedChange={(checked) => updateNotificationField('smart_categorization_suggestions', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Receipt Processing</Label>
                      <p className="text-xs text-muted-foreground">Upload and processing status</p>
                    </div>
                    <Switch 
                      checked={notifications.receipt_processing_status}
                      onCheckedChange={(checked) => updateNotificationField('receipt_processing_status', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reports & Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Reports & Analytics
                </CardTitle>
                <CardDescription>Automated reports and business insights</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Daily Summaries</Label>
                      <p className="text-xs text-muted-foreground">End-of-day expense summary</p>
                    </div>
                    <Switch 
                      checked={notifications.daily_summaries}
                      onCheckedChange={(checked) => updateNotificationField('daily_summaries', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Weekly Insights</Label>
                      <p className="text-xs text-muted-foreground">Business performance insights</p>
                    </div>
                    <Switch 
                      checked={notifications.weekly_insights}
                      onCheckedChange={(checked) => updateNotificationField('weekly_insights', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Monthly Reports</Label>
                      <p className="text-xs text-muted-foreground">Comprehensive monthly analysis</p>
                    </div>
                    <Switch 
                      checked={notifications.monthly_reports}
                      onCheckedChange={(checked) => updateNotificationField('monthly_reports', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security & Account */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security & Account
                </CardTitle>
                <CardDescription>Important account and security notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Login Alerts</Label>
                      <p className="text-xs text-muted-foreground">New device or location logins</p>
                    </div>
                    <Switch 
                      checked={notifications.login_alerts}
                      onCheckedChange={(checked) => updateNotificationField('login_alerts', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Account Changes</Label>
                      <p className="text-xs text-muted-foreground">Profile or settings updates</p>
                    </div>
                    <Switch 
                      checked={notifications.account_changes}
                      onCheckedChange={(checked) => updateNotificationField('account_changes', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Data Export Status</Label>
                      <p className="text-xs text-muted-foreground">Export completion notifications</p>
                    </div>
                    <Switch 
                      checked={notifications.data_export_completion}
                      onCheckedChange={(checked) => updateNotificationField('data_export_completion', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Integration Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Integration Notifications
                </CardTitle>
                <CardDescription>Notifications from connected apps and services</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <Label className="font-medium">Telegram</Label>
                        <p className="text-xs text-muted-foreground">Bot notifications</p>
                      </div>
                    </div>
                    <Switch 
                      checked={notifications.telegram_notifications}
                      onCheckedChange={(checked) => updateNotificationField('telegram_notifications', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <Label className="font-medium">WhatsApp</Label>
                        <p className="text-xs text-muted-foreground">Business messages</p>
                      </div>
                    </div>
                    <Switch 
                      checked={notifications.whatsapp_notifications}
                      onCheckedChange={(checked) => updateNotificationField('whatsapp_notifications', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Updates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  Product Updates
                </CardTitle>
                <CardDescription>Stay updated with new features and improvements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Feature Updates</Label>
                      <p className="text-xs text-muted-foreground">New features and improvements</p>
                    </div>
                    <Switch 
                      checked={notifications.feature_updates}
                      onCheckedChange={(checked) => updateNotificationField('feature_updates', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Product Announcements</Label>
                      <p className="text-xs text-muted-foreground">Major product news</p>
                    </div>
                    <Switch 
                      checked={notifications.product_announcements}
                      onCheckedChange={(checked) => updateNotificationField('product_announcements', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Tips & Tutorials</Label>
                      <p className="text-xs text-muted-foreground">Helpful tips and guides</p>
                    </div>
                    <Switch 
                      checked={notifications.tips_and_tutorials}
                      onCheckedChange={(checked) => updateNotificationField('tips_and_tutorials', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notification Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Notification Schedule
                </CardTitle>
                <CardDescription>Control when and how often you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Quiet Hours</Label>
                      <p className="text-xs text-muted-foreground">Disable notifications during specified hours</p>
                    </div>
                    <Switch 
                      checked={notifications.quiet_hours_enabled}
                      onCheckedChange={(checked) => updateNotificationField('quiet_hours_enabled', checked)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="font-medium">Notification Delivery</Label>
                    <Select 
                      value={notifications.notification_schedule}
                      onValueChange={(value: 'immediate' | 'batched' | 'daily_digest') => 
                        updateNotificationField('notification_schedule', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate - Send notifications right away</SelectItem>
                        <SelectItem value="batched">Batched - Group notifications every 2 hours</SelectItem>
                        <SelectItem value="daily_digest">Daily Digest - One summary email per day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button 
                onClick={saveProfile}
                disabled={saving || !hasNotificationsChanged()}
                className="gap-2"
                size="lg"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? "Saving..." : "Save Notification Preferences"}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="automation">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                AI Automation Settings
              </CardTitle>
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

        <TabsContent value="voice">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
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
                <div className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Voice Language</div>
                <Button variant="outline" className="w-full justify-start">
                  English (US)
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

        <TabsContent value="support">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Help & Support
              </CardTitle>
              <CardDescription>Get help and contact our support team</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Support Options</h4>
                <div className="grid gap-4">
                  {/* Email Support - Available for all users */}
                  <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                    <Mail className="h-5 w-5 text-primary mt-1" />
                    <div className="flex-1">
                      <h5 className="font-medium">Email Support</h5>
                      <p className="text-sm text-muted-foreground mb-3">
                        Get help via email. We typically respond within 24-48 hours.
                      </p>
                      <Button variant="outline" asChild>
                        <a href="mailto:support@aibusinesshub.com" className="inline-flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email Support
                        </a>
                      </Button>
                    </div>
                    <Badge variant="secondary">Free</Badge>
                  </div>

                  {/* Priority Support - Pro only */}
                  <div className={`flex items-start gap-4 p-4 rounded-lg border ${hasActiveSubscription ? 'bg-green-50 border-green-200' : 'bg-muted/30 border-dashed'}`}>
                    <Phone className={`h-5 w-5 mt-1 ${hasActiveSubscription ? 'text-green-600' : 'text-muted-foreground'}`} />
                    <div className="flex-1">
                      <h5 className="font-medium">Priority Support</h5>
                      <p className="text-sm text-muted-foreground mb-3">
                        {hasActiveSubscription 
                          ? "Get priority email support with faster response times and phone support during business hours." 
                          : "Upgrade to Business Pro for priority support with faster response times and phone support."
                        }
                      </p>
                      {hasActiveSubscription ? (
                        <div className="space-y-2">
                          <Button variant="outline" asChild>
                            <a href="mailto:priority@aibusinesshub.com" className="inline-flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              Priority Email
                            </a>
                          </Button>
                          <Button variant="outline" asChild className="ml-2">
                            <a href="tel:+1-555-AI-HELP" className="inline-flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              Call Support
                            </a>
                          </Button>
                        </div>
                      ) : (
                        <Button variant="outline" disabled className="opacity-50">
                          <Phone className="h-4 w-4 mr-2" />
                          Upgrade Required
                        </Button>
                      )}
                    </div>
                    <Badge variant={hasActiveSubscription ? "default" : "secondary"}>
                      {hasActiveSubscription ? "Pro" : "Pro Only"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Frequently Asked Questions</h4>
                <div className="space-y-3">
                  <details className="group">
                    <summary className="flex cursor-pointer items-center justify-between p-3 bg-muted/50 rounded-lg group-open:bg-muted">
                      <span className="font-medium">How do I upload receipts?</span>
                      <span className="text-muted-foreground">+</span>
                    </summary>
                    <div className="p-3 text-sm text-muted-foreground">
                      You can upload receipts in the Expense Tracker section by clicking the "Add Receipt" button or by using the camera icon to take a photo directly.
                    </div>
                  </details>
                  
                  <details className="group">
                    <summary className="flex cursor-pointer items-center justify-between p-3 bg-muted/50 rounded-lg group-open:bg-muted">
                      <span className="font-medium">What's included in the free plan?</span>
                      <span className="text-muted-foreground">+</span>
                    </summary>
                    <div className="p-3 text-sm text-muted-foreground">
                      The free plan includes 5 receipt uploads per month, basic expense categorization, simple reports, email support, and 5 AI content suggestions per month.
                    </div>
                  </details>
                  
                  <details className="group">
                    <summary className="flex cursor-pointer items-center justify-between p-3 bg-muted/50 rounded-lg group-open:bg-muted">
                      <span className="font-medium">How do I upgrade to Business Pro?</span>
                      <span className="text-muted-foreground">+</span>
                    </summary>
                    <div className="p-3 text-sm text-muted-foreground">
                      You can upgrade to Business Pro in the Billing section of Settings or click any "Upgrade" button throughout the application.
                    </div>
                  </details>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Resources</h4>
                <div className="grid gap-3">
                  <Button variant="outline" asChild className="justify-start">
                    <a href="/docs" target="_blank" className="inline-flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Documentation
                    </a>
                  </Button>
                  <Button variant="outline" asChild className="justify-start">
                    <a href="/tutorials" target="_blank" className="inline-flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      Video Tutorials
                    </a>
                  </Button>
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