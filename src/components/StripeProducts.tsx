import React from 'react';
import { stripeProducts } from '../stripe-config';
import { useStripe } from '../hooks/useStripe';
import { useAuth } from '../contexts/AuthContext';
import { CreditCard, Package, Loader2 } from 'lucide-react';

export const StripeProducts: React.FC = () => {
  const { user } = useAuth();
  const { createCheckoutSession, loading, error } = useStripe();

  // If no products are configured, show a message
  if (stripeProducts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Available</h3>
        <p className="text-gray-600">Premium products will be available soon</p>
      </div>
    );
  }

  const handlePurchase = async (priceId: string, mode: 'payment' | 'subscription') => {
    if (!user) {
      alert('Please sign in to make a purchase');
      return;
    }

    try {
      await createCheckoutSession({
        priceId,
        mode,
      });
    } catch (err) {
      console.error('Purchase failed:', err);
    }
  };

  if (!user) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Sign in to Purchase</h3>
        <p className="text-gray-600">Please sign in to access our premium products</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Premium Products</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Enhance your marketplace experience with our premium offerings
        </p>
      </div>

      {error && (
            Enhance your marketplace experience with our premium offerings. All prices are in Nigerian Naira (₦).
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stripeProducts.map((product) => (
          <div
            key={product.priceId}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">{product.name}</h3>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              
              <p className="text-gray-600 mb-6 min-h-[3rem]">{product.description}</p>
              
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500 capitalize">
                  {product.mode === 'payment' ? 'One-time payment' : 'Subscription'}
                </span>
              </div>
              
              <button
                onClick={() => handlePurchase(product.priceId, product.mode)}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Purchase Now
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};