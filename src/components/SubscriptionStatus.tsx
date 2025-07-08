import React from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { getProductByPriceId } from '../stripe-config';
import { Check, Clock, X, CreditCard } from 'lucide-react';

export const SubscriptionStatus: React.FC = () => {
  const { subscription, loading, error } = useSubscription();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (!subscription || !subscription.subscription_id) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center">
          <Clock className="w-5 h-5 text-gray-400 mr-2" />
          <span className="text-gray-600">No active subscription</span>
        </div>
      </div>
    );
  }

  const product = subscription.price_id ? getProductByPriceId(subscription.price_id) : null;
  const isActive = subscription.subscription_status === 'active';
  const isCanceled = subscription.subscription_status === 'canceled';

  const getStatusIcon = () => {
    if (isActive) return <Check className="w-5 h-5 text-green-500" />;
    if (isCanceled) return <X className="w-5 h-5 text-red-500" />;
    return <Clock className="w-5 h-5 text-yellow-500" />;
  };

  const getStatusColor = () => {
    if (isActive) return 'text-green-700 bg-green-50 border-green-200';
    if (isCanceled) return 'text-red-700 bg-red-50 border-red-200';
    return 'text-yellow-700 bg-yellow-50 border-yellow-200';
  };

  return (
    <div className={`rounded-lg border p-4 ${getStatusColor()}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          {getStatusIcon()}
          <span className="ml-2 font-medium">
            {product?.name || 'Subscription'}
          </span>
        </div>
        <span className="text-sm capitalize">
          {subscription.subscription_status.replace('_', ' ')}
        </span>
      </div>
      
      {subscription.current_period_end && (
        <div className="text-sm opacity-75">
          {subscription.cancel_at_period_end ? 'Expires' : 'Renews'} on{' '}
          {new Date(subscription.current_period_end * 1000).toLocaleDateString()}
        </div>
      )}
      
      {subscription.payment_method_brand && subscription.payment_method_last4 && (
        <div className="flex items-center mt-2 text-sm opacity-75">
          <CreditCard className="w-4 h-4 mr-1" />
          {subscription.payment_method_brand.toUpperCase()} ****{subscription.payment_method_last4}
        </div>
      )}
    </div>
  );
};