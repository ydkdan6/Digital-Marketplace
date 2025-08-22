import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProducts } from '../hooks/useProducts';
import { useOrders } from '../hooks/useOrders';
import { useCategories } from '../hooks/useCategories';
import { supabase } from '../lib/supabase';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Eye,
  Upload,
  Check,
  X,
  Clock,
  Truck,
  DollarSign,
  ShoppingBag,
  Users,
  TrendingUp,
  Star,
  Image as ImageIcon,
  Save,
  AlertCircle,
  FileText,
  CreditCard
} from 'lucide-react';

interface ProductFormData {
  title: string;
  description: string;
  price: number;
  stock_quantity: number;
  category_id: string;
  status: 'active' | 'inactive' | 'out_of_stock';
}

export const SellerDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const { categories, loading: categoriesLoading } = useCategories();
  const { products, loading: productsLoading, refetch: refetchProducts } = useProducts({ 
    sellerId: user?.id 
  });
  const { orders, loading: ordersLoading, updateOrderStatus, refetch: refetchOrders } = useOrders({ 
    role: 'seller' 
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'add-product'>('overview');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [productForm, setProductForm] = useState<ProductFormData>({
    title: '',
    description: '',
    price: 0,
    stock_quantity: 0,
    category_id: '',
    status: 'active',
  });

  const [productImages, setProductImages] = useState<string[]>(['']);

  // Dashboard stats
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.status === 'active').length;
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const totalRevenue = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + o.total_amount, 0);

  const resetForm = () => {
    setProductForm({
      title: '',
      description: '',
      price: 0,
      stock_quantity: 0,
      category_id: '',
      status: 'active',
    });
    setProductImages(['']);
    setEditingProduct(null);
    setShowProductForm(false);
    setError(null);
    setSuccess(null);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const productData = {
        ...productForm,
        seller_id: user.id,
      };

      let productResult;

      if (editingProduct) {
        // Update existing product
        const { data, error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)
          .select()
          .single();

        if (updateError) throw updateError;
        productResult = data;
        setSuccess('Product updated successfully!');
      } else {
        // Create new product
        const { data, error: insertError } = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single();

        if (insertError) throw insertError;
        productResult = data;
        setSuccess('Product created successfully!');
      }

      // Handle product images
      if (productResult) {
        // Delete existing images if editing
        if (editingProduct) {
          await supabase
            .from('product_images')
            .delete()
            .eq('product_id', editingProduct.id);
        }

        // Insert new images
        const validImages = productImages.filter(url => url.trim() !== '');
        if (validImages.length > 0) {
          const imageData = validImages.map((url, index) => ({
            product_id: productResult.id,
            image_url: url.trim(),
            is_primary: index === 0,
            sort_order: index,
          }));

          const { error: imageError } = await supabase
            .from('product_images')
            .insert(imageData);

          if (imageError) {
            console.error('Error saving images:', imageError);
          }
        }
      }

      resetForm();
      refetchProducts();
      setActiveTab('products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setSuccess('Product deleted successfully!');
      refetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
    }
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setProductForm({
      title: product.title,
      description: product.description,
      price: product.price,
      stock_quantity: product.stock_quantity,
      category_id: product.category_id,
      status: product.status,
    });
    setProductImages(
      product.images?.map((img: any) => img.image_url) || ['']
    );
    setShowProductForm(true);
    setActiveTab('add-product');
  };

  const handleOrderStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setSuccess('Order status updated successfully!');
      refetchOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order status');
    }
  };

  const addImageField = () => {
    if (productImages.length < 5) {
      setProductImages([...productImages, '']);
    }
  };

  const removeImageField = (index: number) => {
    if (productImages.length > 1) {
      setProductImages(productImages.filter((_, i) => i !== index));
    }
  };

  const updateImageField = (index: number, value: string) => {
    const newImages = [...productImages];
    newImages[index] = value;
    setProductImages(newImages);
  };

  // Overview Tab
  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Products</p>
              <p className="text-2xl font-bold text-gray-900">{activeProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₦{totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
        </div>
        <div className="p-6">
          {pendingOrders > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                <span className="text-yellow-800">
                  You have {pendingOrders} pending order{pendingOrders !== 1 ? 's' : ''} requiring attention
                </span>
              </div>
            </div>
          )}
          
          {orders.slice(0, 5).map(order => (
            <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
              <div>
                <p className="font-medium text-gray-900">#{order.order_number}</p>
                <p className="text-sm text-gray-600">{order.buyer?.full_name}</p>
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
          ))}
          
          {orders.length === 0 && (
            <p className="text-gray-500 text-center py-4">No orders yet</p>
          )}
        </div>
      </div>
    </div>
  );

  // Products Tab
  const ProductsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Your Products</h3>
        <button
          onClick={() => {
            resetForm();
            setShowProductForm(true);
            setActiveTab('add-product');
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </button>
      </div>

      {productsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 animate-pulse">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => {
            const primaryImage = product.images?.find((img: any) => img.is_primary) || product.images?.[0];
            
            return (
              <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
                  <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">{product.title}</h4>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-blue-600">₦{product.price.toLocaleString()}</span>
                    <span className="text-sm text-gray-500">{product.stock_quantity} in stock</span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      product.status === 'active' ? 'bg-green-100 text-green-800' :
                      product.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {product.status}
                    </span>
                    <span className="text-sm text-gray-500">{product.views} views</span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      <Edit className="w-4 h-4 inline mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="flex-1 bg-red-100 text-red-700 py-2 px-3 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4 inline mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!productsLoading && products.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
          <p className="text-gray-600 mb-4">Start by adding your first product</p>
          <button
            onClick={() => {
              resetForm();
              setShowProductForm(true);
              setActiveTab('add-product');
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Your First Product
          </button>
        </div>
      )}
    </div>
  );

  // Orders Tab
  const OrdersTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Order Management</h3>

      {ordersLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium text-gray-900">Order #{order.order_number}</h4>
                  <p className="text-sm text-gray-600">
                    {new Date(order.created_at).toLocaleDateString()} • {order.buyer?.full_name}
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

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Shipping Address:</strong> {order.shipping_address}
                </p>
                {order.notes && (
                  <p className="text-sm text-gray-600">
                    <strong>Notes:</strong> {order.notes}
                  </p>
                )}
              </div>

              {order.status === 'pending' && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleOrderStatusUpdate(order.id, 'confirmed')}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    <Check className="w-4 h-4 inline mr-1" />
                    Confirm Order
                  </button>
                  <button
                    onClick={() => handleOrderStatusUpdate(order.id, 'cancelled')}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    <X className="w-4 h-4 inline mr-1" />
                    Cancel Order
                  </button>
                </div>
              )}

              {order.status === 'confirmed' && (
                <button
                  onClick={() => handleOrderStatusUpdate(order.id, 'shipped')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Truck className="w-4 h-4 inline mr-1" />
                  Mark as Shipped
                </button>
              )}

              {order.status === 'shipped' && (
                <button
                  onClick={() => handleOrderStatusUpdate(order.id, 'delivered')}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Check className="w-4 h-4 inline mr-1" />
                  Mark as Delivered
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!ordersLoading && orders.length === 0 && (
        <div className="text-center py-12">
          <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-600">Orders will appear here when customers purchase your products</p>
        </div>
      )}
    </div>
  );

  // Add/Edit Product Tab
  const AddProductTab = () => (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">
          {editingProduct ? 'Edit Product' : 'Add New Product'}
        </h3>

        <form onSubmit={handleProductSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Title</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={productForm.title}
              onChange={(e) => setProductForm(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              required
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={productForm.description}
              onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₦)</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={productForm.price}
                onChange={(e) => setProductForm(prev => ({ ...prev, price: Number(e.target.value) }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
              <input
                type="number"
                required
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={productForm.stock_quantity}
                onChange={(e) => setProductForm(prev => ({ ...prev, stock_quantity: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
  <select
    required
    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    value={productForm.category_id}
    onChange={(e) => setProductForm(prev => ({ ...prev, category_id: e.target.value }))}
    
  >
    <option value="">
      {categoriesLoading ? 'Loading categories...' : 
       categories.length === 0 ? 'No categories available' : 
       'Select a category'}
    </option>
    {!categoriesLoading && categories.map(category => (
      <option key={cat?.id} value={category?.id}>
        {category?.name}
      </option>
    ))}
  </select>
  {!categoriesLoading && categories.length === 0 && (
    <p className="text-sm text-red-600 mt-1">
      No categories found. Please contact admin to add categories.
    </p>
  )}
</div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Product Images (URLs)</label>
            <div className="space-y-3">
              {productImages.map((image, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={image}
                    onChange={(e) => updateImageField(index, e.target.value)}
                  />
                  {index === 0 && (
                    <span className="text-xs text-blue-600 font-medium">Primary</span>
                  )}
                  {productImages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeImageField(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              
              {productImages.length < 5 && (
                <button
                  type="button"
                  onClick={addImageField}
                  className="flex items-center text-blue-600 hover:text-blue-700 text-sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add another image
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Add up to 5 images. The first image will be the primary image.
            </p>
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline mr-2"></div>
                  {editingProduct ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 inline mr-2" />
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (!user || profile?.role !== 'seller') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">This dashboard is only available to sellers</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Seller Dashboard</h1>
          <p className="text-gray-600">Manage your products, orders, and business</p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-600">{success}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: TrendingUp },
                { id: 'products', label: 'Products', icon: Package },
                { id: 'orders', label: 'Orders', icon: ShoppingBag },
                { id: 'add-product', label: 'Add Product', icon: Plus },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'products' && <ProductsTab />}
          {activeTab === 'orders' && <OrdersTab />}
          {activeTab === 'add-product' && <AddProductTab />}
        </div>
      </div>
    </div>
  );
};