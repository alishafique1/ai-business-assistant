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

// Fallback direct SQL functions when RPC functions don't exist
const getUsageDirectSQL = async (userId: string) => {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
  
  console.log('🔧 FALLBACK: Using direct SQL query for usage');
  const { data, error } = await supabase
    .from('user_usage')
    .select('receipt_uploads, ai_content_suggestions, month_year')
    .eq('user_id', userId)
    .eq('month_year', currentMonth)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw error;
  }

  if (!data) {
    // Create record if it doesn't exist
    const { data: newData, error: insertError } = await supabase
      .from('user_usage')
      .insert({
        user_id: userId,
        month_year: currentMonth,
        receipt_uploads: 0,
        ai_content_suggestions: 0
      })
      .select('receipt_uploads, ai_content_suggestions, month_year')
      .single();
      
    if (insertError) {
      throw insertError;
    }
    
    return [newData];
  }
  
  return [data];
};

const incrementUsageDirectSQL = async (userId: string) => {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
  
  console.log('🔧 FALLBACK: Using direct SQL for increment');
  
  // First, try to get existing record
  const { data: existing } = await supabase
    .from('user_usage')
    .select('receipt_uploads')
    .eq('user_id', userId)
    .eq('month_year', currentMonth)
    .maybeSingle();

  if (existing) {
    // Update existing record
    const { error } = await supabase
      .from('user_usage')
      .update({ 
        receipt_uploads: existing.receipt_uploads + 1,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('month_year', currentMonth);
      
    if (error) throw error;
  } else {
    // Insert new record
    const { error } = await supabase
      .from('user_usage')
      .insert({
        user_id: userId,
        month_year: currentMonth,
        receipt_uploads: 1,
        ai_content_suggestions: 0
      });
      
    if (error) throw error;
  }
  
  return true;
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
      
      console.log('🔄 USAGE: Fetching usage data for user:', user.id);
      const { data, error } = await supabase.rpc('get_current_month_usage', {
        user_uuid: user.id
      });

      // If function doesn't exist, use direct SQL fallback
      if (error && (error.code === '42883' || error.message?.includes('does not exist'))) {
        console.log('🔧 USAGE: RPC function not found, using direct SQL fallback...');
        const fallbackData = await getUsageDirectSQL(user.id);
        if (fallbackData && fallbackData.length > 0) {
          console.log('✅ USAGE: Fallback successful:', fallbackData[0]);
          setUsage(fallbackData[0]);
          return;
        }
      }

      if (error) {
        console.error('❌ USAGE ERROR: Usage tracking not available, defaulting to zero usage');
        console.error('Error details:', { 
          message: error.message, 
          details: error.details, 
          hint: error.hint,
          code: error.code 
        });
        setUsage({
          receipt_uploads: 0,
          ai_content_suggestions: 0,
          month_year: new Date().toISOString().slice(0, 7), // YYYY-MM format
        });
      } else if (data && data.length > 0) {
        console.log('✅ USAGE: Usage data fetched successfully:', data[0]);
        setUsage(data[0]);
      } else {
        console.log('ℹ️ USAGE: No usage data found, creating default record');
        setUsage({
          receipt_uploads: 0,
          ai_content_suggestions: 0,
          month_year: new Date().toISOString().slice(0, 7),
        });
      }
    } catch (error) {
      console.error('❌ USAGE EXCEPTION: Error fetching usage, defaulting to zero:', error);
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
      console.log('🔄 COUNTER: Attempting to increment receipt uploads for user:', user.id);
      const { data, error } = await supabase.rpc('increment_receipt_uploads', {
        user_uuid: user.id
      });

      if (error && (error.code === '42883' || error.message?.includes('does not exist'))) {
        console.log('🔧 COUNTER: RPC function not found, using direct SQL fallback...');
        await incrementUsageDirectSQL(user.id);
        console.log('✅ COUNTER: Fallback increment successful');
      } else if (error) {
        console.error('❌ COUNTER ERROR: Could not increment receipt upload count:', error);
        console.error('Error details:', { 
          message: error.message, 
          details: error.details, 
          hint: error.hint,
          code: error.code 
        });
      } else {
        console.log('✅ COUNTER: Receipt upload incremented successfully:', data);
      }

      // Refresh usage
      console.log('🔄 COUNTER: Refreshing usage data...');
      await fetchUsage();
      
      // Force a small delay to ensure database changes are reflected
      setTimeout(async () => {
        console.log('🔄 COUNTER: Delayed refresh after increment...');
        await fetchUsage();
      }, 1000);
      return true;
    } catch (error) {
      console.error('❌ COUNTER EXCEPTION: Error incrementing receipt upload:', error);
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