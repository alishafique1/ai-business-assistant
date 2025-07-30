import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ReceiptLimitData {
  current_count: number;
  monthly_limit: number | 'unlimited';
  can_add_receipt: boolean;
  plan: string;
  days_until_reset: number;
}

export const useReceiptLimit = () => {
  const { user } = useAuth();
  const [limitData, setLimitData] = useState<ReceiptLimitData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkLimit = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('check-receipt-limit', {
        method: 'GET',
      });

      if (error) throw error;

      setLimitData(data);
    } catch (err) {
      console.error('Error checking receipt limit:', err);
      setError(err instanceof Error ? err.message : 'Failed to check limit');
    } finally {
      setLoading(false);
    }
  };

  const incrementCount = async (): Promise<boolean> => {
    if (!user) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('check-receipt-limit', {
        method: 'POST',
      });

      if (error) throw error;

      // Refresh limit data
      await checkLimit();
      
      return data.can_add_receipt;
    } catch (err) {
      console.error('Error incrementing receipt count:', err);
      setError(err instanceof Error ? err.message : 'Failed to increment count');
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      checkLimit();
    }
  }, [user]);

  const canAddReceipt = limitData?.can_add_receipt ?? true;
  const remainingReceipts = limitData?.monthly_limit === 'unlimited' 
    ? 'unlimited' 
    : Math.max(0, (limitData?.monthly_limit ?? 5) - (limitData?.current_count ?? 0));

  return {
    limitData,
    loading,
    error,
    canAddReceipt,
    remainingReceipts,
    checkLimit,
    incrementCount,
  };
};