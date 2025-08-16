import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, Calendar, AlertCircle } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { STRIPE_PRICE_IDS } from "@/lib/stripe";
import { format } from "date-fns";

export default function SubscriptionManager() {
  const { subscription, isLoading, hasActiveSubscription, refreshSubscription } = useSubscription();
  const { state: checkoutState, createPortalSession, createCheckoutSession } = useStripeCheckout();

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'trialing':
        return 'secondary';
      case 'past_due':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'trialing':
        return 'Trial';
      case 'past_due':
        return 'Past Due';
      case 'cancelled':
        return 'Cancelled';
      case 'incomplete':
        return 'Incomplete';
      default:
        return status;
    }
  };

  const handleUpgradeClick = async () => {
    if (!STRIPE_PRICE_IDS.BUSINESS_PRO) {
      return;
    }

    await createCheckoutSession({
      priceId: STRIPE_PRICE_IDS.BUSINESS_PRO,
      planName: "Business Pro",
      metadata: {
        plan_type: "business_pro",
        source: "subscription_manager",
      },
    });
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading subscription details...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Subscription
        </CardTitle>
        <CardDescription>
          Manage your subscription and billing settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasActiveSubscription && subscription ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{subscription.plan_name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={getStatusBadgeVariant(subscription.status)}>
                    {getStatusLabel(subscription.status)}
                  </Badge>
                  {subscription.cancel_at_period_end && (
                    <Badge variant="outline" className="text-orange-600">
                      Cancels at period end
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {subscription.current_period_end && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {subscription.cancel_at_period_end ? 'Expires' : 'Renews'} on{' '}
                  {format(new Date(subscription.current_period_end), 'PPP')}
                </span>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={createPortalSession}
                disabled={checkoutState.isLoading}
                variant="outline"
              >
                {checkoutState.isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  'Manage Billing'
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 border border-orange-200 bg-orange-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-orange-900">Free Plan</h4>
                <p className="text-sm text-orange-800 mt-1">
                  You're currently on the free plan with limited features. Upgrade to unlock the full potential of our AI business assistant.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Upgrade Benefits:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Unlimited AI expense tracking & categorization</li>
                <li>• Voice assistant with unlimited recording</li>
                <li>• Complete AI content generation suite</li>
                <li>• Advanced business analytics & insights</li>
                <li>• WhatsApp & Telegram integration</li>
                <li>• Priority support</li>
              </ul>
            </div>

            <Button
              onClick={handleUpgradeClick}
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}