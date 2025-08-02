import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Bell, CreditCard, Lock, User, Trash2, Loader2, MapPin, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { usePlan } from "@/hooks/usePlan";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

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
  const { user } = useAuth();
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
    toast({
      title: "Change Password",
      description: "Password change functionality will be available soon. Use your email provider's password reset for now.",
    });
  };

  const handleDownloadData = async () => {
    try {
      const data = {
        profile: profileData,
        notifications: notifications,
        exportDate: new Date().toISOString()
      };
      
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
        title: "Data Downloaded",
        description: "Your user data has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download your data. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAccount = () => {
    toast({
      title: "Account Deletion",
      description: "Account deletion will be available soon. Contact support to delete your account.",
      variant: "destructive"
    });
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
                  <Button variant="outline" className="w-full justify-start" onClick={handleDownloadData}>
                    Download My Data
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={handleChangePassword}>
                    Two-Factor Authentication
                  </Button>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium text-destructive">Danger Zone</h4>
                <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-destructive">Delete Account</p>
                      <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                    </div>
                    <Button variant="destructive" size="sm" className="gap-2" onClick={handleDeleteAccount}>
                      <Trash2 className="h-4 w-4" />
                      Delete Account
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}