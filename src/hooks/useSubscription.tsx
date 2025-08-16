import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface UserSubscription {
  id: string;
  plan_name: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

export interface SubscriptionState {
  subscription: UserSubscription | null;
  isLoading: boolean;
  error: string | null;
  hasActiveSubscription: boolean;
}

export const useSubscription = () => {
  const [state, setState] = useState<SubscriptionState>({
    subscription: null,
    isLoading: true,
    error: null,
    hasActiveSubscription: false,
  });
  const { user } = useAuth();

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setState({
        subscription: null,
        isLoading: false,
        error: null,
        hasActiveSubscription: false,
      });
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Try to call the database function to get user subscription
      const { data, error } = await supabase.rpc('get_user_subscription', {
        user_uuid: user.id
      });

      if (error) {
        // If function doesn't exist or fails, default to free plan
        console.warn('Subscription function not available, defaulting to free plan');
        setState({
          subscription: null,
          isLoading: false,
          error: null,
          hasActiveSubscription: false,
        });
        return;
      }

      const subscription = data && data.length > 0 ? data[0] : null;
      const hasActiveSubscription = subscription && 
        ['active', 'trialing'].includes(subscription.status) &&
        (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date());

      setState({
        subscription: subscription ? {
          id: subscription.subscription_id,
          plan_name: subscription.plan_name,
          status: subscription.status,
          current_period_end: subscription.current_period_end,
          cancel_at_period_end: subscription.cancel_at_period_end || false,
        } : null,
        isLoading: false,
        error: null,
        hasActiveSubscription: Boolean(hasActiveSubscription),
      });

    } catch (error) {
      console.warn('Error fetching subscription, defaulting to free plan:', error);
      // Default to free plan if there's any error
      setState({
        subscription: null,
        isLoading: false,
        error: null,
        hasActiveSubscription: false,
      });
    }
  }, [user]);

  const checkActiveSubscription = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('has_active_subscription', {
        user_uuid: user.id
      });

      if (error) {
        console.warn('Subscription check function not available, returning false');
        return false;
      }

      return Boolean(data);
    } catch (error) {
      console.warn('Error checking subscription status, returning false:', error);
      return false;
    }
  };

  const refreshSubscription = () => {
    fetchSubscription();
  };

  // Fetch subscription on mount and when user changes
  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Set up real-time subscription to subscription changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`user_subscription_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_subscriptions',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Refresh subscription data when changes occur
          fetchSubscription();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    ...state,
    checkActiveSubscription,
    refreshSubscription,
  };
};