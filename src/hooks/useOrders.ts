import { useState, useEffect } from 'react';
import { supabase, Order } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface UseOrdersOptions {
  status?: string;
  role?: 'buyer' | 'seller';
}

interface StripeOrder {
  customer_id: string;
  order_id: number;
  checkout_session_id: string;
  payment_intent_id: string;
  amount_subtotal: number;
  amount_total: number;
  currency: string;
  payment_status: string;
  order_status: string;
  order_date: string;
}

export const useOrders = (options: UseOrdersOptions = {}) => {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stripeOrders, setStripeOrders] = useState<StripeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!user || !profile) {
      setOrders([]);
      setStripeOrders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch marketplace orders
      let query = supabase
        .from('orders')
        .select(`
          *,
          buyer:user_profiles!orders_buyer_id_fkey(*),
          seller:user_profiles!orders_seller_id_fkey(*),
          order_items(
            *,
            product:products(*)
          ),
          payment_receipts(*)
        `);

      // Filter by role
      const role = options.role || profile.role;
      if (role === 'buyer') {
        query = query.eq('buyer_id', user.id);
      } else if (role === 'seller') {
        query = query.eq('seller_id', user.id);
      }

      // Filter by status
      if (options.status) {
        query = query.eq('status', options.status);
      }

      query = query.order('created_at', { ascending: false });

      const { data: marketplaceOrders, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setOrders(marketplaceOrders || []);

      // Fetch Stripe orders
      const { data: stripeOrdersData, error: stripeError } = await supabase
        .from('stripe_user_orders')
        .select('*')
        .order('order_date', { ascending: false });

      if (stripeError) {
        console.error('Error fetching Stripe orders:', stripeError);
      } else {
        setStripeOrders(stripeOrdersData || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (cartItems: any[], shippingAddress: string, notes?: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Group cart items by seller
      const ordersBySeller = cartItems.reduce((acc, item) => {
        const sellerId = item.product.seller_id;
        if (!acc[sellerId]) {
          acc[sellerId] = [];
        }
        acc[sellerId].push(item);
        return acc;
      }, {} as Record<string, any[]>);

      const createdOrders = [];

      // Create separate orders for each seller
      for (const [sellerId, items] of Object.entries(ordersBySeller)) {
        const totalAmount = items.reduce((sum, item) => 
          sum + (item.product.price * item.quantity), 0
        );

        // Generate order number
        const { data: orderNumberData } = await supabase
          .rpc('generate_order_number');

        const orderNumber = orderNumberData || `ORD-${Date.now()}`;

        // Create order
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            order_number: orderNumber,
            buyer_id: user.id,
            seller_id: sellerId,
            total_amount: totalAmount,
            shipping_address: shippingAddress,
            notes,
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // Create order items
        const orderItems = items.map(item => ({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.product.price,
          total_price: item.product.price * item.quantity,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;

        // Update product stock
        for (const item of items) {
          await supabase
            .from('products')
            .update({ 
              stock_quantity: Math.max(0, item.product.stock_quantity - item.quantity)
            })
            .eq('id', item.product_id);
        }

        createdOrders.push(order);
      }

      // Clear cart
      await supabase
        .from('cart_items')
        .delete()
        .eq('buyer_id', user.id);

      await fetchOrders();
      return createdOrders;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create order');
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      await fetchOrders();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update order status');
    }
  };

  const uploadPaymentReceipt = async (orderId: string, receiptUrl: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('payment_receipts')
        .insert({
          order_id: orderId,
          receipt_url: receiptUrl,
          uploaded_by: user.id,
        });

      if (error) throw error;

      await fetchOrders();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to upload receipt');
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user, profile, options.status, options.role]);

  return {
    orders,
    stripeOrders,
    loading,
    error,
    createOrder,
    updateOrderStatus,
    uploadPaymentReceipt,
    refetch: fetchOrders,
  };
};

export const useOrder = (orderId: string) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('orders')
          .select(`
            *,
            buyer:user_profiles!orders_buyer_id_fkey(*),
            seller:user_profiles!orders_seller_id_fkey(*),
            order_items(
              *,
              product:products(*)
            ),
            payment_receipts(*)
          `)
          .eq('id', orderId)
          .single();

        if (fetchError) throw fetchError;

        setOrder(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Order not found');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  return { order, loading, error };
};