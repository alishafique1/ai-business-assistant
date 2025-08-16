import { useState, useCallback } from 'react';
import { stripePromise } from '@/lib/stripe';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface CheckoutOptions {
  priceId: string;
  planName: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
}

export interface CheckoutState {
  isLoading: boolean;
  error: string | null;
}

export const useStripeCheckout = () => {
  const [state, setState] = useState<CheckoutState>({
    isLoading: false,
    error: null,
  });
  const { toast } = useToast();
  const { user } = useAuth();

  const createCheckoutSession = useCallback(async (options: CheckoutOptions) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to continue with your subscription.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Call Supabase function to create Stripe checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          price_id: options.priceId,
          user_id: user.id,
          user_email: user.email,
          plan_name: options.planName,
          success_url: options.successUrl || `${window.location.origin}/dashboard?payment=success`,
          cancel_url: options.cancelUrl || `${window.location.origin}?payment=cancelled`,
          metadata: {
            user_id: user.id,
            plan_name: options.planName,
            ...options.metadata,
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      const { sessionId } = data;

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create checkout session';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage
      }));
      
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive",
        duration: 7000,
      });
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [user, toast]);

  const createPortalSession = useCallback(async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to manage your subscription.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Call Supabase function to create Stripe customer portal session
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: {
          user_id: user.id,
          return_url: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      const { url } = data;
      window.location.href = url;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create portal session';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage
      }));
      
      toast({
        title: "Portal Error",
        description: errorMessage,
        variant: "destructive",
        duration: 7000,
      });
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [user, toast]);

  return {
    state,
    createCheckoutSession,
    createPortalSession,
  };
};