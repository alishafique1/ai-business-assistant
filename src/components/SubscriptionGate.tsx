import { ReactNode } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Loader2 } from "lucide-react";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { STRIPE_PRICE_IDS } from "@/lib/stripe";

interface SubscriptionGateProps {
  children: ReactNode;
  feature: string;
  description?: string;
  requiredPlan?: 'business_pro' | 'enterprise';
}

export default function SubscriptionGate({ 
  children, 
  feature, 
  description,
  requiredPlan = 'business_pro' 
}: SubscriptionGateProps) {
  const { hasActiveSubscription, isLoading } = useSubscription();
  const { state: checkoutState, createCheckoutSession } = useStripeCheckout();

  const handleUpgrade = async () => {
    if (requiredPlan === 'business_pro' && STRIPE_PRICE_IDS.BUSINESS_PRO) {
      await createCheckoutSession({
        priceId: STRIPE_PRICE_IDS.BUSINESS_PRO,
        planName: "Business Pro",
        metadata: {
          plan_type: "business_pro",
          source: "subscription_gate",
          feature: feature,
        },
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Checking subscription...</span>
        </CardContent>
      </Card>
    );
  }

  if (hasActiveSubscription) {
    return <>{children}</>;
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
          <Lock className="h-6 w-6 text-orange-600" />
        </div>
        <CardTitle>Upgrade Required</CardTitle>
        <CardDescription>
          {description || `The ${feature} feature is available for Business Pro subscribers.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Unlock unlimited features with Business Pro:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Unlimited AI expense tracking</li>
            <li>• Voice assistant with unlimited recording</li>
            <li>• Complete AI content generation</li>
            <li>• Advanced analytics & insights</li>
            <li>• Priority support</li>
          </ul>
        </div>
        
        <Button 
          onClick={handleUpgrade}
          disabled={checkoutState.isLoading}
          className="w-full"
        >
          {checkoutState.isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processing...
            </>
          ) : (
            'Upgrade to Business Pro - $29/month'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}