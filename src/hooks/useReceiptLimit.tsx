import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { usePlan } from './usePlan';
import { supabase } from '@/integrations/supabase/client';

interface ReceiptLimitData {
  current_count: number;
  monthly_limit: number | 'unlimited';
  can_add_receipt: boolean;
  plan: string;
  minutes_until_reset: number;
}

export const useReceiptLimit = () => {
  const { user } = useAuth();
  const { planData } = usePlan();
  const [limitData, setLimitData] = useState<ReceiptLimitData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveTimer, setLiveTimer] = useState<number>(0);

  const updateLiveTimer = useCallback((resetTime: Date) => {
    const now = new Date();
    const tenMinutesFromReset = new Date(resetTime.getTime() + 10 * 60 * 1000);
    const secondsUntilReset = Math.max(0, Math.floor((tenMinutesFromReset.getTime() - now.getTime()) / 1000));
    setLiveTimer(secondsUntilReset);
    return secondsUntilReset;
  }, []);

  const checkLimit = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Checking receipt limit for user:', user?.id);
      
      // Use localStorage for testing since database columns might not exist
      const storageKey = `receipt_limit_${user.id}`;
      const storedData = localStorage.getItem(storageKey);
      
      let currentCount = 0;
      let resetTime = new Date();
      
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          currentCount = parsed.count || 0;
          resetTime = new Date(parsed.resetTime || new Date());
        } catch (e) {
          console.warn('Failed to parse stored receipt data');
        }
      }
      
      // Check if we need to reset (every 10 minutes for testing)
      const now = new Date();
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

      if (resetTime < tenMinutesAgo) {
        console.log('Resetting counter due to time limit');
        currentCount = 0;
        resetTime = now;
        localStorage.setItem(storageKey, JSON.stringify({
          count: currentCount,
          resetTime: resetTime.toISOString()
        }));
      }

      const limit = planData.features.receiptLimit;
      const canAdd = limit === 'unlimited' || currentCount < limit;
      
      console.log('Current count:', currentCount, 'Limit:', limit, 'Can add:', canAdd);
      
      setLimitData({
        current_count: currentCount,
        monthly_limit: limit,
        can_add_receipt: canAdd,
        plan: planData.planLabel,
        minutes_until_reset: Math.max(0, Math.ceil((10 * 60 * 1000 - (now.getTime() - resetTime.getTime())) / (60 * 1000)))
      });

    } catch (err) {
      console.error('Error checking receipt limit:', err);
      setError(err instanceof Error ? err.message : 'Failed to check limit');
      
      // Set fallback data based on plan
      setLimitData({
        current_count: 0,
        monthly_limit: planData.features.receiptLimit,
        can_add_receipt: true,
        plan: planData.planLabel,
        minutes_until_reset: 10
      });
    } finally {
      setLoading(false);
    }
  }, [user, planData.features.receiptLimit, planData.planLabel]);

  const incrementCount = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Incrementing count for user:', user?.id);
      
      // Use localStorage for testing
      const storageKey = `receipt_limit_${user.id}`;
      const storedData = localStorage.getItem(storageKey);
      
      let currentCount = 0;
      let resetTime = new Date();
      
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          currentCount = parsed.count || 0;
          resetTime = new Date(parsed.resetTime || new Date());
        } catch (e) {
          console.warn('Failed to parse stored receipt data during increment');
        }
      }
      
      const limit = planData.features.receiptLimit;
      
      // Check if user can add more expenses (unlimited plans can always add)
      if (limit !== 'unlimited' && currentCount >= limit) {
        console.log('User has reached limit:', currentCount, '>=', limit);
        return false;
      }
      
      // Increment the count
      const newCount = currentCount + 1;
      localStorage.setItem(storageKey, JSON.stringify({
        count: newCount,
        resetTime: resetTime.toISOString()
      }));
      
      console.log('Successfully incremented count from', currentCount, 'to', newCount);
      
      // Refresh limit data
      await checkLimit();
      
      return true;
    } catch (err) {
      console.error('Error incrementing receipt count:', err);
      setError(err instanceof Error ? err.message : 'Failed to increment count');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, planData.features.receiptLimit, checkLimit]);

  useEffect(() => {
    if (user) {
      checkLimit();
    }
  }, [user, checkLimit]);

  // Live timer effect - only runs when user has reached limit
  useEffect(() => {
    if (!limitData || planData.plan === 'pro' || limitData.can_add_receipt) {
      return;
    }

    const storageKey = `receipt_limit_${user?.id}`;
    const storedData = localStorage.getItem(storageKey);
    
    if (!storedData) return;

    try {
      const parsed = JSON.parse(storedData);
      const resetTime = new Date(parsed.resetTime);
      
      // Update timer immediately
      const secondsLeft = updateLiveTimer(resetTime);
      
      if (secondsLeft <= 0) {
        // Time's up, refresh the limit data
        checkLimit();
        return;
      }

      // Set up interval to update every second
      const interval = setInterval(() => {
        const secondsLeft = updateLiveTimer(resetTime);
        
        if (secondsLeft <= 0) {
          clearInterval(interval);
          checkLimit(); // Refresh limit data when timer reaches 0
        }
      }, 1000);

      return () => clearInterval(interval);
    } catch (error) {
      console.error('Error setting up live timer:', error);
    }
  }, [limitData?.can_add_receipt, planData.plan, user?.id, updateLiveTimer, checkLimit]);

  const canAddReceipt = limitData?.can_add_receipt ?? true;
  const remainingReceipts = limitData?.monthly_limit === 'unlimited' 
    ? 'unlimited' 
    : Math.max(0, (limitData?.monthly_limit ?? planData.features.receiptLimit) - (limitData?.current_count ?? 0));

  const formatTimeRemaining = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const shouldShowTimer = !canAddReceipt && planData.plan === 'free' && liveTimer > 0;

  return {
    limitData,
    loading,
    error,
    canAddReceipt,
    remainingReceipts,
    checkLimit,
    incrementCount,
    liveTimer,
    formatTimeRemaining,
    shouldShowTimer,
  };
};