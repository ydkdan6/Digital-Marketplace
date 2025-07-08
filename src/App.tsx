import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useProducts } from './hooks/useProducts';
import { useCategories } from './hooks/useCategories';
import { useCart } from './hooks/useCart';
import { useOrders } from './hooks/useOrders';
import { signUp, signIn, signOut } from './lib/supabase';
import { StripeProducts } from './components/StripeProducts';
import { SubscriptionStatus } from './components/SubscriptionStatus';
import { SuccessPage } from './pages/SuccessPage';
import { CancelPage } from './pages/CancelPage';
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  Star, 
  Heart, 
  User, 
  Package, 
  CreditCard, 
  MessageCircle,
  Plus,
  Minus,
  X,
  Eye,
  Edit,
  Trash2,
  Upload,
  Check,
  Clock,
  Truck,
  Home,
  LogOut,
  Menu,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Load Montserrat font
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

// Add Montserrat to body
document.body.style.fontFamily = 'Montserrat, sans-serif';

type Page = 'home' | 'login' | 'register' | 'product' | 'cart' | 'checkout' | 'orders' | 'dashboard' | 'premium' | 'success' | 'cancel';

interface AppState {
  currentPage: Page;
  selectedProductId: string | null;
  selectedOrderId: string | null;
  searchQuery: string;
  selectedCategory: string;
  priceRange: [number, number];
  sortBy: 'newest' | 'price_asc' | 'price_desc' | 'popular';
  showMobileMenu: boolean;
}

const AppContent: React.FC = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const [state, setState] = useState<AppState>({
    currentPage: 'home',
    selectedProductId: null,
    selectedOrderId: null,
    searchQuery: '',
    selectedCategory: '',
    priceRange: [0, 10000],
    sortBy: 'newest',
    showMobileMenu: false,
  });

  const { products, loading: productsLoading } = useProducts({
    searchQuery: state.searchQuery,
    categoryId: state.selectedCategory || undefined,
    minPrice: state.priceRange[0],
    maxPrice: state.priceRange[1],
    sortBy: state.sortBy,
  });

  const { categories } = useCategories();
  const { cartItems, getTotalItems, addToCart, updateQuantity, removeFromCart } = useCart();
  const { orders, stripeOrders, createOrder, updateOrderStatus } = useOrders();

  // Check URL for success/cancel pages
  useEffect(() => {
    // Ensure we're not using any localStorage for auth
    localStorage.removeItem('user');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('authToken');
    
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');
    
    if (success === 'true') {
      setState(prev => ({ ...prev, currentPage: 'success' }));
    } else if (canceled === 'true') {
      setState(prev => ({ ...prev, currentPage: 'cancel' }));
    }
  }, []);

  // Authentication Forms
  const LoginForm: React.FC = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      console.log('Login attempt for:', formData.email);
      setLoading(true);
      setError('');

      try {
        const result = await signIn(formData.email, formData.password);
        console.log('Login successful:', result.user?.id);
        setState(prev => ({ ...prev, currentPage: 'home' }));
      } catch (err) {
        console.error('Login error:', err);
        setError(err instanceof Error ? err.message : 'Login failed');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
            <p className="text-gray-600 mt-2">Sign in to your account</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => setState(prev => ({ ...prev, currentPage: 'register' }))}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  };

  const RegisterForm: React.FC = () => {
    const [role, setRole] = useState<'buyer' | 'seller'>('buyer');
    const [formData, setFormData] = useState({
      email: '',
      password: '',
      full_name: '',
      phone_number: '',
      business_name: '',
      business_registration_number: '',
      business_address: '',
      whatsapp_number: '',
      bank_account_name: '',
      bank_account_number: '',
      bank_name: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError('');

      try {
        console.log('Starting registration process...');
        console.log('Form data:', { email: formData.email, role });
        const profileData = {
          role,
          full_name: formData.full_name,
          phone_number: formData.phone_number,
          ...(role === 'seller' && {
            business_name: formData.business_name,
            business_registration_number: formData.business_registration_number,
            business_address: formData.business_address,
            whatsapp_number: formData.whatsapp_number,
            bank_account_name: formData.bank_account_name,
            bank_account_number: formData.bank_account_number,
            bank_name: formData.bank_name,
          }),
        };

        console.log('Profile data:', profileData);
        const result = await signUp(formData.email, formData.password, profileData);
        console.log('Registration successful');
        console.log('Created user:', result);
        setState(prev => ({ ...prev, currentPage: 'home' }));
      } catch (err) {
        console.error('Registration error:', err);
        setError(err instanceof Error ? err.message : 'Registration failed');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
              <p className="text-gray-600 mt-2">Join our marketplace today</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Role Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">I want to:</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('buyer')}
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${
                    role === 'buyer'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <ShoppingCart className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-medium">Buy Products</div>
                  <div className="text-sm text-gray-500">Browse and purchase items</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('seller')}
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${
                    role === 'seller'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Package className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-medium">Sell Products</div>
                  <div className="text-sm text-gray-500">List and manage products</div>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.phone_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>

              {/* Seller-specific fields */}
              {role === 'seller' && (
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Business Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={formData.business_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                      <input
                        type="text"
                        required
                        pattern="[A-Za-z0-9]{8,12}"
                        title="8-12 alphanumeric characters"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={formData.business_registration_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, business_registration_number: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
                    <textarea
                      required
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.business_address}
                      onChange={(e) => setFormData(prev => ({ ...prev, business_address: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                    <input
                      type="tel"
                      required
                      pattern="^\+[1-9]\d{1,14}$"
                      title="International format (e.g., +1234567890)"
                      placeholder="+1234567890"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.whatsapp_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900">Bank Account Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                        <input
                          type="text"
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={formData.bank_account_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, bank_account_name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                        <input
                          type="text"
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={formData.bank_account_number}
                          onChange={(e) => setFormData(prev => ({ ...prev, bank_account_number: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={formData.bank_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 mt-6"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => setState(prev => ({ ...prev, currentPage: 'login' }))}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Header Component
  const Header: React.FC = () => {
    const totalItems = getTotalItems();

    return (
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <button
                onClick={() => setState(prev => ({ ...prev, currentPage: 'home' }))}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">MarketPlace</span>
              </button>
            </div>

            {/* Navigation */}
            {user && (
              <nav className="hidden md:flex items-center space-x-6">
                <button
                  onClick={() => setState(prev => ({ ...prev, currentPage: 'home' }))}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    state.currentPage === 'home'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Home className="w-4 h-4 inline mr-2" />
                  Home
                </button>
                
                <button
                  onClick={() => setState(prev => ({ ...prev, currentPage: 'premium' }))}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    state.currentPage === 'premium'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <CreditCard className="w-4 h-4 inline mr-2" />
                  Premium
                </button>
                
                {profile?.role === 'buyer' && (
                  <>
                    <button
                      onClick={() => setState(prev => ({ ...prev, currentPage: 'cart' }))}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${
                        state.currentPage === 'cart'
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <ShoppingCart className="w-4 h-4 inline mr-2" />
                      Cart
                      {totalItems > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {totalItems}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setState(prev => ({ ...prev, currentPage: 'orders' }))}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        state.currentPage === 'orders'
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Package className="w-4 h-4 inline mr-2" />
                      Orders
                    </button>
                  </>
                )}

                {profile?.role === 'seller' && (
                  <button
                    onClick={() => setState(prev => ({ ...prev, currentPage: 'dashboard' }))}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      state.currentPage === 'dashboard'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Package className="w-4 h-4 inline mr-2" />
                    Dashboard
                  </button>
                )}
              </nav>
            )}

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">
                    Welcome, {profile?.full_name}
                  </span>
                  <button
                    onClick={signOut}
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setState(prev => ({ ...prev, currentPage: 'login' }))}
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setState(prev => ({ ...prev, currentPage: 'register' }))}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    );
  };

  // Product Card Component
  const ProductCard: React.FC<{ product: any }> = ({ product }) => {
    const primaryImage = product.images?.find((img: any) => img.is_primary) || product.images?.[0];

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        <div className="aspect-w-16 aspect-h-12 bg-gray-100">
          {primaryImage ? (
            <img
              src={primaryImage.image_url}
              alt={product.title}
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{product.title}</h3>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
          
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-bold text-blue-600">₦{product.price.toLocaleString()}</span>
            <div className="flex items-center text-sm text-gray-500">
              <Star className="w-4 h-4 text-yellow-400 mr-1" />
              {product.seller?.rating || 0}
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600">by {product.seller?.full_name}</span>
            <span className="text-sm text-gray-500">{product.stock_quantity} left</span>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setState(prev => ({ ...prev, currentPage: 'product', selectedProductId: product.id }))}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              <Eye className="w-4 h-4 inline mr-1" />
              View
            </button>
            {profile?.role === 'buyer' && (
              <button
                onClick={() => addToCart(product.id)}
                className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4 inline mr-1" />
                Add to Cart
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Home Page
  const HomePage: React.FC = () => {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Discover Amazing Products
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Shop from trusted sellers worldwide
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <input
                type="text"
                placeholder="Search for products..."
                className="w-full px-6 py-4 rounded-full text-gray-900 text-lg focus:outline-none focus:ring-4 focus:ring-blue-300"
                value={state.searchQuery}
                onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
              />
              <Search className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Subscription Status */}
          {user && (
            <div className="mb-8">
              <SubscriptionStatus />
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex flex-wrap items-center gap-4">
              {/* Category Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={state.selectedCategory}
                  onChange={(e) => setState(prev => ({ ...prev, selectedCategory: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <select
                value={state.sortBy}
                onChange={(e) => setState(prev => ({ ...prev, sortBy: e.target.value as any }))}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">Newest</option>
                <option value="popular">Most Popular</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>

              {/* Price Range */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Price:</span>
                <input
                  type="number"
                  placeholder="Min"
                  className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                  value={state.priceRange[0]}
                  onChange={(e) => setState(prev => ({ 
                    ...prev, 
                    priceRange: [Number(e.target.value), prev.priceRange[1]] 
                  }))}
                />
                <span className="text-gray-400">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                  value={state.priceRange[1]}
                  onChange={(e) => setState(prev => ({ 
                    ...prev, 
                    priceRange: [prev.priceRange[0], Number(e.target.value)] 
                  }))}
                />
                <span className="text-sm text-gray-500">₦</span>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {productsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
                  <div className="w-full h-48 bg-gray-200"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {!productsLoading && products.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Premium Page
  const PremiumPage: React.FC = () => {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Subscription Status */}
          {user && (
            <div className="mb-8">
              <SubscriptionStatus />
            </div>
          )}
          
          <StripeProducts />
        </div>
      </div>
    );
  };

  // Orders Page
  const OrdersPage: React.FC = () => {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Orders</h1>
            <p className="text-gray-600">Track your marketplace and premium purchases</p>
          </div>

          {/* Marketplace Orders */}
          {orders.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Marketplace Orders</h2>
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-medium text-gray-900">Order #{order.order_number}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">₦{order.total_amount.toLocaleString()}</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'confirmed' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Seller: {order.seller?.full_name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stripe Orders */}
          {stripeOrders.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Premium Purchases</h2>
              <div className="space-y-4">
                {stripeOrders.map(order => (
                  <div key={order.order_id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-medium text-gray-900">Premium Purchase</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(order.order_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {order.currency.toUpperCase()} {(order.amount_total / 100).toFixed(2)}
                        </p>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          order.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.payment_status}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Payment ID: {order.payment_intent_id}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {orders.length === 0 && stripeOrders.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-600">Start shopping to see your orders here</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render current page
  const renderCurrentPage = () => {
    if (authLoading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    if (!user && (state.currentPage === 'login' || state.currentPage === 'register')) {
      return state.currentPage === 'login' ? <LoginForm /> : <RegisterForm />;
    }

    if (state.currentPage === 'success') {
      return <SuccessPage onNavigateHome={() => setState(prev => ({ ...prev, currentPage: 'home' }))} />;
    }

    if (state.currentPage === 'cancel') {
      return (
        <CancelPage 
          onNavigateHome={() => setState(prev => ({ ...prev, currentPage: 'home' }))}
          onRetry={() => setState(prev => ({ ...prev, currentPage: 'premium' }))}
        />
      );
    }

    if (!user) {
      return <LoginForm />;
    }

    switch (state.currentPage) {
      case 'home':
        return <HomePage />;
      case 'premium':
        return <PremiumPage />;
      case 'orders':
        return <OrdersPage />;
      case 'login':
        return <LoginForm />;
      case 'register':
        return <RegisterForm />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {renderCurrentPage()}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;