import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export type PlanType = 'free' | 'pro';

interface PlanData {
  plan: PlanType;
  planLabel: string;
  features: {
    receiptLimit: number | 'unlimited';
    aiAssistant: boolean;
    integrations: boolean;
    advancedAnalytics: boolean;
  };
}

export const usePlan = () => {
  const { user } = useAuth();
  const [planData, setPlanData] = useState<PlanData>({
    plan: 'free',
    planLabel: 'Free',
    features: {
      receiptLimit: 5,
      aiAssistant: true,
      integrations: false,
      advancedAnalytics: false,
    },
  });
  const [loading, setLoading] = useState(false);

  const getPlanData = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // For now, check localStorage for plan upgrade
      // In a real app, this would check a subscription table in the database
      const planUpgrade = localStorage.getItem(`plan_${user.id}`);
      
      if (planUpgrade === 'pro') {
        setPlanData({
          plan: 'pro',
          planLabel: 'Pro',
          features: {
            receiptLimit: 'unlimited',
            aiAssistant: true,
            integrations: true,
            advancedAnalytics: true,
          },
        });
      } else {
        setPlanData({
          plan: 'free',
          planLabel: 'Free',
          features: {
            receiptLimit: 5,
            aiAssistant: true,
            integrations: false,
            advancedAnalytics: false,
          },
        });
      }
    } catch (error) {
      console.error('Error getting plan data:', error);
      // Default to free plan on error
      setPlanData({
        plan: 'free',
        planLabel: 'Free',
        features: {
          receiptLimit: 5,
          aiAssistant: true,
          integrations: false,
          advancedAnalytics: false,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      getPlanData();
    }
  }, [user]);

  const upgradeToPro = () => {
    if (user) {
      localStorage.setItem(`plan_${user.id}`, 'pro');
      setPlanData({
        plan: 'pro',
        planLabel: 'Pro',
        features: {
          receiptLimit: 'unlimited',
          aiAssistant: true,
          integrations: true,
          advancedAnalytics: true,
        },
      });
    }
  };

  const downgradeToFree = () => {
    if (user) {
      localStorage.removeItem(`plan_${user.id}`);
      setPlanData({
        plan: 'free',
        planLabel: 'Free',
        features: {
          receiptLimit: 5,
          aiAssistant: true,
          integrations: false,
          advancedAnalytics: false,
        },
      });
    }
  };

  return {
    planData,
    loading,
    upgradeToPro,
    downgradeToFree,
    refreshPlan: getPlanData,
  };
};