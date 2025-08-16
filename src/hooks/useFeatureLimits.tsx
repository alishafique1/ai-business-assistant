import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';

export interface FeatureUsage {
  receipt_uploads: number;
  ai_content_suggestions: number;
  month_year: string;
}

export interface FeatureLimits {
  receipt_uploads: number;
  ai_content_suggestions: number;
}

const FREE_PLAN_LIMITS: FeatureLimits = {
  receipt_uploads: 5,
  ai_content_suggestions: 5,
};

const PRO_PLAN_LIMITS: FeatureLimits = {
  receipt_uploads: -1, // -1 means unlimited
  ai_content_suggestions: -1,
};

export const useFeatureLimits = () => {
  const [usage, setUsage] = useState<FeatureUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { hasActiveSubscription } = useSubscription();
  const { toast } = useToast();

  const limits = hasActiveSubscription ? PRO_PLAN_LIMITS : FREE_PLAN_LIMITS;

  const fetchUsage = useCallback(async () => {
    if (!user) {
      setUsage(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc('get_current_month_usage', {
        user_uuid: user.id
      });

      if (error) {
        console.warn('Usage tracking not available, defaulting to zero usage');
        setUsage({
          receipt_uploads: 0,
          ai_content_suggestions: 0,
          month_year: new Date().toISOString().slice(0, 7), // YYYY-MM format
        });
      } else if (data && data.length > 0) {
        setUsage(data[0]);
      } else {
        setUsage({
          receipt_uploads: 0,
          ai_content_suggestions: 0,
          month_year: new Date().toISOString().slice(0, 7),
        });
      }
    } catch (error) {
      console.warn('Error fetching usage, defaulting to zero:', error);
      setUsage({
        receipt_uploads: 0,
        ai_content_suggestions: 0,
        month_year: new Date().toISOString().slice(0, 7),
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const canUploadReceipt = useCallback((): boolean => {
    if (hasActiveSubscription) return true;
    if (!usage) return true; // Allow if usage not loaded yet
    return usage.receipt_uploads < FREE_PLAN_LIMITS.receipt_uploads;
  }, [hasActiveSubscription, usage]);

  const canUseAIContent = useCallback((): boolean => {
    return true; // Always allow AI content
  }, []);

  const incrementReceiptUpload = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    if (!canUploadReceipt()) {
      toast({
        title: "Upload Limit Reached",
        description: `You've reached your limit of ${FREE_PLAN_LIMITS.receipt_uploads} receipt uploads for this month. The limit resets at the beginning of each month.`,
        variant: "destructive",
        duration: 7000,
      });
      return false;
    }

    try {
      const { error } = await supabase.rpc('increment_receipt_uploads', {
        user_uuid: user.id
      });

      if (error) {
        console.warn('Could not increment receipt upload count:', error);
      }

      // Refresh usage
      await fetchUsage();
      return true;
    } catch (error) {
      console.warn('Error incrementing receipt upload:', error);
      return true; // Allow the action even if tracking fails
    }
  }, [user, canUploadReceipt, fetchUsage, toast]);

  const incrementAIContentUsage = useCallback(async (): Promise<boolean> => {
    // Always allow AI content usage
    return true;
  }, []);

  const getRemainingUploads = useCallback((): number => {
    if (hasActiveSubscription) return -1; // Unlimited
    if (!usage) return FREE_PLAN_LIMITS.receipt_uploads;
    return Math.max(0, FREE_PLAN_LIMITS.receipt_uploads - usage.receipt_uploads);
  }, [hasActiveSubscription, usage]);

  const getRemainingAIUsage = useCallback((): number => {
    return -1; // Always unlimited
  }, []);

  // Fetch usage on mount and when user changes
  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  // Set up real-time subscription to usage changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`user_usage_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_usage',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Refresh usage data when changes occur
          fetchUsage();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchUsage]);

  return {
    usage,
    limits,
    isLoading,
    error,
    canUploadReceipt,
    canUseAIContent,
    incrementReceiptUpload,
    incrementAIContentUsage,
    getRemainingUploads,
    getRemainingAIUsage,
    refreshUsage: fetchUsage,
  };
};