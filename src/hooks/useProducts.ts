import { useState, useEffect } from 'react';
import { supabase, Product } from '../lib/supabase';

interface UseProductsOptions {
  categoryId?: string;
  sellerId?: string;
  searchQuery?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'popular';
  limit?: number;
}

export const useProducts = (options: UseProductsOptions = {}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('products')
        .select(`
          *,
          seller:user_profiles!products_seller_id_fkey(*),
          category:categories(*),
          images:product_images(*)
        `)
        .eq('status', 'active');

      // Apply filters
      if (options.categoryId) {
        query = query.eq('category_id', options.categoryId);
      }

      if (options.sellerId) {
        query = query.eq('seller_id', options.sellerId);
      }

      if (options.searchQuery) {
        query = query.or(`title.ilike.%${options.searchQuery}%,description.ilike.%${options.searchQuery}%`);
      }

      if (options.minPrice !== undefined) {
        query = query.gte('price', options.minPrice);
      }

      if (options.maxPrice !== undefined) {
        query = query.lte('price', options.maxPrice);
      }

      // Apply sorting
      switch (options.sortBy) {
        case 'price_asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price', { ascending: false });
          break;
        case 'popular':
          query = query.order('views', { ascending: false });
          break;
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setProducts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [
    options.categoryId,
    options.sellerId,
    options.searchQuery,
    options.minPrice,
    options.maxPrice,
    options.sortBy,
    options.limit,
  ]);

  return { products, loading, error, refetch: fetchProducts };
};

export const useProduct = (productId: string) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('products')
          .select(`
            *,
            seller:user_profiles!products_seller_id_fkey(*),
            category:categories(*),
            images:product_images(*)
          `)
          .eq('id', productId)
          .single();

        if (fetchError) throw fetchError;

        // Increment view count
        await supabase
          .from('products')
          .update({ views: (data.views || 0) + 1 })
          .eq('id', productId);

        setProduct(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Product not found');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  return { product, loading, error };
};