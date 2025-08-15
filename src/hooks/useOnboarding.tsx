import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingStatus {
  isCompleted: boolean;
  loading: boolean;
  checkOnboardingStatus: () => Promise<void>;
}

export const useOnboarding = (): OnboardingStatus => {
  const { user } = useAuth();
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastCheckedUserId, setLastCheckedUserId] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkOnboardingStatus = async () => {
    if (!user?.id || isChecking) {
      if (!user?.id) {
        setIsCompleted(false);
        setLoading(false);
        setLastCheckedUserId(null);
      }
      return;
    }

    try {
      setIsChecking(true);
      setLoading(true);
      console.log('Checking onboarding status for user:', user.id);
      setLastCheckedUserId(user.id);

      // Check if user has a profile with business information
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('business_name, industry')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error checking profile:', profileError);
        setIsCompleted(false);
        return;
      }

      // Check if user has AI settings - be more forgiving about column names
      const { data: aiSettings, error: aiError } = await supabase
        .from('ai_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (aiError) {
        console.error('Error checking AI settings:', aiError);
        setIsCompleted(false);
        return;
      }

      // Onboarding is completed if user has both profile and AI settings
      const hasProfile = profile && profile.business_name && profile.industry;
      // Be more specific about AI settings completion - require actual content, not just a record
      const hasAiSettings = aiSettings && (
        (aiSettings.system_prompt && aiSettings.system_prompt.trim().length > 0) ||
        (aiSettings.ai_name && aiSettings.ai_name.trim().length > 0) ||
        (aiSettings.response_style && aiSettings.response_style.trim().length > 0)
      );
      
      const completed = !!(hasProfile && hasAiSettings);
      
      console.log('Onboarding status check:', {
        hasProfile: !!hasProfile,
        hasAiSettings: !!hasAiSettings,
        completed,
        profileData: profile,
        aiSettingsData: aiSettings
      });

      setIsCompleted(completed);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setIsCompleted(false);
    } finally {
      setLoading(false);
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Only check if user ID changed or if we haven't checked for this user yet
    if (user?.id && user.id !== lastCheckedUserId) {
      checkOnboardingStatus();
    } else if (!user?.id) {
      setIsCompleted(false);
      setLoading(false);
      setLastCheckedUserId(null);
    }
  }, [user?.id, lastCheckedUserId]);

  return {
    isCompleted,
    loading,
    checkOnboardingStatus
  };
};