import React, { useEffect } from 'react';
import { Check, ArrowRight, Package } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SuccessPageProps {
  onNavigateHome: () => void;
}

export const SuccessPage: React.FC<SuccessPageProps> = ({ onNavigateHome }) => {
  const { user, profile } = useAuth();

  useEffect(() => {
    // Auto-redirect after 10 seconds
    const timer = setTimeout(() => {
      onNavigateHome();
    }, 10000);

    return () => clearTimeout(timer);
  }, [onNavigateHome]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Payment Successful!
        </h1>
        
        <p className="text-gray-600 mb-6">
          Thank you for your purchase. Your payment has been processed successfully. All transactions are in Nigerian Naira (₦).
        </p>
        
        {user && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">
              Welcome back, <span className="font-medium">{profile?.full_name}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              You can view your purchase history in your account
            </p>
          </div>
        )}
        
        <div className="space-y-3">
          <button
            onClick={onNavigateHome}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <Package className="w-4 h-4 mr-2" />
            Continue Shopping
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
          
          <p className="text-xs text-gray-500">
            Redirecting automatically in 10 seconds...
          </p>
        </div>
      </div>
    </div>
  );
};